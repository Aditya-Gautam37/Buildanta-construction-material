import { inventoryApiUrl, readApiError, requireStaffAccess } from "@/lib/staff-access"
import CategoryManager, { type ManagedCategory } from "./category-manager"

export default async function CategoryManagementPage() {
  const { accessToken } = await requireStaffAccess("/category-management")
  const response = await fetch(`${inventoryApiUrl}/categories/inventory/all`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  })
  if (!response.ok) throw new Error(await readApiError(response))
  const categories = await response.json() as ManagedCategory[]
  return <CategoryManager initialCategories={categories} />
}
