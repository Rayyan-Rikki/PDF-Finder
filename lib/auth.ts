import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AppRole = "admin" | "user";

export interface AppProfile {
  id: string;
  display_name: string | null;
  role: AppRole;
}

export interface AuthContext {
  user: {
    id: string;
    email?: string;
  };
  profile: AppProfile | null;
}

export async function getAuthContext(): Promise<AuthContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, role")
    .eq("id", user.id)
    .maybeSingle();

  return {
    user: {
      id: user.id,
      email: user.email,
    },
    profile: profile ?? null,
  };
}

export async function requirePageAuth(nextPath = "/"): Promise<AuthContext> {
  const auth = await getAuthContext();

  if (!auth) {
    redirect(`/auth?next=${encodeURIComponent(nextPath)}`);
  }

  return auth;
}

export async function requirePageAdmin(nextPath = "/admin"): Promise<AuthContext> {
  const auth = await requirePageAuth(nextPath);

  if (auth.profile?.role !== "admin") {
    redirect("/");
  }

  return auth;
}
