import { requireUser } from "@/lib/auth";
import { getFullProfile } from "@/modules/profile/service";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { EducationManager } from "./manager";

export default async function EducationPage() {
  const user = await requireUser();
  const data = await getFullProfile(user.id);
  return (
    <>
      <PageHeader
        title="Education"
        description="Degrees, programs, and graduation dates."
        breadcrumbs={[{ label: "Profile", href: "/profile" }, { label: "Education" }]}
      />
      <EducationManager initial={data.educations.map((e) => ({
        id: e.id,
        institution: e.institution,
        degree: e.degree ?? "",
        fieldOfStudy: e.fieldOfStudy ?? "",
        startDate: e.startDate ? e.startDate.toISOString().slice(0,10) : "",
        endDate: e.endDate ? e.endDate.toISOString().slice(0,10) : "",
      }))} />
    </>
  );
}
