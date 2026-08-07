import { forwardCartRequest, resolveCartHeaders } from "../../../cart-http";

export async function POST(request: Request) {
  const { headers, accessToken } = await resolveCartHeaders(request.url, false);
  if (!accessToken) return Response.json({ error: "Sign in required to merge a cart." }, { status: 401 });
  return forwardCartRequest("/cart/merge", { method: "POST", headers });
}
