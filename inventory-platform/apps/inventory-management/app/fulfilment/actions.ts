"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { inventoryApiUrl, readApiError, requireStaffAccess } from "@/lib/staff-access"

const path = "/fulfilment"
const text = (data: FormData, key: string) => String(data.get(key) ?? "").trim()
const num = (data: FormData, key: string, fallback = 0) => { const value = text(data, key); return value ? Number(value) : fallback }
async function send(endpoint: string, body: unknown) { const { accessToken } = await requireStaffAccess(path); const response = await fetch(`${inventoryApiUrl}/fulfilment-operations/${endpoint}`, { method: "POST", headers: { "content-type": "application/json", Authorization: `Bearer ${accessToken}` }, body: JSON.stringify(body), cache: "no-store" }); if (!response.ok) redirect(`${path}?error=${encodeURIComponent(await readApiError(response))}`); revalidatePath(path); revalidatePath("/inventory-locations"); redirect(`${path}?saved=1`) }

export async function createRequisitionAction(data: FormData) { return send("requisitions", { reason: text(data,"reason"), requiredBy: text(data,"requiredBy") || undefined, internalNotes: text(data,"internalNotes") || undefined, items: [{ variantId: text(data,"variantId"), targetLocationId: text(data,"targetLocationId"), quantity: num(data,"quantity"), unitCode: text(data,"unitCode") }] }) }
export async function submitRequisitionAction(data: FormData) { return send(`requisitions/${text(data,"id")}/submit`, {}) }
export async function decideRequisitionAction(data: FormData) { return send(`requisitions/${text(data,"id")}/decision`, { approve: text(data,"approve") === "true", reason: text(data,"reason") }) }
export async function createRfqAction(data: FormData) { return send(`requisitions/${text(data,"id")}/rfqs`, { responseDueAt: text(data,"responseDueAt") || undefined, notes: text(data,"notes") || undefined }) }
export async function addResponseAction(data: FormData) { const ids=data.getAll("rfqItemId").map(String); return send(`rfqs/${text(data,"id")}/responses`, { supplierId:text(data,"supplierId"), validUntil:text(data,"validUntil"), freightTotal:num(data,"freightTotal"), items:ids.map(id=>({supplierRfqItemId:id,offeredQuantity:num(data,`quantity_${id}`),unitCost:num(data,`cost_${id}`),gstPercent:num(data,`gst_${id}`),leadTimeDays:num(data,`lead_${id}`)})) }) }
export async function createPoAction(data: FormData) { return send(`responses/${text(data,"id")}/purchase-order`, { expectedAt:text(data,"expectedAt")||undefined, paymentTerms:text(data,"paymentTerms")||undefined }) }
export async function decidePoAction(data: FormData) { return send(`purchase-orders/${text(data,"id")}/decision`, { approve:text(data,"approve")==="true", reason:text(data,"reason") }) }
export async function sendPoAction(data: FormData) { return send(`purchase-orders/${text(data,"id")}/send`, {}) }
export async function createGrnAction(data: FormData) { const ids=data.getAll("poItemId").map(String); return send("goods-receipts", { purchaseOrderId:text(data,"id"), fulfilmentLocationId:text(data,"locationId"), receivedAt:text(data,"receivedAt"), items:ids.map(id=>({purchaseOrderItemId:id,receivedQuantity:num(data,`received_${id}`),acceptedQuantity:num(data,`accepted_${id}`),rejectedQuantity:num(data,`rejected_${id}`),damagedQuantity:num(data,`damaged_${id}`),batchNumber:text(data,`batch_${id}`)||undefined})) }) }
export async function postGrnAction(data: FormData) { return send(`goods-receipts/${text(data,"id")}/post`, {}) }
export async function createPickingAction(data: FormData) { return send("picking-lists", { salesOrderId:text(data,"id"), fulfilmentLocationId:text(data,"locationId") }) }
export async function createDispatchAction(data: FormData) { const ids=data.getAll("salesOrderItemId").map(String); return send("dispatches", { salesOrderId:text(data,"salesOrderId"), pickingListId:text(data,"pickingListId"), items:ids.map(id=>({salesOrderItemId:id,quantity:num(data,`quantity_${id}`)})) }) }
export async function postDispatchAction(data: FormData) { return send(`dispatches/${text(data,"id")}/post`, {}) }
export async function deliverAction(data: FormData) { return send(`dispatches/${text(data,"id")}/deliver`, { receivedBy:text(data,"receivedBy"), receivedAt:text(data,"receivedAt"), notes:text(data,"notes")||undefined }) }
export async function createReturnAction(data: FormData) { const ids=data.getAll("salesOrderItemId").map(String); return send("returns", { salesOrderId:text(data,"id"), reason:text(data,"reason"), items:ids.map(id=>({salesOrderItemId:id,requestedQuantity:num(data,`quantity_${id}`)})) }) }
export async function approveReturnAction(data: FormData) { return send(`returns/${text(data,"id")}/approve`, {}) }
export async function receiveReturnAction(data: FormData) { const ids=data.getAll("returnItemId").map(String); return send(`returns/${text(data,"id")}/receive`, { items:ids.map(id=>({returnItemId:id,receivedQuantity:num(data,`quantity_${id}`)})) }) }
export async function inspectReturnAction(data: FormData) { const ids=data.getAll("returnItemId").map(String); return send(`returns/${text(data,"id")}/inspect`, { resolution:text(data,"resolution"), creditAmount:text(data,"creditAmount")?num(data,"creditAmount"):undefined, notes:text(data,"notes")||undefined, items:ids.map(id=>({returnItemId:id,decision:text(data,`decision_${id}`),restockQuantity:num(data,`restock_${id}`),damagedQuantity:num(data,`damaged_${id}`),rejectedQuantity:num(data,`rejected_${id}`)})) }) }
