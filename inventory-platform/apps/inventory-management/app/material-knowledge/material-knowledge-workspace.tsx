"use client"

import { useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useFormStatus } from "react-dom"
import {
  AlertTriangle,
  BookOpenCheck,
  CheckCircle2,
  ChevronRight,
  Link2,
  ScrollText,
  Search,
  ShieldAlert,
  Sparkles,
} from "lucide-react"
import { archiveMaterialKnowledgeAction, publishMaterialKnowledgeAction, replaceRelatedMaterialsAction, saveMaterialKnowledgeAction } from "./actions"

type KnowledgeStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED"

export type MaterialKnowledgeListItem = {
  productId: string
  productName: string
  productStatus: string
  brand: string | null
  knowledge: null | {
    id: string
    status: KnowledgeStatus
    updatedAt: string
    verifiedAt: string | null
    missingFields: string[]
  }
}

type RelatedMaterial = {
  id: string
  relatedProductId: string
  role: string
  reason: string
  sequenceNote: string | null
  sortOrder: number
  relatedProduct: { id: string; name: string; status: string }
}

export type KnowledgeDetail = {
  id: string
  status: KnowledgeStatus
  summary: string | null
  useCases: string[]
  suitableSurfaces: string[]
  unsuitableSurfaces: string[]
  preparationSteps: string[]
  applicationSteps: string[]
  sequenceNote: string | null
  mixingInstructions: string | null
  requiredTools: string[]
  coverageValue: string | number | null
  coverageUnit: string | null
  coverageConditions: string | null
  numberOfCoats: number | null
  dryingCuringInfo: string | null
  safetyPrecautions: string[]
  commonMistakes: string[]
  professionalTips: string[]
  technicalDataSheetUrl: string | null
  sourceUrl: string | null
  sourceTitle: string | null
  sourceRevision: string | null
  verifiedAt: string | null
  reviewNotes: string | null
  updatedAt: string
  relatedMaterials: RelatedMaterial[]
} | null

const RELATED_ROLES = [
  "PRIMER", "SEALANT", "ADHESIVE", "GROUT", "CLEANER", "MESH", "PUTTY",
  "WATERPROOFING_LAYER", "APPLICATION_TOOL", "PROTECTIVE_EQUIPMENT", "SUPPORTING_MATERIAL", "OTHER",
] as const
const DEFAULT_ROLE: string = RELATED_ROLES[0]

const statusLabels: Record<KnowledgeStatus, string> = { DRAFT: "Draft", PUBLISHED: "Published", ARCHIVED: "Archived" }
type Filter = "ALL" | "NOT_STARTED" | KnowledgeStatus

