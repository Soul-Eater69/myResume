import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";

export default async function ResumeStudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const uid = await getSessionUserId();
  if (!uid) redirect("/login");
  return <>{children}</>;
}
