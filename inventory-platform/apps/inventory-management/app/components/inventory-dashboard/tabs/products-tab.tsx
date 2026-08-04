"use client"

import type { Dispatch, SetStateAction } from "react"
import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import {
  ArrowDown,
  ArrowUp,
  Box,
  ChevronLeft,
  ChevronRight,
  Images,
  Pencil,
  Plus,
  Search,
  Truck,
  X,
} from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Separator } from "@workspace/ui/components/separator"
import { TabsContent } from "@workspace/ui/components/tabs"
import { supabaseBrowser } from "@/lib/supabase/client"
import { HierarchyDropdown } from "../hierarchy-dropdown"
import { formatPrice } from "../helpers"
import type {
  BrandNode,
  HierarchyOption,
  ProductVariantNode,
  SupplierNode,
} from "../types"
import type { InventoryProduct } from "@/lib/products"

type ProductsTabProps = {
  products: InventoryProduct[]
  brands: BrandNode[]
  suppliers: SupplierNode[]
  query: string
  setQuery: Dispatch<SetStateAction<string>>
  activeCategory: string
  setActiveCategory: Dispatch<SetStateAction<string>>
  productCategoryFilters: string[]
  filteredProducts: InventoryProduct[]
  variantsByProductId: Map<string, ProductVariantNode[]>
  isDeletingProductId: string | null
  openCreateProductDialog: () => void
  openUpdateVariantDialog: (variant: ProductVariantNode) => void
  openProductDetailsDialog: (product: InventoryProduct) => void
  openCreateVariantDialog: (product: InventoryProduct) => void
  handleDeleteProduct: (product: InventoryProduct) => void
  handleUpdateProduct: (input: {
    id: string
    name: string
    brandId: string
    description?: string
    price?: number
  }) => Promise<void>
  isVariantDialogOpen: boolean
  setIsVariantDialogOpen: Dispatch<SetStateAction<boolean>>
  variantMode: "create" | "update"
  variantProductId: string
  setVariantProductId: Dispatch<SetStateAction<string>>
  variantSupplierId: string
  setVariantSupplierId: Dispatch<SetStateAction<string>>
  variantSku: string
  setVariantSku: Dispatch<SetStateAction<string>>
  variantPrice: string
  setVariantPrice: Dispatch<SetStateAction<string>>
  variantAttributes: string
  setVariantAttributes: Dispatch<SetStateAction<string>>
  setVariantImageFiles: (files: File[]) => void
  variantError: string | null
  handleSaveVariant: () => void
  isSavingVariant: boolean
  isProductDialogOpen: boolean
  setIsProductDialogOpen: Dispatch<SetStateAction<boolean>>
  newProductName: string
  setNewProductName: Dispatch<SetStateAction<string>>
  newProductBrandId: string
  setNewProductBrandId: Dispatch<SetStateAction<string>>
  categoryHierarchyOptions: HierarchyOption[]
  stageHierarchyOptions: HierarchyOption[]
  roomHierarchyOptions: HierarchyOption[]
  newProductCategoryIds: string[]
  setNewProductCategoryId: (value: string[]) => void
  newProductStageIds: string[]
  setNewProductStageIds: (value: string[]) => void
  newProductRoomIds: string[]
  setNewProductRoomIds: (value: string[]) => void
  newProductSku: string
  setNewProductSku: Dispatch<SetStateAction<string>>
  newProductPrice: string
  setNewProductPrice: Dispatch<SetStateAction<string>>
  newProductDescription: string
  setNewProductDescription: Dispatch<SetStateAction<string>>
  setNewProductImages: (files: File[]) => void
  newProductVariantSupplierId: string
  setNewProductVariantSupplierId: Dispatch<SetStateAction<string>>
  newProductVariantSku: string
  setNewProductVariantSku: Dispatch<SetStateAction<string>>
  newProductVariantAttributes: string
  setNewProductVariantAttributes: Dispatch<SetStateAction<string>>
  setNewProductVariantImages: (files: File[]) => void
  productError: string | null
  handleCreateProduct: () => void
  isCreatingProduct: boolean
  isProductDetailsOpen: boolean
  setIsProductDetailsOpen: Dispatch<SetStateAction<boolean>>
  selectedProduct: InventoryProduct | null
}

