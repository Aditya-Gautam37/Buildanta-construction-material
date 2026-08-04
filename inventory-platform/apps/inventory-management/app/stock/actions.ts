"use server"

import { StockTransactionType } from "@workspace/db"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { inventoryApiUrl, readApiError, requireStaffAccess } from "@/lib/staff-access"

export async function adjustStockAction(formData: FormData) {
  const variantId = String(formData.get("variantId") ?? "").trim()
  const type = String(formData.get("type") ?? "") as StockTransactionType
  const stockDelta = Number(formData.get("stockDelta") || 0)
  const reservedDelta = Number(formData.get("reservedDelta") || 0)
  const reason = String(formData.get("reason") ?? "").trim()
  const reference = String(formData.get("reference") ?? "").trim()
  if (!variantId || !Object.values(StockTransactionType).includes(type)) throw new Error("Invalid stock adjustment.")
  if (!Number.isInteger(stockDelta) || !Number.isInteger(reservedDelta) || (stockDelta === 0 && reservedDelta === 0)) {
    throw new Error("Enter a whole-number stock or reservation change.")
  }
  if (reason.length < 3) throw new Error("Enter a short reason for the audit history.")

  const { accessToken } = await requireStaffAccess("/stock")
  const response = await fetch(`${inventoryApiUrl}/stock/adjustments`, {
    method: "POST",
    headers: { "content-type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ variantId, type, stockDelta, reservedDelta, reason, reference: reference || undefined }),
    cache: "no-store",
  })
  if (!response.ok) redirect(`/stock?error=${encodeURIComponent(await readApiError(response))}`)

  revalidatePath("/stock")
  redirect(`/stock?saved=${encodeURIComponent(variantId)}`)
}
