"use client"

import type { Dispatch, SetStateAction } from "react"
import { Building2, Mail, Phone, Plus, Trash2, Users } from "lucide-react"
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

type SupplierSummary = {
  id: string
  name: string
  email: string | null
  contactInfo: string | null
  address: string | null
  count: number
  averagePrice: number
}

type SuppliersTabProps = {
  supplierError: string | null
  supplierSummaries: SupplierSummary[]
  isDeletingSupplierId: string | null
  isCreatingSupplier: boolean
  isSupplierDialogOpen: boolean
  setIsSupplierDialogOpen: Dispatch<SetStateAction<boolean>>
  newSupplierName: string
  setNewSupplierName: Dispatch<SetStateAction<string>>
  newSupplierEmail: string
  setNewSupplierEmail: Dispatch<SetStateAction<string>>
  newSupplierContact: string
  setNewSupplierContact: Dispatch<SetStateAction<string>>
  newSupplierAddress: string
  setNewSupplierAddress: Dispatch<SetStateAction<string>>
  openCreateSupplierDialog: () => void
  handleCreateSupplier: () => void
  handleEditSupplier: (supplier: SupplierSummary) => void
  handleDeleteSupplier: (supplier: SupplierSummary) => void
}

export function SuppliersTab({
  supplierError,
  supplierSummaries,
  isDeletingSupplierId,
  isCreatingSupplier,
  isSupplierDialogOpen,
  setIsSupplierDialogOpen,
  newSupplierName,
  setNewSupplierName,
  newSupplierEmail,
  setNewSupplierEmail,
  newSupplierContact,
  setNewSupplierContact,
  newSupplierAddress,
  setNewSupplierAddress,
  openCreateSupplierDialog,
  handleCreateSupplier,
  handleEditSupplier,
  handleDeleteSupplier,
}: SuppliersTabProps) {
  return (
    <TabsContent value="suppliers" className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Suppliers</h2>
          <p className="text-sm text-slate-600">Manage suppliers and monitor supplier contribution.</p>
        </div>

        <Button
          type="button"
          className="bg-slate-950 text-white hover:bg-slate-800"
          onClick={openCreateSupplierDialog}
        >
          <Plus className="size-4" />
          Create supplier
        </Button>
      </div>

      {supplierError ? (
        <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {supplierError}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {supplierSummaries.map((supplier) => (
          <Card
            key={supplier.id}
            className="border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-[0_16px_36px_rgba(15,23,42,0.08)]"
          >
            <CardContent className="flex h-full flex-col gap-4 p-4">
              <div className="flex items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <Building2 className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-slate-950">{supplier.name}</p>
                  <p className="mt-1 text-xs text-slate-500">Supply partner</p>
                </div>
              </div>

                <div className="min-h-10 space-y-1 text-xs text-slate-500">
                  {supplier.email ? (
                    <p className="inline-flex items-center gap-1.5">
                      <Mail className="size-3.5" />
                      {supplier.email}
                    </p>
                  ) : null}
                  {supplier.contactInfo ? (
                    <p className="inline-flex items-center gap-1.5">
                      <Phone className="size-3.5" />
                      {supplier.contactInfo}
                    </p>
                  ) : null}
                  {supplier.address ? <p>{supplier.address}</p> : null}
                </div>

              <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 text-sm text-slate-600">
                <Badge variant="outline" className="border-slate-300 bg-slate-50 text-slate-700">
                  <Users className="mr-1 size-3.5" />
                  {supplier.count} products
                </Badge>
                <Badge variant="outline" className="border-slate-300 bg-slate-50 text-slate-700">
                  Avg. {formatPrice(supplier.averagePrice)}
                </Badge>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="ml-auto border-slate-300 bg-white text-slate-700"
                  onClick={() => handleEditSupplier(supplier)}
                >
                  Edit
                </Button>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="outline"
                  className="border-rose-200 bg-white text-rose-700 hover:bg-rose-50"
                  onClick={() => handleDeleteSupplier(supplier)}
                  disabled={isDeletingSupplierId === supplier.id || isCreatingSupplier}
                  title="Delete supplier"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {supplierSummaries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
            No suppliers found from suppliers service.
          </div>
        ) : null}
      </div>

      <Dialog open={isSupplierDialogOpen} onOpenChange={setIsSupplierDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create supplier</DialogTitle>
            <DialogDescription>
              Enter supplier details. Only supplier name is required.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Input
              value={newSupplierName}
              onChange={(event) => setNewSupplierName(event.target.value)}
              placeholder="Supplier name"
              aria-label="Supplier name"
              className="h-10 border-slate-300 bg-white"
            />
            <Input
              value={newSupplierEmail}
              onChange={(event) => setNewSupplierEmail(event.target.value)}
              placeholder="Email (optional)"
              aria-label="Supplier email"
              className="h-10 border-slate-300 bg-white"
            />
            <Input
              value={newSupplierContact}
              onChange={(event) => setNewSupplierContact(event.target.value)}
              placeholder="Contact info (optional)"
              aria-label="Supplier contact info"
              className="h-10 border-slate-300 bg-white"
            />
            <Input
              value={newSupplierAddress}
              onChange={(event) => setNewSupplierAddress(event.target.value)}
              placeholder="Address (optional)"
              aria-label="Supplier address"
              className="h-10 border-slate-300 bg-white"
            />
          </div>

          <DialogFooter showCloseButton>
            <Button
              type="button"
              className="bg-slate-950 text-white hover:bg-slate-800"
              onClick={handleCreateSupplier}
              disabled={isCreatingSupplier}
            >
              {isCreatingSupplier ? "Creating..." : "Save supplier"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TabsContent>
  )
}
