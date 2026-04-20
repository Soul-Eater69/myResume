import { requireUser } from "@/lib/auth";
import { getFullProfile } from "@/modules/profile/service";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { ProjectManager } from "./manager";

export default async function ProjectsPage() {
  const user = await requireUser();
  const data = await getFullProfile(user.id);
  return (
    <>
      <PageHeader title="Projects" description="Personal or professional projects available for resume tailoring." />
      <ProjectManager initial={data.projects.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description ?? "",
        repoUrl: p.repoUrl ?? "",
        liveUrl: p.liveUrl ?? "",
        techStack: (p.techStack as string[] | null) ?? [],
        isVerified: p.isVerified,
        sourceType: p.sourceType,
        bullets: p.bullets.map((b) => b.bulletText),
      }))} />
    </>
  );
}
