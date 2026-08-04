"use client"

import Image from "next/image"
import { useMemo, useState } from "react"
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  ChevronRight,
  Folder,
  FolderOpen,
  ImagePlus,
  Layers3,
  Pencil,
  Plus,
  Search,
  Sparkles,
  X,
} from "lucide-react"
import { toast } from "@workspace/ui/components/sonner"
import { supabaseBrowser } from "@/lib/supabase/client"
import { trpcClient } from "@/lib/trpc/client"

export type ManagedCategory = {
  id: string
  name: string
  slug: string
  parentId: string | null
  description?: string | null
  imageUrl?: string | null
  icon?: string | null
  sortOrder: number
  featured: boolean
  published: boolean
  seoTitle?: string | null
  seoDescription?: string | null
  _count?: { children: number; products: number }
}

type FormState = Omit<ManagedCategory, "id" | "_count"> & { id?: string }
type View = "departments" | "cleanup"

const blank: FormState = {
  name: "",
  slug: "",
  parentId: null,
  description: "",
  imageUrl: "",
  icon: "folder",
  sortOrder: 0,
  featured: false,
  published: true,
  seoTitle: "",
  seoDescription: "",
}

function pathsFor(categories: ManagedCategory[]) {
  const byId = new Map(categories.map((item) => [item.id, item]))
  const cache = new Map<string, string>()

  function pathOf(item: ManagedCategory, seen = new Set<string>()): string {
    const cached = cache.get(item.id)
    if (cached) return cached
    if (!item.parentId || seen.has(item.id)) return item.name
    seen.add(item.id)
    const parent = byId.get(item.parentId)
    const value = parent ? `${pathOf(parent, seen)} / ${item.name}` : item.name
    cache.set(item.id, value)
    return value
  }

  return new Map(categories.map((item) => [item.id, pathOf(item)]))
}

function childMapFor(categories: ManagedCategory[]) {
  const map = new Map<string | null, ManagedCategory[]>()
  for (const item of categories) {
    const list = map.get(item.parentId) ?? []
    list.push(item)
    map.set(item.parentId, list)
  }
  for (const list of map.values()) {
    list.sort((first, second) => first.sortOrder - second.sortOrder || first.name.localeCompare(second.name))
  }
  return map
}

function descendantIds(id: string, children: Map<string | null, ManagedCategory[]>) {
  const result = new Set<string>()
  const visit = (parentId: string) => {
    for (const child of children.get(parentId) ?? []) {
      result.add(child.id)
      visit(child.id)
    }
  }
  visit(id)
  return result
}

function branchSummary(id: string, children: Map<string | null, ManagedCategory[]>) {
  let categoryCount = 0
  let productCount = 0
  const visit = (parentId: string) => {
    for (const child of children.get(parentId) ?? []) {
      categoryCount += 1
      productCount += child._count?.products ?? 0
      visit(child.id)
    }
  }
  visit(id)
  return { categoryCount, productCount }
}

function levelLabel(depth: number, childCount: number) {
  if (depth === 0) return "Department"
  if (childCount > 0) return "Group"
  return "Product type"
}

type BranchProps = {
  item: ManagedCategory
  depth: number
  childMap: Map<string | null, ManagedCategory[]>
  paths: Map<string, string>
  expanded: Set<string>
  duplicateNames: Set<string>
  saving: boolean
  onToggle: (id: string) => void
  onEdit: (item: ManagedCategory) => void
  onAdd: (parentId: string) => void
  onArchive: (item: ManagedCategory) => void
}

