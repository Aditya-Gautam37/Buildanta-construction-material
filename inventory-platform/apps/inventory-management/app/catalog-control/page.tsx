import { inventoryApiUrl, readApiError, requireStaffAccess } from "@/lib/staff-access"
import CatalogWorkspace, { type CatalogProduct } from "./catalog-workspace"

export default async function CatalogControlPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const { accessToken } = await requireStaffAccess("/catalog-control")
  const response = await fetch(`${inventoryApiUrl}/products/inventory/all`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  })
  if (!response.ok) throw new Error(await readApiError(response))
  const products = await response.json() as CatalogProduct[]
  const query = await searchParams

  return <CatalogWorkspace products={products} savedId={query.saved} error={query.error} />
}
