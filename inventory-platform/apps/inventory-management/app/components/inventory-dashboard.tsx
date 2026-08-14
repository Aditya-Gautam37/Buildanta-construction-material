"use client"

import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import {
  Activity,
  ArrowRight,
  Box,
  Building2,
  House,
  Layers3,
  Package,
  PanelTop,
  Sparkles,
  Tags,
  Truck,
  Users,
} from "lucide-react"
import { toast } from "@workspace/ui/components/sonner"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { supabaseBrowser } from "@/lib/supabase/client"
import { trpcClient } from "@/lib/trpc/client"

import { EntityDeleteDialog, EntityEditDialog } from "./inventory-dashboard/entity-dialogs"
import { flattenHierarchyOptions } from "./inventory-dashboard/helpers"
import { MetricCard } from "./inventory-dashboard/metric-card"
import { BrandsTab } from "./inventory-dashboard/tabs/brands-tab"
import { CategoriesTab } from "./inventory-dashboard/tabs/categories-tab"
import { ProductsTab } from "./inventory-dashboard/tabs/products-tab"
import { CategoryMappingDialog, type MappingOwner } from "./inventory-dashboard/category-mapping-dialog"
import { RoomsTab } from "./inventory-dashboard/tabs/rooms-tab"
import { StagesTab } from "./inventory-dashboard/tabs/stages-tab"
import { SuppliersTab } from "./inventory-dashboard/tabs/suppliers-tab"
import type {
  BrandNode,
  CatalogTab,
  CategoryNode,
  DeleteDialogState,
  EditDialogState,
  InventoryDashboardProps,
  ProductVariantNode,
  RoomNode,
  StageNode,
  SupplierNode,
} from "./inventory-dashboard/types"

import type { InventoryProduct } from "@/lib/products"

