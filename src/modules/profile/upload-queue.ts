import { Queue } from "bullmq";
import { logger } from "@/lib/logger";
import { getRedisConnection } from "@/lib/redis";
import { processResumeUpload } from "@/modules/profile/upload";

export const RESUME_UPLOAD_QUEUE = "resume-upload";

export type ResumeUploadJob = {
  userId: string;
  uploadId: string;
  apply: boolean;
};

let queue: Queue<ResumeUploadJob> | null = null;

function getQueue() {
  if (!queue) {
    queue = new Queue<ResumeUploadJob>(RESUME_UPLOAD_QUEUE, {
      connection: getRedisConnection(),
    });
  }
  return queue;
}

export async function scheduleResumeUpload(job: ResumeUploadJob) {
  if (process.env.NODE_ENV !== "production") {
    scheduleInline(job);
    return { mode: "inline" as const };
  }

  try {
    await getQueue().add("process-upload", job, {
      removeOnComplete: 100,
      removeOnFail: 100,
    });
    return { mode: "queue" as const };
  } catch (error) {
    logger.error("resume_upload_enqueue_failed", {
      uploadId: job.uploadId,
      message: error instanceof Error ? error.message : "unknown error",
    });
    scheduleInline(job);
    return { mode: "inline" as const };
  }
}

export async function runResumeUploadJob(job: ResumeUploadJob) {
  await processResumeUpload(job.userId, job.uploadId, job.apply);
}

function scheduleInline(job: ResumeUploadJob) {
  setTimeout(() => {
    void processResumeUpload(job.userId, job.uploadId, job.apply).catch((error) => {
      logger.error("resume_upload_inline_failed", {
        uploadId: job.uploadId,
        message: error instanceof Error ? error.message : "unknown error",
      });
    });
  }, 0);
}
