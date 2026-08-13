import { inventoryApiUrl, readApiError, requireStaffAccess } from "@/lib/staff-access"
import MaterialKnowledgeWorkspace, { type KnowledgeDetail, type MaterialKnowledgeListItem } from "./material-knowledge-workspace"

export default async function MaterialKnowledgePage({ searchParams }: { searchParams: Promise<{ product?: string; error?: string; saved?: string }> }) {
  const { accessToken } = await requireStaffAccess("/material-knowledge")
  const listResponse = await fetch(`${inventoryApiUrl}/material-knowledge`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  })
  if (!listResponse.ok) throw new Error(await readApiError(listResponse))
  const items = await listResponse.json() as MaterialKnowledgeListItem[]
  const query = await searchParams

  const selectedProductId = query.product && items.some((item) => item.productId === query.product)
    ? query.product
    : items[0]?.productId

  let detail: KnowledgeDetail | null = null
  if (selectedProductId) {
    const detailResponse = await fetch(`${inventoryApiUrl}/material-knowledge/${encodeURIComponent(selectedProductId)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    })
    if (!detailResponse.ok) throw new Error(await readApiError(detailResponse))
    detail = await detailResponse.json() as KnowledgeDetail | null
  }

  return (
    <MaterialKnowledgeWorkspace
      items={items}
      selectedProductId={selectedProductId}
      detail={detail}
      error={query.error}
      saved={Boolean(query.saved)}
    />
  )
}
