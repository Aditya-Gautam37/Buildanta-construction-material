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
  const accessToken = typeof body?.accessToken === "string" ? body.accessToken : "";
  const refreshToken = typeof body?.refreshToken === "string" ? body.refreshToken : "";
  const expiresIn = typeof body?.expiresIn === "number" ? body.expiresIn : 3600;
  if (!accessToken || !refreshToken) {
    return Response.json({ error: "The confirmation session is incomplete." }, { status: 400 });
  }

  const verification = await supabaseAuthFetch("/auth/v1/user", { method: "GET" }, accessToken);
  if (!verification.ok) {
    return Response.json({ error: await authErrorMessage(verification) }, { status: 401 });
  }
  await saveCustomerSession(
    { access_token: accessToken, refresh_token: refreshToken, expires_in: expiresIn },
    request.url,
  );
  return Response.json({ ok: true });
}
