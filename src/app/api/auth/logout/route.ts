import { handle, noContent } from "@/lib/api";
import { logout } from "@/modules/auth/service";

export const POST = handle(async () => {
  await logout();
  return noContent();
});
