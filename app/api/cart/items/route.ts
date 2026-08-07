import { forwardCartRequest, resolveCartHeaders } from "../../../cart-http";

export async function POST(request: Request) {
  const { headers } = await resolveCartHeaders(request.url, true);
  const body = await request.text();
  return forwardCartRequest("/cart/items", { method: "POST", headers, body });
}
