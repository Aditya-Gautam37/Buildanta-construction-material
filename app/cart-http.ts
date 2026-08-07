import { cookies } from "next/headers";
import { getCustomerAccessToken } from "./customer-auth";

const GUEST_CART_COOKIE = "buildanta_guest_cart";
const DEFAULT_API_URL = process.env.NODE_ENV === "development" ? "http://localhost:5173" : "https://buildanta-api.vercel.app";

export const EMPTY_CART_SUMMARY = {
  cartId: null,
  status: "ACTIVE",
  lines: [],
  lineCount: 0,
  itemCount: 0,
  subtotal: 0,
  requiresQuoteCount: 0,
  hasBlockingIssues: false,
};

function apiUrl(path: string) {
  return `${(process.env.INVENTORY_API_URL || DEFAULT_API_URL).replace(/\/$/, "")}${path}`;
}

async function ensureGuestCartToken(requestUrl: string) {
  const store = await cookies();
  const existing = store.get(GUEST_CART_COOKIE)?.value;
  if (existing) return existing;
  const token = crypto.randomUUID();
  const secure = new URL(requestUrl).protocol === "https:";
  store.set(GUEST_CART_COOKIE, token, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 90 });
  return token;
}

async function getGuestCartToken() {
  return (await cookies()).get(GUEST_CART_COOKIE)?.value ?? null;
}

export async function resolveCartHeaders(requestUrl: string, mintGuestToken: boolean) {
  const accessToken = await getCustomerAccessToken();
  const guestToken = accessToken ? null : mintGuestToken ? await ensureGuestCartToken(requestUrl) : await getGuestCartToken();
  const headers = new Headers({ "content-type": "application/json", accept: "application/json" });
  if (accessToken) headers.set("authorization", `Bearer ${accessToken}`);
  else if (guestToken) headers.set("x-buildanta-guest-cart", guestToken);
  return { headers, accessToken, guestToken };
}

export async function forwardCartRequest(path: string, init: RequestInit) {
  const response = await fetch(apiUrl(path), { ...init, cache: "no-store" });
  const body = await response.json().catch(() => ({ error: "Cart service returned an invalid response." }));
  return Response.json(body, { status: response.status });
}
