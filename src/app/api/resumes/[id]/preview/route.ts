import { NextResponse } from "next/server";
import { handle } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { getResume } from "@/modules/resumes/service";

export const GET = handle(async (_req, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await params;
  const resume = await getResume(user.id, id);
  const html = resume.renderedHtml || "<html><body>no preview</body></html>";
  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
});
