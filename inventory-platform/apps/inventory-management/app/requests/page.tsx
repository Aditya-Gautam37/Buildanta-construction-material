/* eslint-disable @next/next/no-img-element -- supplier images use arbitrary durable-store URLs and should bypass the Next image proxy. */
import { prisma, QuoteRequestStatus, SupplierSubmissionStatus, UserRole } from "@workspace/db"
import { requireStaffAccess } from "@/lib/staff-access"
import { updateQuoteStatusAction, updateSupplierStatusAction } from "./actions"

const quoteLabels: Record<QuoteRequestStatus, string> = { NEW: "New", REVIEWING: "Reviewing", QUOTED: "Quoted", ACCEPTED: "Accepted", CLOSED: "Closed" }
const supplierLabels: Record<SupplierSubmissionStatus, string> = { PENDING: "Pending", APPROVED: "Approved", REJECTED: "Rejected" }

export default async function RequestsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireStaffAccess("/requests", { allowedRoles: [UserRole.ADMIN, UserRole.DATA_ENTRY] })

  const query = (await searchParams).q?.trim() ?? ""
  const [quotes, submissions] = await Promise.all([
    prisma.quoteRequest.findMany({
      where: query ? { OR: [{ reference: { contains: query, mode: "insensitive" } }, { name: { contains: query, mode: "insensitive" } }, { email: { contains: query, mode: "insensitive" } }, { requirement: { contains: query, mode: "insensitive" } }] } : undefined,
      orderBy: { createdAt: "desc" }, take: 100,
    }),
    prisma.supplierSubmission.findMany({
      where: query ? { OR: [{ reference: { contains: query, mode: "insensitive" } }, { company: { contains: query, mode: "insensitive" } }, { productName: { contains: query, mode: "insensitive" } }, { email: { contains: query, mode: "insensitive" } }] } : undefined,
      orderBy: { createdAt: "desc" }, take: 100,
    }),
  ])

  return <main className="mx-auto w-full max-w-[1500px] flex-1 space-y-8 px-4 py-8 sm:px-6 lg:px-8">
    <section className="overflow-hidden rounded-3xl bg-[#0a2540] p-6 text-white shadow-xl sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-300">Commercial inbox</p>
      <div className="mt-3 flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Requests and supplier reviews</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Every storefront enquiry now arrives in the shared Buildanta inventory database.</p></div><div className="flex gap-3"><span className="rounded-2xl bg-white/10 px-4 py-3"><b className="block text-2xl">{quotes.length}</b><small className="text-slate-300">Quotes</small></span><span className="rounded-2xl bg-white/10 px-4 py-3"><b className="block text-2xl">{submissions.length}</b><small className="text-slate-300">Listings</small></span></div></div>
    </section>

    <form className="flex max-w-2xl gap-2" action="/requests"><input className="h-11 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" name="q" defaultValue={query} placeholder="Search reference, customer, email or product" /><button className="rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white">Search</button></form>

    <section><div className="mb-4"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Customer demand</p><h2 className="text-2xl font-bold tracking-tight">Quote requests</h2></div>{quotes.length ? <div className="grid gap-4 xl:grid-cols-2">{quotes.map((quote) => <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={quote.id}><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-mono text-xs font-semibold text-emerald-700">{quote.reference}</p><h3 className="mt-1 text-lg font-bold">{quote.requirement}</h3><p className="mt-1 text-sm text-slate-500">{quote.name} · {quote.company}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{quoteLabels[quote.status]}</span></div><div className="mt-4 grid gap-2 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2"><p><b>Quantity:</b> {quote.quantity}</p><p><b>Pincode:</b> {quote.deliveryPincode}</p><p><b>Email:</b> {quote.email}</p><p><b>Phone:</b> {quote.phone}</p>{quote.requiredBy && <p><b>Required:</b> {quote.requiredBy}</p>}{quote.projectType && <p><b>Project:</b> {quote.projectType}</p>}</div>{quote.notes && <p className="mt-3 text-sm leading-6 text-slate-600">{quote.notes}</p>}<form action={updateQuoteStatusAction} className="mt-4 flex gap-2"><input type="hidden" name="id" value={quote.id} /><select name="status" defaultValue={quote.status} className="h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm">{Object.entries(quoteLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select><button className="rounded-xl bg-[#0a2540] px-4 text-sm font-semibold text-white">Update</button></form></article>)}</div> : <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">No matching quote requests.</div>}</section>

    <section><div className="mb-4"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-600">Catalogue intake</p><h2 className="text-2xl font-bold tracking-tight">Supplier product submissions</h2></div>{submissions.length ? <div className="grid gap-4 xl:grid-cols-2">{submissions.map((item) => <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:grid sm:grid-cols-[160px_1fr]" key={item.id}><div className="min-h-40 bg-slate-100"><img src={item.imageUrl} alt="" className="h-full w-full object-cover" /></div><div className="p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-mono text-xs font-semibold text-orange-600">{item.reference}</p><h3 className="mt-1 text-lg font-bold">{item.productName}</h3><p className="text-sm text-slate-500">{item.brand} · {item.category}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{supplierLabels[item.status]}</span></div><p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p><div className="mt-3 grid grid-cols-2 gap-2 text-sm"><p><b>Price:</b> ₹{Number(item.price).toLocaleString("en-IN")}</p><p><b>Stock:</b> {item.stock} {item.unit}</p><p><b>Company:</b> {item.company}</p><p><b>Contact:</b> {item.contactName}</p></div><form action={updateSupplierStatusAction} className="mt-4 flex gap-2"><input type="hidden" name="id" value={item.id} /><select name="status" defaultValue={item.status} className="h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm">{Object.entries(supplierLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select><button className="rounded-xl bg-[#0a2540] px-4 text-sm font-semibold text-white">Update</button></form></div></article>)}</div> : <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">No matching supplier submissions.</div>}</section>
  </main>
}
