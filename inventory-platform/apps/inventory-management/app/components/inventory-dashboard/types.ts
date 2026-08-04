import type { InventoryProduct } from "@/lib/products"

export type InventoryDashboardProps = {
  products: InventoryProduct[]
  categories: {
    id: string
    name: string
    slug: string
    parentId: string | null
    description?: string | null
    imageUrl?: string | null
    icon?: string | null
    sortOrder: number
    featured: boolean
    published: boolean
    seoTitle?: string | null
    seoDescription?: string | null
    _count?: { children: number; products: number }
  }[]
  stages: {
    id: string
    name: string
    slug: string
    parentId: string | null
  }[]
  rooms: {
    id: string
    name: string
    slug: string
    parentId: string | null
  }[]
  suppliers: {
    id: string
    name: string
    contactInfo?: string | null
    email?: string | null
    address?: string | null
  }[]
  brands: {
    id: string
    name: string
    slug: string
    logo?: string | null
    description?: string | null
    website?: string | null
  }[]
}

export type CategoryNode = {
  id: string
  name: string
  slug: string
  parentId: string | null
  description?: string | null
  imageUrl?: string | null
  icon?: string | null
  sortOrder: number
  featured: boolean
  published: boolean
  seoTitle?: string | null
  seoDescription?: string | null
  _count?: { children: number; products: number }
}

export type StageNode = {
  id: string
  name: string
  slug: string
  parentId: string | null
}

export type RoomNode = {
  id: string
  name: string
  slug: string
  parentId: string | null
}

export type SupplierNode = {
  id: string
  name: string
  contactInfo?: string | null
  email?: string | null
  address?: string | null
}

export type BrandNode = {
  id: string
  name: string
  slug: string
  logo?: string | null
  description?: string | null
  website?: string | null
}

export type CatalogTab = "categories" | "stages" | "rooms" | "brands" | "products" | "suppliers"

export type ProductVariantNode = {
  id: string
  productId: string
  supplierId: string
  sku: string
  price?: number | null
  attributes?: unknown
  images?: Array<{ id?: string; src: string; alt?: string }>
  product?: unknown
  supplier?: unknown
}

export type EditEntityType = "category" | "stage" | "room" | "supplier" | "brand"
export type DeleteEntityType = "category" | "stage" | "room" | "supplier" | "brand" | "product"

export type EditDialogState = {
  type: EditEntityType
  id: string
  name: string
  slug?: string
  parentId?: string | null
  contactInfo?: string | null
  email?: string | null
  address?: string | null
  website?: string | null
  description?: string | null
  logo?: string | null
}

export type DeleteDialogState = {
  type: DeleteEntityType
  id: string
  name: string
  hasChildren?: boolean
}

export type HierarchyOption = {
  id: string
  name: string
  depth: number
  path: string
}
