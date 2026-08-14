import { CalculatorDefinitionStatus, CalculatorQualityTier, CalculatorType, CalculatorVersionStatus, UserRole } from "@workspace/db"
import { inventoryApiUrl, readApiError, requireStaffAccess } from "@/lib/staff-access"
import { createDefinitionAction, createVersionAction, publishVersionAction, upsertMappingAction } from "./actions"

type Mapping = {
  id: string; outputKey: string; qualityTier: string; expectedUnit: string; packageSize: string | null; preferred: boolean; active: boolean
  category: { id: string; name: string } | null
  product: { id: string; name: string; status: string } | null
  variant: { id: string; sku: string; unit: string; status: string } | null
}
type Version = { id: string; version: number; formulaKey: string; configuration: Record<string, unknown>; status: CalculatorVersionStatus; effectiveFrom: string | null; publishedAt: string | null; mappings: Mapping[]; _count: { mappings: number; estimates: number } }
type Definition = { id: string; name: string; slug: string; type: CalculatorType; description: string; instructions: string | null; disclaimer: string; status: CalculatorDefinitionStatus; sortOrder: number; versions: Version[]; _count: { estimates: number } }
type Product = { id: string; name: string; status: string; unit: string; variants: { id: string; sku: string; unit: string; price: string | null; status: string }[] }
type Estimate = { id: string; reference: string; status: string; deliveryPincode: string; indicativeTotal: string | null; createdAt: string; definition: { name: string; slug: string }; calculatorVersion: { version: number }; quotation: { id: string; reference: string; status: string } | null; items: { id: string; description: string; purchaseQuantity: string; unitCode: string; lineTotal: string | null }[] }
type Overview = { formulaKeys: string[]; definitions: Definition[]; products: Product[]; categories: { id: string; name: string }[] }

const panel = "rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
const input = "mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
const textarea = "mt-1.5 min-h-28 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-xs outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
const button = "h-11 rounded-xl bg-[#0a2540] px-5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
const label = "text-sm font-medium text-slate-700"