function CategoryBranch({
  item,
  depth,
  childMap,
  paths,
  expanded,
  duplicateNames,
  saving,
  onToggle,
  onEdit,
  onAdd,
  onArchive,
}: BranchProps) {
  const childItems = childMap.get(item.id) ?? []
  const isOpen = expanded.has(item.id)
  const isEmpty = childItems.length === 0 && (item._count?.products ?? 0) === 0
  const duplicate = duplicateNames.has(item.name.toLowerCase())

  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <article className="grid gap-3 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div className="flex min-w-0 items-start gap-3" style={{ paddingLeft: `${Math.min(depth, 3) * 18}px` }}>
          <button
            type="button"
            onClick={() => childItems.length > 0 && onToggle(item.id)}
            aria-label={childItems.length > 0 ? `${isOpen ? "Collapse" : "Expand"} ${item.name}` : undefined}
            className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl ${childItems.length > 0 ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-slate-100 text-slate-500"}`}
          >
            {childItems.length > 0 ? (isOpen ? <FolderOpen className="size-4" /> : <Folder className="size-4" />) : <Layers3 className="size-4" />}
          </button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => childItems.length > 0 && onToggle(item.id)} className="truncate text-left text-sm font-bold text-slate-950">
                {item.name}
              </button>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                {levelLabel(depth, childItems.length)}
              </span>
              {!item.published ? <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Draft</span> : null}
              {isEmpty ? <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700">Empty</span> : null}
              {duplicate ? <AlertTriangle className="size-4 text-amber-500" aria-label="Duplicate category name" /> : null}
            </div>
            <p className="mt-1 truncate text-xs text-slate-500">{paths.get(item.id)}</p>
            <p className="mt-1 text-xs text-slate-600">
              {childItems.length} {childItems.length === 1 ? "child" : "children"} - {item._count?.products ?? 0} direct products
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pl-12 sm:pl-0">
          <button type="button" onClick={() => onEdit(item)} className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50">
            <Pencil className="size-3.5" /> Edit
          </button>
          <button type="button" onClick={() => onAdd(item.id)} className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50">
            <Plus className="size-3.5" /> Add below
          </button>
          {item.published ? (
            <button type="button" onClick={() => onArchive(item)} disabled={saving} className="inline-flex h-9 items-center gap-2 rounded-xl px-3 text-xs font-bold text-amber-700 hover:bg-amber-50 disabled:opacity-50">
              <Archive className="size-3.5" /> Draft
            </button>
          ) : null}
        </div>
      </article>
      {childItems.length > 0 && isOpen ? (
        <div className="border-t border-slate-100 bg-slate-50/60">
          {childItems.map((child) => (
            <CategoryBranch
              key={child.id}
              item={child}
              depth={depth + 1}
              childMap={childMap}
              paths={paths}
              expanded={expanded}
              duplicateNames={duplicateNames}
              saving={saving}
              onToggle={onToggle}
              onEdit={onEdit}
              onAdd={onAdd}
              onArchive={onArchive}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

export default function CategoryManager({ initialCategories }: { initialCategories: ManagedCategory[] }) {
  const [categories, setCategories] = useState(initialCategories)
  const [query, setQuery] = useState("")
  const [view, setView] = useState<View>("departments")
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())
  const [form, setForm] = useState<FormState | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const paths = useMemo(() => pathsFor(categories), [categories])
  const children = useMemo(() => childMapFor(categories), [categories])
  const liveChildren = useMemo(() => childMapFor(categories.filter((item) => item.published)), [categories])
  const allLiveDepartments = liveChildren.get(null) ?? []
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(() => {
    const roots = initialCategories.filter((item) => !item.parentId)
    return roots.find((item) => item.published && initialCategories.some((child) => child.published && child.parentId === item.id))?.id
      ?? roots.find((item) => item.published)?.id
      ?? roots[0]?.id
      ?? null
  })
  const departments = allLiveDepartments.filter((item) =>
    (liveChildren.get(item.id)?.length ?? 0) > 0
    || (item._count?.products ?? 0) > 0
    || item.id === selectedDepartmentId
  )
  const selectedDepartment = departments.find((item) => item.id === selectedDepartmentId) ?? departments[0] ?? null

  const duplicateNames = useMemo(() => {
    const counts = new Map<string, number>()
    for (const item of categories) counts.set(item.name.toLowerCase(), (counts.get(item.name.toLowerCase()) ?? 0) + 1)
    return new Set([...counts].filter(([, count]) => count > 1).map(([name]) => name))
  }, [categories])

  const cleanupItems = useMemo(() => categories.filter((item) => {
    const emptyDepartment = !item.parentId && (children.get(item.id)?.length ?? 0) === 0 && (item._count?.products ?? 0) === 0
    return !item.published || emptyDepartment || duplicateNames.has(item.name.toLowerCase())
  }), [categories, children, duplicateNames])

  const searchResults = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return []
    return categories.filter((item) => `${item.name} ${item.slug} ${paths.get(item.id)} ${item.description ?? ""}`.toLowerCase().includes(needle))
  }, [categories, paths, query])

  function openNew(parentId: string | null = null) {
    setForm({ ...blank, parentId, sortOrder: (children.get(parentId)?.length ?? 0) * 10 })
  }

  function openEdit(item: ManagedCategory) {
    setForm({
      ...item,
      description: item.description ?? "",
      imageUrl: item.imageUrl ?? "",
      icon: item.icon ?? "",
      seoTitle: item.seoTitle ?? "",
      seoDescription: item.seoDescription ?? "",
    })
  }

  function toggle(id: string) {
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function upload(file: File) {
    if (!form) return
    setUploading(true)
    try {
      const body = new FormData()
      body.set("file", file)
      body.set("kind", "category")
      const response = await fetch("/api/uploads", { method: "POST", body })
      const payload = await response.json() as { url?: string; error?: string }
      if (!response.ok || !payload.url) throw new Error(payload.error || "Image upload failed.")
      setForm((current) => current ? { ...current, imageUrl: payload.url! } : current)
      toast.success("Category image uploaded to durable storage.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Image upload failed.")
    } finally {
      setUploading(false)
    }
  }

  async function save() {
    if (!form || !form.name.trim()) return
    setSaving(true)
    try {
      const { data: { session } } = await supabaseBrowser().auth.getSession()
      if (!session?.access_token) throw new Error("Your session expired. Please sign in again.")
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim() || undefined,
        parentId: form.parentId,
        description: form.description?.trim() || undefined,
        imageUrl: form.imageUrl?.trim() || undefined,
        icon: form.icon?.trim() || undefined,
        sortOrder: Number(form.sortOrder) || 0,
        featured: form.featured,
        published: form.published,
        seoTitle: form.seoTitle?.trim() || undefined,
        seoDescription: form.seoDescription?.trim() || undefined,
        accessToken: session.access_token,
      }
      const saved = form.id
        ? await trpcClient.updateCategory.mutate({ id: form.id, ...payload })
        : await trpcClient.createCategory.mutate(payload)
      setCategories((current) => [...current.filter((item) => item.id !== saved.id), saved as ManagedCategory])
      if (!saved.parentId) setSelectedDepartmentId(saved.id)
      setForm(null)
      toast.success(form.id ? "Category updated." : "Category created.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save category.")
    } finally {
      setSaving(false)
    }
  }

  async function archive(item: ManagedCategory) {
    setSaving(true)
    try {
      const { data: { session } } = await supabaseBrowser().auth.getSession()
      if (!session?.access_token) throw new Error("Your session expired.")
      const saved = await trpcClient.updateCategory.mutate({
        id: item.id,
        published: false,
        featured: false,
        accessToken: session.access_token,
      })
      setCategories((current) => current.map((value) => value.id === item.id ? saved as ManagedCategory : value))
      toast.success("Category moved to draft. Products and children were preserved.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to move category to draft.")
    } finally {
      setSaving(false)
    }
  }

  const blockedParents = form?.id ? descendantIds(form.id, children) : new Set<string>()
  if (form?.id) blockedParents.add(form.id)
  const selectedSummary = selectedDepartment ? branchSummary(selectedDepartment.id, liveChildren) : null
  const publishedCount = categories.filter((item) => item.published).length

  return (
    <main className="mx-auto w-full max-w-[1640px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <section className="overflow-hidden rounded-[28px] bg-[#12344a] text-white shadow-xl shadow-slate-900/10">
        <div className="grid gap-6 px-6 py-8 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end xl:px-8">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-300">Simple catalogue structure</p>
            <h2 className="mt-3 text-3xl font-bold tracking-[-0.035em] sm:text-4xl">Departments, groups and product types.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Choose one department, then manage only the categories inside it. Customers see the same clear structure on the storefront.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              [departments.length, "Departments"],
              [publishedCount, "Live categories"],
              [cleanupItems.length, "Drafts / issues"],
            ].map(([value, label]) => (
              <div key={String(label)} className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3">
                <strong className="block text-2xl">{String(value)}</strong>
                <span className="mt-1 block text-[10px] text-slate-300">{String(label)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Search categories</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search any department, group or product type..."
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
            />
          </label>
          <div className="flex gap-2 overflow-x-auto" aria-label="Category views">
            <button type="button" onClick={() => setView("departments")} className={`h-11 shrink-0 rounded-xl px-4 text-sm font-bold ${view === "departments" ? "bg-[#12344a] text-white" : "bg-slate-100 text-slate-600"}`}>
              Departments
            </button>
            <button type="button" onClick={() => setView("cleanup")} className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-bold ${view === "cleanup" ? "bg-amber-100 text-amber-900" : "bg-slate-100 text-slate-600"}`}>
              <AlertTriangle className="size-4" /> Drafts and issues <span className="rounded-full bg-white px-2 py-0.5 text-[10px]">{cleanupItems.length}</span>
            </button>
            <button type="button" onClick={() => openNew()} className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800">
              <Plus className="size-4" /> New department
            </button>
          </div>
        </div>
      </section>

      {query.trim() ? (
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">Search results</p>
            <h3 className="mt-1 text-lg font-bold">{searchResults.length} matching categories</h3>
          </div>
          {searchResults.length > 0 ? searchResults.map((item) => (
            <CategoryBranch key={item.id} item={item} depth={0} childMap={new Map()} paths={paths} expanded={expanded} duplicateNames={duplicateNames} saving={saving} onToggle={toggle} onEdit={openEdit} onAdd={openNew} onArchive={archive} />
          )) : <EmptyState title="No categories found" description="Try a broader name or clear the search." />}
        </section>
      ) : view === "cleanup" ? (
        <section className="overflow-hidden rounded-3xl border border-amber-200 bg-white shadow-sm">
          <div className="border-b border-amber-100 bg-amber-50 px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700">Cleanup queue</p>
            <h3 className="mt-1 text-lg font-bold text-slate-950">Categories that need a decision</h3>
            <p className="mt-1 text-sm text-slate-600">Draft, empty or duplicate-named categories appear here. Edit them, move products into them, or keep them as drafts.</p>
          </div>
          {cleanupItems.length > 0 ? cleanupItems.map((item) => (
            <CategoryBranch key={item.id} item={item} depth={0} childMap={new Map()} paths={paths} expanded={expanded} duplicateNames={duplicateNames} saving={saving} onToggle={toggle} onEdit={openEdit} onAdd={openNew} onArchive={archive} />
          )) : <EmptyState title="Everything is organized" description="There are no draft, empty or duplicate categories." />}
        </section>
      ) : (
        <section className="grid items-start gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm xl:sticky xl:top-20">
            <div className="border-b border-slate-100 px-5 py-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">Step 1</p>
              <h3 className="mt-1 text-base font-bold">Choose a department</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">Only one department opens at a time.</p>
            </div>
            <div className="max-h-[680px] overflow-y-auto p-2 [scrollbar-width:thin]">
              {departments.map((department) => {
                const summary = branchSummary(department.id, liveChildren)
                const selected = selectedDepartment?.id === department.id
                return (
                  <button
                    type="button"
                    key={department.id}
                    onClick={() => setSelectedDepartmentId(department.id)}
                    className={`mb-1 grid w-full grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border p-2.5 text-left transition last:mb-0 ${selected ? "border-emerald-300 bg-emerald-50 shadow-sm" : "border-transparent hover:border-slate-200 hover:bg-slate-50"}`}
                  >
                    <span className="relative grid size-11 place-items-center overflow-hidden rounded-xl bg-slate-100 text-slate-500">
                      {department.imageUrl ? <Image src={department.imageUrl} alt="" fill sizes="44px" className="object-cover" /> : <Folder className="size-5" />}
                    </span>
                    <span className="min-w-0">
                      <strong className="block truncate text-sm text-slate-950">{department.name}</strong>
                      <span className="mt-1 block text-[10px] text-slate-500">{summary.categoryCount} categories - {summary.productCount} products</span>
                    </span>
                    <ChevronRight className={`size-4 ${selected ? "text-emerald-700" : "text-slate-300"}`} />
                  </button>
                )
              })}
              {departments.length === 0 ? <EmptyState title="No departments yet" description="Create your first department to begin." compact /> : null}
            </div>
          </aside>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            {selectedDepartment ? (
              <>
                <header className="border-b border-slate-100 p-5 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-start gap-4">
                      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#12344a] text-white"><FolderOpen className="size-5" /></span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">Step 2 - organize this department</p>
                        <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">{selectedDepartment.name}</h2>
                        <p className="mt-1 text-sm text-slate-500">Department / Group / Product type</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => openEdit(selectedDepartment)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-700"><Pencil className="size-4" /> Edit department</button>
                      <button type="button" onClick={() => openNew(selectedDepartment.id)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#12344a] px-3 text-sm font-bold text-white"><Plus className="size-4" /> Add group</button>
                    </div>
                  </div>
                  <div className="mt-5 grid grid-cols-3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                    {[
                      [liveChildren.get(selectedDepartment.id)?.length ?? 0, "Groups"],
                      [selectedSummary?.categoryCount ?? 0, "Total categories"],
                      [selectedSummary?.productCount ?? 0, "Products"],
                    ].map(([value, label]) => (
                      <div key={String(label)} className="border-r border-slate-200 p-3 text-center last:border-r-0">
                        <strong className="block text-lg text-slate-950">{String(value)}</strong>
                        <span className="text-[10px] font-semibold text-slate-500">{String(label)}</span>
                      </div>
                    ))}
                  </div>
                </header>
                <div>
                  {(liveChildren.get(selectedDepartment.id) ?? []).length > 0 ? (liveChildren.get(selectedDepartment.id) ?? []).map((item) => (
                    <CategoryBranch key={item.id} item={item} depth={1} childMap={liveChildren} paths={paths} expanded={expanded} duplicateNames={duplicateNames} saving={saving} onToggle={toggle} onEdit={openEdit} onAdd={openNew} onArchive={archive} />
                  )) : <EmptyState title="This department has no groups" description="Add a group such as Cement, Tiles, Wiring or Faucets. Product types can then be placed below it." />}
                </div>
              </>
            ) : <EmptyState title="Select a department" description="Choose a department from the left to manage its category structure." />}
          </div>
        </section>
      )}

      {form ? (
        <CategoryForm
          form={form}
          categories={categories}
          paths={paths}
          blockedParents={blockedParents}
          saving={saving}
          uploading={uploading}
          onChange={setForm}
          onClose={() => setForm(null)}
          onUpload={upload}
          onSave={save}
        />
      ) : null}
    </main>
  )
}

function EmptyState({ title, description, compact = false }: { title: string; description: string; compact?: boolean }) {
  return (
    <div className={compact ? "px-5 py-8 text-center" : "px-6 py-16 text-center"}>
      <Sparkles className="mx-auto size-7 text-slate-300" />
      <h3 className="mt-3 text-sm font-bold text-slate-900">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500">{description}</p>
    </div>
  )
}

type CategoryFormProps = {
  form: FormState
  categories: ManagedCategory[]
  paths: Map<string, string>
  blockedParents: Set<string>
  saving: boolean
  uploading: boolean
  onChange: (form: FormState) => void
  onClose: () => void
  onUpload: (file: File) => Promise<void>
  onSave: () => Promise<void>
}

function CategoryForm({ form, categories, paths, blockedParents, saving, uploading, onChange, onClose, onUpload, onSave }: CategoryFormProps) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/55 p-4 backdrop-blur-sm">
      <div role="dialog" aria-modal="true" aria-labelledby="category-form-title" className="mx-auto my-6 max-w-3xl rounded-3xl bg-white p-5 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">{form.id ? "Edit category" : "Add to catalogue"}</p>
            <h2 id="category-form-title" className="mt-1 text-2xl font-bold">Category details</h2>
            <p className="mt-1 text-sm text-slate-500">Choose the parent to place this item in the correct department.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close category form" className="rounded-xl p-2 hover:bg-slate-100"><X /></button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium">Display name<input value={form.name} onChange={(event) => onChange({ ...form, name: event.target.value })} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3" required /></label>
          <label className="text-sm font-medium">URL path<input value={form.slug} onChange={(event) => onChange({ ...form, slug: event.target.value })} placeholder="Generated automatically if blank" className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3" /></label>
          <label className="text-sm font-medium sm:col-span-2">Place under<select value={form.parentId ?? ""} onChange={(event) => onChange({ ...form, parentId: event.target.value || null })} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3"><option value="">Top-level department</option>{[...categories.filter((item) => !blockedParents.has(item.id))].sort((first, second) => (paths.get(first.id) ?? "").localeCompare(paths.get(second.id) ?? "")).map((item) => <option key={item.id} value={item.id}>{paths.get(item.id)}</option>)}</select></label>
          <label className="text-sm font-medium sm:col-span-2">Short description<textarea value={form.description ?? ""} onChange={(event) => onChange({ ...form, description: event.target.value })} rows={3} className="mt-1.5 w-full rounded-xl border border-slate-200 p-3" /></label>
          <label className="text-sm font-medium">Display order<input type="number" min="0" value={form.sortOrder} onChange={(event) => onChange({ ...form, sortOrder: Number(event.target.value) })} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3" /></label>
          <label className="text-sm font-medium">Icon name<input value={form.icon ?? ""} onChange={(event) => onChange({ ...form, icon: event.target.value })} placeholder="Example: package" className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3" /></label>
          <label className="text-sm font-medium sm:col-span-2">Department image<div className="mt-1.5 flex flex-col gap-2 sm:flex-row"><input value={form.imageUrl ?? ""} onChange={(event) => onChange({ ...form, imageUrl: event.target.value })} placeholder="Durable image URL" className="h-11 flex-1 rounded-xl border border-slate-200 px-3" /><label className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 font-bold"><ImagePlus className="size-4" />{uploading ? "Uploading..." : "Upload image"}<input type="file" accept="image/png,image/jpeg,image/webp,image/avif" className="sr-only" disabled={uploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) void onUpload(file) }} /></label></div></label>
          <label className="text-sm font-medium">SEO title<input value={form.seoTitle ?? ""} onChange={(event) => onChange({ ...form, seoTitle: event.target.value })} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3" /></label>
          <label className="text-sm font-medium">SEO description<input value={form.seoDescription ?? ""} onChange={(event) => onChange({ ...form, seoDescription: event.target.value })} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3" /></label>
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 text-sm font-medium"><input type="checkbox" checked={form.published} onChange={(event) => onChange({ ...form, published: event.target.checked })} /><CheckCircle2 className="size-4 text-emerald-600" /> Visible on storefront</label>
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 text-sm font-medium"><input type="checkbox" checked={form.featured} onChange={(event) => onChange({ ...form, featured: event.target.checked })} /><Sparkles className="size-4 text-amber-500" /> Featured department</label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="h-11 rounded-xl border border-slate-200 px-5 font-bold">Cancel</button>
          <button type="button" onClick={() => void onSave()} disabled={saving || uploading || !form.name.trim()} className="h-11 rounded-xl bg-[#12344a] px-5 font-bold text-white disabled:opacity-50">{saving ? "Saving..." : "Save category"}</button>
        </div>
      </div>
    </div>
  )
}