function StatusBadge({ status }: { status: KnowledgeStatus | "NOT_STARTED" }) {
  const label = status === "NOT_STARTED" ? "Not started" : statusLabels[status]
  const classes = status === "PUBLISHED" ? "bg-emerald-100 text-emerald-800" : status === "DRAFT" ? "bg-amber-100 text-amber-800" : status === "ARCHIVED" ? "bg-slate-200 text-slate-700" : "bg-rose-100 text-rose-700"
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold ${classes}`}>{label}</span>
}

function SaveButton({ label, pendingLabel, tone = "primary" }: { label: string; pendingLabel: string; tone?: "primary" | "ghost" | "danger" }) {
  const { pending } = useFormStatus()
  const classes = tone === "primary"
    ? "bg-[#123a5e] text-white hover:bg-emerald-700"
    : tone === "danger"
      ? "border border-rose-300 bg-white text-rose-700 hover:bg-rose-50"
      : "border border-slate-200 bg-white text-slate-700 hover:border-emerald-400"
  return <button disabled={pending} className={`inline-flex min-h-11 items-center justify-center rounded-xl px-5 text-sm font-bold shadow-sm transition disabled:cursor-wait disabled:opacity-60 ${classes}`}>{pending ? pendingLabel : label}</button>
}

const inputClass = "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
const textareaClass = `${inputClass} min-h-[92px] resize-y leading-6`

function Field({ label, hint, children, wide = false }: { label: string; hint?: string; children: React.ReactNode; wide?: boolean }) {
  return <label className={`text-xs font-bold text-slate-700 ${wide ? "sm:col-span-2" : ""}`}>{label}{hint && <span className="ml-1 font-normal normal-case text-slate-400">{hint}</span>}{children}</label>
}

function SectionHeading({ icon: Icon, label, description }: { icon: typeof Sparkles; label: string; description: string }) {
  return <div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Icon className="size-4" /></span><div><h3 className="text-sm font-bold text-slate-950">{label}</h3><p className="mt-0.5 text-xs leading-5 text-slate-500">{description}</p></div></div>
}

export default function MaterialKnowledgeWorkspace({ items, selectedProductId, detail, error, saved }: {
  items: MaterialKnowledgeListItem[]
  selectedProductId?: string
  detail: KnowledgeDetail
  error?: string
  saved: boolean
}) {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<Filter>("ALL")
  const editorRef = useRef<HTMLDivElement>(null)
  const selected = items.find((item) => item.productId === selectedProductId) ?? items[0]

  const counts = useMemo(() => ({
    published: items.filter((item) => item.knowledge?.status === "PUBLISHED").length,
    draft: items.filter((item) => item.knowledge?.status === "DRAFT").length,
    notStarted: items.filter((item) => !item.knowledge).length,
  }), [items])

  const visible = useMemo(() => items.filter((item) => {
    const query = search.trim().toLowerCase()
    const matchesSearch = !query || [item.productName, item.brand ?? ""].some((value) => value.toLowerCase().includes(query))
    const matchesFilter = filter === "ALL"
      || (filter === "NOT_STARTED" ? !item.knowledge : item.knowledge?.status === filter)
    return matchesSearch && matchesFilter
  }), [filter, items, search])

  return <main className="mx-auto w-full max-w-[1640px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
    <section className="overflow-hidden rounded-[28px] bg-[#123a5e] text-white shadow-xl shadow-slate-900/10">
      <div className="grid gap-6 px-6 py-7 sm:px-8 2xl:grid-cols-[minmax(0,1fr)_auto] 2xl:items-end">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-300">Know Your Material</p>
          <h2 className="mt-3 text-3xl font-bold tracking-[-0.035em] sm:text-4xl">Verified product knowledge for the AI assistant.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Only what is entered and published here can ever be presented to customers as verified fact. Leave a field blank if it isn&apos;t confirmed — the assistant will say so rather than guess.</p>
        </div>
        <div className="grid grid-cols-3 gap-2 2xl:min-w-[400px]">{[
          [items.length, "Products", BookOpenCheck, "text-white"],
          [counts.published, "Published", CheckCircle2, "text-emerald-300"],
          [counts.notStarted, "Not started", AlertTriangle, "text-amber-300"],
        ].map(([value, label, Icon, color]) => { const MetricIcon = Icon as typeof BookOpenCheck; return <div key={String(label)} className="rounded-2xl border border-white/10 bg-white/[0.07] p-3.5"><div className="flex items-center justify-between"><strong className="text-2xl">{String(value)}</strong><MetricIcon className={`size-4 ${String(color)}`} /></div><span className="mt-1 block text-[11px] text-slate-300">{String(label)}</span></div> })}</div>
      </div>
    </section>

    {error && <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{String(error)}</p>}
    {saved && <p role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">Saved.</p>}

    <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <label className="relative min-w-0 flex-1"><span className="sr-only">Search products</span><Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products or brands..." className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10" /></label>
        <div className="flex gap-2 overflow-x-auto pb-1 xl:pb-0" aria-label="Knowledge filters">{[
          ["ALL", "All", items.length], ["PUBLISHED", "Published", counts.published], ["DRAFT", "Drafts", counts.draft], ["NOT_STARTED", "Not started", counts.notStarted],
        ].map(([value, label, count]) => <button type="button" key={String(value)} onClick={() => setFilter(value as Filter)} className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-xs font-bold transition ${filter === value ? "bg-[#123a5e] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{String(label)}<span className={`rounded-full px-1.5 py-0.5 text-[9px] ${filter === value ? "bg-white/15" : "bg-white"}`}>{String(count)}</span></button>)}</div>
      </div>
    </section>

    <section className="grid items-start gap-5 2xl:grid-cols-[380px_minmax(0,1fr)]">
      <aside className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm 2xl:sticky 2xl:top-20">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">Product index</p><h3 className="mt-0.5 text-sm font-bold">{visible.length} matching products</h3></div></div>
        <div className="max-h-[620px] overflow-y-auto p-2 [scrollbar-width:thin]">
          {visible.map((item) => <Link
            key={item.productId}
            href={`/material-knowledge?product=${encodeURIComponent(item.productId)}`}
            scroll={false}
            onClick={() => window.setTimeout(() => editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0)}
            className={`mb-1 grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border p-3 text-left transition last:mb-0 ${selected?.productId === item.productId ? "border-emerald-300 bg-emerald-50 shadow-sm" : "border-transparent hover:border-slate-200 hover:bg-slate-50"}`}
          >
            <span className="min-w-0"><span className="block truncate text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700">{item.brand ?? "Buildanta"}</span><strong className="mt-0.5 block truncate text-sm text-slate-950">{item.productName}</strong>{item.knowledge && item.knowledge.missingFields.length > 0 && item.knowledge.status !== "ARCHIVED" && <span className="mt-1 block text-[10px] font-bold text-amber-700">{item.knowledge.missingFields.length} field{item.knowledge.missingFields.length === 1 ? "" : "s"} missing</span>}</span>
            <span className="grid justify-items-end gap-2"><StatusBadge status={item.knowledge?.status ?? "NOT_STARTED"} /><ChevronRight className="size-4 text-slate-400" /></span>
          </Link>)}
          {!visible.length && <div className="px-5 py-14 text-center"><Search className="mx-auto size-7 text-slate-300" /><h3 className="mt-3 text-sm font-bold">No products found</h3><p className="mt-1 text-xs leading-5 text-slate-500">Try another search or filter.</p></div>}
        </div>
      </aside>

      <div ref={editorRef} className="scroll-mt-20">
        {selected ? <KnowledgeEditor key={selected.productId} item={selected} detail={detail} allProducts={items} /> : <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center"><BookOpenCheck className="mx-auto size-9 text-slate-300" /><h3 className="mt-3 font-bold">No published products yet</h3></div>}
      </div>
    </section>
  </main>
}

function textareaDefault(values: string[]) {
  return values.join("\n")
}

function KnowledgeEditor({ item, detail, allProducts }: { item: MaterialKnowledgeListItem; detail: KnowledgeDetail; allProducts: MaterialKnowledgeListItem[] }) {
  const status = item.knowledge?.status ?? "NOT_STARTED"
  const missing = item.knowledge?.missingFields ?? ["a summary", "use cases or suitable surfaces", "safety precautions"]

  return <article className="space-y-5">
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-100 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">{item.brand ?? "Buildanta"}</span><StatusBadge status={status} /></div><h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{item.productName}</h2></div>
          <div className="flex flex-wrap gap-2">
            <form action={publishMaterialKnowledgeAction}><input type="hidden" name="productId" value={item.productId} /><SaveButton label="Publish" pendingLabel="Publishing..." /></form>
            {detail && status !== "ARCHIVED" && <form action={archiveMaterialKnowledgeAction}><input type="hidden" name="productId" value={item.productId} /><SaveButton label="Archive" pendingLabel="Archiving..." tone="danger" /></form>}
          </div>
        </div>
        {status !== "PUBLISHED" && missing.length > 0 && <section className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4"><div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-700" /><div><h3 className="text-sm font-bold text-amber-950">Required before publishing</h3><ul className="mt-2 flex flex-wrap gap-2">{missing.map((field) => <li key={field} className="rounded-lg bg-white px-2.5 py-1 text-[11px] font-semibold text-amber-800 shadow-sm">{field}</li>)}</ul></div></div></section>}
      </header>

      <form action={saveMaterialKnowledgeAction} className="space-y-6 p-5 pt-5 sm:p-6">
        <input type="hidden" name="productId" value={item.productId} />

        <section><SectionHeading icon={Sparkles} label="Overview" description="What this material is and where it's used. Leave blank if not yet confirmed." />
          <div className="mt-4 grid gap-4"><Field label="Summary"><textarea name="summary" defaultValue={detail?.summary ?? ""} placeholder="A short, verified description of this product." className={textareaClass} /></Field></div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Use cases" hint="one per line"><textarea name="useCases" defaultValue={textareaDefault(detail?.useCases ?? [])} className={textareaClass} /></Field>
            <Field label="Suitable surfaces" hint="one per line"><textarea name="suitableSurfaces" defaultValue={textareaDefault(detail?.suitableSurfaces ?? [])} className={textareaClass} /></Field>
            <Field label="Unsuitable surfaces" hint="one per line"><textarea name="unsuitableSurfaces" defaultValue={textareaDefault(detail?.unsuitableSurfaces ?? [])} className={textareaClass} /></Field>
            <Field label="Required tools" hint="one per line"><textarea name="requiredTools" defaultValue={textareaDefault(detail?.requiredTools ?? [])} className={textareaClass} /></Field>
          </div>
        </section>

        <section className="border-t border-slate-100 pt-6"><SectionHeading icon={ScrollText} label="Preparation and application" description="Sequence-critical steps, in order." />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Preparation steps" hint="one per line, in order"><textarea name="preparationSteps" defaultValue={textareaDefault(detail?.preparationSteps ?? [])} className={textareaClass} /></Field>
            <Field label="Application steps" hint="one per line, in order"><textarea name="applicationSteps" defaultValue={textareaDefault(detail?.applicationSteps ?? [])} className={textareaClass} /></Field>
            <Field label="Sequencing note" wide><input name="sequenceNote" defaultValue={detail?.sequenceNote ?? ""} placeholder="e.g. Apply primer at least 4 hours before this product." className={inputClass} /></Field>
            <Field label="Mixing instructions" wide><textarea name="mixingInstructions" defaultValue={detail?.mixingInstructions ?? ""} placeholder="Verified mixing ratio and method, if applicable." className={textareaClass} /></Field>
          </div>
        </section>

        <section className="border-t border-slate-100 pt-6"><SectionHeading icon={BookOpenCheck} label="Coverage and curing" description="Manufacturer-confirmed figures only — leave blank rather than estimate." />
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Coverage value"><input name="coverageValue" type="number" min="0" step="0.0001" defaultValue={detail?.coverageValue == null ? "" : String(detail.coverageValue)} className={inputClass} /></Field>
            <Field label="Coverage unit"><input name="coverageUnit" defaultValue={detail?.coverageUnit ?? ""} placeholder="e.g. sq ft per kg" className={inputClass} /></Field>
            <Field label="Number of coats"><input name="numberOfCoats" type="number" min="1" step="1" defaultValue={detail?.numberOfCoats ?? ""} className={inputClass} /></Field>
            <Field label="Coverage conditions"><input name="coverageConditions" defaultValue={detail?.coverageConditions ?? ""} placeholder="e.g. on a smooth, primed surface" className={inputClass} /></Field>
            <Field label="Drying / curing time" wide><input name="dryingCuringInfo" defaultValue={detail?.dryingCuringInfo ?? ""} placeholder="e.g. Touch dry in 4 hours, full cure in 7 days" className={inputClass} /></Field>
          </div>
        </section>

        <section className="border-t border-slate-100 pt-6"><SectionHeading icon={ShieldAlert} label="Safety and guidance" description="Precautions, common mistakes and professional tips." />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Safety precautions" hint="one per line" wide><textarea name="safetyPrecautions" defaultValue={textareaDefault(detail?.safetyPrecautions ?? [])} className={textareaClass} /></Field>
            <Field label="Common mistakes" hint="one per line"><textarea name="commonMistakes" defaultValue={textareaDefault(detail?.commonMistakes ?? [])} className={textareaClass} /></Field>
            <Field label="Professional tips" hint="one per line"><textarea name="professionalTips" defaultValue={textareaDefault(detail?.professionalTips ?? [])} className={textareaClass} /></Field>
          </div>
        </section>

        <section className="border-t border-slate-100 pt-6"><SectionHeading icon={Link2} label="Source" description="Where this information came from, for internal review." />
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Technical data sheet URL"><input name="technicalDataSheetUrl" type="url" defaultValue={detail?.technicalDataSheetUrl ?? ""} className={inputClass} /></Field>
            <Field label="Source URL"><input name="sourceUrl" type="url" defaultValue={detail?.sourceUrl ?? ""} className={inputClass} /></Field>
            <Field label="Source title"><input name="sourceTitle" defaultValue={detail?.sourceTitle ?? ""} className={inputClass} /></Field>
            <Field label="Source revision / date"><input name="sourceRevision" defaultValue={detail?.sourceRevision ?? ""} className={inputClass} /></Field>
            <Field label="Internal review notes" wide><textarea name="reviewNotes" defaultValue={detail?.reviewNotes ?? ""} className={textareaClass} /></Field>
          </div>
        </section>

        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"><div><strong className="block text-sm">Save draft</strong><span className="mt-1 block text-xs text-slate-500">Saving never publishes — use Publish above when this is ready for customers.</span></div><SaveButton label="Save draft" pendingLabel="Saving..." /></div>
      </form>
    </div>

    {detail && <RelatedMaterialsEditor productId={item.productId} existing={detail.relatedMaterials} allProducts={allProducts} />}
  </article>
}

function RelatedMaterialsEditor({ productId, existing, allProducts }: { productId: string; existing: RelatedMaterial[]; allProducts: MaterialKnowledgeListItem[] }) {
  const [rows, setRows] = useState(() => existing.map((item) => ({
    relatedProductId: item.relatedProductId,
    role: item.role,
    reason: item.reason,
    sequenceNote: item.sequenceNote ?? "",
  })))
  const formRef = useRef<HTMLFormElement>(null)
  const options = allProducts.filter((product) => product.productId !== productId)

  function addRow() {
    const firstOption = options[0]
    if (!firstOption) return
    setRows((current) => [...current, { relatedProductId: firstOption.productId, role: DEFAULT_ROLE, reason: "", sequenceNote: "" }])
  }
  function removeRow(index: number) {
    setRows((current) => current.filter((_, i) => i !== index))
  }
  function updateRow(index: number, patch: Partial<(typeof rows)[number]>) {
    setRows((current) => current.map((row, i) => i === index ? { ...row, ...patch } : row))
  }

  return <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
    <div className="border-b border-slate-100 p-5 sm:p-6"><SectionHeading icon={Link2} label="Related materials" description="Explicitly curated companions only — never auto-suggested. Each link needs a stated reason." /></div>
    <div className="space-y-3 p-5 sm:p-6">
      {rows.map((row, index) => <div key={index} className="grid gap-3 rounded-2xl border border-slate-200 p-4 sm:grid-cols-[minmax(0,1fr)_140px_minmax(0,1fr)_auto]">
        <Field label="Related product"><select value={row.relatedProductId} onChange={(event) => updateRow(index, { relatedProductId: event.target.value })} className={inputClass}>{options.map((product) => <option key={product.productId} value={product.productId}>{product.productName}</option>)}</select></Field>
        <Field label="Role"><select value={row.role} onChange={(event) => updateRow(index, { role: event.target.value })} className={inputClass}>{RELATED_ROLES.map((role) => <option key={role} value={role}>{role.replaceAll("_", " ").toLowerCase()}</option>)}</select></Field>
        <Field label="Reason"><input value={row.reason} onChange={(event) => updateRow(index, { reason: event.target.value })} placeholder="Why this pairing is recommended" className={inputClass} /></Field>
        <div className="flex items-end"><button type="button" onClick={() => removeRow(index)} className="inline-flex h-11 items-center justify-center rounded-xl border border-rose-200 px-3 text-xs font-bold text-rose-700 hover:bg-rose-50">Remove</button></div>
      </div>)}
      {!rows.length && <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No related materials linked yet.</p>}
      <button type="button" onClick={addRow} disabled={!options.length} className="inline-flex h-11 items-center justify-center rounded-xl border border-dashed border-slate-300 px-4 text-sm font-bold text-slate-600 hover:border-emerald-400 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">+ Add related material</button>
    </div>
    <form ref={formRef} action={replaceRelatedMaterialsAction} className="flex items-center justify-between gap-3 border-t border-slate-100 p-5 sm:p-6">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="items" value={JSON.stringify(rows.filter((row) => row.reason.trim()))} />
      <p className="text-xs text-slate-500">Rows without a reason are dropped on save.</p>
      <SaveButton label="Save related materials" pendingLabel="Saving..." tone="ghost" />
    </form>
  </div>
}
