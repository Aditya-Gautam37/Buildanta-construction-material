"use server"

import { revalidatePath } from "next/cache"
import { prisma, QuoteRequestStatus, SupplierSubmissionStatus, UserRole } from "@workspace/db"
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"

async function requireStaff() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Authentication required.")
  const profile = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
  if (!profile || (profile.role !== UserRole.ADMIN && profile.role !== UserRole.DATA_ENTRY)) throw new Error("Inventory staff access is required.")
}

export async function updateQuoteStatusAction(formData: FormData) {
  await requireStaff()
  const id = String(formData.get("id") ?? "")
  const status = String(formData.get("status") ?? "") as QuoteRequestStatus
  if (!id || !Object.values(QuoteRequestStatus).includes(status)) throw new Error("Invalid quote status update.")
  await prisma.quoteRequest.update({ where: { id }, data: { status } })
  revalidatePath("/requests")
}

export async function updateSupplierStatusAction(formData: FormData) {
  await requireStaff()
  const id = String(formData.get("id") ?? "")
  const status = String(formData.get("status") ?? "") as SupplierSubmissionStatus
  if (!id || !Object.values(SupplierSubmissionStatus).includes(status)) throw new Error("Invalid supplier status update.")
  await prisma.supplierSubmission.update({ where: { id }, data: { status } })
  revalidatePath("/requests")
}
