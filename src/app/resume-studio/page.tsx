import { requireUser } from "@/lib/auth";
import { getOrCreateStudioResume } from "@/modules/resumes/resume-studio";
import { StudioWorkspace } from "@/components/resume-studio/workspace-shell";

export const dynamic = "force-dynamic";

export default async function ResumeStudioPage() {
  const user = await requireUser();
  const resume = await getOrCreateStudioResume(user.id);
  return (
    <StudioWorkspace
      initial={{
        resumeId: resume.id,
        title: resume.title,
        resume: resume.data,
      }}
    />
  );
}
