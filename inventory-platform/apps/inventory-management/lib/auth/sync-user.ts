import "server-only";

import { prisma, UserRole } from "@workspace/db";
import type { User } from "@supabase/supabase-js";

function allowlist(name: string) {
  return new Set(
    (process.env[name] ?? "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );
}

function provisionedRole(email: string) {
  const normalized = email.toLowerCase();
  if (allowlist("ADMIN_EMAIL_ALLOWLIST").has(normalized)) {
    return UserRole.ADMIN;
  }
  if (allowlist("DATA_ENTRY_EMAIL_ALLOWLIST").has(normalized)) {
    return UserRole.DATA_ENTRY;
  }
  return UserRole.CUSTOMER;
}

function metadataName(user: User, key: "firstName" | "lastName") {
  const value = user.user_metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export async function syncAuthenticatedUser(user: User): Promise<{
  id: string;
  role: UserRole;
  firstName: string | null;
  lastName: string | null;
}> {
  if (!user.email) {
    throw new Error("The authenticated Supabase user does not have an email address.");
  }

  const existing = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  return prisma.user.upsert({
    where: { id: user.id },
    update: {
      email: user.email,
      firstName: metadataName(user, "firstName"),
      lastName: metadataName(user, "lastName"),
    },
    create: {
      id: user.id,
      email: user.email,
      firstName: metadataName(user, "firstName"),
      lastName: metadataName(user, "lastName"),
      role: existing?.role ?? provisionedRole(user.email),
    },
    select: {
      id: true,
      role: true,
      firstName: true,
      lastName: true,
    },
  });
}
