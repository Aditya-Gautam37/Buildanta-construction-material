"use client"

/* eslint-disable @next/next/no-img-element -- professional photos are validated, staff-managed URLs and need a client fallback for arbitrary approved hosts. */

import { useMemo, useState } from "react"
import { BriefcaseBusiness, ExternalLink, MapPin, Pencil, Plus, Search, Trash2, Upload, UsersRound } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { toast } from "@workspace/ui/components/sonner"
import {
  professionalTypeLabel,
  professionalTypeOptions,
  type ProfessionalDraft,
  type ProfessionalRecord,
  type ProfessionalTypeValue,
} from "@/lib/professionals"
import { deleteProfessionalAction, saveProfessionalAction } from "./actions"

function emptyDraft(type: ProfessionalTypeValue = "CONTRACTOR"): ProfessionalDraft {
  return {
    name: "", slug: "", type, headline: "", bio: "", photoUrl: "", location: "",
    yearsExperience: 0, email: "", phone: "", website: "", portfolioUrl: "", services: [],
    featured: false, published: true, sortOrder: 0,
  }
}

function sortProfessionals(records: ProfessionalRecord[]) {
  return [...records].sort((a, b) => a.type.localeCompare(b.type) || a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
}

function ProfessionalPhoto({ professional }: { professional: ProfessionalRecord }) {
  const [failed, setFailed] = useState(false)
  const initials = professional.name.split(" ").map((part) => part[0]).join("").slice(0, 2)
  if (!professional.photoUrl || failed) return initials
  return <img src={professional.photoUrl} alt={professional.name} width={160} height={160} className="size-full object-cover" onError={() => setFailed(true)} />
}

export default function ProfessionalManager({ initialProfessionals }: { initialProfessionals: ProfessionalRecord[] }) {
  const [professionals, setProfessionals] = useState(sortProfessionals(initialProfessionals))
  const [activeType, setActiveType] = useState<"ALL" | ProfessionalTypeValue>("ALL")
  const [query, setQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [draft, setDraft] = useState<ProfessionalDraft>(emptyDraft())
  const [servicesText, setServicesText] = useState("")
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return professionals.filter((professional) => {
      if (activeType !== "ALL" && professional.type !== activeType) return false
      if (!normalized) return true
      return [professional.name, professional.location, professional.headline, ...professional.services]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized))
    })
  }, [professionals, activeType, query])

  function openCreate(type: ProfessionalTypeValue = activeType === "ALL" ? "CONTRACTOR" : activeType) {
    setDraft(emptyDraft(type))
    setServicesText("")
    setPhotoFile(null)
    setFormError(null)
    setDialogOpen(true)
  }

  function openEdit(professional: ProfessionalRecord) {
    setDraft({ ...professional })
    setServicesText(professional.services.join(", "))
    setPhotoFile(null)
    setFormError(null)
    setDialogOpen(true)
  }

  async function uploadPhoto(file: File) {
    const form = new FormData()
    form.set("kind", "professional")
    form.set("file", file)
    const response = await fetch("/api/uploads", { method: "POST", body: form })
    const payload = await response.json() as { url?: string; error?: string }
    if (!response.ok || !payload.url) throw new Error(payload.error ?? "Unable to upload the photo.")
    return payload.url
  }

  async function save() {
    setSaving(true)
    setFormError(null)
    try {
      const photoUrl = photoFile ? await uploadPhoto(photoFile) : draft.photoUrl
      const result = await saveProfessionalAction({
        ...draft,
        photoUrl,
        services: servicesText.split(",").map((item) => item.trim()).filter(Boolean),
      })
      if (!result.ok) throw new Error(result.error)
      setProfessionals((current) => sortProfessionals([
        ...current.filter((item) => item.id !== result.professional.id),
        result.professional,
      ]))
      setDialogOpen(false)
      toast.success(draft.id ? "Professional profile updated." : "Professional profile created.")
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to save professional.")
    } finally {
      setSaving(false)
    }
  }

  async function remove(professional: ProfessionalRecord) {
    if (!window.confirm(`Delete ${professional.name}? This removes the profile from the public directory.`)) return
    setDeletingId(professional.id)
    const result = await deleteProfessionalAction(professional.id)
    if (result.ok) {
      setProfessionals((current) => current.filter((item) => item.id !== professional.id))
      toast.success("Professional profile deleted.")
    } else {
      toast.error(result.error)
    }
    setDeletingId(null)
  }

  return (
    <main className="relative flex-1 bg-[#f4f7fb]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_12%_0%,rgba(16,185,129,0.12),transparent_31%),radial-gradient(circle_at_88%_2%,rgba(14,165,233,0.11),transparent_32%)]" />
      <section className="relative mx-auto flex w-full max-w-[1500px] flex-col gap-5 px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
        <div className="overflow-hidden rounded-[2rem] bg-[linear-gradient(118deg,#071a2c_0%,#0b2b3f_58%,#0e4a54_100%)] px-5 py-7 text-white shadow-[0_24px_70px_rgba(7,26,44,0.22)] sm:px-8 sm:py-9">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-emerald-100"><BriefcaseBusiness className="size-3.5" /> PROFESSIONAL DIRECTORY</p>
              <h1 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl lg:text-5xl">Manage trusted professionals</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">Create, update and publish the contractors, designers, builders, architects and product owners shown on the Buildanta storefront.</p>
            </div>
            <Button type="button" onClick={() => openCreate()} className="h-11 bg-emerald-500 px-5 font-semibold text-slate-950 hover:bg-emerald-400"><Plus className="size-4" /> Add professional</Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          <button type="button" onClick={() => setActiveType("ALL")} className={`rounded-2xl border p-4 text-left transition ${activeType === "ALL" ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300"}`}><UsersRound className="mb-3 size-5" /><strong className="block text-2xl">{professionals.length}</strong><span className="text-xs opacity-75">All professionals</span></button>
          {professionalTypeOptions.map((option) => {
            const count = professionals.filter((item) => item.type === option.value).length
            return <button key={option.value} type="button" onClick={() => setActiveType(option.value)} className={`rounded-2xl border p-4 text-left transition ${activeType === option.value ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300"}`}><BriefcaseBusiness className="mb-3 size-5" /><strong className="block text-2xl">{count}</strong><span className="text-xs opacity-75">{option.label}</span></button>
          })}
        </div>

        <section className="rounded-[2rem] border border-slate-200/80 bg-white p-4 shadow-[0_18px_55px_rgba(15,23,42,0.07)] sm:p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><h2 className="text-xl font-semibold text-slate-950">{activeType === "ALL" ? "All professionals" : professionalTypeLabel(activeType)}</h2><p className="text-sm text-slate-500">Unpublished profiles stay hidden from customers.</p></div>
            <label className="flex h-11 w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 sm:w-80"><Search className="size-4 text-slate-400" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search people or locations" className="h-auto border-0 bg-transparent p-0 shadow-none focus-visible:ring-0" /></label>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((professional) => (
              <Card key={professional.id} className="overflow-hidden border-slate-200 py-0 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(15,23,42,0.08)]">
                <CardContent className="flex h-full flex-col gap-4 p-4">
                  <div className="flex gap-4">
                    <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 text-xl font-semibold text-slate-500"><ProfessionalPhoto professional={professional} /></div>
                    <div className="min-w-0"><div className="mb-2 flex flex-wrap gap-1.5"><Badge variant="outline">{professionalTypeLabel(professional.type, true)}</Badge>{professional.featured ? <Badge className="bg-amber-100 text-amber-800">Featured</Badge> : null}{!professional.published ? <Badge className="bg-slate-200 text-slate-700">Draft</Badge> : null}</div><h3 className="truncate text-lg font-semibold text-slate-950">{professional.name}</h3><p className="truncate text-xs text-slate-500">{professional.headline || "Professional profile"}</p></div>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-600"><span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5 text-emerald-600" />{professional.location}</span><span>{professional.yearsExperience} years experience</span></div>
                  {professional.services.length ? <div className="flex flex-wrap gap-1.5">{professional.services.slice(0, 3).map((service) => <span key={service} className="rounded-md bg-slate-100 px-2 py-1 text-[10px] text-slate-600">{service}</span>)}</div> : null}
                  <div className="mt-auto flex items-center gap-2 border-t border-slate-100 pt-3"><Button type="button" size="sm" variant="outline" onClick={() => openEdit(professional)}><Pencil className="size-3.5" /> Edit</Button>{professional.portfolioUrl ? <Button asChild type="button" size="sm" variant="outline"><a href={professional.portfolioUrl} target="_blank" rel="noreferrer"><ExternalLink className="size-3.5" /> Work</a></Button> : null}<Button type="button" size="icon-sm" variant="outline" className="ml-auto border-rose-200 text-rose-700 hover:bg-rose-50" onClick={() => void remove(professional)} disabled={deletingId === professional.id}><Trash2 className="size-3.5" /></Button></div>
                </CardContent>
              </Card>
            ))}
          </div>
          {filtered.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center"><UsersRound className="mx-auto mb-3 size-8 text-slate-400" /><h3 className="font-semibold text-slate-800">No professionals found</h3><p className="mt-1 text-sm text-slate-500">Add the first person to this category or change your search.</p><Button type="button" onClick={() => openCreate()} className="mt-4 bg-slate-950 text-white hover:bg-slate-800"><Plus className="size-4" /> Add professional</Button></div> : null}
        </section>
      </section>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>{draft.id ? "Edit professional" : "Add professional"}</DialogTitle><DialogDescription>Profiles marked published appear on the customer website immediately after saving.</DialogDescription></DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-xs font-medium text-slate-600">Full name<Input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Full name" /></label>
            <label className="space-y-1.5 text-xs font-medium text-slate-600">Profile URL slug<Input value={draft.slug} onChange={(event) => setDraft({ ...draft, slug: event.target.value })} placeholder="Auto-created from name" /></label>
            <label className="space-y-1.5 text-xs font-medium text-slate-600">Professional type<select value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value as ProfessionalTypeValue })} className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm">{professionalTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.singular}</option>)}</select></label>
            <label className="space-y-1.5 text-xs font-medium text-slate-600">Location<Input value={draft.location} onChange={(event) => setDraft({ ...draft, location: event.target.value })} placeholder="Mumbai, Maharashtra" /></label>
            <label className="space-y-1.5 text-xs font-medium text-slate-600 sm:col-span-2">Professional headline<Input value={draft.headline ?? ""} onChange={(event) => setDraft({ ...draft, headline: event.target.value })} placeholder="Residential contractor specialising in premium renovations" /></label>
            <label className="space-y-1.5 text-xs font-medium text-slate-600">Years of experience<Input type="number" min="0" max="80" value={draft.yearsExperience} onChange={(event) => setDraft({ ...draft, yearsExperience: Number(event.target.value) })} /></label>
            <label className="space-y-1.5 text-xs font-medium text-slate-600">Services, comma separated<Input value={servicesText} onChange={(event) => setServicesText(event.target.value)} placeholder="Turnkey projects, Renovation" /></label>
            <label className="space-y-1.5 text-xs font-medium text-slate-600 sm:col-span-2">About<textarea value={draft.bio ?? ""} onChange={(event) => setDraft({ ...draft, bio: event.target.value })} rows={4} placeholder="Experience, specialities and approach" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500" /></label>
            <label className="space-y-1.5 text-xs font-medium text-slate-600">Email<Input type="email" value={draft.email ?? ""} onChange={(event) => setDraft({ ...draft, email: event.target.value })} placeholder="name@example.com" /></label>
            <label className="space-y-1.5 text-xs font-medium text-slate-600">Phone<Input value={draft.phone ?? ""} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} placeholder="+91 90000 00000" /></label>
            <label className="space-y-1.5 text-xs font-medium text-slate-600">Website<Input type="url" value={draft.website ?? ""} onChange={(event) => setDraft({ ...draft, website: event.target.value })} placeholder="https://company.com" /></label>
            <label className="space-y-1.5 text-xs font-medium text-slate-600">Past work / portfolio link<Input type="url" value={draft.portfolioUrl ?? ""} onChange={(event) => setDraft({ ...draft, portfolioUrl: event.target.value })} placeholder="https://portfolio.com" /></label>
            <label className="space-y-1.5 text-xs font-medium text-slate-600 sm:col-span-2">Profile photo<div className="flex items-center gap-3"><Input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => setPhotoFile(event.target.files?.[0] ?? null)} /><Upload className="size-4 text-slate-400" /></div>{draft.photoUrl ? <span className="block truncate font-normal text-slate-400">Current: {draft.photoUrl}</span> : null}</label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={draft.featured} onChange={(event) => setDraft({ ...draft, featured: event.target.checked })} className="size-4 accent-emerald-600" /> Feature this profile</label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={draft.published} onChange={(event) => setDraft({ ...draft, published: event.target.checked })} className="size-4 accent-emerald-600" /> Publish on storefront</label>
          </div>
          {formError ? <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{formError}</p> : null}
          <DialogFooter showCloseButton><Button type="button" onClick={() => void save()} disabled={saving} className="bg-slate-950 text-white hover:bg-slate-800">{saving ? "Saving..." : "Save professional"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
