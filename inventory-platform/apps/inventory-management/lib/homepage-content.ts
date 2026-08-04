export type HomepageSlideRecord = {
  id: string
  title: string
  subtitle: string | null
  imageUrl: string
  altText: string
  ctaLabel: string | null
  ctaHref: string | null
  active: boolean
  sortOrder: number
  updatedAt: string
}

export type HomepageSlideDraft = Omit<HomepageSlideRecord, "id" | "updatedAt"> & { id?: string }

export type HomepageProductPlacement = {
  id: string
  productId: string
  badge: string | null
  sortOrder: number
  product: { id: string; name: string; brand: string }
}

export type HomepageProductOption = { id: string; name: string; brand: string }
