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
        title="Interview prep"
        description={
          job.company
            ? `${job.title ?? "Job"} · ${job.company} — prepare for this role`
            : `${job.title ?? "Job"} — prepare for this role`
        }
        breadcrumbs={[
          { label: "Jobs", href: "/jobs" },
          { label: job.title ?? "Job", href: `/jobs/${job.id}` },
          { label: "Interview prep" },
        ]}
      />
      <InterviewPrepClient jobId={jobId} job={job} />
    </>
  );
}