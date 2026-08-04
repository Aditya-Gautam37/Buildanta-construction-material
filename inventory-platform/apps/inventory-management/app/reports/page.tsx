import Link from "next/link"
import { inventoryApiUrl, readApiError, requireStaffAccess } from "@/lib/staff-access"

type Dashboard = {
  summary: { physicalStock:number; availableToPromise:number; pendingReservations:number; inventoryValuation:number; grossMargin:number|null; quoteConversionRate:number; averageQuoteResponseHours:number|null; delayedDispatches:number }
  warehouse: { name:string; physical:number; reserved:number; available:number; valuation:number }[]
  supplierComparison: { rfq:string; supplier:string; total:number; averageLeadDays:number; status:string }[]
  supplierPerformance: { supplier:string; purchaseOrder:string; expectedAt:string|null; receivedAt:string; onTime:boolean }[]
  stockAgeing: { balanceId:string; firstMovementAt:string; ageDays:number }[]
  canViewMargin:boolean
}

const money=(value:number)=>`INR ${value.toLocaleString("en-IN",{maximumFractionDigits:0})}`
const panel="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"

export default async function ReportsPage(){
  const {accessToken}=await requireStaffAccess("/reports")
  const response=await fetch(`${inventoryApiUrl}/fulfilment-operations/dashboard`,{headers:{Authorization:`Bearer ${accessToken}`},cache:"no-store"})
  if(!response.ok) throw new Error(await readApiError(response))
  const data=await response.json() as Dashboard
  const oldest=data.stockAgeing.reduce((maximum,item)=>Math.max(maximum,item.ageDays),0)
  const metrics:[string,string|number][]=[
    ["Physical stock",data.summary.physicalStock],
    ["Available to promise",data.summary.availableToPromise],
    ["Pending reservations",data.summary.pendingReservations],
    ["Inventory valuation",money(data.summary.inventoryValuation)],
    ["Quote conversion",`${data.summary.quoteConversionRate.toFixed(1)}%`],
    ["Average quote response",data.summary.averageQuoteResponseHours===null?"No data":`${data.summary.averageQuoteResponseHours.toFixed(1)} h`],
    ["Delayed dispatches",data.summary.delayedDispatches],
    ["Oldest stock",`${oldest} days`],
  ]
  if(data.canViewMargin&&data.summary.grossMargin!==null) metrics.push(["Authorized gross margin",money(data.summary.grossMargin)])
  return <main className="mx-auto w-full min-w-0 max-w-[1500px] space-y-8 overflow-x-hidden px-4 py-8 sm:px-6 lg:px-8">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-700">Management reports</p><h1 className="mt-2 text-3xl font-bold sm:text-4xl">Operational performance</h1><p className="mt-2 max-w-3xl text-slate-600">Current stock, purchasing, supplier and fulfilment indicators. Cost and margin fields appear only for authorized roles.</p></div><Link href="/dashboard" className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:border-emerald-400">Back to dashboard</Link></header>
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{metrics.map(([label,value])=><article className={panel} key={label}><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></article>)}</section>
    <section className="grid gap-6 lg:grid-cols-2">
      <ReportTable title="Stock by location" headers={["Location","Physical","Reserved","ATP","Value"]} rows={data.warehouse.map(x=>[x.name,x.physical,x.reserved,x.available,money(x.valuation)])}/>
      <ReportTable title="Supplier quotations" headers={["RFQ","Supplier","Offer","Lead","Status"]} rows={data.supplierComparison.map(x=>[x.rfq,x.supplier,money(x.total),`${x.averageLeadDays.toFixed(1)} days`,x.status])}/>
      <ReportTable title="Supplier delivery performance" headers={["Supplier","Purchase order","Received","On time"]} rows={data.supplierPerformance.map(x=>[x.supplier,x.purchaseOrder,new Date(x.receivedAt).toLocaleDateString("en-IN"),x.onTime?"Yes":"No"])}/>
      <ReportTable title="Stock ageing" headers={["Balance reference","First movement","Age"]} rows={data.stockAgeing.sort((a,b)=>b.ageDays-a.ageDays).map(x=>[x.balanceId,new Date(x.firstMovementAt).toLocaleDateString("en-IN"),`${x.ageDays} days`])}/>
    </section>
  </main>
}

function ReportTable({title,headers,rows}:{title:string;headers:string[];rows:(string|number)[][]}){return <section className={`${panel} min-w-0 overflow-hidden`}><h2 className="text-xl font-bold">{title}</h2>{rows.length?<div className="mt-4 max-w-full overflow-x-auto"><table className="min-w-full text-left text-sm"><thead><tr className="text-xs uppercase text-slate-500">{headers.map(header=><th className="whitespace-nowrap px-3 py-2" key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row,index)=><tr className="border-t border-slate-100" key={index}>{row.map((value,column)=><td className={`whitespace-nowrap px-3 py-3 ${column===0?"sticky left-0 bg-white font-semibold":""}`} key={column}>{value}</td>)}</tr>)}</tbody></table></div>:<p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No report data is available yet.</p>}</section>}
