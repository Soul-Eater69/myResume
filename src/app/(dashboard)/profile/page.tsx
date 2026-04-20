import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getFullProfile } from "@/modules/profile/service";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProfileBasicsForm } from "./basics-form";
import { ResumeUploader } from "./resume-uploader";

export default async function ProfilePage() {
  const user = await requireUser();
  const data = await getFullProfile(user.id);

  return (
    <>
      <PageHeader title="Profile vault" description="The single source of truth for your career knowledge." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardTitle>Basics</CardTitle>
            <CardDescription>Headline, summary, and target roles.</CardDescription>
            <ProfileBasicsForm
              initial={{
                headline: data.profile?.headline ?? "",
                summary: data.profile?.summary ?? "",
                targetRoles: (data.profile?.targetRoles as string[] | null) ?? [],
              }}
            />
          </Card>
          <Card>
            <CardTitle>Upload a base resume</CardTitle>
            <CardDescription>We parse and seed your profile. Parsed items are marked as review-needed.</CardDescription>
            <div className="mt-3">
              <ResumeUploader />
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <ProfileStatCard title="Experiences" count={data.experiences.length} href="/profile/experience" />
          <ProfileStatCard title="Projects" count={data.projects.length} href="/profile/projects" />
          <ProfileStatCard title="Skills" count={data.skills.length} href="/profile/skills" />
          <ProfileStatCard title="Education" count={data.educations.length} href="/profile/education" />
        </div>
      </div>

      <Card>
        <CardTitle>Verified vs suggested</CardTitle>
        <CardDescription>
          Items parsed from uploads or imported from GitHub remain in review until you verify them.
        </CardDescription>
        <div className="mt-3 flex gap-2 flex-wrap">
          <Badge variant="verified">Verified — safe for resume generation</Badge>
          <Badge variant="review">Review — parsed or imported</Badge>
          <Badge variant="suggested">Suggested — AI proposal, labeled separately</Badge>
        </div>
      </Card>
    </>
  );
}

function ProfileStatCard({ title, count, href }: { title: string; count: number; href: string }) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <span className="text-2xl font-semibold">{count}</span>
      </div>
      <Link href={href} className="btn-ghost mt-2 text-sm">
        Manage →
      </Link>
    </Card>
  );
}
