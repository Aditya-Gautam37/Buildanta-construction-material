"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { inventoryApiUrl, readApiError, requireStaffAccess } from "@/lib/staff-access"

const returnPath = "/calculators"

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim()
}

function number(formData: FormData, key: string, fallback?: number) {
  const raw = text(formData, key)
  if (!raw && fallback !== undefined) return fallback
  const value = Number(raw)
  if (!Number.isFinite(value)) throw new Error(`${key} must be a valid number.`)
  return value
}

async function send(endpoint: string, method: "POST" | "PATCH", body: unknown) {
  const { accessToken } = await requireStaffAccess(returnPath)
  const response = await fetch(`${inventoryApiUrl}/calculators/admin/${endpoint}`, {
    method,
    headers: { "content-type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(body),
    cache: "no-store",
  })
  if (!response.ok) redirect(`${returnPath}?error=${encodeURIComponent(await readApiError(response))}`)
  revalidatePath(returnPath)
  redirect(`${returnPath}?saved=1`)
}

export async function createDefinitionAction(formData: FormData) {
  return send("definitions", "POST", {
    name: text(formData, "name"),
    slug: text(formData, "slug"),
    type: text(formData, "type"),
    description: text(formData, "description"),
    instructions: text(formData, "instructions") || undefined,
    icon: text(formData, "icon") || undefined,
    disclaimer: text(formData, "disclaimer"),
    status: "DRAFT",
    sortOrder: number(formData, "sortOrder", 0),
  })
}

export async function createVersionAction(formData: FormData) {
  let configuration: Record<string, unknown>
  try {
    configuration = JSON.parse(text(formData, "configuration")) as Record<string, unknown>
  } catch {
    redirect(`${returnPath}?error=${encodeURIComponent("Configuration must be valid JSON.")}`)
  }
  return send(`definitions/${encodeURIComponent(text(formData, "definitionId"))}/versions`, "POST", {
    formulaKey: text(formData, "formulaKey"),
    configuration: configuration!,
    reason: text(formData, "reason"),
  })
}

export async function upsertMappingAction(formData: FormData) {
  const productId = text(formData, "productId") || undefined
  const variantId = text(formData, "variantId") || undefined
  const categoryId = text(formData, "categoryId") || undefined
  return send(`versions/${encodeURIComponent(text(formData, "versionId"))}/mappings`, "POST", {
    outputKey: text(formData, "outputKey"),
    qualityTier: text(formData, "qualityTier") || "STANDARD",
    categoryId,
    productId,
    variantId,
    expectedUnit: text(formData, "expectedUnit"),
    conversionFactor: number(formData, "conversionFactor", 1),
    packageSize: text(formData, "packageSize") ? number(formData, "packageSize") : undefined,
    priority: number(formData, "priority", 0),
    preferred: formData.get("preferred") === "on",
    active: true,
  })
}

export async function publishVersionAction(formData: FormData) {
  return send(`versions/${encodeURIComponent(text(formData, "versionId"))}/publish`, "POST", {
    reason: text(formData, "reason"),
  })
}
