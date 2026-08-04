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
import type { StageNode } from "../types"

type StagesTabProps = {
  stageError: string | null
  stagesByParent: Map<string | null, StageNode[]>
  stageItemCounts: Map<string, number>
  isDeletingStageId: string | null
  isCreatingStage: boolean
  isStageDialogOpen: boolean
  setIsStageDialogOpen: Dispatch<SetStateAction<boolean>>
  stageDialogParent: { id: string; name: string } | null
  newStageName: string
  setNewStageName: Dispatch<SetStateAction<string>>
  newStageSlug: string
  setNewStageSlug: Dispatch<SetStateAction<string>>
  openCreateStageDialog: (parent?: { id: string; name: string }) => void
  handleCreateStage: () => void
  handleEditStage: (node: StageNode) => void
  handleDeleteStage: (node: StageNode) => void
}

export function StagesTab({
  stageError,
  stagesByParent,
  stageItemCounts,
  isDeletingStageId,
  isCreatingStage,
  isStageDialogOpen,
  setIsStageDialogOpen,
  stageDialogParent,
  newStageName,
  setNewStageName,
  newStageSlug,
  setNewStageSlug,
  openCreateStageDialog,
  handleCreateStage,
  handleEditStage,
  handleDeleteStage,
}: StagesTabProps) {
  return (
    <TabsContent value="stages" className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Stages</h2>
          <p className="text-sm text-slate-600">Stage tree with child stages.</p>
        </div>

        <Button
          type="button"
          className="bg-slate-950 text-white hover:bg-slate-800"
          onClick={() => openCreateStageDialog()}
        >
          <Plus className="size-4" />
          Create stage
        </Button>
      </div>

      {stageError ? (
        <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {stageError}
        </p>
      ) : null}

      <Card className="border-slate-200 bg-white">
        <CardContent className="p-4">
          <TaxonomyTree
            itemsByParent={stagesByParent}
            itemCounts={stageItemCounts}
            deletingId={isDeletingStageId}
            isCreating={isCreatingStage}
            emptyMessage="No stages found from stages service."
            onEdit={(node) => handleEditStage(node as StageNode)}
            onAddChild={(node) => openCreateStageDialog({ id: node.id, name: node.name })}
            onDelete={(node) => handleDeleteStage(node as StageNode)}
          />
        </CardContent>
      </Card>

      <Dialog open={isStageDialogOpen} onOpenChange={setIsStageDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {stageDialogParent ? `Add child to ${stageDialogParent.name}` : "Create stage"}
            </DialogTitle>
            <DialogDescription>
              Enter the stage name and optionally provide a slug.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Input
              value={newStageName}
              onChange={(event) => setNewStageName(event.target.value)}
              placeholder="Stage name"
              aria-label="Stage name"
              className="h-10 border-slate-300 bg-white"
            />
            <Input
              value={newStageSlug}
              onChange={(event) => setNewStageSlug(event.target.value)}
              placeholder="Slug (optional)"
              aria-label="Stage slug"
              className="h-10 border-slate-300 bg-white"
            />
          </div>

          <DialogFooter showCloseButton>
            <Button
              type="button"
              className="bg-slate-950 text-white hover:bg-slate-800"
              onClick={handleCreateStage}
              disabled={isCreatingStage}
            >
              {isCreatingStage ? "Creating..." : "Save stage"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TabsContent>
  )
}
