"use client"

import type { Dispatch, SetStateAction } from "react"
import Image from "next/image"
import { Globe, Plus, Trash2 } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
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
import { TabsContent } from "@workspace/ui/components/tabs"
import { formatPrice } from "../helpers"

type BrandSummary = {
  id: string
  name: string
  slug: string
  logo: string | null
  website: string | null
  description: string | null
  count: number
  averagePrice: number
}

type BrandsTabProps = {
  brandError: string | null
  brandSummaries: BrandSummary[]
  isDeletingBrandId: string | null
  isCreatingBrand: boolean
  isBrandDialogOpen: boolean
  setIsBrandDialogOpen: Dispatch<SetStateAction<boolean>>
  newBrandName: string
  setNewBrandName: Dispatch<SetStateAction<string>>
  newBrandSlug: string
  setNewBrandSlug: Dispatch<SetStateAction<string>>
  newBrandWebsite: string
  setNewBrandWebsite: Dispatch<SetStateAction<string>>
  setBrandLogoFile: (file: File | null) => void
  newBrandDescription: string
  setNewBrandDescription: Dispatch<SetStateAction<string>>
  openCreateBrandDialog: () => void
  handleCreateBrand: () => void
  handleEditBrand: (brand: BrandSummary) => void
  handleDeleteBrand: (brand: BrandSummary) => void
}

export function BrandsTab({
  brandError,
  brandSummaries,
  isDeletingBrandId,
  isCreatingBrand,
  isBrandDialogOpen,
  setIsBrandDialogOpen,
  newBrandName,
  setNewBrandName,
  newBrandSlug,
  setNewBrandSlug,
  newBrandWebsite,
  setNewBrandWebsite,
  setBrandLogoFile,
  newBrandDescription,
  setNewBrandDescription,
  openCreateBrandDialog,
  handleCreateBrand,
  handleEditBrand,
  handleDeleteBrand,
}: BrandsTabProps) {
  return (
    <TabsContent value="brands" className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Brands</h2>
          <p className="text-sm text-slate-600">Manage brands and monitor brand contribution.</p>
        </div>

        <Button
          type="button"
          className="bg-slate-950 text-white hover:bg-slate-800"
          onClick={openCreateBrandDialog}
        >
          <Plus className="size-4" />
          Create brand
        </Button>
      </div>

      {brandError ? (
        <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {brandError}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {brandSummaries.map((brand) => (
          <Card
            key={brand.id}
            className="group overflow-hidden border-slate-200 bg-white py-0 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-[0_16px_36px_rgba(15,23,42,0.08)]"
          >
            <CardContent className="flex h-full flex-col gap-4 p-4">
              <div className="flex items-start gap-3">
                <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                  {brand.logo ? (
                    <Image
                      src={brand.logo}
                      alt={`${brand.name} logo`}
                      width={80}
                      height={80}
                      className="size-full object-contain"
                    />
                  ) : (
                    <Globe className="size-5 text-slate-400" />
                  )}
                </div>
                <div className="min-w-0 space-y-1">
                  <p className="truncate text-base font-semibold text-slate-950">{brand.name}</p>
                  <p className="truncate text-xs text-slate-500">/{brand.slug}</p>
                  {brand.website ? <p className="truncate text-xs text-emerald-700">{brand.website}</p> : null}
                </div>
              </div>
              {brand.description ? <p className="line-clamp-2 text-xs leading-5 text-slate-500">{brand.description}</p> : null}

              <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 text-sm text-slate-600">
                <Badge variant="outline" className="border-slate-300 bg-slate-50 text-slate-700">
                  {brand.count} products
                </Badge>
                <Badge variant="outline" className="border-slate-300 bg-slate-50 text-slate-700">
                  Avg. {formatPrice(brand.averagePrice)}
                </Badge>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="ml-auto border-slate-300 bg-white text-slate-700"
                  onClick={() => handleEditBrand(brand)}
                >
                  Edit
                </Button>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="outline"
                  className="border-rose-200 bg-white text-rose-700 hover:bg-rose-50"
                  onClick={() => handleDeleteBrand(brand)}
                  disabled={isDeletingBrandId === brand.id || isCreatingBrand}
                  title="Delete brand"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {brandSummaries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
            No brands found from brands service.
          </div>
        ) : null}
      </div>

      <Dialog open={isBrandDialogOpen} onOpenChange={setIsBrandDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create brand</DialogTitle>
            <DialogDescription>
              Enter brand details. Name and slug are required.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Input
              value={newBrandName}
              onChange={(event) => setNewBrandName(event.target.value)}
              placeholder="Brand name"
              aria-label="Brand name"
              className="h-10 border-slate-300 bg-white"
            />
            <Input
              value={newBrandSlug}
              onChange={(event) => setNewBrandSlug(event.target.value)}
              placeholder="Slug"
              aria-label="Brand slug"
              className="h-10 border-slate-300 bg-white"
            />
            <Input
              value={newBrandWebsite}
              onChange={(event) => setNewBrandWebsite(event.target.value)}
              placeholder="Website (optional)"
              aria-label="Brand website"
              className="h-10 border-slate-300 bg-white"
            />
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Brand logo (optional)</label>
              <Input
                type="file"
                accept="image/*"
                onChange={(event) => setBrandLogoFile(event.target.files?.[0] ?? null)}
                aria-label="Brand logo file"
                className="h-10 border-slate-300 bg-white"
              />
            </div>
            <Input
              value={newBrandDescription}
              onChange={(event) => setNewBrandDescription(event.target.value)}
              placeholder="Description (optional)"
              aria-label="Brand description"
              className="h-10 border-slate-300 bg-white"
            />
          </div>

          <DialogFooter showCloseButton>
            <Button
              type="button"
              className="bg-slate-950 text-white hover:bg-slate-800"
              onClick={handleCreateBrand}
              disabled={isCreatingBrand}
            >
              {isCreatingBrand ? "Creating..." : "Save brand"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TabsContent>
  )
}
