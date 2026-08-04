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
import type { RoomNode } from "../types"

type RoomsTabProps = {
  roomError: string | null
  roomsByParent: Map<string | null, RoomNode[]>
  roomItemCounts: Map<string, number>
  isDeletingRoomId: string | null
  isCreatingRoom: boolean
  isRoomDialogOpen: boolean
  setIsRoomDialogOpen: Dispatch<SetStateAction<boolean>>
  roomDialogParent: { id: string; name: string } | null
  newRoomName: string
  setNewRoomName: Dispatch<SetStateAction<string>>
  newRoomSlug: string
  setNewRoomSlug: Dispatch<SetStateAction<string>>
  openCreateRoomDialog: (parent?: { id: string; name: string }) => void
  handleCreateRoom: () => void
  handleEditRoom: (node: RoomNode) => void
  handleDeleteRoom: (node: RoomNode) => void
}

export function RoomsTab({
  roomError,
  roomsByParent,
  roomItemCounts,
  isDeletingRoomId,
  isCreatingRoom,
  isRoomDialogOpen,
  setIsRoomDialogOpen,
  roomDialogParent,
  newRoomName,
  setNewRoomName,
  newRoomSlug,
  setNewRoomSlug,
  openCreateRoomDialog,
  handleCreateRoom,
  handleEditRoom,
  handleDeleteRoom,
}: RoomsTabProps) {
  return (
    <TabsContent value="rooms" className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Rooms</h2>
          <p className="text-sm text-slate-600">Room tree with child rooms.</p>
        </div>

        <Button
          type="button"
          className="bg-slate-950 text-white hover:bg-slate-800"
          onClick={() => openCreateRoomDialog()}
        >
          <Plus className="size-4" />
          Create room
        </Button>
      </div>

      {roomError ? (
        <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {roomError}
        </p>
      ) : null}

      <Card className="border-slate-200 bg-white">
        <CardContent className="p-4">
          <TaxonomyTree
            itemsByParent={roomsByParent}
            itemCounts={roomItemCounts}
            deletingId={isDeletingRoomId}
            isCreating={isCreatingRoom}
            emptyMessage="No rooms found from rooms service."
            onEdit={(node) => handleEditRoom(node as RoomNode)}
            onAddChild={(node) => openCreateRoomDialog({ id: node.id, name: node.name })}
            onDelete={(node) => handleDeleteRoom(node as RoomNode)}
          />
        </CardContent>
      </Card>

      <Dialog open={isRoomDialogOpen} onOpenChange={setIsRoomDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {roomDialogParent ? `Add child to ${roomDialogParent.name}` : "Create room"}
            </DialogTitle>
            <DialogDescription>
              Enter the room name and optionally provide a slug.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Input
              value={newRoomName}
              onChange={(event) => setNewRoomName(event.target.value)}
              placeholder="Room name"
              aria-label="Room name"
              className="h-10 border-slate-300 bg-white"
            />
            <Input
              value={newRoomSlug}
              onChange={(event) => setNewRoomSlug(event.target.value)}
              placeholder="Slug (optional)"
              aria-label="Room slug"
              className="h-10 border-slate-300 bg-white"
            />
          </div>

          <DialogFooter showCloseButton>
            <Button
              type="button"
              className="bg-slate-950 text-white hover:bg-slate-800"
              onClick={handleCreateRoom}
              disabled={isCreatingRoom}
            >
              {isCreatingRoom ? "Creating..." : "Save room"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TabsContent>
  )
}
