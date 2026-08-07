import { inventoryApiUrl, readApiError, requireStaffAccess } from "@/lib/staff-access"
import CommerceManager, { type CommerceVariant } from "./commerce-manager"

export default async function CommercePage() {
  const { accessToken } = await requireStaffAccess("/commerce")
  const response = await fetch(`${inventoryApiUrl}/product-variants/inventory/all`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  })
  if (!response.ok) throw new Error(await readApiError(response))
  const variants = await response.json() as CommerceVariant[]

  return <CommerceManager variants={variants} />
}
