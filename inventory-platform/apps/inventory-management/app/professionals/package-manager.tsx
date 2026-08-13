"use client"

import { useState, useTransition } from "react"
import {
  inclusionCategories,
  inclusionCategoryLabel,
  packagePublishIssues,
  type ContractorPackageDraft,
  type ContractorPackageRecord,
  type InclusionCategory,
} from "@/lib/professionals"
import {
  deleteContractorPackageAction,
  duplicateContractorPackageAction,
  reorderContractorPackageAction,
  saveContractorPackageAction,
} from "./actions"

const input = "mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
const label = "block text-xs font-bold text-slate-700"
const hint = "font-normal text-slate-400"
const smallButton = "min-h-9 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:border-emerald-400 disabled:opacity-40"

const statusOptions: Array<{ value: ContractorPackageDraft["status"]; label: string; help: string }> = [
  { value: "DRAFT", label: "Draft", help: "Only staff can see this." },
  { value: "UNDER_REVIEW", label: "Under review", help: "Being checked. Still hidden from customers." },
  { value: "PUBLISHED", label: "Published", help: "Visible to customers on the contractor's profile." },
  { value: "ARCHIVED", label: "Archived", help: "Retired. Hidden from customers, kept for reference." },
]

function emptyDraft(professionalId: string, sortOrder: number): ContractorPackageDraft {
  return {
    professionalId,
    name: "",
    slug: "",
    tagline: null,
    summary: null,
    ratePerSqFt: "",
    rateBasis: "PLOT_AREA",
    inclusions: [],
    bestFor: [],
    exclusions: [],
    terms: null,
    validFrom: null,
    validUntil: null,
    materials: [],
    sortOrder,
    status: "DRAFT",
  }
}

const toLines = (values: string[]) => values.join("\n")
const fromLines = (value: string) => value.split("\n").map((line) => line.trim()).filter(Boolean)

