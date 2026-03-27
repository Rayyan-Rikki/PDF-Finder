import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authClient = await createClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { data: profile } = await authClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const supabase = createAdminClient();
    const { data: worksheet, error: worksheetError } = await supabase
      .from("worksheets")
      .select("id, storage_path, status")
      .eq("id", id)
      .maybeSingle();

    if (worksheetError || !worksheet) {
      return NextResponse.json({ error: "Worksheet not found." }, { status: 404 });
    }

    const isAdmin = profile?.role === "admin";

    if (!isAdmin && worksheet.status !== "published") {
      return NextResponse.json({ error: "You do not have access to this PDF." }, { status: 403 });
    }

    const { data: signedUrl, error: signedUrlError } = await supabase.storage
      .from("worksheets")
      .createSignedUrl(worksheet.storage_path, 60);

    if (signedUrlError || !signedUrl?.signedUrl) {
      return NextResponse.json({ error: "Failed to generate PDF link." }, { status: 500 });
    }

    return NextResponse.redirect(signedUrl.signedUrl);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to open worksheet PDF." },
      { status: 500 }
    );
  }
}
