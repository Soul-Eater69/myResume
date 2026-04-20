import { requireUser } from "@/lib/auth";
import { getFullProfile } from "@/modules/profile/service";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { SkillManager } from "./manager";

export default async function SkillsPage() {
  const user = await requireUser();
  const data = await getFullProfile(user.id);
  return (
    <>
      <PageHeader title="Skills" description="Verified skills are what the resume composer is allowed to list." />
      <SkillManager initial={data.skills.map((s) => ({ id: s.id, name: s.name, category: s.category ?? "", isVerified: s.isVerified }))} />
    </>
  );
}
