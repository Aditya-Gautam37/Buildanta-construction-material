"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { customerPortalMutation } from "../customer-portal";

function message(error:unknown){return error instanceof Error?error.message:"The request could not be completed."}
export async function bookCompleteBoq(form:FormData){let target="/account?notice=Complete%20BOQ%20booked.%20Your%20sales%20order%20and%20stock%20reservation%20are%20ready.";try{await customerPortalMutation(`quotations/${String(form.get("quotationId"))}/book`)}catch(error){target=`/account?error=${encodeURIComponent(message(error))}`}revalidatePath("/account");redirect(target)}
export async function cancelOrder(form:FormData){let target="/account?notice=Order%20cancelled%20and%20stock%20released.";try{await customerPortalMutation(`sales-orders/${String(form.get("orderId"))}/cancel`,{reason:String(form.get("reason")||"")})}catch(error){target=`/account?error=${encodeURIComponent(message(error))}`}revalidatePath("/account");redirect(target)}
export async function requestReturn(form:FormData){let target="/account?notice=Return%20request%20submitted.";try{const items=[...form.entries()].filter(([key])=>key.startsWith("quantity:")).map(([key,value])=>({salesOrderItemId:key.slice(9),quantity:Number(value)})).filter(item=>Number.isInteger(item.quantity)&&item.quantity>0);await customerPortalMutation(`sales-orders/${String(form.get("orderId"))}/returns`,{reason:String(form.get("reason")||""),items})}catch(error){target=`/account?error=${encodeURIComponent(message(error))}`}revalidatePath("/account");redirect(target)}
