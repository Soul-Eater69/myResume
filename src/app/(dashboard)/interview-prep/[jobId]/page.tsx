import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getJob } from "@/modules/jobs/service";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { InterviewPrepClient } from "./client";

export default async function InterviewPrepPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  const user = await requireUser();
  const job = await getJob(user.id, jobId);

  return (
    <>
      <PageHeader
        title={`Interview prep — ${job.title ?? "job"}`}
        description={`${job.company ?? ""} · prepare for this role`}
        actions={
          <Link className="btn-outline" href={`/jobs/${job.id}`}>
            ← Back to job
          </Link>
        }
      />
      <InterviewPrepClient jobId={jobId} job={job} />
    </>
  );
}