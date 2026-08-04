import "server-only"

import { redirect } from "next/navigation"
import { prisma, UserRole } from "@workspace/db"
import { syncAuthenticatedUser } from "@/lib/auth/sync-user"
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"

const staffRoles: UserRole[] = [UserRole.ADMIN, UserRole.DATA_ENTRY, UserRole.CATALOG_MANAGER, UserRole.SALES, UserRole.WAREHOUSE_MANAGER, UserRole.PROCUREMENT, UserRole.FINANCE, UserRole.SUPPORT]

export async function requireStaffAccess(returnTo: string, options?: { allowedRoles?: UserRole[] }): Promise<{ accessToken: string; role: UserRole }> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirect=${encodeURIComponent(returnTo)}`)

  await syncAuthenticatedUser(user)
  const profile = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { role: true },
  })
  const allowedRoles = options?.allowedRoles ?? staffRoles
  if (!allowedRoles.includes(profile.role)) {
    redirect("/access-denied")
  }

  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) redirect(`/login?redirect=${encodeURIComponent(returnTo)}`)

  return { accessToken: session.access_token, role: profile.role }
}

export const inventoryApiUrl =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:5173"

export async function readApiError(response: Response) {
  const fallback = `Request failed with status ${response.status}.`
  try {
    const payload = await response.json() as { message?: string | string[] }
    if (Array.isArray(payload.message)) return payload.message.join(" ")
    return payload.message || fallback
  } catch {
    return fallback
  }
}
