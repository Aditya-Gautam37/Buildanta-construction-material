import { clearCustomerSession, isSameOriginRequest } from "../../../customer-auth";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return Response.json({ error: "Invalid request origin." }, { status: 403 });
  }
  await clearCustomerSession();
  return Response.json({ ok: true });
}
