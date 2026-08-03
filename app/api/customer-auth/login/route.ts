import {
  authErrorMessage,
  isSameOriginRequest,
  saveCustomerSession,
  supabaseAuthFetch,
} from "../../../customer-auth";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return Response.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as { email?: unknown; password?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!email || !password) {
    return Response.json({ error: "Email and password are required." }, { status: 400 });
  }

  const response = await supabaseAuthFetch("/auth/v1/token?grant_type=password", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    return Response.json({ error: await authErrorMessage(response) }, { status: response.status });
  }

  const session = await response.json();
  await saveCustomerSession(session, request.url);
  return Response.json({ user: { email: session.user?.email ?? email } });
}
