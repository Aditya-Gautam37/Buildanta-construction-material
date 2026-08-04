import { prisma, UserRole } from "@workspace/db"
import { requireStaffAccess } from "@/lib/staff-access"
import type { HomepageProductOption, HomepageProductPlacement, HomepageSlideRecord } from "@/lib/homepage-content"
import HomepageContentManager from "./homepage-content-manager"

export default async function HomepageContentPage() {
  await requireStaffAccess("/homepage-content", { allowedRoles: [UserRole.ADMIN, UserRole.DATA_ENTRY] })

  const [slideRows, placementRows, productRows] = await Promise.all([
    prisma.homepageSlide.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
    prisma.homepageProduct.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], include: { product: { include: { brand: true } } } }),
    prisma.product.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, brand: { select: { name: true } } } }),
  ])
  const slides: HomepageSlideRecord[] = slideRows.map((slide) => ({ ...slide, updatedAt: slide.updatedAt.toISOString() }))
  const placements: HomepageProductPlacement[] = placementRows.map((item) => ({ id: item.id, productId: item.productId, badge: item.badge, sortOrder: item.sortOrder, product: { id: item.product.id, name: item.product.name, brand: item.product.brand.name } }))
  const products: HomepageProductOption[] = productRows.map((product) => ({ id: product.id, name: product.name, brand: product.brand.name }))
  return <HomepageContentManager initialSlides={slides} initialPlacements={placements} products={products} />
}
