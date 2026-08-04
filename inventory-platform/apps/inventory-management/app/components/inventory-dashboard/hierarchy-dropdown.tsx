"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Check, ChevronDown } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { Input } from "@workspace/ui/components/input"
import type { HierarchyOption } from "./types"

export function HierarchyDropdown({
  label,
  placeholder,
  options,
  selectedIds,
  onChange,
  multiple = false,
}: {
  label: string
  placeholder: string
  options: HierarchyOption[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  multiple?: boolean
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState("")

  const selected = useMemo(
    () => options.filter((option) => selectedIds.includes(option.id)),
    [options, selectedIds]
  )

  const filtered = useMemo(() => {
    const normalized = search.trim().toLowerCase()
    if (!normalized) {
      return options
    }

    return options.filter((option) => option.path.toLowerCase().includes(normalized))
  }, [options, search])

  function toggle(id: string) {
    if (!multiple) {
      onChange([id])
      setIsOpen(false)
      return
    }

    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((value) => value !== id))
      setIsOpen(false)
      return
    }

    onChange([...selectedIds, id])
    setIsOpen(false)
  }

  useEffect(() => {
    if (!isOpen) {
      return
    }

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current) {
        return
      }

      if (!containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false)
      }
    }

    window.addEventListener("mousedown", handlePointerDown)
    window.addEventListener("keydown", handleEscape)

    return () => {
      window.removeEventListener("mousedown", handlePointerDown)
      window.removeEventListener("keydown", handleEscape)
    }
  }, [isOpen])

  return (
    <div ref={containerRef} className="space-y-1">
      <label className="text-xs font-medium text-slate-600">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          className="flex h-10 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 text-left text-sm text-slate-900"
        >
          <span className="truncate">
            {selected.length > 0
              ? selected
                  .slice(0, 2)
                  .map((item) => item.name)
                  .join(", ") + (selected.length > 2 ? ` +${selected.length - 2}` : "")
              : placeholder}
          </span>
          <ChevronDown className="size-4 text-slate-500" />
        </button>

        {isOpen ? (
          <div className="absolute z-30 mt-2 w-full rounded-md border border-slate-200 bg-white p-2 shadow-lg">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={`Search ${label.toLowerCase()}`}
              aria-label={`Search ${label.toLowerCase()}`}
              className="h-9 border-slate-300"
            />
            <div className="mt-2 max-h-56 overflow-auto rounded-md border border-slate-200">
              {filtered.length === 0 ? (
                <p className="px-3 py-2 text-xs text-slate-500">No matches</p>
              ) : (
                filtered.map((option) => {
                  const selectedItem = selectedIds.includes(option.id)

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => toggle(option.id)}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50"
                      style={{ paddingLeft: `${option.depth * 16 + 12}px` }}
                    >
                      <span className="truncate text-slate-800">{option.path}</span>
                      {selectedItem ? <Check className="size-4 text-slate-900" /> : null}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        ) : null}
      </div>
      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {selected.map((option) => (
            <Badge key={option.id} variant="outline" className="border-slate-300 bg-slate-50 text-slate-700">
              {option.path}
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  )
}
