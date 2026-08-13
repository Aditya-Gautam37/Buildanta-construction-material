"use client"

import { useState, useTransition } from "react"
import { updatePackageEnquiryAction, type PackageEnquiryStatusValue } from "./actions"

export type PackageEnquiryRecord = {
  id: string
  reference: string
  professionalName: string
  customerName: string
  customerPhone: string
  customerEmail: string | null
  projectLocation: string | null
  plotDimensions: string | null
  areaSqFt: string
  floors: number | null
  constructionType: string | null
  expectedStart: string | null
  requirement: string | null
  packageNameSnapshot: string
  rateSnapshot: string
  amountSnapshot: string
  status: PackageEnquiryStatusValue
  internalNotes: string | null
  createdAt: string
}

const statusLabels: Record<PackageEnquiryStatusValue, string> = {
  SUBMITTED: "Submitted",
  REVIEWING: "Reviewing",
  PROFESSIONAL_CONTACTED: "Contractor contacted",
  CALLBACK_SCHEDULED: "Callback scheduled",
  SITE_VISIT_SCHEDULED: "Site visit scheduled",
  QUOTATION_PREPARED: "Quotation prepared",
  CLOSED: "Closed",
  CANCELLED: "Cancelled",
}

const openTone = "bg-amber-100 text-amber-800"
const activeTone = "bg-sky-100 text-sky-800"
const doneTone = "bg-emerald-100 text-emerald-800"
const deadTone = "bg-slate-200 text-slate-700"

function toneFor(status: PackageEnquiryStatusValue) {
  if (status === "SUBMITTED") return openTone
  if (status === "CLOSED") return doneTone
  if (status === "CANCELLED") return deadTone
  return activeTone
}

function Detail({ label, value }: { label: string; value: string | null }) {
  if (!value) return null
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-slate-800">{value}</dd>
    </div>
  )
}

function EnquiryRow({ enquiry }: { enquiry: PackageEnquiryRecord }) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState(enquiry.status)
  const [notes, setNotes] = useState(enquiry.internalNotes ?? "")
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [pending, startTransition] = useTransition()

  function save() {
    setError(null)
    setSaved(false)
    startTransition(async () => {
      const result = await updatePackageEnquiryAction(enquiry.id, { status, internalNotes: notes || null })
      if (!result.ok) setError(result.error)
      else setSaved(true)
    })
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <strong className="text-sm text-slate-950">{enquiry.customerName}</strong>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${toneFor(enquiry.status)}`}>
              {statusLabels[enquiry.status]}
            </span>
            <span className="font-mono text-[10px] text-slate-400">{enquiry.reference}</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {enquiry.packageNameSnapshot} · {enquiry.areaSqFt} sq ft · ₹{Number(enquiry.amountSnapshot).toLocaleString("en-IN")}
            {" · "}{enquiry.professionalName}
            {" · "}{new Date(enquiry.createdAt).toLocaleDateString("en-IN")}
          </p>
        </div>
        <button
          type="button"
          className="min-h-9 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:border-emerald-400"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
        >
          {open ? "Hide" : "Open"}
        </button>
      </div>

      {open ? (
        <div className="mt-4 space-y-4 border-t border-slate-100 pt-4">
          <dl className="grid gap-3 text-xs sm:grid-cols-3">
            <Detail label="Phone" value={enquiry.customerPhone} />
            <Detail label="Email" value={enquiry.customerEmail} />
            <Detail label="Area in Kanpur" value={enquiry.projectLocation} />
            <Detail label="Plot size" value={enquiry.plotDimensions} />
            <Detail label="Floors" value={enquiry.floors ? String(enquiry.floors) : null} />
            <Detail label="Construction type" value={enquiry.constructionType} />
            <Detail label="Expected start" value={enquiry.expectedStart} />
            <Detail label="Rate quoted at" value={`₹${enquiry.rateSnapshot} per sq ft`} />
          </dl>

          {enquiry.requirement ? (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Requirement</p>
              <p className="mt-1 whitespace-pre-wrap text-xs text-slate-800">{enquiry.requirement}</p>
            </div>
          ) : null}

          {/* The rate and amount above are a snapshot of what this customer was
              shown. They stay fixed even if the package price changes later. */}
          <div className="grid gap-3 sm:grid-cols-[200px_minmax(0,1fr)]">
            <label className="block text-xs font-bold text-slate-700">
              Status
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={status}
                onChange={(event) => setStatus(event.target.value as PackageEnquiryStatusValue)}
              >
                {Object.entries(statusLabels).map(([value, text]) => (
                  <option key={value} value={value}>{text}</option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-bold text-slate-700">
              Internal notes <span className="font-normal text-slate-400">not shown to the customer</span>
              <textarea
                className="mt-1 min-h-[70px] w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </label>
          </div>

          {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700" role="alert">{error}</p> : null}
          {saved ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800" role="status">Saved.</p> : null}

          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="min-h-10 rounded-xl bg-[#12344a] px-4 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {pending ? "Saving..." : "Save"}
          </button>
        </div>
      ) : null}
    </div>
  )
}

export default function EnquiryList({ enquiries }: { enquiries: PackageEnquiryRecord[] }) {
  if (!enquiries.length) {
    return (
      <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <h3 className="text-sm font-bold text-slate-950">Package enquiries</h3>
        <p className="mt-2 text-xs text-slate-500">
          No enquiries yet. They appear here when a customer requests a detailed
          quotation from a published package.
        </p>
      </section>
    )
  }

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <h3 className="text-sm font-bold text-slate-950">Package enquiries</h3>
      <p className="mt-1 text-xs text-slate-500">
        Customer contact details, held for the Buildanta team only. They are never
        returned by any public endpoint.
      </p>
      <div className="mt-4 space-y-2">
        {enquiries.map((enquiry) => <EnquiryRow enquiry={enquiry} key={enquiry.id} />)}
      </div>
    </section>
  )
}
