"use client"

import Image from "next/image"
import { useMemo, useState } from "react"
import { ArrowDown, ArrowUp, ExternalLink, GalleryHorizontalEnd, ImagePlus, Package, Pencil, Plus, Trash2, Upload } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { toast } from "@workspace/ui/components/sonner"
import type { HomepageProductOption, HomepageProductPlacement, HomepageSlideDraft, HomepageSlideRecord } from "@/lib/homepage-content"
import { addHomepageProductAction, deleteHomepageSlideAction, removeHomepageProductAction, reorderHomepageProductsAction, saveHomepageSlideAction } from "./actions"

function emptySlide(sortOrder: number): HomepageSlideDraft {
  return { title: "", subtitle: "", imageUrl: "", altText: "", ctaLabel: "Browse materials", ctaHref: "/categories", active: true, sortOrder }
}

export default function HomepageContentManager({ initialSlides, initialPlacements, products }: { initialSlides: HomepageSlideRecord[]; initialPlacements: HomepageProductPlacement[]; products: HomepageProductOption[] }) {
  const [slides, setSlides] = useState(initialSlides)
  const [placements, setPlacements] = useState(initialPlacements)
  const [slideOpen, setSlideOpen] = useState(false)
  const [draft, setDraft] = useState<HomepageSlideDraft>(emptySlide(initialSlides.length))
  const [slideFile, setSlideFile] = useState<File | null>(null)
  const [selectedProductId, setSelectedProductId] = useState("")
  const [savingSlide, setSavingSlide] = useState(false)
  const [savingProducts, setSavingProducts] = useState(false)
  const [slideError, setSlideError] = useState<string | null>(null)

  const availableProducts = useMemo(() => {
    const selected = new Set(placements.map((item) => item.productId))
    return products.filter((product) => !selected.has(product.id))
  }, [placements, products])

  function openCreateSlide() {
    setDraft(emptySlide(slides.length))
    setSlideFile(null)
    setSlideError(null)
    setSlideOpen(true)
  }

  function openEditSlide(slide: HomepageSlideRecord) {
    setDraft({ ...slide })
    setSlideFile(null)
    setSlideError(null)
    setSlideOpen(true)
  }

  async function uploadSlide(file: File) {
    const form = new FormData()
    form.set("kind", "homepage")
    form.set("file", file)
    const response = await fetch("/api/uploads", { method: "POST", body: form })
    const payload = await response.json() as { url?: string; error?: string }
    if (!response.ok || !payload.url) throw new Error(payload.error ?? "Unable to upload slide image.")
    return payload.url
  }

  async function saveSlide() {
    setSavingSlide(true)
    setSlideError(null)
    try {
      const imageUrl = slideFile ? await uploadSlide(slideFile) : draft.imageUrl
      const result = await saveHomepageSlideAction({ ...draft, imageUrl })
      if (!result.ok) throw new Error(result.error)
      setSlides((current) => [...current.filter((item) => item.id !== result.slide.id), result.slide].sort((a, b) => a.sortOrder - b.sortOrder))
      setSlideOpen(false)
      toast.success(draft.id ? "Homepage slide updated." : "Homepage slide created.")
    } catch (error) {
      setSlideError(error instanceof Error ? error.message : "Unable to save slide.")
    } finally {
      setSavingSlide(false)
    }
  }

  async function deleteSlide(slide: HomepageSlideRecord) {
    if (!window.confirm(`Delete the slide “${slide.title}”?`)) return
    const result = await deleteHomepageSlideAction(slide.id)
    if (!result.ok) return toast.error(result.error)
    setSlides((current) => current.filter((item) => item.id !== slide.id))
    toast.success("Homepage slide deleted.")
  }

  async function addProduct() {
    if (!selectedProductId) return
    setSavingProducts(true)
    const result = await addHomepageProductAction(selectedProductId)
    if (result.ok) {
      setPlacements((current) => [...current, result.placement].sort((a, b) => a.sortOrder - b.sortOrder))
      setSelectedProductId("")
      toast.success("Product added to the homepage.")
    } else toast.error(result.error)
    setSavingProducts(false)
  }

  async function removeProduct(placement: HomepageProductPlacement) {
    const result = await removeHomepageProductAction(placement.id)
    if (!result.ok) return toast.error(result.error)
    setPlacements((current) => current.filter((item) => item.id !== placement.id))
    toast.success("Product removed from the homepage.")
  }

  async function moveProduct(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= placements.length) return
    const next = [...placements]
    const currentItem = next[index]
    const targetItem = next[target]
    if (!currentItem || !targetItem) return
    next[index] = targetItem
    next[target] = currentItem
    setSavingProducts(true)
    const result = await reorderHomepageProductsAction(next.map((item) => item.id))
    if (result.ok) setPlacements(next.map((item, sortOrder) => ({ ...item, sortOrder })))
    else toast.error(result.error)
    setSavingProducts(false)
  }

  return <main className="relative flex-1 bg-[#f4f7fb]">
    <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_12%_0%,rgba(249,115,22,0.13),transparent_31%),radial-gradient(circle_at_88%_2%,rgba(14,165,233,0.11),transparent_32%)]" />
    <section className="relative mx-auto flex w-full max-w-[1500px] flex-col gap-5 px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
      <div className="overflow-hidden rounded-[2rem] bg-[linear-gradient(118deg,#071a2c_0%,#0a2540_58%,#0e4a54_100%)] px-5 py-7 text-white shadow-[0_24px_70px_rgba(7,26,44,0.22)] sm:px-8 sm:py-9">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"><div className="max-w-3xl"><p className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-300/20 bg-orange-300/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-orange-100"><GalleryHorizontalEnd className="size-3.5" /> STOREFRONT HOMEPAGE</p><h1 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl lg:text-5xl">Control the first customer impression</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">Choose the rotating banner images and the exact inventory products featured on the Buildanta homepage.</p></div><a href="http://localhost:3003" target="_blank" rel="noreferrer" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 text-sm font-semibold text-white hover:bg-orange-400">Open storefront <ExternalLink className="size-4" /></a></div>
      </div>

      <section className="rounded-[2rem] border border-slate-200/80 bg-white p-4 shadow-[0_18px_55px_rgba(15,23,42,0.07)] sm:p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-xl font-semibold text-slate-950">Rotating hero slides</h2><p className="text-sm text-slate-500">Active slides rotate automatically. Use 1600 × 700 px landscape images for the best result.</p></div><Button type="button" onClick={openCreateSlide} className="bg-slate-950 text-white hover:bg-slate-800"><ImagePlus className="size-4" /> Add slide</Button></div>
        <div className="grid gap-4 lg:grid-cols-2">{slides.map((slide) => <Card key={slide.id} className="overflow-hidden border-slate-200 py-0"><div className="relative aspect-[16/6] overflow-hidden bg-slate-100"><Image src={slide.imageUrl} alt={slide.altText} fill sizes="(max-width:1024px) 100vw, 50vw" className="object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" /><div className="absolute inset-x-0 bottom-0 p-4 text-white"><div className="mb-1 flex items-center gap-2"><Badge className={slide.active ? "bg-emerald-500 text-white" : "bg-slate-500 text-white"}>{slide.active ? "Active" : "Hidden"}</Badge><span className="text-[10px]">Position {slide.sortOrder + 1}</span></div><h3 className="text-lg font-semibold">{slide.title}</h3><p className="line-clamp-1 text-xs text-slate-200">{slide.subtitle}</p></div></div><CardContent className="flex items-center gap-2 p-3"><Button type="button" size="sm" variant="outline" onClick={() => openEditSlide(slide)}><Pencil className="size-3.5" /> Edit</Button><Button type="button" size="icon-sm" variant="outline" className="ml-auto border-rose-200 text-rose-700 hover:bg-rose-50" onClick={() => void deleteSlide(slide)}><Trash2 className="size-3.5" /></Button></CardContent></Card>)}{slides.length === 0 ? <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center"><GalleryHorizontalEnd className="mx-auto mb-3 size-8 text-slate-400" /><h3 className="font-semibold text-slate-800">No custom slides yet</h3><p className="mt-1 text-sm text-slate-500">The storefront continues using its current Buildanta hero until you add a slide.</p></div> : null}</div>
      </section>

      <section className="rounded-[2rem] border border-slate-200/80 bg-white p-4 shadow-[0_18px_55px_rgba(15,23,42,0.07)] sm:p-6">
        <div className="mb-5"><h2 className="text-xl font-semibold text-slate-950">Featured inventory products</h2><p className="text-sm text-slate-500">Select up to 12 catalog products. Their current names, prices and images come directly from inventory.</p></div>
        <div className="mb-5 flex flex-col gap-2 sm:flex-row"><select value={selectedProductId} onChange={(event) => setSelectedProductId(event.target.value)} className="h-11 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-sm"><option value="">Choose an inventory product</option>{availableProducts.map((product) => <option key={product.id} value={product.id}>{product.name} — {product.brand}</option>)}</select><Button type="button" onClick={() => void addProduct()} disabled={!selectedProductId || savingProducts} className="h-11 bg-slate-950 text-white hover:bg-slate-800"><Plus className="size-4" /> Feature product</Button></div>
        <div className="space-y-2">{placements.map((placement, index) => <div key={placement.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-bold text-slate-500 shadow-sm">{index + 1}</span><Package className="size-5 shrink-0 text-emerald-600" /><div className="min-w-0 flex-1"><p className="truncate font-semibold text-slate-900">{placement.product.name}</p><p className="text-xs text-slate-500">{placement.product.brand}</p></div><div className="flex items-center gap-1"><Button type="button" size="icon-sm" variant="outline" disabled={index === 0 || savingProducts} onClick={() => void moveProduct(index, -1)} title="Move up"><ArrowUp className="size-3.5" /></Button><Button type="button" size="icon-sm" variant="outline" disabled={index === placements.length - 1 || savingProducts} onClick={() => void moveProduct(index, 1)} title="Move down"><ArrowDown className="size-3.5" /></Button><Button type="button" size="icon-sm" variant="outline" className="border-rose-200 text-rose-700 hover:bg-rose-50" onClick={() => void removeProduct(placement)} title="Remove"><Trash2 className="size-3.5" /></Button></div></div>)}{placements.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">No products selected. Until you choose them, the storefront automatically shows the latest inventory products.</div> : null}</div>
      </section>
    </section>

    <Dialog open={slideOpen} onOpenChange={setSlideOpen}><DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle>{draft.id ? "Edit homepage slide" : "Add homepage slide"}</DialogTitle><DialogDescription>The title and button appear over the image. Keep important image content near the centre for mobile screens.</DialogDescription></DialogHeader><div className="grid gap-4 sm:grid-cols-2"><label className="space-y-1.5 text-xs font-medium text-slate-600 sm:col-span-2">Slide image<div className="flex items-center gap-3"><Input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => setSlideFile(event.target.files?.[0] ?? null)} /><Upload className="size-4 text-slate-400" /></div>{draft.imageUrl ? <span className="block truncate font-normal text-slate-400">Current image: {draft.imageUrl}</span> : null}</label><label className="space-y-1.5 text-xs font-medium text-slate-600 sm:col-span-2">Headline<Input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Everything your project needs" /></label><label className="space-y-1.5 text-xs font-medium text-slate-600 sm:col-span-2">Supporting text<textarea value={draft.subtitle ?? ""} onChange={(event) => setDraft({ ...draft, subtitle: event.target.value })} rows={3} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Trusted materials, live availability and project pricing." /></label><label className="space-y-1.5 text-xs font-medium text-slate-600 sm:col-span-2">Image description<Input value={draft.altText} onChange={(event) => setDraft({ ...draft, altText: event.target.value })} placeholder="Construction materials prepared for a residential project" /></label><label className="space-y-1.5 text-xs font-medium text-slate-600">Button label<Input value={draft.ctaLabel ?? ""} onChange={(event) => setDraft({ ...draft, ctaLabel: event.target.value })} placeholder="Browse materials" /></label><label className="space-y-1.5 text-xs font-medium text-slate-600">Button destination<Input value={draft.ctaHref ?? ""} onChange={(event) => setDraft({ ...draft, ctaHref: event.target.value })} placeholder="/categories" /></label><label className="space-y-1.5 text-xs font-medium text-slate-600">Display position<Input type="number" min="0" value={draft.sortOrder} onChange={(event) => setDraft({ ...draft, sortOrder: Number(event.target.value) })} /></label><label className="flex items-end gap-2 pb-2 text-sm text-slate-700"><input type="checkbox" checked={draft.active} onChange={(event) => setDraft({ ...draft, active: event.target.checked })} className="size-4 accent-emerald-600" /> Show this slide</label></div>{slideError ? <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{slideError}</p> : null}<DialogFooter showCloseButton><Button type="button" onClick={() => void saveSlide()} disabled={savingSlide} className="bg-slate-950 text-white hover:bg-slate-800">{savingSlide ? "Saving..." : "Save slide"}</Button></DialogFooter></DialogContent></Dialog>
  </main>
}
