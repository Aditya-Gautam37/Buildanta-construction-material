"use client"
/* eslint-disable @next/next/no-img-element */

import { useState } from "react"
import { ImagePlus, Images, Star, Trash2 } from "lucide-react"
import { toast } from "@workspace/ui/components/sonner"
import { supabaseBrowser } from "@/lib/supabase/client"

type ImageRow = { id?: string; src: string; alt: string; sortOrder: number; primary: boolean; variantId?: string | null }

export default function ProductImageManager({ productId, productName, initialImages }: { productId: string; productName: string; initialImages: ImageRow[] }) {
  const [images, setImages] = useState(initialImages)
  const [busy, setBusy] = useState(false)

  function update(index: number, patch: Partial<ImageRow>) {
    setImages((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : patch.primary ? { ...item, primary: false } : item))
  }

  async function upload(file: File) {
    setBusy(true)
    try {
      const body = new FormData()
      body.set("file", file)
      body.set("kind", "product")
      const response = await fetch("/api/uploads", { method: "POST", body })
      const payload = await response.json() as { url?: string; error?: string }
      if (!response.ok || !payload.url) throw new Error(payload.error || "Upload failed.")
      setImages((current) => [...current, { src: payload.url!, alt: productName, sortOrder: current.length, primary: current.length === 0 }])
      toast.success("Image uploaded to durable storage. Save the gallery to publish it.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed.")
    } finally {
      setBusy(false)
    }
  }

  async function save() {
    setBusy(true)
    try {
      const { data: { session } } = await supabaseBrowser().auth.getSession()
      if (!session?.access_token) throw new Error("Your session expired.")
      const base = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5173").replace(/\/$/, "")
      const response = await fetch(`${base}/products/${encodeURIComponent(productId)}/images`, {
        method: "PUT",
        headers: { "content-type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ images: images.map((item, index) => ({ ...item, sortOrder: index, alt: item.alt.trim() || productName })) }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(Array.isArray(payload.message) ? payload.message.join(" ") : payload.message || "Gallery update failed.")
      setImages(payload as ImageRow[])
      toast.success("Product gallery saved and synchronized.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gallery update failed.")
    } finally {
      setBusy(false)
    }
  }

  function remove(index: number) {
    setImages((current) => {
      const remaining = current.filter((_, itemIndex) => itemIndex !== index)
      return remaining.map((item, itemIndex) => ({ ...item, sortOrder: itemIndex, primary: item.primary || (!remaining.some((candidate) => candidate.primary) && itemIndex === 0) }))
    })
  }

  return <section>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3"><span className="grid size-9 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Images className="size-4" /></span><div><h3 className="text-sm font-bold">Product gallery</h3><p className="mt-0.5 text-xs leading-5 text-slate-500">Images are stored durably and published in the selected order.</p></div></div>
      <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-sm transition hover:border-emerald-400 hover:text-emerald-700"><ImagePlus className="size-4" />{busy ? "Working..." : "Upload image"}<input type="file" accept="image/png,image/jpeg,image/webp,image/avif" className="sr-only" disabled={busy} onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file) }} /></label>
    </div>

    {images.length ? <div className="mt-4 grid gap-3 lg:grid-cols-2">{images.map((image, index) => <article key={image.id || `${image.src}-${index}`} className={`rounded-2xl border bg-slate-50 p-3 ${image.primary ? "border-emerald-300 ring-2 ring-emerald-100" : "border-slate-200"}`}>
      <div className="grid grid-cols-[76px_minmax(0,1fr)] gap-3"><div className="relative grid h-[76px] place-items-center overflow-hidden rounded-xl border border-slate-200 bg-white"><img src={image.src} alt="" className="h-full w-full object-contain" />{image.primary && <span className="absolute left-1.5 top-1.5 rounded-md bg-emerald-700 px-1.5 py-1 text-[8px] font-bold uppercase text-white">Primary</span>}</div><div className="min-w-0"><label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Accessible description<input value={image.alt} onChange={(event) => update(index, { alt: event.target.value })} placeholder={productName} className="mt-1.5 h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium normal-case tracking-normal text-slate-900 outline-none focus:border-emerald-500" /></label><div className="mt-2 flex items-center justify-between gap-2"><label className="inline-flex cursor-pointer items-center gap-1.5 text-[10px] font-bold text-slate-600"><input type="radio" name={`primary-${productId}`} checked={image.primary} onChange={() => update(index, { primary: true })} /><Star className="size-3" />Use as primary</label><button type="button" onClick={() => remove(index)} className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-[10px] font-bold text-rose-700 transition hover:bg-rose-50"><Trash2 className="size-3.5" />Remove</button></div></div></div>
    </article>)}</div> : <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center"><ImageOffIcon /><h4 className="mt-3 text-sm font-bold">No product images yet</h4><p className="mt-1 text-xs text-slate-500">Upload a clear product photo to improve storefront readiness.</p></div>}

    <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-[#f4f7fa] p-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-[11px] leading-5 text-slate-500"><strong className="text-slate-700">{images.length} image{images.length === 1 ? "" : "s"}</strong> prepared. Save after uploading, removing or changing the primary image.</p><button type="button" onClick={() => void save()} disabled={busy} className="min-h-10 rounded-xl bg-[#12344a] px-4 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50">{busy ? "Saving gallery..." : "Save gallery"}</button></div>
  </section>
}

function ImageOffIcon() {
  return <span className="mx-auto grid size-11 place-items-center rounded-2xl bg-white text-slate-400 shadow-sm"><Images className="size-5" /></span>
}
