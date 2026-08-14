import Link from "next/link"
import { inventoryApiUrl, readApiError, requireStaffAccess } from "@/lib/staff-access"
import { ORDER_STEPS, STEP_LABELS, orderView, sortByAttention, type OrderStep } from "@/lib/customer-orders"

type Dispatch = { status: string; dispatchedAt: string | null; deliveredAt: string | null; trackingReference: string | null }
type SalesOrder = { reference: string; status: string; grandTotal: string | number; dispatches?: Dispatch[] }
type Quotation = {
  id: string
  reference: string
  status: string
  createdAt: string
  customerName: string
  customerEmail: string
  customerPhone: string
  customerUserId: string | null
  deliveryPincode: string
  items: { id: string; description: string; quantity: string | number; unitCode: string }[]
  revisions: { grandTotal: string | number }[]
  salesOrder: SalesOrder | null
}

const panel = "rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"

const STEP_TONE: Record<OrderStep, string> = {
  PLACED: "bg-orange-100 text-orange-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PACKED: "bg-indigo-100 text-indigo-800",
  OUT_FOR_DELIVERY: "bg-violet-100 text-violet-800",
  DELIVERED: "bg-emerald-100 text-emerald-800",
}

const money = (value: string | number) =>
  `INR ${Number(value).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const day = (value: string) =>
  new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))

const dayOnly = (value: string) =>
  new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value))

/**
 * The customer order queue.
 *
 * /quotations and /fulfilment are the machinery — pricing revisions, approvals,
 * picking lists, challans. This screen answers the two questions staff actually
 * open the app for: who ordered, and what is waiting on us. Every row links to
 * the screen that can move it, so there is one place to look and one place to act.
 */
export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ step?: string }> }) {
  const { accessToken } = await requireStaffAccess("/orders")
  const response = await fetch(`${inventoryApiUrl}/quotations/overview`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  })
  if (!response.ok) throw new Error(await readApiError(response))

  const data = (await response.json()) as { quotations: Quotation[] }
  const query = await searchParams

  const rows = data.quotations.map((quotation) => ({
    quotation,
    view: orderView(quotation.salesOrder, quotation.status),
    placedAt: quotation.createdAt,
  }))

  const counts = Object.fromEntries(
    ORDER_STEPS.map((step) => [step, rows.filter((row) => !row.view.stopped && row.view.step === step).length]),
  ) as Record<OrderStep, number>

  const active = ORDER_STEPS.includes(query.step as OrderStep) ? (query.step as OrderStep) : null
  const visible = sortByAttention(active ? rows.filter((row) => !row.view.stopped && row.view.step === active) : rows)

  // Lead with the oldest thing we have not dealt with, not a count of everything
  // waiting. Until an order is dispatched every order technically needs an
  // action, so that count is always the total and tells staff nothing.
  const unstarted = rows.filter((row) => row.view.step === "PLACED" && !row.view.stopped).length
  const oldestWaiting = sortByAttention(rows.filter((row) => row.view.nextAction)).at(-1)

  return (
    <main className="mx-auto w-full max-w-[1200px] flex-1 space-y-7 px-4 py-8 sm:px-6 lg:px-8">
      <header className="overflow-hidden rounded-3xl bg-[#0a2540] p-6 text-white shadow-xl sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-300">Customer orders</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Who ordered, and where it is</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
          {unstarted > 0
            ? `${unstarted} new order${unstarted === 1 ? "" : "s"} not yet confirmed`
            : "Every order is confirmed"}
          {oldestWaiting
            ? `, and the oldest still open was placed ${dayOnly(oldestWaiting.placedAt)}.`
            : "."}{" "}
          This is the same view the customer sees when they track their order.
        </p>
      </header>

      <nav aria-label="Filter by stage" className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {ORDER_STEPS.map((step) => {
          const selected = active === step
          return (
            <Link
              key={step}
              href={selected ? "/orders" : `/orders?step=${step}`}
              aria-current={selected ? "true" : undefined}
              className={`rounded-2xl border p-4 transition ${selected ? "border-[#123a5e] bg-[#123a5e] text-white shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"}`}
            >
              <b className="block text-2xl">{counts[step]}</b>
              <small className={selected ? "text-slate-200" : "text-slate-500"}>{STEP_LABELS[step]}</small>
            </Link>
          )
        })}
      </nav>

      <div className="space-y-4">
        {visible.map(({ quotation, view }) => {
          const reference = quotation.salesOrder?.reference ?? quotation.reference
          const total = quotation.salesOrder?.grandTotal ?? quotation.revisions[0]?.grandTotal
          const tracking = quotation.salesOrder?.dispatches?.find((entry) => entry.trackingReference)?.trackingReference

          return (
            <article key={quotation.id} className={view.stopped ? `${panel} opacity-70` : panel}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-mono text-xs font-semibold text-orange-600">{reference}</p>
                  <h2 className="mt-1 text-xl font-bold">{quotation.customerName}</h2>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {quotation.customerEmail} · {quotation.customerPhone} · PIN {quotation.deliveryPincode}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Placed {day(quotation.createdAt)} ·{" "}
                    {quotation.customerUserId ? "Signed in to an account" : "Enquiry without an account"}
                  </p>
                </div>
                <span className={`h-fit whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${view.stopped ? "bg-red-100 text-red-700" : STEP_TONE[view.step]}`}>
                  {view.label}
                </span>
              </div>

              <ul className="mt-4 space-y-1.5 border-t border-slate-100 pt-4 text-sm">
                {quotation.items.map((item) => (
                  <li key={item.id} className="flex justify-between gap-4">
                    <span className="min-w-0">{item.description}</span>
                    <span className="whitespace-nowrap font-semibold text-slate-600">
                      {String(item.quantity)} {item.unitCode}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm">
                  {total != null && <b className="text-lg">{money(total)}</b>}
                  {tracking && <span className="ml-3 font-mono text-xs text-slate-500">Tracking {tracking}</span>}
                </div>
                {view.nextAction ? (
                  <Link
                    href={quotation.salesOrder ? "/fulfilment" : "/quotations"}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#0a2540] px-4 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    {view.nextAction} →
                  </Link>
                ) : (
                  <span className="text-sm text-slate-400">Nothing pending</span>
                )}
              </div>
            </article>
          )
        })}

        {visible.length === 0 && (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
            {active ? `No orders are ${STEP_LABELS[active].toLowerCase()} right now.` : "No customer orders yet."}
          </p>
        )}
      </div>
    </main>
  )
}
