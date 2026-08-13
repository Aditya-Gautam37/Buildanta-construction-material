"use client"

import { useState, useTransition } from "react"
import { packagePublishIssues, type ContractorPackageDraft, type ContractorPackageRecord } from "@/lib/professionals"
import { deleteContractorPackageAction, saveContractorPackageAction } from "./actions"

const input = "mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
const label = "block text-xs font-bold text-slate-700"

function emptyDraft(professionalId: string, sortOrder: number): ContractorPackageDraft {
  return {
    professionalId,
    name: "",
    tagline: null,
    ratePerSqFt: "",
    inclusions: [],
    bestFor: [],
    materials: [],
    sortOrder,
    published: false,
  }
}

function toLines(values: string[]) {
  return values.join("\n")
}

function fromLines(value: string) {
  return value.split("\n").map((line) => line.trim()).filter(Boolean)
}

function PackageForm({ draft, onChange, onSave, onCancel, saving }: {
  draft: ContractorPackageDraft
  onChange: (next: ContractorPackageDraft) => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
}) {
  const issues = packagePublishIssues(draft)

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <label className={label}>
          Package name
          <input
            className={input}
            value={draft.name}
            onChange={(event) => onChange({ ...draft, name: event.target.value })}
            placeholder="Economy"
          />
        </label>
        <label className={label}>
          Rate per sq ft (INR)
          <input
            className={input}
            type="number"
            min="1"
            step="1"
            value={draft.ratePerSqFt}
            onChange={(event) => onChange({ ...draft, ratePerSqFt: event.target.value })}
            placeholder="1250"
          />
        </label>
        <label className={label}>
          Display order
          <input
            className={input}
            type="number"
            step="1"
            value={draft.sortOrder}
            onChange={(event) => onChange({ ...draft, sortOrder: Number(event.target.value) || 0 })}
          />
        </label>
      </div>

      <label className={label}>
        Tagline
        <input
          className={input}
          value={draft.tagline ?? ""}
          onChange={(event) => onChange({ ...draft, tagline: event.target.value || null })}
          placeholder="Budget friendly | Economical | Value for money"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={label}>
          Included works <span className="font-normal text-slate-400">one per line</span>
          <textarea
            className={`${input} min-h-[130px]`}
            value={toLines(draft.inclusions)}
            onChange={(event) => onChange({ ...draft, inclusions: fromLines(event.target.value) })}
            placeholder={"Structure + Plaster Both Sides\nBasic Electrical Wiring"}
          />
        </label>
        <label className={label}>
          Best for <span className="font-normal text-slate-400">one per line</span>
          <textarea
            className={`${input} min-h-[130px]`}
            value={toLines(draft.bestFor)}
            onChange={(event) => onChange({ ...draft, bestFor: fromLines(event.target.value) })}
            placeholder={"Budget friendly homes\nRental properties"}
          />
        </label>
      </div>

      <fieldset className="rounded-xl border border-slate-200 p-4">
        <legend className="px-1 text-xs font-bold text-slate-700">Materials used</legend>
        <div className="space-y-2">
          {draft.materials.map((material, index) => (
            <div className="grid gap-2 sm:grid-cols-[160px_minmax(0,1fr)_auto]" key={index}>
              <input
                className={input}
                value={material.category}
                onChange={(event) => {
                  const materials = [...draft.materials]
                  materials[index] = { ...material, category: event.target.value }
                  onChange({ ...draft, materials })
                }}
                placeholder="Cement"
                aria-label={`Material category ${index + 1}`}
              />
              <input
                className={input}
                value={material.detail}
                onChange={(event) => {
                  const materials = [...draft.materials]
                  materials[index] = { ...material, detail: event.target.value }
                  onChange({ ...draft, materials })
                }}
                placeholder="MP Birla / JK Lakshmi"
                aria-label={`Material detail ${index + 1}`}
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
          onClick={() => onChange({ ...draft, materials: [...draft.materials, { category: "", detail: "" }] })}
        >
          + Add material
        </button>
      </fieldset>

      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <input
          type="checkbox"
          checked={draft.published}
          onChange={(event) => onChange({ ...draft, published: event.target.checked })}
        />
        Published — visible to customers
      </label>

      {draft.published && issues.length > 0 ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800" role="alert">
          Cannot publish yet: add {issues.join(", ")}.
        </p>
      ) : null}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="min-h-11 rounded-xl bg-[#12344a] px-5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save package"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="min-h-11 rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-700 hover:border-slate-400"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

export default function PackageManager({ professionalId, professionalName, packages }: {
  professionalId: string
  professionalName: string
  packages: ContractorPackageRecord[]
}) {
  const [draft, setDraft] = useState<ContractorPackageDraft | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function save() {
    if (!draft) return
    setError(null)
    startTransition(async () => {
      const result = await saveContractorPackageAction(draft)
      if (!result.ok) setError(result.error)
      else setDraft(null)
    })
  }

  function remove(id: string) {
    setError(null)
    startTransition(async () => {
      const result = await deleteContractorPackageAction(id)
      if (!result.ok) setError(result.error)
    })
  }

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-950">Packages for {professionalName}</h3>
          <p className="mt-1 text-xs text-slate-500">
            Rates shown on the public profile. Customers see an estimate of rate × plot area.
          </p>
        </div>
        {!draft ? (
          <button
            type="button"
            className="min-h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 hover:border-emerald-400"
            onClick={() => setDraft(emptyDraft(professionalId, packages.length))}
          >
            + Add package
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700" role="alert">{error}</p>
      ) : null}

      {draft ? (
        <div className="mt-4">
          <PackageForm
            draft={draft}
            onChange={setDraft}
            onSave={save}
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
        {packages.map((item) => (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4" key={item.id}>
            <div className="min-w-0">
              <strong className="text-sm text-slate-950">{item.name}</strong>
              <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${item.published ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                {item.published ? "Published" : "Draft"}
              </span>
              <p className="mt-1 text-xs text-slate-500">
                ₹{item.ratePerSqFt} per sq ft · {item.inclusions.length} included works · {item.materials.length} materials
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="min-h-9 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:border-emerald-400"
                onClick={() => setDraft({ ...item })}
              >
                Edit
              </button>
              <button
                type="button"
                disabled={pending}
                className="min-h-9 rounded-lg border border-rose-200 px-3 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                onClick={() => remove(item.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
