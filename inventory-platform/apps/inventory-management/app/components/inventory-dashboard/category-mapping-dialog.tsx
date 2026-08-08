"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ArrowDown, ArrowUp, EyeOff, Loader2, X } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { toast } from "@workspace/ui/components/sonner"
import { trpcClient } from "@/lib/trpc/client"
import type { CategoryNode } from "./types"

export type MappingOwner = { kind: "rooms" | "stages"; id: string; name: string }

type CategoryMappingDialogProps = {
  owner: MappingOwner | null
  categories: CategoryNode[]
  onClose: () => void
  runWithAccessToken: <T,>(operation: (accessToken: string) => Promise<T>) => Promise<T>
}

// Included categories are ordered, so they are a list. Exclusions are a set:
// order is meaningless for something being hidden.
type Draft = { includes: string[]; excludes: Set<string> }

export function CategoryMappingDialog({
  owner,
  categories,
  onClose,
  runWithAccessToken,
}: CategoryMappingDialogProps) {
  const [draft, setDraft] = useState<Draft>({ includes: [], excludes: new Set() })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [search, setSearch] = useState("")
  const [error, setError] = useState<string | null>(null)

  const byId = useMemo(() => new Map(categories.map((node) => [node.id, node])), [categories])
  const roots = useMemo(
    () => categories.filter((node) => !node.parentId).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    [categories],
  )

  const pathOf = useCallback(
    (id: string) => {
      const parts: string[] = []
      let cursor = byId.get(id)
      const seen = new Set<string>()
      while (cursor && !seen.has(cursor.id)) {
        seen.add(cursor.id)
        parts.unshift(cursor.name)
        cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined
      }
      return parts.join(" > ")
    },
    [byId],
  )

  useEffect(() => {
    if (!owner) return
    let cancelled = false
    setIsLoading(true)
    setError(null)
    setSearch("")
    trpcClient.getTaxonomyLinks
      .query({ owner: owner.kind, ownerId: owner.id })
      .then((links) => {
        if (cancelled) return
        const includes = links
          .filter((link) => link.mode === "INCLUDE")
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((link) => link.categoryId)
        const excludes = new Set(links.filter((link) => link.mode === "EXCLUDE").map((link) => link.categoryId))
        setDraft({ includes, excludes })
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        setError(cause instanceof Error ? cause.message : "Unable to load the current mapping.")
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [owner])

  const included = draft.includes.filter((id) => byId.has(id))
  const available = roots.filter(
    (node) => !included.includes(node.id) && node.name.toLowerCase().includes(search.trim().toLowerCase()),
  )

  // Only descendants of an included department are worth excluding; anything
  // else is already invisible to this room.
  const excludableDescendants = useMemo(() => {
    const out: CategoryNode[] = []
    const walk = (parentId: string) => {
      for (const node of categories.filter((candidate) => candidate.parentId === parentId)) {
        out.push(node)
        walk(node.id)
      }
    }
    included.forEach(walk)
    return out.sort((a, b) => pathOf(a.id).localeCompare(pathOf(b.id)))
  }, [categories, included, pathOf])

  function move(index: number, delta: number) {
    setDraft((current) => {
      const next = [...current.includes]
      const target = index + delta
      if (target < 0 || target >= next.length) return current
      const [moved] = next.splice(index, 1)
      next.splice(target, 0, moved!)
      return { ...current, includes: next }
    })
  }

  function toggleExclude(categoryId: string) {
    setDraft((current) => {
      const excludes = new Set(current.excludes)
      if (excludes.has(categoryId)) excludes.delete(categoryId)
      else excludes.add(categoryId)
      return { ...current, excludes }
    })
  }

  async function save() {
    if (!owner) return
    setIsSaving(true)
    setError(null)
    try {
      // Excludes are dropped if their department is no longer included,
      // otherwise the API rejects the whole payload as contradictory.
      const keptExcludes = [...draft.excludes].filter((id) => excludableDescendants.some((node) => node.id === id))
      await runWithAccessToken((accessToken) =>
        trpcClient.replaceTaxonomyLinks.mutate({
          owner: owner.kind,
          ownerId: owner.id,
          includes: included.map((categoryId, index) => ({ categoryId, sortOrder: (index + 1) * 10 })),
          excludes: keptExcludes,
          accessToken,
        }),
      )
      toast.success(`Saved the category mapping for ${owner.name}.`)
      onClose()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Saving the mapping failed.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={Boolean(owner)} onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Categories shown for {owner?.name}</DialogTitle>
          <DialogDescription>
            Choose which departments a shopper sees after picking {owner?.name}, and in what order. Subcategories
            follow automatically, so add a new one to the catalogue and it appears here without further work.
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        ) : null}

        {isLoading ? (
          <p className="flex items-center gap-2 py-8 text-sm text-slate-600">
            <Loader2 className="size-4 animate-spin" />
            Loading the current mapping...
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-slate-950">Shown, in order ({included.length})</h3>
              {included.length === 0 ? (
                <p className="rounded-md border border-dashed border-slate-300 px-3 py-6 text-center text-sm text-slate-500">
                  Nothing mapped yet. A shopper choosing {owner?.name} would see no departments.
                </p>
              ) : (
                <ul className="space-y-1">
                  {included.map((id, index) => (
                    <li
                      key={id}
                      className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                    >
                      <span className="w-6 text-xs text-slate-500">{index + 1}</span>
                      <span className="flex-1 text-slate-900">{byId.get(id)?.name ?? id}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Move ${byId.get(id)?.name ?? id} up`}
                        disabled={index === 0}
                        onClick={() => move(index, -1)}
                      >
                        <ArrowUp className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Move ${byId.get(id)?.name ?? id} down`}
                        disabled={index === included.length - 1}
                        onClick={() => move(index, 1)}
                      >
                        <ArrowDown className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Remove ${byId.get(id)?.name ?? id}`}
                        onClick={() =>
                          setDraft((current) => ({ ...current, includes: current.includes.filter((value) => value !== id) }))
                        }
                      >
                        <X className="size-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-slate-950">Add a department</h3>
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search departments..."
                aria-label="Search departments"
                className="h-9 border-slate-300 bg-white"
              />
              <ul className="max-h-48 space-y-1 overflow-y-auto">
                {available.length === 0 ? (
                  <li className="px-3 py-2 text-sm text-slate-500">Nothing else to add.</li>
                ) : (
                  available.map((node) => (
                    <li key={node.id}>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-sm hover:bg-slate-50"
                        onClick={() =>
                          setDraft((current) => ({ ...current, includes: [...current.includes, node.id] }))
                        }
                      >
                        <span className="text-slate-900">{node.name}</span>
                        <span className="text-xs text-slate-500">
                          {node.published ? `${node._count?.products ?? 0} products` : "unpublished"}
                        </span>
                      </button>
                    </li>
                  ))
                )}
              </ul>

              {excludableDescendants.length > 0 ? (
                <div className="pt-2">
                  <h3 className="flex items-center gap-1.5 text-sm font-medium text-slate-950">
                    <EyeOff className="size-3.5" />
                    Hide specific subcategories ({draft.excludes.size})
                  </h3>
                  <p className="pb-1 text-xs text-slate-600">
                    Everything below a shown department appears by default. Hide only what does not belong here.
                  </p>
                  <ul className="max-h-40 space-y-1 overflow-y-auto">
                    {excludableDescendants.map((node) => (
                      <li key={node.id}>
                        <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-xs hover:bg-slate-50">
                          <input
                            type="checkbox"
                            checked={draft.excludes.has(node.id)}
                            onChange={() => toggleExclude(node.id)}
                          />
                          <span className={draft.excludes.has(node.id) ? "text-slate-400 line-through" : "text-slate-700"}>
                            {pathOf(node.id)}
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        )}

        <DialogFooter showCloseButton>
          <Button
            type="button"
            className="bg-slate-950 text-white hover:bg-slate-800"
            onClick={save}
            disabled={isSaving || isLoading}
          >
            {isSaving ? "Saving..." : "Save mapping"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
