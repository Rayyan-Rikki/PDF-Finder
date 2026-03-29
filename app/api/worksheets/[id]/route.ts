import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
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

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const supabase = createAdminClient();
    const { data: worksheet, error: worksheetError } = await supabase
      .from("worksheets")
      .select("id, storage_path")
      .eq("id", id)
      .single();

    if (worksheetError || !worksheet) {
      return NextResponse.json({ error: "Worksheet not found." }, { status: 404 });
    }

    const { error: storageError } = await supabase.storage
      .from("worksheets")
      .remove([worksheet.storage_path]);

    if (storageError) {
      throw new Error(`Failed to remove PDF from storage: ${storageError.message}`);
    }

    const { error: deleteError } = await supabase
      .from("worksheets")
      .delete()
      .eq("id", id);

    if (deleteError) {
      throw new Error(`Failed to delete worksheet: ${deleteError.message}`);
    }

    return NextResponse.json({ success: true, message: "Worksheet deleted successfully." });
  } catch (error: unknown) {
    console.error("Delete Worksheet Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
