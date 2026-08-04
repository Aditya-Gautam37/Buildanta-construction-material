"use server"

import { QuotationApprovalStatus, QuotationStatus } from "@workspace/db"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { inventoryApiUrl, readApiError, requireStaffAccess } from "@/lib/staff-access"

const returnPath = "/quotations"

function text(formData: FormData, key: string) { return String(formData.get(key) ?? "").trim() }
function number(formData: FormData, key: string, fallback = 0) { const raw = text(formData, key); return raw ? Number(raw) : fallback }

async function send(endpoint: string, method: "POST" | "PATCH", body: unknown) {
  const { accessToken } = await requireStaffAccess(returnPath)
  const response = await fetch(`${inventoryApiUrl}/quotations/${endpoint}`, {
    method,
    headers: { "content-type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(body),
    cache: "no-store",
  })
  if (!response.ok) redirect(`${returnPath}?error=${encodeURIComponent(await readApiError(response))}`)
  revalidatePath(returnPath)
  revalidatePath("/inventory-locations")
  redirect(`${returnPath}?saved=1`)
}

export async function reviewQuotationAction(formData: FormData) {
  return send(`${encodeURIComponent(text(formData, "id"))}/status`, "PATCH", { status: QuotationStatus.REVIEWING, reason: text(formData, "reason") || "Sales review started" })
}

export async function rejectQuotationAction(formData: FormData) {
  return send(`${encodeURIComponent(text(formData, "id"))}/status`, "PATCH", { status: QuotationStatus.REJECTED, reason: text(formData, "reason") })
}

export async function createRevisionAction(formData: FormData) {
  const quotationId = text(formData, "quotationId")
  const itemIds = formData.getAll("quotationItemId").map(String)
  const items = itemIds.map((itemId) => ({
    quotationItemId: itemId,
    variantId: text(formData, `variantId_${itemId}`),
    fulfilmentLocationId: text(formData, `fulfilmentLocationId_${itemId}`),
    supplierProductId: text(formData, `supplierProductId_${itemId}`) || undefined,
    dealerProductId: text(formData, `dealerProductId_${itemId}`) || undefined,
    description: text(formData, `description_${itemId}`),
    quantity: number(formData, `quantity_${itemId}`),
    unitCode: text(formData, `unitCode_${itemId}`),
    unitPrice: number(formData, `unitPrice_${itemId}`),
    gstPercent: number(formData, `gstPercent_${itemId}`),
    discountAmount: number(formData, `discountAmount_${itemId}`),
    estimatedLeadDays: number(formData, `estimatedLeadDays_${itemId}`),
    isAlternative: formData.get(`isAlternative_${itemId}`) === "on",
  }))
  return send(`${encodeURIComponent(quotationId)}/revisions`, "POST", {
    validUntil: text(formData, "validUntil"),
    freightTotal: number(formData, "freightTotal"),
    discountTotal: number(formData, "orderDiscount"),
    marginTotal: text(formData, "marginTotal") ? number(formData, "marginTotal") : undefined,
    customerNotes: text(formData, "customerNotes") || undefined,
    internalNotes: text(formData, "internalNotes") || undefined,
    items,
  })
}

export async function decideApprovalAction(formData: FormData) {
  const quotationId = text(formData, "quotationId")
  const approvalId = text(formData, "approvalId")
  return send(`${encodeURIComponent(quotationId)}/approvals/${encodeURIComponent(approvalId)}/decision`, "POST", {
    status: text(formData, "status") as QuotationApprovalStatus,
    reason: text(formData, "reason"),
  })
}

export async function sendQuotationAction(formData: FormData) {
  return send(`${encodeURIComponent(text(formData, "id"))}/send`, "POST", {})
}

export async function acceptQuotationAction(formData: FormData) {
  return send(`${encodeURIComponent(text(formData, "id"))}/accept`, "POST", {
    reservationExpiresAt: text(formData, "reservationExpiresAt") || undefined,
    paymentTerms: text(formData, "paymentTerms") || undefined,
    reason: text(formData, "reason") || "Customer acceptance recorded by sales",
  })
}

export async function cancelSalesOrderAction(formData: FormData) {
  return send(`sales-orders/${encodeURIComponent(text(formData, "id"))}/cancel`, "POST", { reason: text(formData, "reason") })
}
