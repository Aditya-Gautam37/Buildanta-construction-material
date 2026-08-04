"use client"

import type { Dispatch, SetStateAction } from "react"
import { Plus } from "lucide-react"
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
import { TaxonomyTree } from "../taxonomy-tree"
import type { CategoryNode } from "../types"

type CategoriesTabProps = {
  categoryError: string | null
  categoriesByParent: Map<string | null, CategoryNode[]>
  categoryItemCounts: Map<string, number>
  isDeletingCategoryId: string | null
  isCreatingCategory: boolean
  isCategoryDialogOpen: boolean
  setIsCategoryDialogOpen: Dispatch<SetStateAction<boolean>>
  categoryDialogParent: { id: string; name: string } | null
  newCategoryName: string
  setNewCategoryName: Dispatch<SetStateAction<string>>
  newCategorySlug: string
  setNewCategorySlug: Dispatch<SetStateAction<string>>
  openCreateCategoryDialog: (parent?: { id: string; name: string }) => void
  handleCreateCategory: () => void
  handleEditCategory: (node: CategoryNode) => void
  handleDeleteCategory: (node: CategoryNode) => void
}

export function CategoriesTab({
  categoryError,
  categoriesByParent,
  categoryItemCounts,
  isDeletingCategoryId,
  isCreatingCategory,
  isCategoryDialogOpen,
  setIsCategoryDialogOpen,
  categoryDialogParent,
  newCategoryName,
  setNewCategoryName,
  newCategorySlug,
  setNewCategorySlug,
  openCreateCategoryDialog,
  handleCreateCategory,
  handleEditCategory,
  handleDeleteCategory,
}: CategoriesTabProps) {
  return (
    <TabsContent value="categories" className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Categories</h2>
          <p className="text-sm text-slate-600">Category tree with child categories.</p>
        </div>

        <Button
          type="button"
          className="bg-slate-950 text-white hover:bg-slate-800"
          onClick={() => openCreateCategoryDialog()}
        >
          <Plus className="size-4" />
          Create category
        </Button>
      </div>

      {categoryError ? (
        <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {categoryError}
        </p>
      ) : null}

      <Card className="border-slate-200 bg-white">
        <CardContent className="p-4">
          <TaxonomyTree
            itemsByParent={categoriesByParent}
            itemCounts={categoryItemCounts}
            deletingId={isDeletingCategoryId}
            isCreating={isCreatingCategory}
            emptyMessage="No categories found from categories service."
            onEdit={(node) => handleEditCategory(node as CategoryNode)}
            onAddChild={(node) =>
              openCreateCategoryDialog({ id: node.id, name: node.name })
            }
            onDelete={(node) => handleDeleteCategory(node as CategoryNode)}
          />
        </CardContent>
      </Card>

      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {categoryDialogParent ? `Add child to ${categoryDialogParent.name}` : "Create category"}
            </DialogTitle>
            <DialogDescription>
              Enter the category name and optionally provide a slug.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Input
              value={newCategoryName}
              onChange={(event) => setNewCategoryName(event.target.value)}
              placeholder="Category name"
              aria-label="Category name"
              className="h-10 border-slate-300 bg-white"
            />
            <Input
              value={newCategorySlug}
              onChange={(event) => setNewCategorySlug(event.target.value)}
              placeholder="Slug (optional)"
              aria-label="Category slug"
              className="h-10 border-slate-300 bg-white"
            />
          </div>

          <DialogFooter showCloseButton>
            <Button
              type="button"
              className="bg-slate-950 text-white hover:bg-slate-800"
              onClick={handleCreateCategory}
              disabled={isCreatingCategory}
            >
              {isCreatingCategory ? "Creating..." : "Save category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TabsContent>
  )
}
