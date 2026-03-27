import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ADMIN_ID = "admin";
const ADMIN_EMAIL = "admin@pdffinder.local";

export async function POST(request: NextRequest) {
  try {
    const { adminId, password } = await request.json();

    if (adminId !== ADMIN_ID || !password) {
      return NextResponse.json({ error: "Invalid admin credentials." }, { status: 401 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password,
    });

    if (error || !data.user) {
      return NextResponse.json({ error: "Invalid admin credentials." }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profile?.role !== "admin") {
      await supabase.auth.signOut();
      return NextResponse.json({ error: "Admin profile is not configured." }, { status: 403 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Admin login failed." },
      { status: 500 }
    );
  }
}
