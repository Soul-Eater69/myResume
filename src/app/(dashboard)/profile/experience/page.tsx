import { requireUser } from "@/lib/auth";
import { getFullProfile } from "@/modules/profile/service";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { ExperienceManager } from "./manager";

export default async function ExperiencePage() {
  const user = await requireUser();
  const data = await getFullProfile(user.id);
  return (
    <>
      <PageHeader
        title="Experience"
        description="Roles that appear in resume generation."
        breadcrumbs={[{ label: "Profile", href: "/profile" }, { label: "Experience" }]}
      />
      <ExperienceManager initial={data.experiences.map((e) => ({
        id: e.id,
        company: e.company,
        title: e.title,
        location: e.location ?? "",
        startDate: e.startDate ? e.startDate.toISOString().slice(0,10) : "",
        endDate: e.endDate ? e.endDate.toISOString().slice(0,10) : "",
        isCurrent: e.isCurrent,
        techStack: (e.techStack as string[] | null) ?? [],
        bullets: e.bullets.map((b) => b.bulletText),
      }))} />
    </>
  );
}
