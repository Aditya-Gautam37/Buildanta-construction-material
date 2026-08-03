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

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const firstName = typeof body?.firstName === "string" ? body.firstName.trim() : "";
  const lastName = typeof body?.lastName === "string" ? body.lastName.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!firstName || !lastName || !email || password.length < 8) {
    return Response.json({ error: "Name, email and a password of at least 8 characters are required." }, { status: 400 });
  }

  const confirmationUrl = new URL("/auth/confirm", request.url).toString();
  const response = await supabaseAuthFetch(`/auth/v1/signup?redirect_to=${encodeURIComponent(confirmationUrl)}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email,
      password,
      data: { firstName, lastName, accountType: "customer" },
    }),
  });
  if (!response.ok) {
    return Response.json({ error: await authErrorMessage(response) }, { status: response.status });
  }

  const result = await response.json();
  if (Array.isArray(result.user?.identities) && result.user.identities.length === 0) {
    return Response.json({ error: "An account already exists for this email. Please sign in." }, { status: 409 });
  }
  if (result.access_token && result.refresh_token) {
    await saveCustomerSession(result, request.url);
    return Response.json({ requiresConfirmation: false });
  }
  return Response.json({ requiresConfirmation: true });
}
