"use server"

import { InventoryLedgerType, StockCountStatus, StockTransferStatus } from "@workspace/db"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { inventoryApiUrl, readApiError, requireStaffAccess } from "@/lib/staff-access"

const returnPath = "/inventory-locations"

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim()
}

function integer(formData: FormData, key: string, fallback = 0) {
  const value = Number(formData.get(key) ?? fallback)
  if (!Number.isInteger(value)) throw new Error(`${key} must be a whole number.`)
  return value
}

function optionalNumber(formData: FormData, key: string) {
  const raw = text(formData, key)
  return raw ? Number(raw) : undefined
}

async function send(endpoint: string, method: "POST" | "PATCH", body: unknown) {
  const { accessToken } = await requireStaffAccess(returnPath)
  const response = await fetch(`${inventoryApiUrl}/inventory-locations/${endpoint}`, {
    method,
    headers: { "content-type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(body),
    cache: "no-store",
  })
  if (!response.ok) redirect(`${returnPath}?error=${encodeURIComponent(await readApiError(response))}`)
  revalidatePath(returnPath)
  redirect(`${returnPath}?saved=1`)
}

export async function createWarehouseAction(formData: FormData) {
  return send("warehouses", "POST", {
    code: text(formData, "code"), name: text(formData, "name"), address: text(formData, "address") || undefined,
    city: text(formData, "city"), state: text(formData, "state"), pincode: text(formData, "pincode"),
    locationCode: text(formData, "locationCode") || "MAIN", locationName: text(formData, "locationName") || "Main storage",
  })
}

export async function createWarehouseLocationAction(formData: FormData) {
  return send("warehouse-locations", "POST", {
    warehouseId: text(formData, "warehouseId"), code: text(formData, "code"), name: text(formData, "name"), zone: text(formData, "zone") || undefined,
  })
}

export async function createServiceAreaAction(formData: FormData) {
  const pincodes = text(formData, "pincodes").split(/[\s,]+/).map((item) => item.trim()).filter(Boolean)
  return send("service-areas", "POST", {
    code: text(formData, "code"), name: text(formData, "name"), city: text(formData, "city"), state: text(formData, "state"), pincodes,
  })
}

export async function addPincodesAction(formData: FormData) {
  const pincodes = text(formData, "pincodes").split(/[\s,]+/).map((item) => item.trim()).filter(Boolean)
  return send("pincodes", "POST", { serviceAreaId: text(formData, "serviceAreaId"), pincodes })
}

export async function createUnitAction(formData: FormData) {
  return send("units", "POST", {
    code: text(formData, "code"), name: text(formData, "name"), symbol: text(formData, "symbol"), dimension: text(formData, "dimension") || undefined,
  })
}

export async function createUnitConversionAction(formData: FormData) {
  return send("unit-conversions", "POST", {
    fromUnitId: text(formData, "fromUnitId"), toUnitId: text(formData, "toUnitId"), multiplier: optionalNumber(formData, "multiplier"),
  })
}

export async function linkServiceAreaAction(formData: FormData) {
  return send("service-area-links", "POST", {
    fulfilmentLocationId: text(formData, "fulfilmentLocationId"), serviceAreaId: text(formData, "serviceAreaId"),
    deliveryCharge: optionalNumber(formData, "deliveryCharge"), minimumOrderValue: optionalNumber(formData, "minimumOrderValue"), estimatedLeadDays: integer(formData, "estimatedLeadDays", 2),
  })
}

export async function adjustLocationBalanceAction(formData: FormData) {
  return send("balances/adjustments", "POST", {
    variantId: text(formData, "variantId"), fulfilmentLocationId: text(formData, "fulfilmentLocationId"), warehouseLocationId: text(formData, "warehouseLocationId") || undefined,
    physicalDelta: integer(formData, "physicalDelta"), reservedDelta: integer(formData, "reservedDelta"), blockedDelta: integer(formData, "blockedDelta"),
    damagedDelta: integer(formData, "damagedDelta"), quarantineDelta: integer(formData, "quarantineDelta"), inTransitDelta: integer(formData, "inTransitDelta"),
    lowStockThreshold: optionalNumber(formData, "lowStockThreshold"), type: (text(formData, "type") || InventoryLedgerType.ADJUSTMENT) as InventoryLedgerType,
    reason: text(formData, "reason"), reference: text(formData, "reference") || undefined,
  })
}

export async function createReservationAction(formData: FormData) {
  return send("reservations", "POST", {
    reference: text(formData, "reference"), variantId: text(formData, "variantId"), fulfilmentLocationId: text(formData, "fulfilmentLocationId"),
    quantity: integer(formData, "quantity"), expiresAt: text(formData, "expiresAt") || undefined, notes: text(formData, "notes") || undefined,
  })
}

export async function releaseReservationAction(formData: FormData) {
  return send(`reservations/${encodeURIComponent(text(formData, "id"))}/release`, "PATCH", {})
}

export async function createTransferAction(formData: FormData) {
  return send("transfers", "POST", {
    reference: text(formData, "reference"), originLocationId: text(formData, "originLocationId"), destinationLocationId: text(formData, "destinationLocationId"),
    notes: text(formData, "notes") || undefined, items: [{ variantId: text(formData, "variantId"), quantity: integer(formData, "quantity") }],
  })
}

export async function transitionTransferAction(formData: FormData) {
  return send(`transfers/${encodeURIComponent(text(formData, "id"))}/status`, "PATCH", { status: text(formData, "status") as StockTransferStatus })
}

export async function createStockCountAction(formData: FormData) {
  return send("stock-counts", "POST", {
    reference: text(formData, "reference"), fulfilmentLocationId: text(formData, "fulfilmentLocationId"), notes: text(formData, "notes") || undefined,
    items: [{ variantId: text(formData, "variantId"), countedQuantity: integer(formData, "countedQuantity") }],
  })
}

export async function transitionStockCountAction(formData: FormData) {
  return send(`stock-counts/${encodeURIComponent(text(formData, "id"))}/status`, "PATCH", { status: text(formData, "status") as StockCountStatus })
}

export async function createSupplierProductAction(formData: FormData) {
  return send("supplier-products", "POST", {
    supplierId: text(formData, "supplierId"), variantId: text(formData, "variantId"), supplierSku: text(formData, "supplierSku") || undefined,
    fulfilmentMode: text(formData, "fulfilmentMode"), price: optionalNumber(formData, "price"), minimumQuantity: integer(formData, "minimumQuantity", 1),
    minimumDays: optionalNumber(formData, "minimumDays"), maximumDays: optionalNumber(formData, "maximumDays"), serviceAreaId: text(formData, "serviceAreaId") || undefined,
  })
}

export async function createDealerAction(formData: FormData) {
  return send("dealers", "POST", {
    code: text(formData, "code"), name: text(formData, "name"), email: text(formData, "email") || undefined, phone: text(formData, "phone") || undefined,
    address: text(formData, "address") || undefined, city: text(formData, "city"), state: text(formData, "state"), pincode: text(formData, "pincode"),
  })
}

export async function createDealerProductAction(formData: FormData) {
  return send("dealer-products", "POST", {
    dealerId: text(formData, "dealerId"), variantId: text(formData, "variantId"), price: optionalNumber(formData, "price"),
    reportedQuantity: optionalNumber(formData, "reportedQuantity"), leadTimeDays: integer(formData, "leadTimeDays", 2),
  })
}

export async function createDealerServiceAreaAction(formData: FormData) {
  return send("dealer-service-areas", "POST", {
    dealerId: text(formData, "dealerId"), serviceAreaId: text(formData, "serviceAreaId"),
    deliveryCharge: optionalNumber(formData, "deliveryCharge"), minimumOrderValue: optionalNumber(formData, "minimumOrderValue"),
    estimatedLeadDays: integer(formData, "estimatedLeadDays", 2),
  })
}

export async function createCarrierAction(formData: FormData) {
  return send("carriers", "POST", { code: text(formData, "code"), name: text(formData, "name"), email: text(formData, "email") || undefined, phone: text(formData, "phone") || undefined })
}

export async function createCarrierServiceAreaAction(formData: FormData) {
  return send("carrier-service-areas", "POST", {
    carrierId: text(formData, "carrierId"), serviceAreaId: text(formData, "serviceAreaId"),
    baseCharge: optionalNumber(formData, "baseCharge"), perKmCharge: optionalNumber(formData, "perKmCharge"),
  })
}
