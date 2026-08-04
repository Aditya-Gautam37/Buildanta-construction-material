"use server"

import { ProductStatus } from "@workspace/db"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { inventoryApiUrl, readApiError, requireStaffAccess } from "@/lib/staff-access"

function optionalNumber(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim()
  if (!text) return undefined
  const parsed = Number(text)
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error("Prices and percentages must be valid non-negative numbers.")
  return parsed
}

export async function updateCatalogProductAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim()
  const status = String(formData.get("status") ?? "") as ProductStatus
  const unit = String(formData.get("unit") ?? "").trim()
  const minimumOrderQuantity = Number(formData.get("minimumOrderQuantity"))
  const deliveryInfo = String(formData.get("deliveryInfo") ?? "").trim()
  if (!id || !Object.values(ProductStatus).includes(status)) throw new Error("Invalid product update.")
  if (!unit || !Number.isInteger(minimumOrderQuantity) || minimumOrderQuantity < 1) {
    throw new Error("Unit and a minimum order quantity of at least 1 are required.")
  }

  const sellingPrice = optionalNumber(formData.get("sellingPrice"))
  const bulkPrice = optionalNumber(formData.get("bulkPrice"))
  const gstPercent = optionalNumber(formData.get("gstPercent"))
  if (gstPercent !== undefined && gstPercent > 100) throw new Error("GST cannot exceed 100%.")

  const { accessToken } = await requireStaffAccess("/catalog-control")
  const response = await fetch(`${inventoryApiUrl}/products/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "content-type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({
      status,
      unit,
      minimumOrderQuantity,
      deliveryInfo: deliveryInfo || undefined,
      sellingPrice,
      bulkPrice,
      gstPercent,
    }),
    cache: "no-store",
  })
  if (!response.ok) redirect(`/catalog-control?error=${encodeURIComponent(await readApiError(response))}`)

  revalidatePath("/catalog-control")
  redirect(`/catalog-control?saved=${encodeURIComponent(id)}`)
}
