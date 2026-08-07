"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { PackageCheck, Search, ShoppingCart } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { NativeSelect, NativeSelectOption } from "@workspace/ui/components/native-select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table"
import { toast } from "@workspace/ui/components/sonner"
import { supabaseBrowser } from "@/lib/supabase/client"

export type PurchaseModeValue = "QUOTE_ONLY" | "DIRECT_ONLY" | "DIRECT_AND_QUOTE"

export type CommerceVariant = {
  id: string
  sku: string
  unit: string
  price: number | string | null
  status: string
  minimumOrderQuantity: number
  purchaseMode: PurchaseModeValue
  maxDirectQuantity: number | null
  bulkQuoteThreshold: number | null
  quantityIncrement: number
  product: { id: string; name: string; status: string }
}

const PURCHASE_MODES: Array<{ value: PurchaseModeValue; label: string; help: string }> = [
  { value: "QUOTE_ONLY", label: "Quote only", help: "Customers must request a quotation. No Add to Cart button is shown." },
  { value: "DIRECT_ONLY", label: "Direct only", help: "Customers add to cart and buy directly, up to the maximum quantity." },
  { value: "DIRECT_AND_QUOTE", label: "Direct + bulk quote", help: "Direct purchase for small quantities; large orders switch to a quotation." },
]

function modeLabel(mode: PurchaseModeValue) {
  return PURCHASE_MODES.find((item) => item.value === mode)?.label ?? mode
}

function modeBadgeClass(mode: PurchaseModeValue) {
  if (mode === "DIRECT_ONLY") return "border-emerald-200 bg-emerald-50 text-emerald-700"
  if (mode === "DIRECT_AND_QUOTE") return "border-sky-200 bg-sky-50 text-sky-700"
  return "border-slate-200 bg-slate-50 text-slate-600"
}

type Draft = {
  purchaseMode: PurchaseModeValue
  minimumOrderQuantity: string
  quantityIncrement: string
  maxDirectQuantity: string
  bulkQuoteThreshold: string
}

function draftFrom(variant: CommerceVariant): Draft {
  return {
    purchaseMode: variant.purchaseMode,
    minimumOrderQuantity: String(variant.minimumOrderQuantity),
    quantityIncrement: String(variant.quantityIncrement),
    maxDirectQuantity: variant.maxDirectQuantity == null ? "" : String(variant.maxDirectQuantity),
    bulkQuoteThreshold: variant.bulkQuoteThreshold == null ? "" : String(variant.bulkQuoteThreshold),
  }
}

