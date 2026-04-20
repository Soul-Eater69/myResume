import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getFullProfile } from "@/modules/profile/service";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { ProfileBasicsForm } from "./basics-form";
import { ResumeUploader } from "./resume-uploader";

export default async function ProfilePage() {
  const user = await requireUser();
  const data = await getFullProfile(user.id);

  const sections = [
    { title: "Experiences", count: data.experiences.length, href: "/profile/experience", icon: Icon.Briefcase, description: "Roles, tenure, tech stacks, and impact bullets." },
    { title: "Projects", count: data.projects.length, href: "/profile/projects", icon: Icon.FileText, description: "Project evidence — manual or GitHub-imported." },
    { title: "Skills", count: data.skills.length, href: "/profile/skills", icon: Icon.Sparkles, description: "Canonical skills, levels, and focus areas." },
    { title: "Education", count: data.educations.length, href: "/profile/education", icon: Icon.CheckCircle, description: "Degrees, programs, graduation dates." },
  ];

  return (
    <>
      <PageHeader
        title="Profile vault"
        description="The single source of truth for your career knowledge — feeds every tailored resume."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardTitle>Basics</CardTitle>
            <CardDescription className="mt-1">
              Headline, summary, and target roles.
            </CardDescription>
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
            <CardDescription className="mt-1">
              We parse and seed your profile. Parsed items are marked review-needed.
            </CardDescription>
            <div className="mt-4">
              <ResumeUploader />
            </div>
          </Card>
        </div>

        <div className="space-y-3">
          {sections.map((s) => {
            const I = s.icon;
            return (
              <Link
                key={s.title}
                href={s.href}
                className="surface p-4 flex items-center justify-between gap-3 hover:border-border-strong transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-md bg-brand-50 text-brand-700 border border-brand-100 flex items-center justify-center shrink-0">
                    <I className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-fg">{s.title}</div>
                    <div className="text-xs text-fg-subtle mt-0.5 truncate">{s.description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-sm font-semibold text-fg">{s.count}</span>
                  <Icon.ChevronRight className="h-4 w-4 text-fg-faint group-hover:text-fg-subtle" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <Card>
        <CardTitle>Verified vs suggested</CardTitle>
        <CardDescription className="mt-1">
          Items parsed from uploads or imported from GitHub remain in review until you verify them.
          Suggestions are never silently merged into your vault.
        </CardDescription>
        <div className="mt-4 flex gap-2 flex-wrap">
          <Badge variant="verified" leftIcon={<Icon.CheckCircle className="h-3 w-3" />}>
            Verified — safe for resume generation
          </Badge>
          <Badge variant="review" leftIcon={<Icon.Circle className="h-3 w-3" />}>
            Review — parsed or imported
          </Badge>
          <Badge variant="suggested" leftIcon={<Icon.Sparkles className="h-3 w-3" />}>
            Suggested — AI proposal, labeled separately
          </Badge>
        </div>
      </Card>
    </>
  );
}
