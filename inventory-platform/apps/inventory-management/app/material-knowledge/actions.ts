"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { inventoryApiUrl, readApiError, requireStaffAccess } from "@/lib/staff-access"

function lines(value: FormDataEntryValue | null): string[] {
  return String(value ?? "").split("\n").map((line) => line.trim()).filter(Boolean)
}

function optionalText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim()
  return text || undefined
}

function optionalPositiveNumber(value: FormDataEntryValue | null, label: string) {
  const text = String(value ?? "").trim()
  if (!text) return null
  const parsed = Number(text)
  if (!Number.isFinite(parsed) || parsed <= 0) throw new Error(`${label} must be a positive number.`)
  return parsed
}

function backTo(productId: string, params: Record<string, string>) {
  const search = new URLSearchParams({ product: productId, ...params })
  redirect(`/material-knowledge?${search.toString()}`)
}

export async function saveMaterialKnowledgeAction(formData: FormData) {
  const productId = String(formData.get("productId") ?? "").trim()
  if (!productId) throw new Error("Missing product.")

  const payload = {
    summary: optionalText(formData.get("summary")),
    useCases: lines(formData.get("useCases")),
    suitableSurfaces: lines(formData.get("suitableSurfaces")),
    unsuitableSurfaces: lines(formData.get("unsuitableSurfaces")),
    preparationSteps: lines(formData.get("preparationSteps")),
    applicationSteps: lines(formData.get("applicationSteps")),
    sequenceNote: optionalText(formData.get("sequenceNote")),
    mixingInstructions: optionalText(formData.get("mixingInstructions")),
    requiredTools: lines(formData.get("requiredTools")),
    coverageValue: optionalPositiveNumber(formData.get("coverageValue"), "Coverage"),
    coverageUnit: optionalText(formData.get("coverageUnit")),
    coverageConditions: optionalText(formData.get("coverageConditions")),
    numberOfCoats: optionalPositiveNumber(formData.get("numberOfCoats"), "Number of coats"),
    dryingCuringInfo: optionalText(formData.get("dryingCuringInfo")),
    safetyPrecautions: lines(formData.get("safetyPrecautions")),
    commonMistakes: lines(formData.get("commonMistakes")),
    professionalTips: lines(formData.get("professionalTips")),
    technicalDataSheetUrl: optionalText(formData.get("technicalDataSheetUrl")),
    sourceUrl: optionalText(formData.get("sourceUrl")),
    sourceTitle: optionalText(formData.get("sourceTitle")),
    sourceRevision: optionalText(formData.get("sourceRevision")),
    reviewNotes: optionalText(formData.get("reviewNotes")),
  }

  const { accessToken } = await requireStaffAccess("/material-knowledge")
  const response = await fetch(`${inventoryApiUrl}/material-knowledge/${encodeURIComponent(productId)}`, {
    method: "PUT",
    headers: { "content-type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(payload),
    cache: "no-store",
  })
  if (!response.ok) backTo(productId, { error: await readApiError(response) })

  revalidatePath("/material-knowledge")
  backTo(productId, { saved: "1" })
}

export async function publishMaterialKnowledgeAction(formData: FormData) {
  const productId = String(formData.get("productId") ?? "").trim()
  if (!productId) throw new Error("Missing product.")

  const { accessToken } = await requireStaffAccess("/material-knowledge")
  const response = await fetch(`${inventoryApiUrl}/material-knowledge/${encodeURIComponent(productId)}/publish`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  })
  if (!response.ok) backTo(productId, { error: await readApiError(response) })

  revalidatePath("/material-knowledge")
  backTo(productId, { saved: "1" })
}

export async function archiveMaterialKnowledgeAction(formData: FormData) {
  const productId = String(formData.get("productId") ?? "").trim()
  if (!productId) throw new Error("Missing product.")

  const { accessToken } = await requireStaffAccess("/material-knowledge")
  const response = await fetch(`${inventoryApiUrl}/material-knowledge/${encodeURIComponent(productId)}/archive`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  })
  if (!response.ok) backTo(productId, { error: await readApiError(response) })

  revalidatePath("/material-knowledge")
  backTo(productId, { saved: "1" })
}

export async function replaceRelatedMaterialsAction(formData: FormData) {
  const productId = String(formData.get("productId") ?? "").trim()
  if (!productId) throw new Error("Missing product.")

  let items: unknown
  try {
    items = JSON.parse(String(formData.get("items") ?? "[]"))
  } catch {
    throw new Error("Invalid related materials payload.")
  }

  const { accessToken } = await requireStaffAccess("/material-knowledge")
  const response = await fetch(`${inventoryApiUrl}/material-knowledge/${encodeURIComponent(productId)}/related`, {
    method: "PUT",
    headers: { "content-type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ items }),
    cache: "no-store",
  })
  if (!response.ok) backTo(productId, { error: await readApiError(response) })

  revalidatePath("/material-knowledge")
  backTo(productId, { saved: "1" })
}
