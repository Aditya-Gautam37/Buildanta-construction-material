import { forwardCartRequest, resolveCartHeaders } from "../../../../cart-http";

export async function PATCH(request: Request, { params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await params;
  const { headers } = await resolveCartHeaders(request.url, false);
  const body = await request.text();
  return forwardCartRequest(`/cart/items/${encodeURIComponent(itemId)}`, { method: "PATCH", headers, body });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await params;
  const { headers } = await resolveCartHeaders(request.url, false);
  return forwardCartRequest(`/cart/items/${encodeURIComponent(itemId)}`, { method: "DELETE", headers });
}
