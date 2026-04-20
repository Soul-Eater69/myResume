import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const uid = await getSessionUserId();
  if (!uid) redirect("/login");
  const user = await db.user.findUnique({
    where: { id: uid },
    select: { name: true, email: true },
  });
  if (!user) redirect("/login");
  return (
    <DashboardShell userName={user.name} userEmail={user.email}>
      {children}
    </DashboardShell>
  );
}