export default function CommerceManager({ variants }: { variants: CommerceVariant[] }) {
  const router = useRouter()
  const [term, setTerm] = useState("")
  const [editing, setEditing] = useState<CommerceVariant | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [saving, setSaving] = useState(false)

  const visible = useMemo(() => {
    const needle = term.trim().toLowerCase()
    if (!needle) return variants
    return variants.filter((variant) =>
      `${variant.product.name} ${variant.sku}`.toLowerCase().includes(needle),
    )
  }, [term, variants])

  const directCount = variants.filter((variant) => variant.purchaseMode !== "QUOTE_ONLY").length

  function openEditor(variant: CommerceVariant) {
    setEditing(variant)
    setDraft(draftFrom(variant))
  }

  async function save() {
    if (!editing || !draft) return
    setSaving(true)
    try {
      const supabase = supabaseBrowser()
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token
      if (!accessToken) throw new Error("You must be logged in to continue.")

      const payload: Record<string, unknown> = {
        purchaseMode: draft.purchaseMode,
        minimumOrderQuantity: Number(draft.minimumOrderQuantity) || 1,
        quantityIncrement: Number(draft.quantityIncrement) || 1,
        maxDirectQuantity: draft.maxDirectQuantity.trim() === "" ? null : Number(draft.maxDirectQuantity),
        // A threshold only has meaning when both direct and quote channels exist.
        bulkQuoteThreshold:
          draft.purchaseMode === "DIRECT_AND_QUOTE" && draft.bulkQuoteThreshold.trim() !== ""
            ? Number(draft.bulkQuoteThreshold)
            : null,
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:5173"}/product-variants/${editing.id}`,
        {
          method: "PUT",
          headers: { "content-type": "application/json", Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify(payload),
        },
      )
      if (!response.ok) {
        const failure = await response.json().catch(() => null) as { message?: string | string[] } | null
        const message = Array.isArray(failure?.message) ? failure.message.join(" ") : failure?.message
        throw new Error(message || `Request failed with status ${response.status}.`)
      }

      toast.success(`${editing.product.name} updated.`)
      setEditing(null)
      setDraft(null)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save these purchase rules.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div className="space-y-1">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <ShoppingCart className="size-5" /> Direct purchase settings
            </h2>
            <p className="max-w-2xl text-sm text-slate-600">
              Choose how customers can buy each product variant. Products stay quote-only until you
              enable direct purchase here, and every rule is enforced again on the server when a
              customer adds an item to their cart.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
              {directCount} of {variants.length} directly purchasable
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="relative max-w-sm">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="pl-9"
              placeholder="Search by product or SKU..."
              value={term}
              onChange={(event) => setTerm(event.target.value)}
            />
          </div>

          {visible.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center text-slate-500">
              <PackageCheck className="size-8" />
              <p className="text-sm">No product variants match this search.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Purchase mode</TableHead>
                    <TableHead className="text-right">Min</TableHead>
                    <TableHead className="text-right">Step</TableHead>
                    <TableHead className="text-right">Max direct</TableHead>
                    <TableHead className="text-right">Quote above</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((variant) => (
                    <TableRow key={variant.id}>
                      <TableCell className="font-medium text-slate-900">{variant.product.name}</TableCell>
                      <TableCell className="text-slate-600">{variant.sku}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={modeBadgeClass(variant.purchaseMode)}>
                          {modeLabel(variant.purchaseMode)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{variant.minimumOrderQuantity}</TableCell>
                      <TableCell className="text-right">{variant.quantityIncrement}</TableCell>
                      <TableCell className="text-right">{variant.maxDirectQuantity ?? "—"}</TableCell>
                      <TableCell className="text-right">{variant.bulkQuoteThreshold ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => openEditor(variant)}>
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={editing !== null} onOpenChange={(open) => { if (!open) { setEditing(null); setDraft(null) } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing?.product.name}</DialogTitle>
            <DialogDescription>
              {editing?.sku} · sold per {editing?.unit}
            </DialogDescription>
          </DialogHeader>

          {draft && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="purchase-mode">How can customers buy this?</Label>
                <NativeSelect
                  id="purchase-mode"
                  className="w-full"
                  value={draft.purchaseMode}
                  onChange={(event) => setDraft({ ...draft, purchaseMode: event.target.value as PurchaseModeValue })}
                >
                  {PURCHASE_MODES.map((mode) => (
                    <NativeSelectOption key={mode.value} value={mode.value}>{mode.label}</NativeSelectOption>
                  ))}
                </NativeSelect>
                <p className="text-xs text-slate-500">
                  {PURCHASE_MODES.find((mode) => mode.value === draft.purchaseMode)?.help}
                </p>
              </div>

              {draft.purchaseMode !== "QUOTE_ONLY" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="moq">Minimum quantity</Label>
                      <Input
                        id="moq" type="number" min="1" value={draft.minimumOrderQuantity}
                        onChange={(event) => setDraft({ ...draft, minimumOrderQuantity: event.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="increment">Sold in steps of</Label>
                      <Input
                        id="increment" type="number" min="1" value={draft.quantityIncrement}
                        onChange={(event) => setDraft({ ...draft, quantityIncrement: event.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max-direct">Maximum direct quantity</Label>
                    <Input
                      id="max-direct" type="number" min="1" placeholder="No limit"
                      value={draft.maxDirectQuantity}
                      onChange={(event) => setDraft({ ...draft, maxDirectQuantity: event.target.value })}
                    />
                    <p className="text-xs text-slate-500">Leave blank for no cap.</p>
                  </div>

                  {draft.purchaseMode === "DIRECT_AND_QUOTE" && (
                    <div className="space-y-2">
                      <Label htmlFor="threshold">Switch to a bulk quote at</Label>
                      <Input
                        id="threshold" type="number" min="1" placeholder="No threshold"
                        value={draft.bulkQuoteThreshold}
                        onChange={(event) => setDraft({ ...draft, bulkQuoteThreshold: event.target.value })}
                      />
                      <p className="text-xs text-slate-500">
                        At or above this quantity the line is handled as a quotation instead of a direct sale.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditing(null); setDraft(null) }} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save settings"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
