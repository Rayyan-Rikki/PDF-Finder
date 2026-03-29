import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
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
      .select("id, status")
      .eq("id", id)
      .single();

    if (worksheetError || !worksheet) {
      return NextResponse.json({ error: "Worksheet not found." }, { status: 404 });
    }

    const { data: rawProcessing } = await supabase
      .from("raw_processing")
      .select("id")
      .eq("worksheet_id", id)
      .maybeSingle();

    const nextStatus = rawProcessing ? "draft_generated" : "reviewed";

    const { error: questionsError } = await supabase
      .from("questions")
      .update({ is_published: false })
      .eq("worksheet_id", id);

    if (questionsError) {
      throw new Error(`Failed to unpublish worksheet questions: ${questionsError.message}`);
    }

    const { error: updateError } = await supabase
      .from("worksheets")
      .update({ status: nextStatus, published_at: null })
      .eq("id", id);

    if (updateError) {
      throw new Error(`Failed to update worksheet status: ${updateError.message}`);
    }

    return NextResponse.json({
      success: true,
      message: "Worksheet unpublished successfully.",
      status: nextStatus,
    });
  } catch (error: unknown) {
    console.error("Unpublish Worksheet Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
