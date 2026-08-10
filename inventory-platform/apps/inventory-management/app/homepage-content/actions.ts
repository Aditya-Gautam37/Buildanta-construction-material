"use server"

import { revalidatePath } from "next/cache"
import { prisma, UserRole } from "@workspace/db"
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"
import type { HomepageProductPlacement, HomepageSlideDraft, HomepageSlideRecord } from "@/lib/homepage-content"

async function requireStaff() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Authentication required.")
  const staff = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
  if (!staff || (staff.role !== UserRole.ADMIN && staff.role !== UserRole.DATA_ENTRY)) {
    throw new Error("Inventory staff access is required.")
  }
}

function optional(value: string | null | undefined) {
  return value?.trim() || null
}

function imageUrl(value: string) {
  try {
    const parsed = new URL(value)
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") throw new Error()
    return parsed.toString()
  } catch {
    throw new Error("Upload a valid slide image.")
  }
}

function link(value: string | null | undefined) {
  const cleaned = optional(value)
  if (!cleaned) return null
  if (cleaned.startsWith("/") && !cleaned.startsWith("//")) return cleaned
  try {
    const parsed = new URL(cleaned)
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") throw new Error()
    return parsed.toString()
  } catch {
    throw new Error("The button link must start with / or be a valid web address.")
  }
}

function serializeSlide(record: { id: string; title: string; subtitle: string | null; imageUrl: string; altText: string; ctaLabel: string | null; ctaHref: string | null; active: boolean; sortOrder: number; updatedAt: Date }): HomepageSlideRecord {
  return { ...record, updatedAt: record.updatedAt.toISOString() }
}

function serializePlacement(record: { id: string; productId: string; badge: string | null; sortOrder: number; product: { id: string; name: string; brand: { name: string } } }): HomepageProductPlacement {
  return { id: record.id, productId: record.productId, badge: record.badge, sortOrder: record.sortOrder, product: { id: record.product.id, name: record.product.name, brand: record.product.brand.name } }
}

export async function saveHomepageSlideAction(input: HomepageSlideDraft) {
  try {
    await requireStaff()
    const title = input.title.trim()
    // Title and image description are optional: an image-only slide is a valid
    // choice. Alt text still matters for screen readers and SEO, so when it is
    // left blank we fall back to the title, then to a generic banner label,
    // rather than storing nothing.
    const altText = input.altText.trim() || title || "Buildanta homepage banner"
    const data = {
      title,
      subtitle: optional(input.subtitle),
      imageUrl: imageUrl(input.imageUrl),
      altText,
      ctaLabel: optional(input.ctaLabel),
      ctaHref: link(input.ctaHref),
      active: Boolean(input.active),
      sortOrder: Number.isInteger(input.sortOrder) ? input.sortOrder : 0,
    }
    if (data.ctaLabel && !data.ctaHref) throw new Error("Add a destination for the slide button.")
    const slide = input.id
      ? await prisma.homepageSlide.update({ where: { id: input.id }, data })
      : await prisma.homepageSlide.create({ data })
    revalidatePath("/homepage-content")
    return { ok: true as const, slide: serializeSlide(slide) }
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Unable to save slide." }
  }
}

export async function deleteHomepageSlideAction(id: string) {
  try {
    await requireStaff()
    await prisma.homepageSlide.delete({ where: { id } })
    revalidatePath("/homepage-content")
    return { ok: true as const }
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Unable to delete slide." }
  }
}

export async function addHomepageProductAction(productId: string) {
  try {
    await requireStaff()
    const [count, last] = await Promise.all([
      prisma.homepageProduct.count(),
      prisma.homepageProduct.findFirst({ orderBy: { sortOrder: "desc" }, select: { sortOrder: true } }),
    ])
    if (count >= 12) throw new Error("The homepage can feature up to 12 products.")
    const placement = await prisma.homepageProduct.create({
      data: { productId, sortOrder: (last?.sortOrder ?? -1) + 1 },
      include: { product: { include: { brand: true } } },
    })
    revalidatePath("/homepage-content")
    return { ok: true as const, placement: serializePlacement(placement) }
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : ""
    return { ok: false as const, error: code === "P2002" ? "That product is already featured." : error instanceof Error ? error.message : "Unable to feature product." }
  }
}

export async function removeHomepageProductAction(id: string) {
  try {
    await requireStaff()
    await prisma.homepageProduct.delete({ where: { id } })
    revalidatePath("/homepage-content")
    return { ok: true as const }
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Unable to remove product." }
  }
}

export async function reorderHomepageProductsAction(ids: string[]) {
  try {
    await requireStaff()
    const unique = [...new Set(ids)]
    if (unique.length !== ids.length || ids.length > 12) throw new Error("Invalid product order.")
    await prisma.$transaction(ids.map((id, sortOrder) => prisma.homepageProduct.update({ where: { id }, data: { sortOrder } })))
    revalidatePath("/homepage-content")
    return { ok: true as const }
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Unable to reorder products." }
  }
}