export default async function CalculatorsManagementPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const { accessToken, role } = await requireStaffAccess("/calculators")
  const headers = { Authorization: `Bearer ${accessToken}` }
  const editorRoles: UserRole[] = [UserRole.ADMIN, UserRole.CATALOG_MANAGER, UserRole.DATA_ENTRY]
  const estimateReaderRoles: UserRole[] = [UserRole.ADMIN, UserRole.CATALOG_MANAGER, UserRole.SALES, UserRole.SUPPORT]
  const canEdit = editorRoles.includes(role)
  const canReadEstimates = estimateReaderRoles.includes(role)
  const overviewResponse = await fetch(`${inventoryApiUrl}/calculators/admin/overview`, { headers, cache: "no-store" })
  if (!overviewResponse.ok) throw new Error(await readApiError(overviewResponse))
  const overview = await overviewResponse.json() as Overview
  let estimates: Estimate[] = []
  if (canReadEstimates) {
    const estimatesResponse = await fetch(`${inventoryApiUrl}/calculators/admin/estimates`, { headers, cache: "no-store" })
    if (!estimatesResponse.ok) throw new Error(await readApiError(estimatesResponse))
    estimates = await estimatesResponse.json() as Estimate[]
  }
  const query = await searchParams
  const published = overview.definitions.filter((item) => item.status === CalculatorDefinitionStatus.PUBLISHED).length
  const converted = estimates.filter((item) => item.quotation).length

  return <main className="mx-auto w-full max-w-[1500px] flex-1 space-y-8 px-4 py-8 sm:px-6 lg:px-8">
    <section className="overflow-hidden rounded-3xl bg-[#0a2540] p-6 text-white shadow-xl sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-300">Planning tools</p>
      <div className="mt-3 grid gap-6 xl:grid-cols-[1fr_auto] xl:items-end">
        <div><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Calculator control centre</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">Manage validated material formulas, publish quantity calculators independently, optionally connect outputs to catalogue variants, and trace every estimate into its quotation.</p></div>
        <div className="grid grid-cols-3 gap-2"><Kpi value={published} label="Published"/><Kpi value={estimates.length} label="Estimates"/><Kpi value={converted} label="Quoted"/></div>
      </div>
    </section>

    {query.error && <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{query.error}</p>}
    {query.saved && <p role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Calculator configuration saved. The connected storefront will use it after publication.</p>}

    {canEdit && <details className={panel}>
      <summary className="cursor-pointer text-lg font-bold">Create a new calculator definition</summary>
      <form action={createDefinitionAction} className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Field name="name" title="Name" placeholder="Waterproofing calculator"/><Field name="slug" title="URL slug" placeholder="waterproofing"/>
        <Select name="type" title="Calculator type" options={Object.values(CalculatorType).map((item) => [item, item.replaceAll("_", " ")])}/><Field name="sortOrder" title="Sort order" type="number" min="0" defaultValue="100"/>
        <label className={`${label} md:col-span-2`}>Description<textarea name="description" required className={textarea}/></label>
        <label className={`${label} md:col-span-2`}>Customer instructions<textarea name="instructions" className={textarea}/></label>
        <Field name="icon" title="Icon label (optional)" required={false}/>
        <label className={`${label} md:col-span-2 xl:col-span-3`}>Safety disclaimer<textarea name="disclaimer" required defaultValue="This estimate is for preliminary planning. Actual requirements can vary with site conditions, design, workmanship and product performance. Confirm final quantities with a qualified professional." className={textarea}/></label>
        <button className={`${button} self-end`}>Create draft definition</button>
      </form>
    </details>}

    {canEdit && <section className="space-y-5">
      <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Versioned configuration</p><h2 className="text-2xl font-bold tracking-tight">Calculator definitions</h2></div>
      {overview.definitions.map((definition) => {
        const latest = definition.versions[0]
        const draft = definition.versions.find((version) => version.status === CalculatorVersionStatus.DRAFT)
        return <article key={definition.id} className={panel}>
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
            <div><div className="flex flex-wrap items-center gap-2"><h3 className="text-xl font-bold">{definition.name}</h3><Status value={definition.status}/><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">/{definition.slug}</span></div><p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">{definition.description}</p></div>
            <div className="grid grid-cols-3 gap-2 text-center"><Mini value={definition.versions.length} label="Versions"/><Mini value={latest?._count.mappings ?? 0} label="Mappings"/><Mini value={definition._count.estimates} label="Estimates"/></div>
          </div>

          {latest && <div className="mt-5 rounded-2xl bg-slate-50 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><b>Version {latest.version}</b><span className="ml-2 text-sm text-slate-500">{latest.formulaKey}</span></div><Status value={latest.status}/></div><pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-xl bg-white p-3 text-xs text-slate-600">{JSON.stringify(latest.configuration, null, 2)}</pre></div>}

          <div className="mt-5 grid gap-5 xl:grid-cols-2">
            <details className="rounded-2xl border border-slate-200 p-4" open={!draft}>
              <summary className="cursor-pointer font-bold">Create the next draft version</summary>
              <form action={createVersionAction} className="mt-4 grid gap-3"><input type="hidden" name="definitionId" value={definition.id}/><Select name="formulaKey" title="Validated formula" options={overview.formulaKeys.map((item) => [item, item])} defaultValue={latest?.formulaKey}/><label className={label}>Configuration JSON<textarea name="configuration" required defaultValue={JSON.stringify(latest?.configuration ?? {}, null, 2)} className={textarea}/></label><Field name="reason" title="Change reason" placeholder="Update reviewed coverage assumptions"/><button className={button}>Create immutable draft version</button></form>
            </details>

            <div className="rounded-2xl border border-slate-200 p-4"><h4 className="font-bold">Product mappings</h4>{latest?.mappings.length ? <div className="mt-3 space-y-2">{latest.mappings.map((mapping) => <div key={mapping.id} className="flex flex-col justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm sm:flex-row"><span><b>{mapping.outputKey}</b> · {mapping.qualityTier}<small className="block text-slate-500">{mapping.product?.name || mapping.category?.name || "No catalogue item"} {mapping.variant ? `/ ${mapping.variant.sku}` : ""}</small></span><span className="text-xs font-semibold text-slate-500">{mapping.expectedUnit}{mapping.packageSize ? ` · pack ${mapping.packageSize}` : ""}</span></div>)}</div> : <p className="mt-3 text-sm text-slate-500">No mappings exist in this version.</p>}</div>
          </div>

          {draft && <section className="mt-5 rounded-2xl border border-orange-200 bg-orange-50/50 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h4 className="font-bold">Prepare draft version {draft.version}</h4><p className="text-sm text-slate-600">Product mappings are optional. Publish the reviewed formula for quantity-only results now and add catalogue mappings in a later version.</p></div><Status value={draft.status}/></div>
            <form action={upsertMappingAction} className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-6"><input type="hidden" name="versionId" value={draft.id}/><Field name="outputKey" title="Formula output key" placeholder="cement"/><Select name="qualityTier" title="Quality tier" options={Object.values(CalculatorQualityTier).map((item) => [item, item])}/><label className={`${label} sm:col-span-2`}>Catalogue variant<select name="variantId" required className={input}><option value="">Choose a product variant</option>{overview.products.flatMap((product) => product.variants.map((variant) => <option key={variant.id} value={variant.id}>{product.name} / {variant.sku} / {variant.unit}</option>))}</select></label><Field name="expectedUnit" title="Formula unit" placeholder="bag"/><Field name="packageSize" title="Pack size" type="number" min="0.000001" step="0.000001" required={false}/><Field name="conversionFactor" title="Conversion" type="number" min="0.000001" step="0.000001" defaultValue="1"/><Field name="priority" title="Priority" type="number" min="0" defaultValue="0"/><label className={`${label} flex items-end gap-2 pb-3`}><input name="preferred" type="checkbox" defaultChecked/>Preferred option</label><button className={`${button} self-end sm:col-span-2`}>Save mapping</button></form>
            {role === UserRole.ADMIN ? <form action={publishVersionAction} className="mt-4 flex flex-col gap-3 border-t border-orange-200 pt-4 sm:flex-row sm:items-end"><input type="hidden" name="versionId" value={draft.id}/><Field name="reason" title="Publication reason" placeholder="Reviewed by catalogue and commercial teams" className="flex-1"/><button className={`${button} bg-emerald-700 hover:bg-emerald-800`}>Publish version {draft.version}</button></form> : <p className="mt-4 border-t border-orange-200 pt-4 text-sm text-orange-800">Only an administrator can publish a draft. Catalogue staff can prepare and map it.</p>}
          </section>}
        </article>
      })}
    </section>}

    {canReadEstimates && <section className={panel}><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Traceability</p><h2 className="text-2xl font-bold">Recent customer estimates</h2></div><p className="text-sm text-slate-500">{converted} of {estimates.length} converted to quotations</p></div>
      <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-3 py-3">Estimate</th><th className="px-3 py-3">Calculator</th><th className="px-3 py-3">PIN</th><th className="px-3 py-3">Materials</th><th className="px-3 py-3">Indicative total</th><th className="px-3 py-3">Quotation</th><th className="px-3 py-3">Created</th></tr></thead><tbody>{estimates.map((estimate) => <tr key={estimate.id} className="border-b border-slate-100 align-top"><td className="px-3 py-4 font-mono text-xs">{estimate.reference}<Status value={estimate.status}/></td><td className="px-3 py-4"><b>{estimate.definition.name}</b><small className="block text-slate-500">Version {estimate.calculatorVersion.version}</small></td><td className="px-3 py-4">{estimate.deliveryPincode}</td><td className="px-3 py-4">{estimate.items.map((item) => `${item.description}: ${item.purchaseQuantity} ${item.unitCode}`).join(", ")}</td><td className="px-3 py-4">{estimate.indicativeTotal ? `₹${Number(estimate.indicativeTotal).toLocaleString("en-IN")}` : "Price on request"}</td><td className="px-3 py-4">{estimate.quotation ? <a href={`/quotations?reference=${encodeURIComponent(estimate.quotation.reference)}`} className="font-semibold text-emerald-700 hover:underline">{estimate.quotation.reference}</a> : <span className="text-slate-400">Not requested</span>}</td><td className="px-3 py-4 text-slate-500">{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(estimate.createdAt))}</td></tr>)}{!estimates.length && <tr><td colSpan={7} className="px-3 py-10 text-center text-slate-500">No calculator estimates yet.</td></tr>}</tbody></table></div>
    </section>}
  </main>
}

function Kpi({ value, label: text }: { value: number; label: string }) { return <span className="rounded-2xl bg-white/10 px-4 py-3"><b className="block text-2xl">{value}</b><small className="text-slate-300">{text}</small></span> }
function Mini({ value, label: text }: { value: number; label: string }) { return <span className="rounded-xl bg-slate-100 px-3 py-2"><b className="block text-lg">{value}</b><small className="text-slate-500">{text}</small></span> }
function Status({ value }: { value: string }) { const good = value === "PUBLISHED" || value === "CONVERTED"; return <span className={`ml-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${good ? "bg-emerald-100 text-emerald-800" : value === "DRAFT" || value === "ACTIVE" ? "bg-orange-100 text-orange-800" : "bg-slate-100 text-slate-600"}`}>{value.replaceAll("_", " ")}</span> }
function Field({ name, title, className = "", required = true, ...props }: { name: string; title: string; className?: string; required?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) { return <label className={`${label} ${className}`}>{title}<input name={name} required={required} className={input} {...props}/></label> }
function Select({ name, title, options, defaultValue }: { name: string; title: string; options: [string, string][]; defaultValue?: string }) { return <label className={label}>{title}<select name={name} required defaultValue={defaultValue} className={input}>{options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label> }
