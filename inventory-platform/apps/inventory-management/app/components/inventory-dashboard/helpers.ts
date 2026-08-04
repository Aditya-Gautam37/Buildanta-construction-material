import type { HierarchyOption } from "./types"

export function formatPrice(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value)
}

export function flattenHierarchyOptions<T extends { id: string; name: string }>(
  grouped: Map<string | null, T[]>,
  parentId: string | null = null,
  depth = 0,
  lineage: string[] = []
): HierarchyOption[] {
  const items = grouped.get(parentId) ?? []
  const output: HierarchyOption[] = []

  items.forEach((item) => {
    const nextLineage = [...lineage, item.name]
    output.push({
      id: item.id,
      name: item.name,
      depth,
      path: nextLineage.join(" / "),
    })

    output.push(...flattenHierarchyOptions(grouped, item.id, depth + 1, nextLineage))
  })

  return output
}
