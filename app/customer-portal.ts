import "server-only";
import { getCustomerAccessToken } from "./customer-auth";

const DEFAULT_API_URL = process.env.NODE_ENV === "development"
  ? "http://localhost:5173"
  : "https://buildanta-api.vercel.app";

const API = (
  process.env.INVENTORY_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  DEFAULT_API_URL
).replace(/\/$/, "");
export type CustomerPortal={quotations:{id:string;reference:string;status:string;deliveryPincode:string;expiresAt:string|null;createdAt:string;items:{id:string;description:string;quantity:string|number;unitCode:string}[];revisions:{number:number;validUntil:string;subtotal:string|number;gstTotal:string|number;freightTotal:string|number;discountTotal:string|number;grandTotal:string|number;sentAt:string|null;items:{description:string;quantity:string|number;unitCode:string;unitPrice:string|number;gstPercent:string|number;lineTotal:string|number;estimatedLeadDays:number|null}[]}[];history:{toStatus:string;createdAt:string}[];salesOrder:null|{id:string;reference:string;status:string;paymentStatus:string;grandTotal:string|number;reservedUntil:string|null;createdAt:string;items:{id:string;description:string;quantity:number;unitCode:string}[];deliverySchedules:{status:string;scheduledFor:string}[];dispatches:{reference:string;status:string;trackingReference:string|null;dispatchedAt:string|null;deliveredAt:string|null;history:{toStatus:string;createdAt:string}[]}[];returnRequests:{reference:string;status:string;requestedAt:string;resolvedAt:string|null}[]}}[]};

export async function getCustomerPortal():Promise<{data:CustomerPortal|null;error:string|null}>{
  const token=await getCustomerAccessToken();if(!token)return {data:null,error:"Your customer session has expired."};
  try {
    const response = await fetch(`${API}/customer-portal`, {
      headers: { authorization: `Bearer ${token}`, accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) {
      return { data: null, error: "Your quotation and order history could not be loaded." };
    }
    const data = await response.json().catch(() => null) as CustomerPortal | null;
    if (!data || !Array.isArray(data.quotations)) {
      return { data: null, error: "The customer workspace returned an invalid response." };
    }
    return { data, error: null };
  } catch {
    return { data: null, error: "The customer workspace is temporarily unavailable." };
  }
}

export async function customerPortalMutation(path:string,body?:unknown){
  const token=await getCustomerAccessToken();if(!token)throw new Error("Your customer session has expired.");
  const response=await fetch(`${API}/customer-portal/${path}`,{method:"POST",headers:{authorization:`Bearer ${token}`,"content-type":"application/json"},body:JSON.stringify(body??{}),cache:"no-store"});
  if(!response.ok){const payload=await response.json().catch(()=>({})) as {message?:string|string[]};throw new Error(Array.isArray(payload.message)?payload.message.join(" "):payload.message||"The request could not be completed.")}
}
