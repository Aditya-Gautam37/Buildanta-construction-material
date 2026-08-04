import { createClient } from "@/lib/supabase/server";
import { syncAuthenticatedUser } from "@/lib/auth/sync-user";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return Response.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const profile = await syncAuthenticatedUser(user);
    return Response.json({ profile });
  } catch (syncError) {
    console.error("Unable to synchronize authenticated user.", syncError);
    return Response.json({ error: "Unable to synchronize your profile." }, { status: 500 });
  }
}