function InclusionRows({ draft, onChange }: {
  draft: ContractorPackageDraft
  onChange: (next: ContractorPackageDraft) => void
}) {
  function update(index: number, patch: Partial<ContractorPackageDraft["inclusions"][number]>) {
    const inclusions = [...draft.inclusions]
    inclusions[index] = { ...inclusions[index]!, ...patch }
    onChange({ ...draft, inclusions })
  }

  return (
    <fieldset className="rounded-xl border border-slate-200 p-4">
      <legend className="px-1 text-xs font-bold text-slate-700">Included works</legend>
      <p className="mb-3 text-xs text-slate-500">
        The category is what lets customers compare this package against the others
        side by side, so pick the closest one rather than leaving everything as Other.
      </p>
      <div className="space-y-2">
        {draft.inclusions.map((item, index) => (
          <div className="grid gap-2 sm:grid-cols-[150px_minmax(0,1fr)_110px_110px_auto]" key={index}>
            <select
              className={input}
              value={item.category}
              onChange={(event) => update(index, { category: event.target.value as InclusionCategory })}
              aria-label={`Category for included work ${index + 1}`}
            >
              {inclusionCategories.map((category) => (
                <option key={category} value={category}>{inclusionCategoryLabel(category)}</option>
              ))}
            </select>
            <input
              className={input}
              value={item.label}
              onChange={(event) => update(index, { label: event.target.value })}
              placeholder="Structure and plaster, both sides"
              aria-label={`Included work ${index + 1}`}
            />
            <input
              className={input}
              type="number"
              min="0"
              step="1"
              value={item.allowanceAmount ?? ""}
              onChange={(event) => update(index, { allowanceAmount: event.target.value || null })}
              placeholder="Allowance"
              aria-label={`Allowance amount for included work ${index + 1}`}
            />
            <input
              className={input}
              value={item.allowanceUnit ?? ""}
              onChange={(event) => update(index, { allowanceUnit: event.target.value || null })}
              placeholder="per sq ft"
              aria-label={`Allowance unit for included work ${index + 1}`}
            />
            <button
              type="button"
              className="mt-1 rounded-lg border border-rose-200 px-3 text-xs font-bold text-rose-700 hover:bg-rose-50"
              onClick={() => onChange({ ...draft, inclusions: draft.inclusions.filter((_, i) => i !== index) })}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="mt-3 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs font-bold text-slate-600 hover:border-emerald-400"
        onClick={() => onChange({
          ...draft,
          inclusions: [...draft.inclusions, { category: "OTHER", label: "", allowanceAmount: null, allowanceUnit: null }],
        })}
      >
        + Add included work
      </button>
    </fieldset>
  )
}

function MaterialRows({ draft, onChange }: {
  draft: ContractorPackageDraft
  onChange: (next: ContractorPackageDraft) => void
}) {
  function update(index: number, patch: Partial<ContractorPackageDraft["materials"][number]>) {
    const materials = [...draft.materials]
    materials[index] = { ...materials[index]!, ...patch }
    onChange({ ...draft, materials })
  }

  return (
    <fieldset className="rounded-xl border border-slate-200 p-4">
      <legend className="px-1 text-xs font-bold text-slate-700">Materials used</legend>
      <p className="mb-3 text-xs text-slate-500">
        Shown to customers as the contractor&rsquo;s own proposed specification, not as a
        Buildanta endorsement of any brand.
      </p>
      <div className="space-y-2">
        {draft.materials.map((material, index) => (
          <div className="grid gap-2 sm:grid-cols-[140px_minmax(0,1fr)_minmax(0,1fr)_auto]" key={index}>
            <input
              className={input}
              value={material.category}
              onChange={(event) => update(index, { category: event.target.value })}
              placeholder="Cement"
              aria-label={`Material category ${index + 1}`}
            />
            <input
              className={input}
              value={material.specification}
              onChange={(event) => update(index, { specification: event.target.value })}
              placeholder="OPC 53 grade"
              aria-label={`Material specification ${index + 1}`}
            />
            <input
              className={input}
              value={material.preferredBrands ?? ""}
              onChange={(event) => update(index, { preferredBrands: event.target.value || null })}
              placeholder="Preferred brands"
              aria-label={`Preferred brands ${index + 1}`}
            />
            <button
              type="button"
              className="mt-1 rounded-lg border border-rose-200 px-3 text-xs font-bold text-rose-700 hover:bg-rose-50"
              onClick={() => onChange({ ...draft, materials: draft.materials.filter((_, i) => i !== index) })}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="mt-3 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs font-bold text-slate-600 hover:border-emerald-400"
        onClick={() => onChange({
          ...draft,
          materials: [...draft.materials, { category: "", specification: "", preferredBrands: null, substitutionNote: null }],
        })}
      >
        + Add material
      </button>
    </fieldset>
  )
}

function PackageForm({ draft, onChange, onSave, onCancel, saving }: {
  draft: ContractorPackageDraft
  onChange: (next: ContractorPackageDraft) => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
}) {
  const issues = packagePublishIssues(draft)
  const status = statusOptions.find((option) => option.value === draft.status)

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="grid gap-4 sm:grid-cols-4">
        <label className={label}>
          Package name
          <input className={input} value={draft.name} onChange={(event) => onChange({ ...draft, name: event.target.value })} placeholder="Economy" />
        </label>
        <label className={label}>
          Rate per sq ft (INR)
          <input className={input} type="number" min="1" step="1" value={draft.ratePerSqFt} onChange={(event) => onChange({ ...draft, ratePerSqFt: event.target.value })} placeholder="1250" />
        </label>
        <label className={label}>
          Rate is per <span className={hint}>which area?</span>
          <select className={input} value={draft.rateBasis} onChange={(event) => onChange({ ...draft, rateBasis: event.target.value as ContractorPackageDraft["rateBasis"] })}>
            <option value="PLOT_AREA">Plot area</option>
            <option value="BUILT_UP_AREA">Built-up area</option>
          </select>
        </label>
        <label className={label}>
          Display order
          <input className={input} type="number" step="1" value={draft.sortOrder} onChange={(event) => onChange({ ...draft, sortOrder: Number(event.target.value) || 0 })} />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={label}>
          Tagline <span className={hint}>the strip on a flyer</span>
          <input className={input} value={draft.tagline ?? ""} onChange={(event) => onChange({ ...draft, tagline: event.target.value || null })} placeholder="Budget friendly | Value for money" />
        </label>
        <label className={label}>
          Summary <span className={hint}>one sentence</span>
          <input className={input} value={draft.summary ?? ""} onChange={(event) => onChange({ ...draft, summary: event.target.value || null })} placeholder="A complete finish for a first home." />
        </label>
      </div>

      <InclusionRows draft={draft} onChange={onChange} />
      <MaterialRows draft={draft} onChange={onChange} />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={label}>
          Best for <span className={hint}>one per line</span>
          <textarea className={`${input} min-h-[110px]`} value={toLines(draft.bestFor)} onChange={(event) => onChange({ ...draft, bestFor: fromLines(event.target.value) })} placeholder={"Budget friendly homes\nRental properties"} />
        </label>
        <label className={label}>
          Not included <span className={hint}>one per line — shown to customers</span>
          <textarea className={`${input} min-h-[110px]`} value={toLines(draft.exclusions)} onChange={(event) => onChange({ ...draft, exclusions: fromLines(event.target.value) })} placeholder={"Boundary wall\nModular kitchen\nGovernment approvals"} />
        </label>
      </div>

      <label className={label}>
        Terms <span className={hint}>the contractor&rsquo;s stated conditions</span>
        <textarea className={`${input} min-h-[80px]`} value={draft.terms ?? ""} onChange={(event) => onChange({ ...draft, terms: event.target.value || null })} placeholder="Rate assumes a clear, accessible site. Payment in stages against completed work." />
      </label>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className={label}>
          Valid from <span className={hint}>optional</span>
          <input className={input} type="date" value={draft.validFrom ?? ""} onChange={(event) => onChange({ ...draft, validFrom: event.target.value || null })} />
        </label>
        <label className={label}>
          Valid until <span className={hint}>optional</span>
          <input className={input} type="date" value={draft.validUntil ?? ""} onChange={(event) => onChange({ ...draft, validUntil: event.target.value || null })} />
        </label>
        <label className={label}>
          Status
          <select className={input} value={draft.status} onChange={(event) => onChange({ ...draft, status: event.target.value as ContractorPackageDraft["status"] })}>
            {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
      </div>

      {status ? <p className="text-xs text-slate-500">{status.help}</p> : null}

      {draft.status === "PUBLISHED" && issues.length > 0 ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800" role="alert">
          Cannot publish yet: add {issues.join(", ")}.
        </p>
      ) : null}

      <div className="flex gap-2">
        <button type="button" onClick={onSave} disabled={saving} className="min-h-11 rounded-xl bg-[#12344a] px-5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60">
          {saving ? "Saving..." : "Save package"}
        </button>
        <button type="button" onClick={onCancel} className="min-h-11 rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-700 hover:border-slate-400">
          Cancel
        </button>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: ContractorPackageRecord["status"] }) {
  const tone = status === "PUBLISHED" ? "bg-emerald-100 text-emerald-800"
    : status === "ARCHIVED" ? "bg-slate-200 text-slate-700"
    : status === "UNDER_REVIEW" ? "bg-sky-100 text-sky-800"
    : "bg-amber-100 text-amber-800"
  const text = statusOptions.find((option) => option.value === status)?.label ?? status
  return <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${tone}`}>{text}</span>
}

export default function PackageManager({ professionalId, professionalName, packages, canHavePackages }: {
  professionalId: string
  professionalName: string
  packages: ContractorPackageRecord[]
  canHavePackages: boolean
}) {
  const [draft, setDraft] = useState<ContractorPackageDraft | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  // Packages are a contractor concept in this release, so the whole section
  // stays out of the way for other professional types.
  if (!canHavePackages) return null

  function run(action: () => Promise<{ ok: boolean; error?: string }>, onDone?: () => void) {
    setError(null)
    startTransition(async () => {
      const result = await action()
      if (!result.ok) setError(result.error ?? "Something went wrong.")
      else onDone?.()
    })
  }

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-950">Packages for {professionalName}</h3>
          <p className="mt-1 text-xs text-slate-500">
            Customers see an estimate of rate × area, clearly labelled as indicative rather than a quotation.
          </p>
        </div>
        {!draft ? (
          <button type="button" className={smallButton} onClick={() => setDraft(emptyDraft(professionalId, packages.length))}>
            + Add package
          </button>
        ) : null}
      </div>

      {error ? <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700" role="alert">{error}</p> : null}

      {draft ? (
        <div className="mt-4">
          <PackageForm
            draft={draft}
            onChange={setDraft}
            onSave={() => run(() => saveContractorPackageAction(draft), () => setDraft(null))}
            onCancel={() => { setDraft(null); setError(null) }}
            saving={pending}
          />
        </div>
      ) : null}

      {!packages.length && !draft ? (
        <p className="mt-4 rounded-xl bg-white p-4 text-xs text-slate-500">
          No packages yet. Customers see no calculator on this profile until one is published.
        </p>
      ) : null}

      <div className="mt-4 space-y-2">
        {packages.map((item, index) => (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4" key={item.id}>
            <div className="min-w-0">
              <strong className="text-sm text-slate-950">{item.name}</strong>
              <StatusBadge status={item.status} />
              <p className="mt-1 text-xs text-slate-500">
                ₹{item.ratePerSqFt} per sq ft of {item.rateBasis === "BUILT_UP_AREA" ? "built-up area" : "plot area"}
                {" · "}{item.inclusions.length} included{" · "}{item.materials.length} materials
                {item.validUntil ? ` · valid to ${item.validUntil}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={pending || index === 0} className={smallButton} onClick={() => run(() => reorderContractorPackageAction(item.id, "up"))} aria-label={`Move ${item.name} up`}>↑</button>
              <button type="button" disabled={pending || index === packages.length - 1} className={smallButton} onClick={() => run(() => reorderContractorPackageAction(item.id, "down"))} aria-label={`Move ${item.name} down`}>↓</button>
              <button type="button" className={smallButton} onClick={() => setDraft({ ...item })}>Edit</button>
              <button type="button" disabled={pending} className={smallButton} onClick={() => run(() => duplicateContractorPackageAction(item.id))}>Duplicate</button>
              <button type="button" disabled={pending} className="min-h-9 rounded-lg border border-rose-200 px-3 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-60" onClick={() => run(() => deleteContractorPackageAction(item.id))}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
