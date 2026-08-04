"use client"

import { ChevronDown, ChevronRight, FolderTree, Pencil, Plus, Trash2 } from "lucide-react"
import { useState, type ReactNode } from "react"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"

type TaxonomyNode = {
  id: string
  name: string
  slug: string
  parentId: string | null
}

export function TaxonomyTree({
  itemsByParent,
  itemCounts,
  deletingId,
  isCreating,
  emptyMessage,
  onEdit,
  onAddChild,
  onDelete,
}: {
  itemsByParent: Map<string | null, TaxonomyNode[]>
  itemCounts: Map<string, number>
  deletingId: string | null
  isCreating: boolean
  emptyMessage: string
  onEdit: (node: TaxonomyNode) => void
  onAddChild: (node: TaxonomyNode) => void
  onDelete: (node: TaxonomyNode) => void
}) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set())

  function toggleExpanded(id: string) {
    setExpandedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function renderRows(parentId: string | null, depth = 0): ReactNode {
    const rows = itemsByParent.get(parentId) ?? []

    if (rows.length === 0) {
      if (depth === 0) {
        return (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
            {emptyMessage}
          </div>
        )
      }

      return null
    }

    return (
      <ul className={depth === 0 ? "space-y-2" : "mt-2 space-y-2"}>
        {rows.map((node) => {
          const hasChildren = (itemsByParent.get(node.id)?.length ?? 0) > 0
          const childCount = itemsByParent.get(node.id)?.length ?? 0
          const deleting = deletingId === node.id
          const isExpanded = expandedIds.has(node.id)
          const childRows = hasChildren && isExpanded ? renderRows(node.id, depth + 1) : null
          const itemCount = itemCounts.get(node.name) ?? 0

          return (
            <li key={node.id}>
              <div
                className={`flex items-center justify-between gap-3 rounded-2xl border px-3 py-2.5 transition ${
                  depth === 0
                    ? "border-slate-200 bg-white shadow-[0_7px_24px_rgba(15,23,42,0.05)] hover:border-emerald-200"
                    : "border-slate-200/80 bg-slate-50/80 hover:bg-white"
                }`}
                style={{ marginLeft: `${Math.min(depth, 4) * 16}px` }}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  {hasChildren ? (
                    <button
                      type="button"
                      onClick={() => toggleExpanded(node.id)}
                      className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100"
                      aria-label={`${isExpanded ? "Collapse" : "Expand"} ${node.name}`}
                      aria-expanded={isExpanded}
                    >
                      {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                    </button>
                  ) : (
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                      <FolderTree className="size-3.5" />
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{node.name}</p>
                    <p className="truncate text-xs text-slate-500">/{node.slug}</p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  {hasChildren ? (
                    <Badge variant="outline" className="hidden border-emerald-200 bg-emerald-50 text-emerald-700 sm:inline-flex">
                      {childCount} child{childCount === 1 ? "" : "ren"}
                    </Badge>
                  ) : null}
                  <Badge variant="outline" className="hidden border-slate-300 bg-slate-50 text-slate-700 md:inline-flex">
                    {itemCount} items
                  </Badge>

                  <Button
                    type="button"
                    size="icon-sm"
                    variant="outline"
                    className="border-slate-300 bg-white text-slate-700"
                    onClick={() => onEdit(node)}
                    title={`Edit ${node.name}`}
                  >
                    <Pencil className="size-4" />
                  </Button>

                  <Button
                    type="button"
                    size="icon-sm"
                    variant="outline"
                    className="border-slate-300 bg-white text-slate-700"
                    onClick={() => onAddChild(node)}
                    title="Add child"
                  >
                    <Plus className="size-4" />
                  </Button>

                  <Button
                    type="button"
                    size="icon-sm"
                    variant="outline"
                    className="border-rose-200 bg-white text-rose-700 hover:bg-rose-50"
                    onClick={() => onDelete(node)}
                    disabled={deleting || isCreating}
                    title={hasChildren ? "Delete (children must be removed first)" : "Delete"}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>

              {childRows}
            </li>
          )
        })}
      </ul>
    )
  }

  return <>{renderRows(null)}</>
}
