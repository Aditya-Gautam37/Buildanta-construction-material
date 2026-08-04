"use client"
/* eslint-disable @next/next/no-img-element */

import { useMemo, useRef, useState } from "react"
import { useFormStatus } from "react-dom"
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ImageOff,
  PackageCheck,
  Search,
  SlidersHorizontal,
  Tags,
} from "lucide-react"
import { updateCatalogProductAction } from "./actions"
import ProductImageManager from "./product-image-manager"

type ProductStatus = "DRAFT" | "PUBLISHED" | "HIDDEN" | "ARCHIVED"
type ProductImage = { id: string; src: string; alt: string; sortOrder: number; primary: boolean; variantId: string | null }

export type CatalogProduct = {
  id: string
  name: string
  brand: string
  description: string | null
  status: ProductStatus
  unit: string
  minimumOrderQuantity: number
  sellingPrice: number | string
  bulkPrice: number | string | null
  gstPercent: number | string | null
  deliveryInfo: string | null
  updatedAt?: string
  categories: Array<{ id?: string; name: string; slug?: string }>
  variants: Array<{
    sku: string
    stockQuantity: number
    reservedQuantity: number
    lowStockThreshold?: number
    stockTracked: boolean
    unit?: string
    status?: string
  }>
  images: ProductImage[]
}

const statusLabels: Record<ProductStatus, string> = { DRAFT: "Draft", PUBLISHED: "Published", HIDDEN: "Hidden", ARCHIVED: "Archived" }
type Filter = "ALL" | ProductStatus | "ATTENTION"

function availableStock(product: CatalogProduct) {
  return product.variants.filter((variant) => variant.stockTracked).reduce((sum, variant) => sum + variant.stockQuantity - variant.reservedQuantity, 0)
}

function productIssues(product: CatalogProduct) {
  const issues: string[] = []
  if (!product.images.length) issues.push("Add a product image")
  if (!product.categories.length) issues.push("Assign a category")
  if (!product.variants.length) issues.push("Add an active variant")
  if (Number(product.sellingPrice) <= 0) issues.push("Confirm selling price")
  if (product.gstPercent == null || String(product.gstPercent) === "") issues.push("Add GST percentage")
  if (product.status === "PUBLISHED" && !product.variants.some((variant) => variant.stockTracked)) issues.push("Configure stock tracking")
  return issues
}

function primaryImage(product: CatalogProduct) {
  return [...product.images].sort((a, b) => Number(b.primary) - Number(a.primary) || a.sortOrder - b.sortOrder)[0]
}

function price(value: number | string | null) {
  if (value == null || Number(value) <= 0) return "Price pending"
  return `INR ${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
}

function StatusBadge({ status }: { status: ProductStatus }) {
  const classes = status === "PUBLISHED" ? "bg-emerald-100 text-emerald-800" : status === "DRAFT" ? "bg-amber-100 text-amber-800" : status === "HIDDEN" ? "bg-slate-200 text-slate-700" : "bg-rose-100 text-rose-700"
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold ${classes}`}>{statusLabels[status]}</span>
}

function SaveButton() {
  const { pending } = useFormStatus()
  return <button disabled={pending} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#12344a] px-5 text-sm font-bold text-white shadow-lg shadow-slate-900/10 transition hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60">{pending ? "Saving and synchronizing..." : "Save product settings"}</button>
}

