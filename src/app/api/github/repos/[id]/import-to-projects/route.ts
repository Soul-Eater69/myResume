import { handle, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { importRepoToProject } from "@/modules/github/service";

export const POST = handle(async (_req, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await params;
  const project = await importRepoToProject(user.id, id);
  return ok({ projectId: project.id, status: "review_needed" });
});
