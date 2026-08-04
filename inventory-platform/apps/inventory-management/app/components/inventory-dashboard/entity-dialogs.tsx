"use client"

import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import type { DeleteDialogState, EditDialogState } from "./types"

export function EntityEditDialog({
  editDialog,
  setEditDialog,
  onSave,
  isSaving,
}: {
  editDialog: EditDialogState | null
  setEditDialog: (value: EditDialogState | null | ((current: EditDialogState | null) => EditDialogState | null)) => void
  onSave: () => void
  isSaving: boolean
}) {
  return (
    <Dialog
      open={!!editDialog}
      onOpenChange={(open) => {
        if (!open) {
          setEditDialog(null)
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editDialog ? `Edit ${editDialog.type}` : "Edit item"}</DialogTitle>
          <DialogDescription>Update the fields below and save changes.</DialogDescription>
        </DialogHeader>

        {editDialog ? (
          <div className="space-y-3">
            <Input
              value={editDialog.name}
              onChange={(event) =>
                setEditDialog((current) => (current ? { ...current, name: event.target.value } : current))
              }
              placeholder="Name"
              aria-label="Edit name"
              className="h-10 border-slate-300 bg-white"
            />

            {editDialog.type === "category" ||
            editDialog.type === "stage" ||
            editDialog.type === "room" ||
            editDialog.type === "brand" ? (
              <Input
                value={editDialog.slug ?? ""}
                onChange={(event) =>
                  setEditDialog((current) => (current ? { ...current, slug: event.target.value } : current))
                }
                placeholder="Slug"
                aria-label="Edit slug"
                className="h-10 border-slate-300 bg-white"
              />
            ) : null}

            {editDialog.type === "supplier" ? (
              <>
                <Input
                  value={editDialog.email ?? ""}
                  onChange={(event) =>
                    setEditDialog((current) => (current ? { ...current, email: event.target.value } : current))
                  }
                  placeholder="Email"
                  aria-label="Edit supplier email"
                  className="h-10 border-slate-300 bg-white"
                />
                <Input
                  value={editDialog.contactInfo ?? ""}
                  onChange={(event) =>
                    setEditDialog((current) =>
                      current ? { ...current, contactInfo: event.target.value } : current
                    )
                  }
                  placeholder="Contact info"
                  aria-label="Edit supplier contact info"
                  className="h-10 border-slate-300 bg-white"
                />
                <Input
                  value={editDialog.address ?? ""}
                  onChange={(event) =>
                    setEditDialog((current) => (current ? { ...current, address: event.target.value } : current))
                  }
                  placeholder="Address"
                  aria-label="Edit supplier address"
                  className="h-10 border-slate-300 bg-white"
                />
              </>
            ) : null}

            {editDialog.type === "brand" ? (
              <>
                <Input
                  value={editDialog.website ?? ""}
                  onChange={(event) =>
                    setEditDialog((current) => (current ? { ...current, website: event.target.value } : current))
                  }
                  placeholder="Website"
                  aria-label="Edit brand website"
                  className="h-10 border-slate-300 bg-white"
                />
                <Input
                  value={editDialog.description ?? ""}
                  onChange={(event) =>
                    setEditDialog((current) =>
                      current ? { ...current, description: event.target.value } : current
                    )
                  }
                  placeholder="Description"
                  aria-label="Edit brand description"
                  className="h-10 border-slate-300 bg-white"
                />
              </>
            ) : null}
          </div>
        ) : null}

        <DialogFooter showCloseButton>
          <Button
            type="button"
            className="bg-slate-950 text-white hover:bg-slate-800"
            onClick={onSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function EntityDeleteDialog({
  deleteDialog,
  setDeleteDialog,
  onConfirm,
  isConfirming,
}: {
  deleteDialog: DeleteDialogState | null
  setDeleteDialog: (value: DeleteDialogState | null) => void
  onConfirm: () => void
  isConfirming: boolean
}) {
  return (
    <Dialog
      open={!!deleteDialog}
      onOpenChange={(open) => {
        if (!open) {
          setDeleteDialog(null)
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete {deleteDialog?.type ?? "item"}?</DialogTitle>
          <DialogDescription>
            {deleteDialog?.hasChildren
              ? `"${deleteDialog.name}" has child items. Remove child items first, then delete.`
              : `This will permanently delete "${deleteDialog?.name ?? "item"}".`}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter showCloseButton>
          <Button
            type="button"
            variant="outline"
            className="border-rose-200 bg-white text-rose-700 hover:bg-rose-50"
            onClick={onConfirm}
            disabled={isConfirming || !!deleteDialog?.hasChildren}
          >
            {isConfirming ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
