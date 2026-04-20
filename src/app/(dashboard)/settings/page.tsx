import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export default async function SettingsPage() {
  const user = await requireUser();
  return (
    <>
      <PageHeader title="Settings" />
      <Card>
        <CardTitle>Account</CardTitle>
        <CardDescription className="mt-2">
          {user.name} · {user.email}
        </CardDescription>
      </Card>
      <Card className="mt-4">
        <CardTitle>AI provider</CardTitle>
        <CardDescription className="mt-2">
          Set <code>ANTHROPIC_API_KEY</code> in your environment to use Claude for signal extraction,
          parsing, summarization, and resume composition. Without a key, the system falls back to
          deterministic rule-based processing for all flows.
        </CardDescription>
      </Card>
    </>
  );
}
