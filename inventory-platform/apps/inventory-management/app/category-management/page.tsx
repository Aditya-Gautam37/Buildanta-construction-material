import { inventoryApiUrl, readApiError, requireStaffAccess } from "@/lib/staff-access"
import InventoryDashboard from "@/app/components/inventory-dashboard"
import type { InventoryDashboardProps } from "@/app/components/inventory-dashboard/types"
import { toInventoryProduct } from "@/lib/trpc/helpers"

type ApiProduct = Parameters<typeof toInventoryProduct>[0]

async function fetchInventoryData<T>(path: string, accessToken: string) {
  const response = await fetch(`${inventoryApiUrl}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  })

  if (!response.ok) throw new Error(await readApiError(response))
  return response.json() as Promise<T>
}

export default async function CategoryManagementPage() {
  const { accessToken } = await requireStaffAccess("/category-management")

  const [categories, stages, rooms, brands, suppliers, apiProducts] = await Promise.all([
    fetchInventoryData<InventoryDashboardProps["categories"]>("/categories/inventory/all", accessToken),
    fetchInventoryData<InventoryDashboardProps["stages"]>("/stages", accessToken),
    fetchInventoryData<InventoryDashboardProps["rooms"]>("/rooms", accessToken),
    fetchInventoryData<InventoryDashboardProps["brands"]>("/brands", accessToken),
    fetchInventoryData<InventoryDashboardProps["suppliers"]>("/suppliers", accessToken),
    fetchInventoryData<ApiProduct[]>("/products/inventory/all", accessToken),
  ])

  return (
    <InventoryDashboard
      products={apiProducts.map(toInventoryProduct)}
      categories={categories}
      stages={stages}
      rooms={rooms}
      brands={brands}
      suppliers={suppliers}
    />
  )
}