export default function CatalogWorkspace({ products, savedId, error }: { products: CatalogProduct[]; savedId?: string; error?: string }) {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<Filter>("ALL")
  const [selectedId, setSelectedId] = useState(() => products.some((item) => item.id === savedId) ? savedId! : products[0]?.id ?? "")
  const editorRef = useRef<HTMLDivElement>(null)
  const selected = products.find((product) => product.id === selectedId) ?? products[0]

  const counts = useMemo(() => ({
    published: products.filter((item) => item.status === "PUBLISHED").length,
    draft: products.filter((item) => item.status === "DRAFT").length,
    attention: products.filter((item) => productIssues(item).length > 0).length,
    withoutImages: products.filter((item) => !item.images.length).length,
  }), [products])

  const visible = useMemo(() => products.filter((product) => {
    const query = search.trim().toLowerCase()
    const matchesSearch = !query || [product.name, product.brand, ...product.categories.map((item) => item.name), ...product.variants.map((item) => item.sku)].some((value) => value.toLowerCase().includes(query))
    const matchesFilter = filter === "ALL" || filter === "ATTENTION" ? filter === "ALL" || productIssues(product).length > 0 : product.status === filter
    return matchesSearch && matchesFilter
  }), [filter, products, search])

  function chooseProduct(id: string) {
    setSelectedId(id)
    window.setTimeout(() => editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0)
  }

  return <main className="mx-auto w-full max-w-[1640px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
    <section className="overflow-hidden rounded-[28px] bg-[#12344a] text-white shadow-xl shadow-slate-900/10">
      <div className="grid gap-6 px-6 py-7 sm:px-8 2xl:grid-cols-[minmax(0,1fr)_auto] 2xl:items-end">
        <div><p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-300">Catalogue command centre</p><h2 className="mt-3 text-3xl font-bold tracking-[-0.035em] sm:text-4xl">Keep every product storefront-ready.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Review visibility, price, tax, stock and images from one focused workspace. Saved changes continue to synchronize through the Inventory API.</p></div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 2xl:min-w-[500px]">{[
          [products.length, "Products", PackageCheck, "text-white"],
          [counts.published, "Published", CheckCircle2, "text-emerald-300"],
          [counts.attention, "Need attention", AlertTriangle, "text-amber-300"],
          [counts.withoutImages, "Missing images", ImageOff, "text-rose-300"],
        ].map(([value, label, Icon, color]) => { const MetricIcon = Icon as typeof PackageCheck; return <div key={String(label)} className="rounded-2xl border border-white/10 bg-white/[0.07] p-3.5"><div className="flex items-center justify-between"><strong className="text-2xl">{String(value)}</strong><MetricIcon className={`size-4 ${String(color)}`} /></div><span className="mt-1 block text-[11px] text-slate-300">{String(label)}</span></div> })}</div>
      </div>
    </section>

    {error && <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{String(error)}</p>}
    {savedId && <p role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">Product settings saved. Storefront visibility and pricing are synchronized.</p>}

    <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <label className="relative min-w-0 flex-1"><span className="sr-only">Search catalogue</span><Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products, brands, categories or SKU..." className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10" /></label>
        <div className="flex gap-2 overflow-x-auto pb-1 xl:pb-0" aria-label="Catalogue filters">{[
          ["ALL", "All", products.length], ["PUBLISHED", "Published", counts.published], ["DRAFT", "Drafts", counts.draft], ["ATTENTION", "Need attention", counts.attention],
        ].map(([value, label, count]) => <button type="button" key={String(value)} onClick={() => setFilter(value as Filter)} className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-xs font-bold transition ${filter === value ? "bg-[#12344a] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{String(label)}<span className={`rounded-full px-1.5 py-0.5 text-[9px] ${filter === value ? "bg-white/15" : "bg-white"}`}>{String(count)}</span></button>)}</div>
      </div>
    </section>

    <section className="grid items-start gap-5 2xl:grid-cols-[380px_minmax(0,1fr)]">
      <aside className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm 2xl:sticky 2xl:top-20">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">Product index</p><h3 className="mt-0.5 text-sm font-bold">{visible.length} matching products</h3></div><SlidersHorizontal className="size-4 text-slate-400" /></div>
        <div className="max-h-[620px] overflow-y-auto p-2 [scrollbar-width:thin]">
          {visible.map((product) => {
            const image = primaryImage(product)
            const issues = productIssues(product)
            return <button type="button" key={product.id} onClick={() => chooseProduct(product.id)} className={`mb-1 grid w-full grid-cols-[54px_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border p-2.5 text-left transition last:mb-0 ${selected?.id === product.id ? "border-emerald-300 bg-emerald-50 shadow-sm" : "border-transparent hover:border-slate-200 hover:bg-slate-50"}`}>
              <span className="grid size-[54px] place-items-center overflow-hidden rounded-xl bg-slate-100">{image ? <img src={image.src} alt="" className="h-full w-full object-contain" /> : <ImageOff className="size-5 text-slate-400" />}</span>
              <span className="min-w-0"><span className="block truncate text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700">{product.brand}</span><strong className="mt-0.5 block truncate text-sm text-slate-950">{product.name}</strong><span className="mt-1 flex items-center gap-2 text-[10px] text-slate-500"><span>{price(product.sellingPrice)}</span>{issues.length > 0 && <span className="font-bold text-amber-700">{issues.length} issue{issues.length === 1 ? "" : "s"}</span>}</span></span>
              <span className="grid justify-items-end gap-2"><StatusBadge status={product.status} /><ChevronRight className="size-4 text-slate-400" /></span>
            </button>
          })}
          {!visible.length && <div className="px-5 py-14 text-center"><Search className="mx-auto size-7 text-slate-300" /><h3 className="mt-3 text-sm font-bold">No products found</h3><p className="mt-1 text-xs leading-5 text-slate-500">Try another search or catalogue filter.</p></div>}
        </div>
      </aside>

      <div ref={editorRef} className="scroll-mt-20">
        {selected ? <ProductEditor product={selected} /> : <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center"><Boxes className="mx-auto size-9 text-slate-300" /><h3 className="mt-3 font-bold">No catalogue products</h3><p className="mt-1 text-sm text-slate-500">Create a product from the dashboard to begin.</p></div>}
      </div>
    </section>
  </main>
}

function ProductEditor({ product }: { product: CatalogProduct }) {
  const tracked = product.variants.filter((variant) => variant.stockTracked)
  const available = availableStock(product)
  const issues = productIssues(product)
  const image = primaryImage(product)
  const readyChecks = 6 - issues.length
  const readiness = Math.max(0, Math.round((readyChecks / 6) * 100))

  return <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
    <header className="border-b border-slate-100 p-5 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">{image ? <img src={image.src} alt={image.alt} className="h-full w-full object-contain" /> : <ImageOff className="size-8 text-slate-300" />}</div>
        <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">{product.brand}</span><StatusBadge status={product.status} /></div><h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{product.name}</h2><p className="mt-1 text-sm text-slate-500">{product.categories.map((item) => item.name).join(" / ") || "Uncategorized product"}</p>{product.description && <p className="mt-3 line-clamp-2 max-w-3xl text-sm leading-6 text-slate-600">{product.description}</p>}</div>
        <div className="w-full rounded-2xl bg-slate-50 p-4 sm:w-44"><div className="flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Readiness</span><strong className={issues.length ? "text-amber-700" : "text-emerald-700"}>{readiness}%</strong></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"><i className={`block h-full rounded-full ${issues.length ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${readiness}%` }} /></div><small className="mt-2 block text-[10px] leading-4 text-slate-500">{issues.length ? `${issues.length} item${issues.length === 1 ? "" : "s"} need attention` : "Ready for customers"}</small></div>
      </div>
    </header>

    <div className="grid grid-cols-2 border-b border-slate-100 sm:grid-cols-4">{[
      [product.variants.length, "Variants", Boxes], [tracked.length ? available : "Not tracked", "Available", PackageCheck], [price(product.sellingPrice), "Selling price", CircleDollarSign], [product.images.length, "Images", ImageOff],
    ].map(([value, label, Icon]) => { const MetricIcon = Icon as typeof Boxes; return <div key={String(label)} className="border-b border-r border-slate-100 p-4 last:border-r-0 sm:border-b-0"><MetricIcon className="size-4 text-emerald-700" /><strong className="mt-2 block truncate text-base text-slate-950">{String(value)}</strong><span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{String(label)}</span></div> })}</div>

    {issues.length > 0 && <section className="m-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:m-6"><div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-700" /><div><h3 className="text-sm font-bold text-amber-950">Complete before promoting this product</h3><ul className="mt-2 flex flex-wrap gap-2">{issues.map((issue) => <li key={issue} className="rounded-lg bg-white px-2.5 py-1 text-[11px] font-semibold text-amber-800 shadow-sm">{issue}</li>)}</ul></div></div></section>}

    <form action={updateCatalogProductAction} className="space-y-6 p-5 pt-1 sm:p-6 sm:pt-1">
      <input type="hidden" name="id" value={product.id} />
      <section><SectionHeading icon={PackageCheck} label="Storefront control" description="Choose whether customers can discover this product." /><div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Storefront status"><select name="status" defaultValue={product.status} className={inputClass}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field><Field label="Selling unit"><input name="unit" defaultValue={product.unit} required className={inputClass} /></Field></div></section>
      <section className="border-t border-slate-100 pt-6"><SectionHeading icon={CircleDollarSign} label="Commercial details" description="Customer-facing price, tax and minimum purchasing rules." /><div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Field label="Selling price (INR)"><input name="sellingPrice" type="number" min="0" step="0.01" defaultValue={String(product.sellingPrice)} className={inputClass} /></Field><Field label="Bulk price (INR)"><input name="bulkPrice" type="number" min="0" step="0.01" defaultValue={product.bulkPrice == null ? "" : String(product.bulkPrice)} placeholder="Optional" className={inputClass} /></Field><Field label="GST percentage"><input name="gstPercent" type="number" min="0" max="100" step="0.01" defaultValue={product.gstPercent == null ? "" : String(product.gstPercent)} placeholder="Example: 18" className={inputClass} /></Field><Field label="Minimum order quantity"><input name="minimumOrderQuantity" type="number" min="1" step="1" required defaultValue={product.minimumOrderQuantity} className={inputClass} /></Field><Field label="Delivery information" wide><input name="deliveryInfo" defaultValue={product.deliveryInfo ?? ""} placeholder="Confirmed after PIN-code review" className={inputClass} /></Field></div></section>
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"><div><strong className="block text-sm">Save and synchronize</strong><span className="mt-1 block text-xs text-slate-500">Updates are validated by the Inventory API before reaching the storefront.</span></div><SaveButton /></div>
    </form>

    <div className="border-t border-slate-100 p-5 sm:p-6"><ProductImageManager key={product.id} productId={product.id} productName={product.name} initialImages={product.images} /></div>
  </article>
}

const inputClass = "mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"

function Field({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return <label className={`text-xs font-bold text-slate-700 ${wide ? "sm:col-span-2" : ""}`}>{label}{children}</label>
}

function SectionHeading({ icon: Icon, label, description }: { icon: typeof Tags; label: string; description: string }) {
  return <div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Icon className="size-4" /></span><div><h3 className="text-sm font-bold text-slate-950">{label}</h3><p className="mt-0.5 text-xs leading-5 text-slate-500">{description}</p></div></div>
}
