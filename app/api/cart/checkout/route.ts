import { forwardCartRequest, resolveCartHeaders } from "../../../cart-http";

export async function POST(request: Request) {
  const { headers } = await resolveCartHeaders(request.url, false);
  const body = await request.text();
  return forwardCartRequest("/cart/checkout", { method: "POST", headers, body });
}
