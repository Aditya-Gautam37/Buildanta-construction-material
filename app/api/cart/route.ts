import { EMPTY_CART_SUMMARY, forwardCartRequest, resolveCartHeaders } from "../../cart-http";

export async function GET(request: Request) {
  const { headers, accessToken, guestToken } = await resolveCartHeaders(request.url, false);
  if (!accessToken && !guestToken) return Response.json(EMPTY_CART_SUMMARY);
  return forwardCartRequest("/cart", { method: "GET", headers });
}

export async function DELETE(request: Request) {
  const { headers, accessToken, guestToken } = await resolveCartHeaders(request.url, false);
  if (!accessToken && !guestToken) return Response.json(EMPTY_CART_SUMMARY);
  return forwardCartRequest("/cart", { method: "DELETE", headers });
}
