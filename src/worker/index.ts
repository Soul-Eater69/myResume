import { Worker } from "bullmq";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { closeRedisConnection, getRedisConnection } from "@/lib/redis";
import {
  RESUME_UPLOAD_QUEUE,
  runResumeUploadJob,
  type ResumeUploadJob,
} from "@/modules/profile/upload-queue";

async function main() {
  const worker = new Worker<ResumeUploadJob>(
    RESUME_UPLOAD_QUEUE,
    async (job) => {
      await runResumeUploadJob(job.data);
    },
    {
      connection: getRedisConnection(),
      concurrency: 2,
    }
  );

  worker.on("ready", () => {
    logger.info("worker_ready", { queue: RESUME_UPLOAD_QUEUE });
  });

  worker.on("completed", (job) => {
    logger.info("resume_upload_job_completed", { uploadId: job.data.uploadId });
  });

  worker.on("failed", (job, error) => {
    logger.error("resume_upload_job_failed", {
      uploadId: job?.data.uploadId,
      message: error.message,
    });
  });

  const shutdown = async (signal: string) => {
    logger.info("worker_shutdown", { signal });
    await worker.close();
    await closeRedisConnection();
    await db.$disconnect();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

void main().catch(async (error) => {
  logger.error("worker_boot_failed", {
    message: error instanceof Error ? error.message : "unknown error",
  });
  await closeRedisConnection();
  await db.$disconnect();
  process.exit(1);
});