function moveArrayItem<T>(items: T[], fromIndex: number, toIndex: number) {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= items.length || toIndex >= items.length) {
    return items
  }

  const copy = [...items]
  const [moved] = copy.splice(fromIndex, 1)
  if (moved === undefined) {
    return items
  }
  copy.splice(toIndex, 0, moved)
  return copy
}

export function ProductsTab({
  products,
  brands,
  suppliers,
  query,
  setQuery,
  activeCategory,
  setActiveCategory,
  productCategoryFilters,
  filteredProducts,
  variantsByProductId,
  isDeletingProductId,
  openCreateProductDialog,
  openUpdateVariantDialog,
  openProductDetailsDialog,
  openCreateVariantDialog,
  handleDeleteProduct,
  handleUpdateProduct,
  isVariantDialogOpen,
  setIsVariantDialogOpen,
  variantMode,
  variantProductId,
  setVariantProductId,
  variantSupplierId,
  setVariantSupplierId,
  variantSku,
  setVariantSku,
  variantPrice,
  setVariantPrice,
  variantAttributes,
  setVariantAttributes,
  setVariantImageFiles,
  variantError,
  handleSaveVariant,
  isSavingVariant,
  isProductDialogOpen,
  setIsProductDialogOpen,
  newProductName,
  setNewProductName,
  newProductBrandId,
  setNewProductBrandId,
  categoryHierarchyOptions,
  stageHierarchyOptions,
  roomHierarchyOptions,
  newProductCategoryIds,
  setNewProductCategoryId,
  newProductStageIds,
  setNewProductStageIds,
  newProductRoomIds,
  setNewProductRoomIds,
  newProductSku,
  setNewProductSku,
  newProductPrice,
  setNewProductPrice,
  newProductDescription,
  setNewProductDescription,
  setNewProductImages,
  newProductVariantSupplierId,
  setNewProductVariantSupplierId,
  newProductVariantSku,
  setNewProductVariantSku,
  newProductVariantAttributes,
  setNewProductVariantAttributes,
  setNewProductVariantImages,
  productError,
  handleCreateProduct,
  isCreatingProduct,
  isProductDetailsOpen,
  setIsProductDetailsOpen,
  selectedProduct,
}: ProductsTabProps) {
  const [isEditProductDialogOpen, setIsEditProductDialogOpen] = useState(false)
  const [editingProductId, setEditingProductId] = useState("")
  const [editProductName, setEditProductName] = useState("")
  const [editProductBrandId, setEditProductBrandId] = useState("")
  const [editProductDescription, setEditProductDescription] = useState("")
  const [editProductPrice, setEditProductPrice] = useState("")
  const [isUpdatingProduct, setIsUpdatingProduct] = useState(false)
  const [editProductError, setEditProductError] = useState<string | null>(null)

  const [productPhotosById, setProductPhotosById] = useState<Map<string, string[]>>(new Map())
  const [variantImageQueue, setVariantImageQueue] = useState<File[]>([])
  const [initialVariantImageQueue, setInitialVariantImageQueue] = useState<File[]>([])
  const [productImageQueue, setProductImageQueue] = useState<File[]>([])
  const [galleryState, setGalleryState] = useState<{
    title: string
    images: string[]
    activeIndex: number
  } | null>(null)
  const [variantAttributeRows, setVariantAttributeRows] = useState<Array<{ key: string; value: string }>>([])

  const productIds = useMemo(() => products.map((product) => product.id), [products])
  const linkedVariantPhotos = useMemo(() => {
    const linked = new Map<string, string[]>()

    productIds.forEach((productId) => {
      const urls = (variantsByProductId.get(productId) ?? [])
        .flatMap((variant) => variant.images ?? [])
        .flatMap((image) => (image?.src ? [image.src] : []))
        .filter(Boolean)
      linked.set(productId, Array.from(new Set(urls)))
    })

    return linked
  }, [productIds, variantsByProductId])

  useEffect(() => {
    let isMounted = true

    async function loadProductPhotos() {
      if (productIds.length === 0) {
        setProductPhotosById(new Map())
        return
      }

      const supabase = supabaseBrowser()

      const entries = await Promise.all(
        productIds.map(async (productId) => {
          const { data, error } = await supabase.storage.from("ProductPhotos").list(productId, {
            limit: 20,
            sortBy: { column: "name", order: "asc" },
          })

          const existingUrls = linkedVariantPhotos.get(productId) ?? []

          if (error || !Array.isArray(data)) {
            return [productId, existingUrls] as const
          }

          const storageUrls = data
            .filter((item) => typeof item.name === "string" && item.name.length > 0)
            .map((item) => {
              const { data: publicUrl } = supabase.storage
                .from("ProductPhotos")
                .getPublicUrl(`${productId}/${item.name}`)
              return publicUrl.publicUrl
            })

          return [productId, Array.from(new Set([...existingUrls, ...storageUrls]))] as const
        })
      )

      if (!isMounted) {
        return
      }

      setProductPhotosById(new Map(entries))
    }

    void loadProductPhotos()

    return () => {
      isMounted = false
    }
  }, [linkedVariantPhotos, productIds])

  function openGallery(title: string, images: string[], index = 0) {
    if (images.length === 0) {
      return
    }
    setGalleryState({ title, images, activeIndex: Math.max(0, Math.min(index, images.length - 1)) })
  }

  function syncVariantAttributes(nextRows: Array<{ key: string; value: string }>) {
    setVariantAttributeRows(nextRows)

    const output = nextRows.reduce<Record<string, string>>((acc, row) => {
      const key = row.key.trim()
      if (!key) {
        return acc
      }
      acc[key] = row.value
      return acc
    }, {})

    setVariantAttributes(JSON.stringify(output))
  }

  useEffect(() => {
    if (!isVariantDialogOpen) {
      return
    }

    try {
      const parsed = JSON.parse(variantAttributes || "{}")
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const entries = Object.entries(parsed as Record<string, unknown>).map(([key, value]) => ({
          key,
          value: value == null ? "" : String(value),
        }))
        setVariantAttributeRows(entries.length > 0 ? entries : [{ key: "", value: "" }])
        return
      }
    } catch {
      // Keep fallback row if invalid JSON is present.
    }

    setVariantAttributeRows([{ key: "", value: "" }])
  }, [isVariantDialogOpen, variantAttributes])

  function openEditDialog(product: InventoryProduct) {
    setEditingProductId(product.id)
    setEditProductName(product.name)
    setEditProductDescription("")
    setEditProductPrice(product.price > 0 ? String(product.price) : "")
    const matchedBrand = brands.find((brand) => brand.name === product.brand)
    setEditProductBrandId(matchedBrand?.id ?? "")
    setEditProductError(null)
    setIsEditProductDialogOpen(true)
  }

  async function saveEditedProduct() {
    if (!editingProductId) {
      return
    }

    const parsedPrice = editProductPrice.trim() ? Number(editProductPrice) : undefined
    if (parsedPrice != null && (!Number.isFinite(parsedPrice) || parsedPrice < 0)) {
      setEditProductError("Price must be a valid non-negative number.")
      return
    }

    setEditProductError(null)
    setIsUpdatingProduct(true)
    try {
      await handleUpdateProduct({
        id: editingProductId,
        name: editProductName,
        brandId: editProductBrandId,
        description: editProductDescription,
        price: parsedPrice,
      })
      setIsEditProductDialogOpen(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update product right now."
      setEditProductError(message)
    } finally {
      setIsUpdatingProduct(false)
    }
  }

  function handleVariantImageQueueChange(next: File[]) {
    setVariantImageQueue(next)
    setVariantImageFiles(next)
  }

  function handleInitialVariantImageQueueChange(next: File[]) {
    setInitialVariantImageQueue(next)
    setNewProductVariantImages(next)
  }

  function handleProductImageQueueChange(next: File[]) {
    setProductImageQueue(next)
    setNewProductImages(next)
  }

  function renderQueuedImages(
    files: File[],
    onChange: (files: File[]) => void,
    emptyLabel: string
  ) {
    if (files.length === 0) {
      return <p className="text-xs text-slate-500">{emptyLabel}</p>
    }

    return (
      <div className="space-y-2 rounded-md border border-slate-200 bg-white p-2">
        {files.map((file, index) => (
          <div
            key={`${file.name}-${file.lastModified}-${index}`}
            className="flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5"
          >
            <span className="truncate text-xs text-slate-700">{index + 1}. {file.name}</span>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                size="icon-sm"
                variant="outline"
                className="h-7 w-7 border-slate-300 bg-white"
                disabled={index === 0}
                onClick={() => onChange(moveArrayItem(files, index, index - 1))}
                title="Move up"
              >
                <ArrowUp className="size-3.5" />
              </Button>
              <Button
                type="button"
                size="icon-sm"
                variant="outline"
                className="h-7 w-7 border-slate-300 bg-white"
                disabled={index === files.length - 1}
                onClick={() => onChange(moveArrayItem(files, index, index + 1))}
                title="Move down"
              >
                <ArrowDown className="size-3.5" />
              </Button>
              <Button
                type="button"
                size="icon-sm"
                variant="outline"
                className="h-7 w-7 border-rose-200 bg-white text-rose-700 hover:bg-rose-50"
                onClick={() => onChange(files.filter((_, fileIndex) => fileIndex !== index))}
                title="Remove"
              >
                <X className="size-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <TabsContent value="products" className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Products</h2>
          <p className="text-sm text-slate-600">Search and filter the active inventory set.</p>
        </div>

        <Button
          type="button"
          className="bg-slate-950 text-white hover:bg-slate-800"
          onClick={openCreateProductDialog}
        >
          <Plus className="size-4" />
          Add product
        </Button>
      </div>

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by product, SKU, brand, or supplier"
            aria-label="Search products"
            className="h-11 border-slate-300 bg-white pl-9 text-slate-900 placeholder:text-slate-400"
          />
        </div>
        <div className="rounded-xl bg-white px-4 py-2 text-sm text-slate-600 shadow-sm"><strong className="text-slate-950">{filteredProducts.length}</strong> of {products.length} products</div>
      </div>

      <div className="flex flex-wrap gap-2">
        {productCategoryFilters.map((category) => {
          const active = category === activeCategory

          return (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`rounded-full border px-3 py-1.5 text-sm transition ${
                active
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-900"
              }`}
            >
              {category}
            </button>
          )
        })}
      </div>

      <Separator className="bg-slate-200" />

      <div id="catalog-grid" className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
        {filteredProducts.map((product) => (
          <Card
            key={product.id}
            className="group overflow-hidden border-slate-200 bg-white py-0 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
          >
            <CardHeader className="gap-4 border-b border-slate-100 bg-slate-50/80 pb-4">
              {(productPhotosById.get(product.id) ?? []).length > 0 ? (
                <div className="relative h-48 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <Image
                    src={(productPhotosById.get(product.id) ?? [])[0]!}
                    alt={`${product.name} product photo`}
                    fill
                    loading="eager"
                    className="object-contain p-4 transition duration-300 group-hover:scale-[1.03]"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                  {(productPhotosById.get(product.id) ?? []).length > 1 ? (
                    <span className="absolute right-3 bottom-3 rounded-full bg-slate-950/80 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
                      +{(productPhotosById.get(product.id) ?? []).length - 1} more
                    </span>
                  ) : null}
                </div>
              ) : (
                <div className="flex h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-3 text-center text-xs text-slate-500">
                  <Images className="mb-2 size-7 text-slate-300" />
                  Product imagery is not available yet.
                </div>
              )}

              {(productPhotosById.get(product.id) ?? []).length > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-fit border-slate-300 bg-white text-slate-700"
                  onClick={() => openGallery(product.name, productPhotosById.get(product.id) ?? [], 0)}
                >
                  <Images className="size-4" />
                  View gallery
                </Button>
              ) : null}

              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
                    <Box className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="line-clamp-2 text-base font-semibold text-slate-950">
                      {product.name}
                    </CardTitle>
                    <CardDescription className="mt-1 text-xs text-slate-500">
                      SKU {product.sku} • {product.brand}
                    </CardDescription>
                  </div>
                </div>

                <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">
                  Supplier: {product.supplier}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">
                  {product.category}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 p-4">
              <div className="rounded-2xl bg-slate-50 p-3 text-sm">
                <p className="text-xs text-slate-500">Price</p>
                <p className="mt-1 font-semibold text-slate-950">{formatPrice(product.price)}</p>
              </div>

              <div className="flex items-center justify-between gap-3 text-sm text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                  <Truck className="size-4 text-slate-500" />
                  Updated {product.updatedAt}
                </span>
                <span className="font-medium text-slate-900">{product.rating.toFixed(1)} / 5</span>
              </div>

              <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between text-xs font-medium text-slate-600">
                  <span>Variants</span>
                  <span>{(variantsByProductId.get(product.id) ?? []).length}</span>
                </div>
                <div className="space-y-1">
                  {(variantsByProductId.get(product.id) ?? []).slice(0, 3).map((variant) => (
                    <div key={variant.id} className="flex items-center justify-between gap-2 rounded-md bg-white px-2 py-1.5 text-xs">
                      <span className="truncate font-medium text-slate-800">{variant.sku}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">
                          {variant.price == null ? "-" : formatPrice(variant.price)}
                        </span>
                        <button
                          type="button"
                          className="text-slate-700 underline-offset-2 hover:text-slate-950 hover:underline"
                          onClick={() => openUpdateVariantDialog(variant)}
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                  {(variantsByProductId.get(product.id) ?? []).length === 0 ? (
                    <p className="text-xs text-slate-500">No variants yet.</p>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  className="min-w-32 flex-1 bg-slate-950 text-white hover:bg-slate-800"
                  onClick={() => openProductDetailsDialog(product)}
                >
                  Open item
                </Button>
                <Button
                  variant="outline"
                  className="border-slate-300 bg-white text-slate-700"
                  onClick={() => openEditDialog(product)}
                >
                  <Pencil className="size-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  className="border-slate-300 bg-white text-slate-700"
                  onClick={() => openCreateVariantDialog(product)}
                >
                  Add variant
                </Button>
                <Button
                  variant="outline"
                  className="border-rose-200 bg-white text-rose-700 hover:bg-rose-50"
                  onClick={() => handleDeleteProduct(product)}
                  disabled={isDeletingProductId === product.id}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredProducts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center text-sm text-slate-500 md:col-span-2 xl:col-span-3">
            No products match the current search and category filters.
          </div>
        ) : null}
      </div>

      <Dialog
        open={isVariantDialogOpen}
        onOpenChange={(open) => {
          setIsVariantDialogOpen(open)
          if (!open) {
            handleVariantImageQueueChange([])
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{variantMode === "create" ? "Create product variant" : "Update product variant"}</DialogTitle>
            <DialogDescription>
              Set SKU, supplier, price, and optional JSON attributes for this variant.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <select
              value={variantProductId}
              onChange={(event) => setVariantProductId(event.target.value)}
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
              aria-label="Variant product"
            >
              <option value="">Select product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>

            <select
              value={variantSupplierId}
              onChange={(event) => setVariantSupplierId(event.target.value)}
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
              aria-label="Variant supplier"
            >
              <option value="">Select supplier</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>

            <Input
              value={variantSku}
              onChange={(event) => setVariantSku(event.target.value)}
              placeholder="Variant SKU"
              aria-label="Variant sku"
              className="h-10 border-slate-300 bg-white"
            />

            <Input
              value={variantPrice}
              onChange={(event) => setVariantPrice(event.target.value)}
              placeholder="Price (optional)"
              aria-label="Variant price"
              type="number"
              min="0"
              step="0.01"
              className="h-10 border-slate-300 bg-white"
            />

            <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-600">Variant attributes</label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 border-slate-300 bg-white text-slate-700"
                  onClick={() => syncVariantAttributes([...variantAttributeRows, { key: "", value: "" }])}
                >
                  Add attribute
                </Button>
              </div>

              {variantAttributeRows.map((row, index) => (
                <div key={`variant-attribute-${index + 1}`} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                  <Input
                    value={row.key}
                    onChange={(event) => {
                      const next = [...variantAttributeRows]
                      const current = next[index] ?? { key: "", value: "" }
                      next[index] = { ...current, key: event.target.value }
                      syncVariantAttributes(next)
                    }}
                    placeholder="Attribute name"
                    aria-label={`Variant attribute name ${index + 1}`}
                    className="h-9 border-slate-300 bg-white"
                  />
                  <Input
                    value={row.value}
                    onChange={(event) => {
                      const next = [...variantAttributeRows]
                      const current = next[index] ?? { key: "", value: "" }
                      next[index] = { ...current, value: event.target.value }
                      syncVariantAttributes(next)
                    }}
                    placeholder="Attribute value"
                    aria-label={`Variant attribute value ${index + 1}`}
                    className="h-9 border-slate-300 bg-white"
                  />
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="outline"
                    className="h-9 w-9 border-rose-200 bg-white text-rose-700 hover:bg-rose-50"
                    onClick={() =>
                      syncVariantAttributes(variantAttributeRows.filter((_, rowIndex) => rowIndex !== index))
                    }
                    title="Remove attribute"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Variant photos (optional)</label>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => {
                  const next = [...variantImageQueue, ...(event.target.files ? Array.from(event.target.files) : [])]
                  handleVariantImageQueueChange(next)
                  event.currentTarget.value = ""
                }}
                aria-label="Variant photos"
                className="h-10 border-slate-300 bg-white"
              />
              {renderQueuedImages(
                variantImageQueue,
                handleVariantImageQueueChange,
                "No variant photos selected."
              )}
            </div>

            {variantError ? (
              <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {variantError}
              </p>
            ) : null}
          </div>

          <DialogFooter showCloseButton>
            <Button
              type="button"
              className="bg-slate-950 text-white hover:bg-slate-800"
              onClick={handleSaveVariant}
              disabled={isSavingVariant}
            >
              {isSavingVariant
                ? variantMode === "create"
                  ? "Creating..."
                  : "Updating..."
                : variantMode === "create"
                  ? "Create variant"
                  : "Update variant"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isProductDialogOpen}
        onOpenChange={(open) => {
          setIsProductDialogOpen(open)
          if (!open) {
            handleInitialVariantImageQueueChange([])
            handleProductImageQueueChange([])
          }
        }}
      >
        <DialogContent className="w-[calc(100vw-1.5rem)] max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create product</DialogTitle>
            <DialogDescription>
              Create a product and upload photos to ProductPhotos/{"{productId}"}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Input
              value={newProductName}
              onChange={(event) => setNewProductName(event.target.value)}
              placeholder="Product name"
              aria-label="Product name"
              className="h-10 border-slate-300 bg-white"
            />

            <select
              value={newProductBrandId}
              onChange={(event) => setNewProductBrandId(event.target.value)}
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
              aria-label="Product brand"
            >
              <option value="">Select brand</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>

            <HierarchyDropdown
              label="Category"
              placeholder="Select category from hierarchy"
              options={categoryHierarchyOptions}
              selectedIds={newProductCategoryIds}
              onChange={setNewProductCategoryId}
              multiple
            />

            <HierarchyDropdown
              label="Stages"
              placeholder="Select stage(s) from hierarchy"
              options={stageHierarchyOptions}
              selectedIds={newProductStageIds}
              onChange={setNewProductStageIds}
              multiple
            />

            <HierarchyDropdown
              label="Rooms"
              placeholder="Select room(s) from hierarchy"
              options={roomHierarchyOptions}
              selectedIds={newProductRoomIds}
              onChange={setNewProductRoomIds}
              multiple
            />

            <Input
              value={newProductSku}
              onChange={(event) => setNewProductSku(event.target.value)}
              placeholder="SKU (optional)"
              aria-label="Product sku"
              className="h-10 border-slate-300 bg-white"
            />

            <Input
              value={newProductPrice}
              onChange={(event) => setNewProductPrice(event.target.value)}
              placeholder="Price (optional)"
              aria-label="Product price"
              type="number"
              min="0"
              step="0.01"
              className="h-10 border-slate-300 bg-white"
            />

            <Input
              value={newProductDescription}
              onChange={(event) => setNewProductDescription(event.target.value)}
              placeholder="Description (optional)"
              aria-label="Product description"
              className="h-10 border-slate-300 bg-white"
            />

            <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Initial variant (optional)</p>

              <select
                value={newProductVariantSupplierId}
                onChange={(event) => setNewProductVariantSupplierId(event.target.value)}
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
                aria-label="Initial variant supplier"
              >
                <option value="">Select supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>

              <Input
                value={newProductVariantSku}
                onChange={(event) => setNewProductVariantSku(event.target.value)}
                placeholder="Initial variant SKU"
                aria-label="Initial variant sku"
                className="h-10 border-slate-300 bg-white"
              />

              <textarea
                value={newProductVariantAttributes}
                onChange={(event) => setNewProductVariantAttributes(event.target.value)}
                placeholder='Initial variant attributes JSON (optional), e.g. {"size":"10kg"}'
                aria-label="Initial variant attributes"
                className="min-h-24 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              />

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Initial variant photos (optional)</label>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(event) => {
                    const next = [
                      ...initialVariantImageQueue,
                      ...(event.target.files ? Array.from(event.target.files) : []),
                    ]
                    handleInitialVariantImageQueueChange(next)
                    event.currentTarget.value = ""
                  }}
                  aria-label="Initial variant photos"
                  className="h-10 border-slate-300 bg-white"
                />
                {renderQueuedImages(
                  initialVariantImageQueue,
                  handleInitialVariantImageQueueChange,
                  "No initial variant photos selected."
                )}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Product photos (required)</label>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => {
                  const next = [...productImageQueue, ...(event.target.files ? Array.from(event.target.files) : [])]
                  handleProductImageQueueChange(next)
                  event.currentTarget.value = ""
                }}
                aria-label="Product photos"
                className="h-10 border-slate-300 bg-white"
              />
              {renderQueuedImages(
                productImageQueue,
                handleProductImageQueueChange,
                "No product photos selected yet."
              )}
            </div>

            {productError ? (
              <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {productError}
              </p>
            ) : null}
          </div>

          <DialogFooter showCloseButton>
            <Button
              type="button"
              className="bg-slate-950 text-white hover:bg-slate-800"
              onClick={handleCreateProduct}
              disabled={isCreatingProduct}
            >
              {isCreatingProduct ? "Creating..." : "Save product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isProductDetailsOpen} onOpenChange={setIsProductDetailsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedProduct?.name ?? "Product details"}</DialogTitle>
            <DialogDescription>Detailed view of the selected product.</DialogDescription>
          </DialogHeader>

          {selectedProduct ? (
            <div className="space-y-3 text-sm">
              {(productPhotosById.get(selectedProduct.id) ?? []).length > 0 ? (
                <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="relative h-44 overflow-hidden rounded-lg border border-slate-200 bg-white">
                    <Image
                      src={(productPhotosById.get(selectedProduct.id) ?? [])[0] ?? ""}
                      alt={`${selectedProduct.name} featured photo`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 90vw, 480px"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-slate-300 bg-white text-slate-700"
                    onClick={() => openGallery(selectedProduct.name, productPhotosById.get(selectedProduct.id) ?? [], 0)}
                  >
                    <Images className="size-4" />
                    Open full gallery
                  </Button>
                  <div className="grid grid-cols-3 gap-2">
                  {(productPhotosById.get(selectedProduct.id) ?? []).slice(0, 6).map((imageUrl, index) => (
                    <div
                      key={`${selectedProduct.id}-details-photo-${index + 1}`}
                      className="relative h-20 overflow-hidden rounded-md border border-slate-200 bg-white"
                    >
                      <Image
                        src={imageUrl}
                        alt={`${selectedProduct.name} photo ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 28vw, 140px"
                      />
                    </div>
                  ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                  No product photos have been uploaded for this item.
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div>
                  <p className="text-xs text-slate-500">SKU</p>
                  <p className="font-medium text-slate-900">{selectedProduct.sku}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Brand</p>
                  <p className="font-medium text-slate-900">{selectedProduct.brand}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Category</p>
                  <p className="font-medium text-slate-900">{selectedProduct.category}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Supplier</p>
                  <p className="font-medium text-slate-900">{selectedProduct.supplier}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Price</p>
                  <p className="font-medium text-slate-900">{formatPrice(selectedProduct.price)}</p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-xs font-medium text-slate-500">Variants</p>
                <div className="mt-2 space-y-1">
                  {(variantsByProductId.get(selectedProduct.id) ?? []).length === 0 ? (
                    <p className="text-xs text-slate-500">No variants available.</p>
                  ) : (
                    (variantsByProductId.get(selectedProduct.id) ?? []).map((variant) => (
                      <div
                        key={variant.id}
                        className="space-y-2 rounded-md bg-slate-50 px-2 py-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-800">{variant.sku}</span>
                          <span className="text-slate-600">
                            {variant.price == null ? "-" : formatPrice(variant.price)}
                          </span>
                        </div>
                        {(variant.images ?? []).length > 0 ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 border-slate-300 bg-white text-slate-700"
                            onClick={() =>
                              openGallery(
                                `${selectedProduct.name} - ${variant.sku}`,
                                (variant.images ?? []).map((image) => image.src)
                              )
                            }
                          >
                            <Images className="size-3.5" />
                            View images
                          </Button>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : null}

          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(galleryState)} onOpenChange={(open) => (!open ? setGalleryState(null) : null)}>
        <DialogContent className="w-[calc(100vw-1.5rem)] sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{galleryState ? `${galleryState.title} gallery` : "Product gallery"}</DialogTitle>
            <DialogDescription>
              Larger preview with thumbnails for easier image browsing.
            </DialogDescription>
          </DialogHeader>

          {galleryState ? (
            <div className="space-y-3">
              <div className="relative h-[42vh] overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                <Image
                  src={galleryState.images[galleryState.activeIndex] ?? ""}
                  alt={`${galleryState.title} photo ${galleryState.activeIndex + 1}`}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 95vw, 900px"
                />

                <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="border-slate-300 bg-white/95 text-slate-700"
                    disabled={galleryState.activeIndex === 0}
                    onClick={() =>
                      setGalleryState((current) =>
                        current
                          ? {
                              ...current,
                              activeIndex: Math.max(0, current.activeIndex - 1),
                            }
                          : null
                      )
                    }
                  >
                    <ChevronLeft className="size-4" />
                    Previous
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="border-slate-300 bg-white/95 text-slate-700"
                    disabled={galleryState.activeIndex >= galleryState.images.length - 1}
                    onClick={() =>
                      setGalleryState((current) =>
                        current
                          ? {
                              ...current,
                              activeIndex: Math.min(current.images.length - 1, current.activeIndex + 1),
                            }
                          : null
                      )
                    }
                  >
                    Next
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {galleryState.images.map((imageUrl, index) => {
                  const active = index === galleryState.activeIndex
                  return (
                    <button
                      key={`${imageUrl}-${index}`}
                      type="button"
                      className={`relative h-16 overflow-hidden rounded-md border ${
                        active ? "border-slate-950" : "border-slate-200"
                      }`}
                      onClick={() =>
                        setGalleryState((current) =>
                          current
                            ? {
                                ...current,
                                activeIndex: index,
                              }
                            : null
                        )
                      }
                    >
                      <Image
                        src={imageUrl}
                        alt={`${galleryState.title} thumbnail ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="120px"
                      />
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}

          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>

      <Dialog open={isEditProductDialogOpen} onOpenChange={setIsEditProductDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit product</DialogTitle>
            <DialogDescription>Update base product details.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Input
              value={editProductName}
              onChange={(event) => setEditProductName(event.target.value)}
              placeholder="Product name"
              aria-label="Edit product name"
              className="h-10 border-slate-300 bg-white"
            />

            <select
              value={editProductBrandId}
              onChange={(event) => setEditProductBrandId(event.target.value)}
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
              aria-label="Edit product brand"
            >
              <option value="">Select brand</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>

            <Input
              value={editProductPrice}
              onChange={(event) => setEditProductPrice(event.target.value)}
              placeholder="Base price (optional)"
              aria-label="Edit product price"
              type="number"
              min="0"
              step="0.01"
              className="h-10 border-slate-300 bg-white"
            />

            <textarea
              value={editProductDescription}
              onChange={(event) => setEditProductDescription(event.target.value)}
              placeholder="Description (optional)"
              aria-label="Edit product description"
              className="min-h-24 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            />

            {editProductError ? (
              <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {editProductError}
              </p>
            ) : null}
          </div>

          <DialogFooter showCloseButton>
            <Button
              type="button"
              className="bg-slate-950 text-white hover:bg-slate-800"
              onClick={saveEditedProduct}
              disabled={isUpdatingProduct}
            >
              {isUpdatingProduct ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TabsContent>
  )
}
