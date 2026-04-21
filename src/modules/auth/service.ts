import { db } from "@/lib/db";
import { hashPassword, verifyPassword, issueSession, clearSession } from "@/lib/auth";
import { badRequest, conflict, unauthorized } from "@/lib/errors";
import type { SignupInput, LoginInput } from "@/schemas/auth";

export async function signup(input: SignupInput) {
  const existing = await db.user.findUnique({ where: { email: input.email } });
  if (existing) throw conflict("email already registered");
  const passwordHash = await hashPassword(input.password);
  const user = await db.user.create({
    data: {
      email: input.email,
      name: input.name,
      passwordHash,
      profile: { create: {} },
    },
    select: { id: true, email: true, name: true },
  });
  await issueSession(user.id);
  return user;
}

export async function login(input: LoginInput) {
  const user = await db.user.findUnique({ where: { email: input.email } });
  if (!user) throw unauthorized("invalid credentials");
  if (!user.passwordHash) throw unauthorized("invalid credentials");
  const ok = await verifyPassword(input.password, user.passwordHash);
  if (!ok) throw unauthorized("invalid credentials");
  await issueSession(user.id);
  return { id: user.id, email: user.email, name: user.name };
}

export async function logout() {
  await clearSession();
}

export async function getCurrentUser(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, createdAt: true },
  });
  if (!user) throw badRequest("user not found");
  return user;
}