export default function InventoryDashboard({
  products,
  categories: backendCategories,
  stages: backendStages,
  rooms: backendRooms,
  suppliers: backendSuppliers,
  brands: backendBrands,
}: InventoryDashboardProps) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("All")
  const [activeTab, setActiveTab] = useState<CatalogTab>("categories")
  const [categories, setCategories] = useState<CategoryNode[]>(backendCategories)
  const [stages, setStages] = useState<StageNode[]>(backendStages)
  const [rooms, setRooms] = useState<RoomNode[]>(backendRooms)
  const [suppliers, setSuppliers] = useState<SupplierNode[]>(backendSuppliers)
  const [brands, setBrands] = useState<BrandNode[]>(backendBrands)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [categoryDialogParent, setCategoryDialogParent] = useState<{ id: string; name: string } | null>(null)
  const [isStageDialogOpen, setIsStageDialogOpen] = useState(false)
  const [stageDialogParent, setStageDialogParent] = useState<{ id: string; name: string } | null>(null)
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false)
  const [mappingOwner, setMappingOwner] = useState<MappingOwner | null>(null)
  const [roomDialogParent, setRoomDialogParent] = useState<{ id: string; name: string } | null>(null)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategorySlug, setNewCategorySlug] = useState("")
  const [newStageName, setNewStageName] = useState("")
  const [newStageSlug, setNewStageSlug] = useState("")
  const [newRoomName, setNewRoomName] = useState("")
  const [newRoomSlug, setNewRoomSlug] = useState("")
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false)
  const [newSupplierName, setNewSupplierName] = useState("")
  const [newSupplierEmail, setNewSupplierEmail] = useState("")
  const [newSupplierContact, setNewSupplierContact] = useState("")
  const [newSupplierAddress, setNewSupplierAddress] = useState("")
  const [isBrandDialogOpen, setIsBrandDialogOpen] = useState(false)
  const [newBrandName, setNewBrandName] = useState("")
  const [newBrandSlug, setNewBrandSlug] = useState("")
  const [newBrandWebsite, setNewBrandWebsite] = useState("")
  const [brandLogoFile, setBrandLogoFile] = useState<File | null>(null)
  const [newBrandDescription, setNewBrandDescription] = useState("")
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false)
  const [newProductName, setNewProductName] = useState("")
  const [newProductBrandId, setNewProductBrandId] = useState("")
  const [newProductCategoryIds, setNewProductCategoryIds] = useState<string[]>([])
  const [newProductStageIds, setNewProductStageIds] = useState<string[]>([])
  const [newProductRoomIds, setNewProductRoomIds] = useState<string[]>([])
  const [newProductPrice, setNewProductPrice] = useState("")
  const [newProductDescription, setNewProductDescription] = useState("")
  const [publishNewProduct, setPublishNewProduct] = useState(true)
  const [newProductImages, setNewProductImages] = useState<File[]>([])
  const [newProductVariantSupplierId, setNewProductVariantSupplierId] = useState("")
  const [newProductVariantSku, setNewProductVariantSku] = useState("")
  const [newProductVariantAttributes, setNewProductVariantAttributes] = useState("{}")
  const [newProductVariantImages, setNewProductVariantImages] = useState<File[]>([])
  const [isCreatingProduct, setIsCreatingProduct] = useState(false)
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)
  const [isCreatingStage, setIsCreatingStage] = useState(false)
  const [isCreatingRoom, setIsCreatingRoom] = useState(false)
  const [isCreatingSupplier, setIsCreatingSupplier] = useState(false)
  const [isCreatingBrand, setIsCreatingBrand] = useState(false)
  const [isDeletingCategoryId, setIsDeletingCategoryId] = useState<string | null>(null)
  const [isDeletingStageId, setIsDeletingStageId] = useState<string | null>(null)
  const [isDeletingRoomId, setIsDeletingRoomId] = useState<string | null>(null)
  const [isDeletingSupplierId, setIsDeletingSupplierId] = useState<string | null>(null)
  const [isDeletingBrandId, setIsDeletingBrandId] = useState<string | null>(null)
  const [isDeletingProductId, setIsDeletingProductId] = useState<string | null>(null)
  const [variants, setVariants] = useState<ProductVariantNode[]>([])
  const [isVariantDialogOpen, setIsVariantDialogOpen] = useState(false)
  const [variantMode, setVariantMode] = useState<"create" | "update">("create")
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null)
  const [variantProductId, setVariantProductId] = useState("")
  const [variantSupplierId, setVariantSupplierId] = useState("")
  const [variantSku, setVariantSku] = useState("")
  const [variantPrice, setVariantPrice] = useState("")
  const [variantAttributes, setVariantAttributes] = useState("{}")
  const [variantImageFiles, setVariantImageFiles] = useState<File[]>([])
  const [variantError, setVariantError] = useState<string | null>(null)
  const [isSavingVariant, setIsSavingVariant] = useState(false)
  const [categoryError, setCategoryError] = useState<string | null>(null)
  const [stageError, setStageError] = useState<string | null>(null)
  const [roomError, setRoomError] = useState<string | null>(null)
  const [supplierError, setSupplierError] = useState<string | null>(null)
  const [brandError, setBrandError] = useState<string | null>(null)
  const [productError, setProductError] = useState<string | null>(null)
  const [isProductDetailsOpen, setIsProductDetailsOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<InventoryProduct | null>(null)
  const [editDialog, setEditDialog] = useState<EditDialogState | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState | null>(null)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)

  function slugify(value: string) {
    return value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
  }

  function sanitizeFileName(value: string) {
    return value.replace(/[^a-zA-Z0-9._-]/g, "-")
  }

  async function uploadFileToBucket(bucket: string, path: string, file: File) {
    void path
    const form = new FormData()
    form.set("kind", bucket === "BrandLogos" ? "brand" : "product")
    form.set("file", file)
    const response = await fetch("/api/uploads", { method: "POST", body: form })
    const payload = (await response.json()) as { url?: string; error?: string }
    if (!response.ok || !payload.url) {
      throw new Error(payload.error ?? "Unable to upload image.")
    }
    return payload.url
  }

  useEffect(() => {
    let isMounted = true

    async function loadVariants() {
      try {
        const data = await runWithAccessToken((accessToken) =>
          trpcClient.getProductVariants.query({ accessToken })
        )
        if (!isMounted) {
          return
        }

        const normalized = data.map((item) => ({
          id: item.id,
          productId: item.productId,
          supplierId: item.supplierId,
          sku: item.sku,
          price: item.price == null ? null : Number(item.price),
          attributes: item.attributes,
          images: Array.isArray(item.images)
            ? item.images
                .filter((image) => Boolean(image?.src))
                .map((image) => ({
                  id: typeof image.id === "string" ? image.id : undefined,
                  src: String(image.src),
                  alt: typeof image.alt === "string" ? image.alt : undefined,
                }))
            : [],
          product: item.product,
          supplier: item.supplier,
        }))

        setVariants(normalized)
      } catch {
        if (isMounted) {
          toast.error("Unable to load product variants right now.")
        }
      }
    }

    void loadVariants()

    return () => {
      isMounted = false
    }
  }, [])

  function openCreateCategoryDialog(parent?: { id: string; name: string }) {
    setCategoryDialogParent(parent ?? null)
    setNewCategoryName("")
    setNewCategorySlug("")
    setCategoryError(null)
    setIsCategoryDialogOpen(true)
  }

  function openCreateStageDialog(parent?: { id: string; name: string }) {
    setStageDialogParent(parent ?? null)
    setNewStageName("")
    setNewStageSlug("")
    setStageError(null)
    setIsStageDialogOpen(true)
  }

  function openCreateRoomDialog(parent?: { id: string; name: string }) {
    setRoomDialogParent(parent ?? null)
    setNewRoomName("")
    setNewRoomSlug("")
    setRoomError(null)
    setIsRoomDialogOpen(true)
  }

  function openCreateSupplierDialog() {
    setNewSupplierName("")
    setNewSupplierEmail("")
    setNewSupplierContact("")
    setNewSupplierAddress("")
    setSupplierError(null)
    setIsSupplierDialogOpen(true)
  }

  function openCreateBrandDialog() {
    setNewBrandName("")
    setNewBrandSlug("")
    setNewBrandWebsite("")
    setBrandLogoFile(null)
    setNewBrandDescription("")
    setBrandError(null)
    setIsBrandDialogOpen(true)
  }

  function openCreateProductDialog() {
    setNewProductName("")
    setNewProductBrandId("")
    setNewProductCategoryIds([])
    setNewProductStageIds([])
    setNewProductRoomIds([])
    setNewProductPrice("")
    setNewProductDescription("")
    setNewProductImages([])
    setNewProductVariantSupplierId("")
    setNewProductVariantSku("")
    setNewProductVariantAttributes("{}")
    setNewProductVariantImages([])
    setProductError(null)
    setIsProductDialogOpen(true)
  }

  function openProductDetailsDialog(product: InventoryProduct) {
    setSelectedProduct(product)
    setIsProductDetailsOpen(true)
  }

  function openCreateVariantDialog(product: InventoryProduct) {
    setVariantMode("create")
    setEditingVariantId(null)
    setVariantProductId(product.id)
    setVariantSupplierId("")
    setVariantSku(`${product.sku}-V`)
    setVariantPrice(product.price > 0 ? String(product.price) : "")
    setVariantAttributes("{}")
    setVariantImageFiles([])
    setVariantError(null)
    setIsVariantDialogOpen(true)
  }

  function openUpdateVariantDialog(variant: ProductVariantNode) {
    setVariantMode("update")
    setEditingVariantId(variant.id)
    setVariantProductId(variant.productId)
    setVariantSupplierId(variant.supplierId)
    setVariantSku(variant.sku)
    setVariantPrice(variant.price == null ? "" : String(variant.price))
    setVariantAttributes(JSON.stringify(variant.attributes ?? {}, null, 2))
    setVariantImageFiles([])
    setVariantError(null)
    setIsVariantDialogOpen(true)
  }

  async function runWithAccessToken<T>(operation: (accessToken: string) => Promise<T>) {
    const supabase = supabaseBrowser()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    let accessToken = session?.access_token

    if (!accessToken) {
      throw new Error("You must be logged in to continue.")
    }

    try {
      return await operation(accessToken)
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : ""
      const isUnauthorized = message.includes("401") || message.includes("unauthorized")

      if (!isUnauthorized) {
        throw error
      }

      const refreshed = await supabase.auth.refreshSession()
      accessToken = refreshed.data.session?.access_token

      if (!accessToken) {
        throw error
      }

      return await operation(accessToken)
    }
  }

  async function handleCreateCategory() {
    const name = newCategoryName.trim()
    const slug = newCategorySlug.trim()

    if (!name) {
      setCategoryError("Category name is required.")
      return
    }

    setCategoryError(null)
    setIsCreatingCategory(true)

    try {
      const created = await runWithAccessToken((accessToken) =>
        trpcClient.createCategory.mutate({
          name,
          slug: slug || undefined,
          parentId: categoryDialogParent?.id,
          accessToken,
        })
      )

      setCategories((current) => {
        if (current.some((category) => category.id === created.id)) {
          return current
        }

        return [...current, created]
      })

      setIsCategoryDialogOpen(false)
      setCategoryDialogParent(null)
      setNewCategoryName("")
      setNewCategorySlug("")
      toast.success("Category created")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create category right now."
      setCategoryError(message)
      toast.error(message)
    } finally {
      setIsCreatingCategory(false)
    }
  }

  async function handleDeleteCategory(category: CategoryNode) {
    const hasChildren = categories.some((item) => item.parentId === category.id)
    setDeleteDialog({ type: "category", id: category.id, name: category.name, hasChildren })
  }

  async function handleEditCategory(category: CategoryNode) {
    setEditDialog({
      type: "category",
      id: category.id,
      name: category.name,
      slug: category.slug,
      parentId: category.parentId,
    })
  }

  async function handleCreateStage() {
    const name = newStageName.trim()
    const slug = newStageSlug.trim()

    if (!name) {
      setStageError("Stage name is required.")
      return
    }

    setStageError(null)
    setIsCreatingStage(true)

    try {
      const created = await runWithAccessToken((accessToken) =>
        trpcClient.createStage.mutate({
          name,
          slug: slug || undefined,
          parentId: stageDialogParent?.id,
          accessToken,
        })
      )

      setStages((current) => {
        if (current.some((stage) => stage.id === created.id)) {
          return current
        }

        return [...current, created]
      })

      setIsStageDialogOpen(false)
      setStageDialogParent(null)
      setNewStageName("")
      setNewStageSlug("")
      toast.success("Stage created")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create stage right now."
      setStageError(message)
      toast.error(message)
    } finally {
      setIsCreatingStage(false)
    }
  }

  async function handleDeleteStage(stage: StageNode) {
    const hasChildren = stages.some((item) => item.parentId === stage.id)
    setDeleteDialog({ type: "stage", id: stage.id, name: stage.name, hasChildren })
  }

  async function handleEditStage(stage: StageNode) {
    setEditDialog({
      type: "stage",
      id: stage.id,
      name: stage.name,
      slug: stage.slug,
      parentId: stage.parentId,
    })
  }

  async function handleCreateRoom() {
    const name = newRoomName.trim()
    const slug = newRoomSlug.trim()

    if (!name) {
      setRoomError("Room name is required.")
      return
    }

    setRoomError(null)
    setIsCreatingRoom(true)

    try {
      const created = await runWithAccessToken((accessToken) =>
        trpcClient.createRoom.mutate({
          name,
          slug: slug || undefined,
          parentId: roomDialogParent?.id,
          accessToken,
        })
      )

      setRooms((current) => {
        if (current.some((room) => room.id === created.id)) {
          return current
        }

        return [...current, created]
      })

      setIsRoomDialogOpen(false)
      setRoomDialogParent(null)
      setNewRoomName("")
      setNewRoomSlug("")
      toast.success("Room created")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create room right now."
      setRoomError(message)
      toast.error(message)
    } finally {
      setIsCreatingRoom(false)
    }
  }

  async function handleDeleteRoom(room: RoomNode) {
    const hasChildren = rooms.some((item) => item.parentId === room.id)
    setDeleteDialog({ type: "room", id: room.id, name: room.name, hasChildren })
  }

  async function handleEditRoom(room: RoomNode) {
    setEditDialog({
      type: "room",
      id: room.id,
      name: room.name,
      slug: room.slug,
      parentId: room.parentId,
    })
  }

  async function handleCreateSupplier() {
    const name = newSupplierName.trim()
    const email = newSupplierEmail.trim()
    const contactInfo = newSupplierContact.trim()
    const address = newSupplierAddress.trim()

    if (!name) {
      setSupplierError("Supplier name is required.")
      return
    }

    setSupplierError(null)
    setIsCreatingSupplier(true)

    try {
      const created = await runWithAccessToken((accessToken) =>
        trpcClient.createSupplier.mutate({
          name,
          email: email || undefined,
          contactInfo: contactInfo || undefined,
          address: address || undefined,
          accessToken,
        })
      )

      setSuppliers((current) => {
        if (current.some((supplier) => supplier.id === created.id)) {
          return current
        }

        return [created, ...current]
      })

      setIsSupplierDialogOpen(false)
      setNewSupplierName("")
      setNewSupplierEmail("")
      setNewSupplierContact("")
      setNewSupplierAddress("")
      toast.success("Supplier created")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create supplier right now."
      setSupplierError(message)
      toast.error(message)
    } finally {
      setIsCreatingSupplier(false)
    }
  }

  async function handleDeleteSupplier(supplier: SupplierNode) {
    setDeleteDialog({ type: "supplier", id: supplier.id, name: supplier.name })
  }

  async function handleEditSupplier(supplier: SupplierNode) {
    setEditDialog({
      type: "supplier",
      id: supplier.id,
      name: supplier.name,
      email: supplier.email ?? "",
      contactInfo: supplier.contactInfo ?? "",
      address: supplier.address ?? "",
    })
  }

  async function handleCreateBrand() {
    const name = newBrandName.trim()
    const slug = (newBrandSlug.trim() || slugify(name)).trim()
    const website = newBrandWebsite.trim()
    const description = newBrandDescription.trim()

    if (!name) {
      setBrandError("Brand name is required.")
      return
    }

    if (!slug) {
      setBrandError("Brand slug is required.")
      return
    }

    setBrandError(null)
    setIsCreatingBrand(true)

    try {
      let logoUrl: string | undefined

      if (brandLogoFile) {
        const filePath = `${slug}-${Date.now()}-${brandLogoFile.name}`
        logoUrl = await uploadFileToBucket("BrandLogos", filePath, brandLogoFile)
      }

      const created = await runWithAccessToken((accessToken) =>
        trpcClient.createBrand.mutate({
          name,
          slug,
          website: website || undefined,
          logo: logoUrl,
          description: description || undefined,
          accessToken,
        })
      )

      setBrands((current) => {
        if (current.some((brand) => brand.id === created.id)) {
          return current
        }

        return [created, ...current]
      })

      setIsBrandDialogOpen(false)
      setNewBrandName("")
      setNewBrandSlug("")
      setNewBrandWebsite("")
      setBrandLogoFile(null)
      setNewBrandDescription("")
      toast.success("Brand created")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create brand right now."
      setBrandError(message)
      toast.error(message)
    } finally {
      setIsCreatingBrand(false)
    }
  }

  async function handleDeleteBrand(brand: BrandNode) {
    setDeleteDialog({ type: "brand", id: brand.id, name: brand.name })
  }

  async function handleEditBrand(brand: BrandNode) {
    setEditDialog({
      type: "brand",
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      website: brand.website ?? "",
      description: brand.description ?? "",
      logo: brand.logo ?? null,
    })
  }

  async function handleDeleteProduct(product: InventoryProduct) {
    setDeleteDialog({ type: "product", id: product.id, name: product.name })
  }

  async function handleUpdateProduct(input: {
    id: string
    name: string
    brandId: string
    description?: string
    price?: number
  }) {
    const name = input.name.trim()
    const brandId = input.brandId.trim()

    if (!name) {
      throw new Error("Product name is required.")
    }

    if (!brandId) {
      throw new Error("Please select a brand.")
    }

    await runWithAccessToken((accessToken) =>
      trpcClient.updateProduct.mutate({
        id: input.id,
        name,
        brandId,
        description: input.description?.trim() || undefined,
        price: input.price,
        accessToken,
      })
    )

    toast.success("Product updated")
    router.refresh()
  }

  async function handleSaveEditDialog() {
    if (!editDialog) {
      return
    }

    const name = editDialog.name.trim()
    if (!name) {
      toast.error("Name is required.")
      return
    }

    setIsSavingEdit(true)

    try {
      if (editDialog.type === "category") {
        const updated = await runWithAccessToken((accessToken) =>
          trpcClient.updateCategory.mutate({
            id: editDialog.id,
            name,
            slug: editDialog.slug?.trim() || undefined,
            parentId: editDialog.parentId ?? undefined,
            accessToken,
          })
        )
        setCategories((current) => current.map((item) => (item.id === updated.id ? updated : item)))
      }

      if (editDialog.type === "stage") {
        const updated = await runWithAccessToken((accessToken) =>
          trpcClient.updateStage.mutate({
            id: editDialog.id,
            name,
            slug: editDialog.slug?.trim() || undefined,
            parentId: editDialog.parentId ?? undefined,
            accessToken,
          })
        )
        setStages((current) => current.map((item) => (item.id === updated.id ? updated : item)))
      }

      if (editDialog.type === "room") {
        const updated = await runWithAccessToken((accessToken) =>
          trpcClient.updateRoom.mutate({
            id: editDialog.id,
            name,
            slug: editDialog.slug?.trim() || undefined,
            parentId: editDialog.parentId ?? undefined,
            accessToken,
          })
        )
        setRooms((current) => current.map((item) => (item.id === updated.id ? updated : item)))
      }

      if (editDialog.type === "supplier") {
        const updated = await runWithAccessToken((accessToken) =>
          trpcClient.updateSupplier.mutate({
            id: editDialog.id,
            name,
            email: editDialog.email?.trim() || undefined,
            contactInfo: editDialog.contactInfo?.trim() || undefined,
            address: editDialog.address?.trim() || undefined,
            accessToken,
          })
        )
        setSuppliers((current) => current.map((item) => (item.id === updated.id ? updated : item)))
      }

      if (editDialog.type === "brand") {
        const slug = editDialog.slug?.trim()
        if (!slug) {
          toast.error("Brand slug is required.")
          setIsSavingEdit(false)
          return
        }

        const updated = await runWithAccessToken((accessToken) =>
          trpcClient.updateBrand.mutate({
            id: editDialog.id,
            name,
            slug,
            logo: editDialog.logo ?? undefined,
            website: editDialog.website?.trim() || undefined,
            description: editDialog.description?.trim() || undefined,
            accessToken,
          })
        )
        setBrands((current) => current.map((item) => (item.id === updated.id ? updated : item)))
      }

      toast.success("Saved changes")
      setEditDialog(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update right now."
      toast.error(message)
    } finally {
      setIsSavingEdit(false)
    }
  }

  async function handleConfirmDeleteDialog() {
    if (!deleteDialog) {
      return
    }

    setIsConfirmingDelete(true)

    try {
      if (deleteDialog.type === "category") {
        setIsDeletingCategoryId(deleteDialog.id)
        await runWithAccessToken((accessToken) =>
          trpcClient.deleteCategory.mutate({
            id: deleteDialog.id,
            accessToken,
          })
        )
        setCategories((current) => current.filter((item) => item.id !== deleteDialog.id))
      }

      if (deleteDialog.type === "stage") {
        setIsDeletingStageId(deleteDialog.id)
        await runWithAccessToken((accessToken) =>
          trpcClient.deleteStage.mutate({
            id: deleteDialog.id,
            accessToken,
          })
        )
        setStages((current) => current.filter((item) => item.id !== deleteDialog.id))
      }

      if (deleteDialog.type === "room") {
        setIsDeletingRoomId(deleteDialog.id)
        await runWithAccessToken((accessToken) =>
          trpcClient.deleteRoom.mutate({
            id: deleteDialog.id,
            accessToken,
          })
        )
        setRooms((current) => current.filter((item) => item.id !== deleteDialog.id))
      }

      if (deleteDialog.type === "supplier") {
        setIsDeletingSupplierId(deleteDialog.id)
        await runWithAccessToken((accessToken) =>
          trpcClient.deleteSupplier.mutate({
            id: deleteDialog.id,
            accessToken,
          })
        )
        setSuppliers((current) => current.filter((item) => item.id !== deleteDialog.id))
      }

      if (deleteDialog.type === "brand") {
        setIsDeletingBrandId(deleteDialog.id)
        await runWithAccessToken((accessToken) =>
          trpcClient.deleteBrand.mutate({
            id: deleteDialog.id,
            accessToken,
          })
        )
        setBrands((current) => current.filter((item) => item.id !== deleteDialog.id))
      }

      if (deleteDialog.type === "product") {
        setIsDeletingProductId(deleteDialog.id)
        await runWithAccessToken((accessToken) =>
          trpcClient.deleteProduct.mutate({
            id: deleteDialog.id,
            accessToken,
          })
        )
        router.refresh()
      }

      toast.success("Deleted successfully")
      setDeleteDialog(null)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to delete item. Remove child items first if present."
      toast.error(message)
    } finally {
      setIsDeletingCategoryId(null)
      setIsDeletingStageId(null)
      setIsDeletingRoomId(null)
      setIsDeletingSupplierId(null)
      setIsDeletingBrandId(null)
      setIsDeletingProductId(null)
      setIsConfirmingDelete(false)
    }
  }

  async function handleCreateProduct() {
    const name = newProductName.trim()
    const brandId = newProductBrandId.trim()
    const categoryIds = Array.from(new Set(newProductCategoryIds.map((value) => value.trim()).filter(Boolean)))
    const stageIds = Array.from(new Set(newProductStageIds.map((value) => value.trim()).filter(Boolean)))
    const roomIds = Array.from(new Set(newProductRoomIds.map((value) => value.trim()).filter(Boolean)))
    const description = newProductDescription.trim()
    const initialVariantSupplierId = newProductVariantSupplierId.trim()
    const initialVariantSku = newProductVariantSku.trim()
    const hasAnyInitialVariantInput = Boolean(initialVariantSupplierId || initialVariantSku)
    const shouldCreateInitialVariant = Boolean(initialVariantSupplierId && initialVariantSku)

    if (!name) {
      setProductError("Product name is required.")
      return
    }

    if (!brandId) {
      setProductError("Please select a brand.")
      return
    }

    if (categoryIds.length === 0) {
      setProductError("Please select at least one category.")
      return
    }

    if (stageIds.length === 0) {
      setProductError("Please select at least one stage.")
      return
    }

    if (newProductImages.length === 0) {
      setProductError("Please upload at least one product photo.")
      return
    }

    if (hasAnyInitialVariantInput && !initialVariantSupplierId) {
      setProductError("Please select a supplier for the initial variant.")
      return
    }

    if (hasAnyInitialVariantInput && !initialVariantSku) {
      setProductError("Initial variant SKU is required.")
      return
    }

    let parsedInitialVariantAttributes: Record<string, unknown> | undefined
    if (newProductVariantAttributes.trim()) {
      try {
        const parsed = JSON.parse(newProductVariantAttributes)
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          parsedInitialVariantAttributes = parsed as Record<string, unknown>
        } else {
          setProductError("Initial variant attributes must be a JSON object.")
          return
        }
      } catch {
        setProductError("Initial variant attributes must be valid JSON.")
        return
      }
    }

    const parsedPrice = newProductPrice.trim() ? Number(newProductPrice) : undefined
    if (parsedPrice != null && (!Number.isFinite(parsedPrice) || parsedPrice < 0)) {
      setProductError("Price must be a valid non-negative number.")
      return
    }

    setProductError(null)
    setIsCreatingProduct(true)

    try {
      const shouldPublish = publishNewProduct
      let variantImageUrls: string[] = []
      if (shouldCreateInitialVariant && newProductVariantImages.length > 0) {
        variantImageUrls = await Promise.all(
          newProductVariantImages.map(async (file) => {
            const filePath = `variants/${Date.now()}-${sanitizeFileName(initialVariantSku)}-${sanitizeFileName(file.name)}`
            return await uploadFileToBucket("ProductPhotos", filePath, file)
          })
        )
      }

      const created = await runWithAccessToken((accessToken) =>
        trpcClient.createProduct.mutate({
          name,
          brandId,
          description: description || undefined,
          categoryIds,
          stageIds,
          roomIds,
          price: parsedPrice,
          status: "DRAFT",
          createDefaultVariant: shouldCreateInitialVariant,
          defaultVariant: shouldCreateInitialVariant
            ? {
                supplierId: initialVariantSupplierId,
                sku: initialVariantSku,
                price: parsedPrice,
                attributes: parsedInitialVariantAttributes,
                imageUrls: variantImageUrls,
              }
            : undefined,
          accessToken,
        })
      )

      let uploadedCount = 0
      if (newProductImages.length > 0) {
        const productImageUrls = await Promise.all(
          newProductImages.map(async (file) => {
            const filePath = `${created.id}/${Date.now()}-${sanitizeFileName(file.name)}`
            return await uploadFileToBucket("ProductPhotos", filePath, file)
          })
        )
        await runWithAccessToken((accessToken) =>
          trpcClient.updateProductImages.mutate({
            productId: created.id,
            images: productImageUrls.map((src, index) => ({
              src,
              alt: `${name} product photo ${index + 1}`,
              sortOrder: index,
              primary: index === 0,
            })),
            accessToken,
          })
        )
        uploadedCount = productImageUrls.length
      }

      if (shouldPublish) {
        await runWithAccessToken((accessToken) =>
          trpcClient.updateProduct.mutate({ id: created.id, status: "PUBLISHED", accessToken })
        )
      }

      setIsProductDialogOpen(false)
      setNewProductName("")
      setNewProductBrandId("")
      setNewProductCategoryIds([])
      setNewProductStageIds([])
      setNewProductRoomIds([])
      setNewProductPrice("")
      setNewProductDescription("")
      setPublishNewProduct(true)
      setNewProductImages([])
      setNewProductVariantSupplierId("")
      setNewProductVariantSku("")
      setNewProductVariantAttributes("{}")
      setNewProductVariantImages([])

      toast.success(
        uploadedCount > 0
          ? `Product ${shouldPublish ? "published to the storefront" : "saved as a draft"} and ${uploadedCount} image${uploadedCount > 1 ? "s" : ""} uploaded.`
          : `Product ${shouldPublish ? "published to the storefront" : "saved as a draft"}.`
      )
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create product right now."
      setProductError(message)
      toast.error(message)
    } finally {
      setIsCreatingProduct(false)
    }
  }

  async function handleSaveVariant() {
    if (!variantProductId) {
      setVariantError("Please select a product.")
      return
    }

    if (!variantSupplierId) {
      setVariantError("Please select a supplier.")
      return
    }

    if (!variantSku.trim()) {
      setVariantError("Variant SKU is required.")
      return
    }

    let parsedAttributes: Record<string, unknown> | undefined

    if (variantAttributes.trim()) {
      try {
        const parsed = JSON.parse(variantAttributes)
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          parsedAttributes = parsed as Record<string, unknown>
        } else {
          setVariantError("Attributes must be a JSON object.")
          return
        }
      } catch {
        setVariantError("Attributes must be valid JSON.")
        return
      }
    }

    const parsedPrice = variantPrice.trim() ? Number(variantPrice) : undefined
    if (parsedPrice != null && (!Number.isFinite(parsedPrice) || parsedPrice < 0)) {
      setVariantError("Price must be a valid non-negative number.")
      return
    }

    setVariantError(null)
    setIsSavingVariant(true)

    try {
      let imageUrls: string[] = []
      if (variantImageFiles.length > 0) {
        imageUrls = await Promise.all(
          variantImageFiles.map(async (file) => {
            const filePath = `variants/${variantProductId}/${Date.now()}-${sanitizeFileName(variantSku.trim())}-${sanitizeFileName(file.name)}`
            return await uploadFileToBucket("ProductPhotos", filePath, file)
          })
        )
      }

      const result = await runWithAccessToken((accessToken) => {
        if (variantMode === "create") {
          return trpcClient.createProductVariant.mutate({
            productId: variantProductId,
            supplierId: variantSupplierId,
            sku: variantSku.trim(),
            price: parsedPrice,
            attributes: parsedAttributes,
            imageUrls,
            accessToken,
          })
        }

        if (!editingVariantId) {
          throw new Error("Variant id is missing for update.")
        }

        return trpcClient.updateProductVariant.mutate({
          id: editingVariantId,
          productId: variantProductId,
          supplierId: variantSupplierId,
          sku: variantSku.trim(),
          price: parsedPrice,
          attributes: parsedAttributes,
          imageUrls,
          accessToken,
        })
      })

      const normalized: ProductVariantNode = {
        id: result.id,
        productId: result.productId,
        supplierId: result.supplierId,
        sku: result.sku,
        price: result.price == null ? null : Number(result.price),
        attributes: result.attributes,
        images: Array.isArray(result.images)
          ? result.images
              .filter((image) => Boolean(image?.src))
              .map((image) => ({
                id: typeof image.id === "string" ? image.id : undefined,
                src: String(image.src),
                alt: typeof image.alt === "string" ? image.alt : undefined,
              }))
          : [],
        product: result.product,
        supplier: result.supplier,
      }

      setVariants((current) => {
        if (variantMode === "create") {
          return [normalized, ...current]
        }

        return current.map((item) => (item.id === normalized.id ? normalized : item))
      })

      setIsVariantDialogOpen(false)
  setVariantImageFiles([])
      toast.success(variantMode === "create" ? "Variant created" : "Variant updated")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save variant right now."
      setVariantError(message)
      toast.error(message)
    } finally {
      setIsSavingVariant(false)
    }
  }

  const productCategoryFilters = useMemo(
    () => ["All", ...new Set(products.map((product) => product.category))],
    [products]
  )

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return products.filter((product) => {
      const matchesCategory = activeCategory === "All" || product.category === activeCategory

      const searchable = [
        product.name,
        product.sku,
        product.brand,
        product.category,
        product.supplier,
      ]
        .join(" ")
        .toLowerCase()

      const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery)

      return matchesCategory && matchesQuery
    })
  }, [activeCategory, products, query])

  const totalProducts = products.length
  const totalCategories = categories.filter((category) => category.parentId == null).length
  const totalStages = stages.filter((stage) => stage.parentId == null).length
  const totalRooms = rooms.filter((room) => room.parentId == null).length
  const totalSuppliers = suppliers.length
  const totalBrands = brands.length

  const variantsByProductId = useMemo(() => {
    const grouped = new Map<string, ProductVariantNode[]>()

    variants.forEach((variant) => {
      const existing = grouped.get(variant.productId)

      if (existing) {
        existing.push(variant)
      } else {
        grouped.set(variant.productId, [variant])
      }
    })

    return grouped
  }, [variants])

  const categoryItemCounts = useMemo(() => {
    const counts = new Map<string, number>()

    products.forEach((product) => {
      counts.set(product.category, (counts.get(product.category) ?? 0) + 1)
    })

    return counts
  }, [products])

  const categoriesByParent = useMemo(() => {
    const grouped = new Map<string | null, CategoryNode[]>()

    categories.forEach((category) => {
      const key = category.parentId ?? null
      const existing = grouped.get(key)

      if (existing) {
        existing.push(category)
      } else {
        grouped.set(key, [category])
      }
    })

    grouped.forEach((items) => {
      items.sort((a, b) => a.name.localeCompare(b.name))
    })

    return grouped
  }, [categories])

  const stageItemCounts = useMemo(() => new Map<string, number>(), [])

  const stagesByParent = useMemo(() => {
    const grouped = new Map<string | null, StageNode[]>()

    stages.forEach((stage) => {
      const key = stage.parentId ?? null
      const existing = grouped.get(key)

      if (existing) {
        existing.push(stage)
      } else {
        grouped.set(key, [stage])
      }
    })

    grouped.forEach((items) => {
      items.sort((a, b) => a.name.localeCompare(b.name))
    })

    return grouped
  }, [stages])

  const roomItemCounts = useMemo(() => new Map<string, number>(), [])

  const roomsByParent = useMemo(() => {
    const grouped = new Map<string | null, RoomNode[]>()

    rooms.forEach((room) => {
      const key = room.parentId ?? null
      const existing = grouped.get(key)

      if (existing) {
        existing.push(room)
      } else {
        grouped.set(key, [room])
      }
    })

    grouped.forEach((items) => {
      items.sort((a, b) => a.name.localeCompare(b.name))
    })

    return grouped
  }, [rooms])

  const categoryParentById = useMemo(
    () => new Map(categories.map((category) => [category.id, category.parentId ?? null])),
    [categories]
  )

  const stageParentById = useMemo(
    () => new Map(stages.map((stage) => [stage.id, stage.parentId ?? null])),
    [stages]
  )

  const roomParentById = useMemo(
    () => new Map(rooms.map((room) => [room.id, room.parentId ?? null])),
    [rooms]
  )

  function includeAncestorSelections(ids: string[], parentById: Map<string, string | null>) {
    const unique = Array.from(new Set(ids.filter(Boolean)))

    const withAncestors = new Set<string>(unique)

    unique.forEach((candidateId) => {
      let current = parentById.get(candidateId) ?? null
      while (current) {
        withAncestors.add(current)
        current = parentById.get(current) ?? null
      }
    })

    return Array.from(withAncestors)
  }

  function handleProductCategorySelection(values: string[]) {
    setNewProductCategoryIds(includeAncestorSelections(values, categoryParentById))
  }

  function handleProductStageSelection(values: string[]) {
    setNewProductStageIds(includeAncestorSelections(values, stageParentById))
  }

  function handleProductRoomSelection(values: string[]) {
    setNewProductRoomIds(includeAncestorSelections(values, roomParentById))
  }

  const categoryHierarchyOptions = useMemo(
    () => flattenHierarchyOptions(categoriesByParent),
    [categoriesByParent]
  )

  const stageHierarchyOptions = useMemo(
    () => flattenHierarchyOptions(stagesByParent),
    [stagesByParent]
  )

  const roomHierarchyOptions = useMemo(
    () => flattenHierarchyOptions(roomsByParent),
    [roomsByParent]
  )

  const supplierSummaries = useMemo(() => {
    const summary = new Map<string, { count: number; totalPrice: number }>()

    products.forEach((product) => {
      const current = summary.get(product.brand)

      if (!current) {
        summary.set(product.brand, { count: 1, totalPrice: product.price })
        return
      }

      summary.set(product.brand, {
        count: current.count + 1,
        totalPrice: current.totalPrice + product.price,
      })
    })

    return suppliers
      .map((supplier) => {
        const stats = summary.get(supplier.name)

        return {
          id: supplier.id,
          name: supplier.name,
          email: supplier.email ?? null,
          contactInfo: supplier.contactInfo ?? null,
          address: supplier.address ?? null,
          count: stats?.count ?? 0,
          averagePrice: stats ? stats.totalPrice / stats.count : 0,
        }
      })
      .sort((a, b) => b.count - a.count)
  }, [products, suppliers])

  const brandSummaries = useMemo(() => {
    const summary = new Map<string, { count: number; totalPrice: number }>()

    products.forEach((product) => {
      const current = summary.get(product.brand)

      if (!current) {
        summary.set(product.brand, { count: 1, totalPrice: product.price })
        return
      }

      summary.set(product.brand, {
        count: current.count + 1,
        totalPrice: current.totalPrice + product.price,
      })
    })

    return brands
      .map((brand) => {
        const stats = summary.get(brand.name)

        return {
          id: brand.id,
          name: brand.name,
          slug: brand.slug,
          logo: brand.logo ?? null,
          website: brand.website ?? null,
          description: brand.description ?? null,
          count: stats?.count ?? 0,
          averagePrice: stats ? stats.totalPrice / stats.count : 0,
        }
      })
      .sort((a, b) => b.count - a.count)
  }, [products, brands])

  const catalogTabs = [
    { value: "categories" as const, label: "Product Categories", icon: Tags, count: totalCategories },
    { value: "stages" as const, label: "Stages", icon: Layers3, count: totalStages },
    { value: "rooms" as const, label: "Rooms", icon: House, count: totalRooms },
    { value: "brands" as const, label: "Brands", icon: Sparkles, count: totalBrands },
    { value: "products" as const, label: "Products", icon: Package, count: totalProducts },
    { value: "suppliers" as const, label: "Suppliers", icon: Building2, count: totalSuppliers },
  ]

  return (
    <main className="relative flex-1 overflow-hidden bg-[#f4f7fb]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(circle_at_12%_0%,rgba(16,185,129,0.13),transparent_30%),radial-gradient(circle_at_88%_5%,rgba(14,165,233,0.12),transparent_32%)]" />

      <section className="relative mx-auto flex w-full max-w-[1500px] flex-col gap-5 px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(118deg,#071a2c_0%,#0a2540_58%,#0e4a54_100%)] px-5 py-6 text-white shadow-[0_24px_70px_rgba(7,26,44,0.22)] sm:px-8 sm:py-8">
          <div className="pointer-events-none absolute -top-24 right-0 size-72 rounded-full bg-emerald-400/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 size-64 rounded-full bg-sky-400/10 blur-3xl" />

          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-emerald-100">
                <Activity className="size-3.5" />
                LIVE INVENTORY WORKSPACE
              </div>
              <h1 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl lg:text-5xl">
                Buildanta catalog control
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
                Manage every product, taxonomy, brand, room, construction stage, and supplier from
                one connected operations workspace.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/7 px-4 py-3 backdrop-blur">
                <p className="text-xs uppercase tracking-wider text-slate-400">Catalog status</p>
                <p className="mt-1 inline-flex items-center gap-2 text-sm font-semibold">
                  <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.12)]" />
                  Connected
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/7 px-4 py-3 backdrop-blur">
                <p className="text-xs uppercase tracking-wider text-slate-400">Data groups</p>
                <p className="mt-1 text-xl font-semibold">{catalogTabs.length}</p>
              </div>
              <div className="col-span-2 rounded-2xl border border-white/10 bg-white/7 px-4 py-3 backdrop-blur sm:col-span-1">
                <p className="text-xs uppercase tracking-wider text-slate-400">Assets</p>
                <p className="mt-1 text-sm font-semibold">Durable storage</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          <MetricCard label="Product categories" value={totalCategories.toString()} icon={Box} />
          <MetricCard label="Stages" value={totalStages.toString()} icon={Truck} />
          <MetricCard label="Rooms" value={totalRooms.toString()} icon={House} />
          <MetricCard label="Brands" value={totalBrands.toString()} icon={Sparkles} />
          <MetricCard label="Products" value={totalProducts.toString()} icon={Package} />
          <MetricCard label="Suppliers" value={totalSuppliers.toString()} icon={Users} />
        </div>

        <section className="grid gap-3 rounded-[2rem] border border-slate-200/80 bg-white p-4 shadow-[0_18px_55px_rgba(15,23,42,0.06)] lg:grid-cols-[1.15fr_1fr_1fr_1fr] lg:p-5">
          <div className="rounded-2xl bg-slate-950 p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-300">Recommended workflow</p>
            <h2 className="mt-2 text-xl font-semibold">Keep the catalogue organized</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">Create the structure first, add complete product information, then choose what customers see on the homepage.</p>
          </div>
          <button type="button" onClick={() => setActiveTab("categories")} className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-emerald-300 hover:bg-emerald-50/60">
            <span className="flex size-9 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm"><Tags className="size-4" /></span>
            <strong className="mt-4 flex items-center justify-between text-sm text-slate-950">1. Product categories <ArrowRight className="size-4 transition group-hover:translate-x-1" /></strong>
            <small className="mt-1 block leading-5 text-slate-500">Manage departments, categories and every nested product group.</small>
          </button>
          <button type="button" onClick={() => setActiveTab("products")} className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-sky-300 hover:bg-sky-50/60">
            <span className="flex size-9 items-center justify-center rounded-xl bg-white text-sky-700 shadow-sm"><Package className="size-4" /></span>
            <strong className="mt-4 flex items-center justify-between text-sm text-slate-950">2. Add products <ArrowRight className="size-4 transition group-hover:translate-x-1" /></strong>
            <small className="mt-1 block leading-5 text-slate-500">Add photos, pricing, specifications and variants.</small>
          </button>
          <a href="/homepage-content" className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-orange-300 hover:bg-orange-50/60">
            <span className="flex size-9 items-center justify-center rounded-xl bg-white text-orange-700 shadow-sm"><PanelTop className="size-4" /></span>
            <strong className="mt-4 flex items-center justify-between text-sm text-slate-950">3. Feature on website <ArrowRight className="size-4 transition group-hover:translate-x-1" /></strong>
            <small className="mt-1 block leading-5 text-slate-500">Select banners and products for the storefront.</small>
          </a>
        </section>

        <div>
          <section className="space-y-5 rounded-[2rem] border border-slate-200/80 bg-white p-4 shadow-[0_18px_55px_rgba(15,23,42,0.07)] sm:p-6">
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as CatalogTab)}
              className="space-y-6"
            >
              <TabsList className="grid h-auto w-full grid-cols-2 gap-2 rounded-2xl bg-slate-100/90 p-2 sm:grid-cols-3 lg:sticky lg:top-20 lg:z-20 lg:grid-cols-6 lg:shadow-sm">
                {catalogTabs.map(({ value, label, icon: Icon, count }) => (
                  <TabsTrigger
                    key={value}
                    value={value}
                    className="h-11 min-w-0 justify-between gap-2 rounded-xl px-3 text-slate-600 data-active:bg-white data-active:text-slate-950 data-active:shadow-sm"
                  >
                    <span className="inline-flex min-w-0 items-center gap-2">
                      <Icon className="size-4 shrink-0" />
                      <span className="truncate">{label}</span>
                    </span>
                    <span className="rounded-md bg-slate-200/70 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                      {count}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>

              <CategoriesTab
                categoryError={categoryError}
                categoriesByParent={categoriesByParent}
                categoryItemCounts={categoryItemCounts}
                isDeletingCategoryId={isDeletingCategoryId}
                isCreatingCategory={isCreatingCategory}
                isCategoryDialogOpen={isCategoryDialogOpen}
                setIsCategoryDialogOpen={setIsCategoryDialogOpen}
                categoryDialogParent={categoryDialogParent}
                newCategoryName={newCategoryName}
                setNewCategoryName={setNewCategoryName}
                newCategorySlug={newCategorySlug}
                setNewCategorySlug={setNewCategorySlug}
                openCreateCategoryDialog={openCreateCategoryDialog}
                handleCreateCategory={handleCreateCategory}
                handleEditCategory={handleEditCategory}
                handleDeleteCategory={handleDeleteCategory}
              />

              <StagesTab
                stageError={stageError}
                stagesByParent={stagesByParent}
                stageItemCounts={stageItemCounts}
                isDeletingStageId={isDeletingStageId}
                isCreatingStage={isCreatingStage}
                isStageDialogOpen={isStageDialogOpen}
                setIsStageDialogOpen={setIsStageDialogOpen}
                stageDialogParent={stageDialogParent}
                newStageName={newStageName}
                setNewStageName={setNewStageName}
                newStageSlug={newStageSlug}
                setNewStageSlug={setNewStageSlug}
                openCreateStageDialog={openCreateStageDialog}
                handleCreateStage={handleCreateStage}
                handleEditStage={handleEditStage}
                handleDeleteStage={handleDeleteStage}
                onMapCategories={(node) => setMappingOwner({ kind: "stages", id: node.id, name: node.name })}
              />

              <RoomsTab
                roomError={roomError}
                roomsByParent={roomsByParent}
                roomItemCounts={roomItemCounts}
                isDeletingRoomId={isDeletingRoomId}
                isCreatingRoom={isCreatingRoom}
                isRoomDialogOpen={isRoomDialogOpen}
                setIsRoomDialogOpen={setIsRoomDialogOpen}
                roomDialogParent={roomDialogParent}
                newRoomName={newRoomName}
                setNewRoomName={setNewRoomName}
                newRoomSlug={newRoomSlug}
                setNewRoomSlug={setNewRoomSlug}
                openCreateRoomDialog={openCreateRoomDialog}
                handleCreateRoom={handleCreateRoom}
                handleEditRoom={handleEditRoom}
                handleDeleteRoom={handleDeleteRoom}
                onMapCategories={(node) => setMappingOwner({ kind: "rooms", id: node.id, name: node.name })}
              />

              <BrandsTab
                brandError={brandError}
                brandSummaries={brandSummaries}
                isDeletingBrandId={isDeletingBrandId}
                isCreatingBrand={isCreatingBrand}
                isBrandDialogOpen={isBrandDialogOpen}
                setIsBrandDialogOpen={setIsBrandDialogOpen}
                newBrandName={newBrandName}
                setNewBrandName={setNewBrandName}
                newBrandSlug={newBrandSlug}
                setNewBrandSlug={setNewBrandSlug}
                newBrandWebsite={newBrandWebsite}
                setNewBrandWebsite={setNewBrandWebsite}
                setBrandLogoFile={setBrandLogoFile}
                newBrandDescription={newBrandDescription}
                setNewBrandDescription={setNewBrandDescription}
                openCreateBrandDialog={openCreateBrandDialog}
                handleCreateBrand={handleCreateBrand}
                handleEditBrand={handleEditBrand}
                handleDeleteBrand={handleDeleteBrand}
              />

              <ProductsTab
                products={products}
                brands={brands}
                suppliers={suppliers}
                query={query}
                setQuery={setQuery}
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
                productCategoryFilters={productCategoryFilters}
                filteredProducts={filteredProducts}
                variantsByProductId={variantsByProductId}
                isDeletingProductId={isDeletingProductId}
                openCreateProductDialog={openCreateProductDialog}
                openUpdateVariantDialog={openUpdateVariantDialog}
                openProductDetailsDialog={openProductDetailsDialog}
                openCreateVariantDialog={openCreateVariantDialog}
                handleDeleteProduct={handleDeleteProduct}
                handleUpdateProduct={handleUpdateProduct}
                isVariantDialogOpen={isVariantDialogOpen}
                setIsVariantDialogOpen={setIsVariantDialogOpen}
                variantMode={variantMode}
                variantProductId={variantProductId}
                setVariantProductId={setVariantProductId}
                variantSupplierId={variantSupplierId}
                setVariantSupplierId={setVariantSupplierId}
                variantSku={variantSku}
                setVariantSku={setVariantSku}
                variantPrice={variantPrice}
                setVariantPrice={setVariantPrice}
                variantAttributes={variantAttributes}
                setVariantAttributes={setVariantAttributes}
                setVariantImageFiles={setVariantImageFiles}
                variantError={variantError}
                handleSaveVariant={handleSaveVariant}
                isSavingVariant={isSavingVariant}
                isProductDialogOpen={isProductDialogOpen}
                setIsProductDialogOpen={setIsProductDialogOpen}
                newProductName={newProductName}
                setNewProductName={setNewProductName}
                newProductBrandId={newProductBrandId}
                setNewProductBrandId={setNewProductBrandId}
                categoryHierarchyOptions={categoryHierarchyOptions}
                stageHierarchyOptions={stageHierarchyOptions}
                roomHierarchyOptions={roomHierarchyOptions}
                newProductCategoryIds={newProductCategoryIds}
                setNewProductCategoryId={handleProductCategorySelection}
                newProductStageIds={newProductStageIds}
                setNewProductStageIds={handleProductStageSelection}
                newProductRoomIds={newProductRoomIds}
                setNewProductRoomIds={handleProductRoomSelection}
                newProductPrice={newProductPrice}
                setNewProductPrice={setNewProductPrice}
                newProductDescription={newProductDescription}
                setNewProductDescription={setNewProductDescription}
                publishNewProduct={publishNewProduct}
                setPublishNewProduct={setPublishNewProduct}
                setNewProductImages={setNewProductImages}
                newProductVariantSupplierId={newProductVariantSupplierId}
                setNewProductVariantSupplierId={setNewProductVariantSupplierId}
                newProductVariantSku={newProductVariantSku}
                setNewProductVariantSku={setNewProductVariantSku}
                newProductVariantAttributes={newProductVariantAttributes}
                setNewProductVariantAttributes={setNewProductVariantAttributes}
                setNewProductVariantImages={setNewProductVariantImages}
                productError={productError}
                handleCreateProduct={handleCreateProduct}
                isCreatingProduct={isCreatingProduct}
                isProductDetailsOpen={isProductDetailsOpen}
                setIsProductDetailsOpen={setIsProductDetailsOpen}
                selectedProduct={selectedProduct}
              />

              <SuppliersTab
                supplierError={supplierError}
                supplierSummaries={supplierSummaries}
                isDeletingSupplierId={isDeletingSupplierId}
                isCreatingSupplier={isCreatingSupplier}
                isSupplierDialogOpen={isSupplierDialogOpen}
                setIsSupplierDialogOpen={setIsSupplierDialogOpen}
                newSupplierName={newSupplierName}
                setNewSupplierName={setNewSupplierName}
                newSupplierEmail={newSupplierEmail}
                setNewSupplierEmail={setNewSupplierEmail}
                newSupplierContact={newSupplierContact}
                setNewSupplierContact={setNewSupplierContact}
                newSupplierAddress={newSupplierAddress}
                setNewSupplierAddress={setNewSupplierAddress}
                openCreateSupplierDialog={openCreateSupplierDialog}
                handleCreateSupplier={handleCreateSupplier}
                handleEditSupplier={handleEditSupplier}
                handleDeleteSupplier={handleDeleteSupplier}
              />
            </Tabs>

            <EntityEditDialog
              editDialog={editDialog}
              setEditDialog={setEditDialog}
              onSave={handleSaveEditDialog}
              isSaving={isSavingEdit}
            />

            <EntityDeleteDialog
              deleteDialog={deleteDialog}
              setDeleteDialog={setDeleteDialog}
              onConfirm={handleConfirmDeleteDialog}
              isConfirming={isConfirmingDelete}
            />

            <CategoryMappingDialog
              owner={mappingOwner}
              categories={categories}
              onClose={() => setMappingOwner(null)}
              runWithAccessToken={runWithAccessToken}
            />
          </section>

        </div>
      </section>
    </main>
  )
}
