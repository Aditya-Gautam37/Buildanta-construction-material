import { cookies } from "next/headers";

const ACCESS_COOKIE = "buildanta_customer_access";
const REFRESH_COOKIE = "buildanta_customer_refresh";

export type CustomerUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string;
};

type SessionPayload = {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
};

function configuration() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Customer authentication is not configured.");
  return { url: url.replace(/\/$/, ""), key };
}

export async function supabaseAuthFetch(
  path: string,
  init: RequestInit = {},
  accessToken?: string,
) {
  const { url, key } = configuration();
  const headers = new Headers(init.headers);
  headers.set("apikey", key);
  if (accessToken) headers.set("authorization", `Bearer ${accessToken}`);
  return fetch(`${url}${path}`, { ...init, headers, cache: "no-store" });
}

export async function authErrorMessage(response: Response) {
  try {
    const data = (await response.json()) as {
      message?: string;
      error_description?: string;
      msg?: string;
    };
    return data.message ?? data.error_description ?? data.msg ?? "Authentication failed.";
  } catch {
    return "Authentication failed.";
  }
}

export async function saveCustomerSession(session: SessionPayload, requestUrl: string) {
  const store = await cookies();
  const secure = new URL(requestUrl).protocol === "https:";
  const shared = { httpOnly: true, secure, sameSite: "lax" as const, path: "/" };
  store.set(ACCESS_COOKIE, session.access_token, {
    ...shared,
    maxAge: Math.max(60, session.expires_in ?? 3600),
  });
  store.set(REFRESH_COOKIE, session.refresh_token, {
    ...shared,
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearCustomerSession() {
  const store = await cookies();
  store.set(ACCESS_COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  store.set(REFRESH_COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
}

export async function getCustomerUser(): Promise<CustomerUser | null> {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return null;

  const response = await supabaseAuthFetch("/auth/v1/user", { method: "GET" }, token);
  if (!response.ok) return null;
  const user = (await response.json()) as {
    id?: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
  };
  if (!user.id || !user.email) return null;

  const firstName = textMetadata(user.user_metadata, "firstName") ?? textMetadata(user.user_metadata, "first_name");
  const lastName = textMetadata(user.user_metadata, "lastName") ?? textMetadata(user.user_metadata, "last_name");
  return {
    id: user.id,
    email: user.email,
    firstName,
    lastName,
    displayName: [firstName, lastName].filter(Boolean).join(" ") || user.email,
  };
}

export function isSameOriginRequest(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

function textMetadata(metadata: Record<string, unknown> | undefined, key: string) {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
