import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateQuestions } from "@/lib/questions";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { questions } = await req.json();

    if (!questions || !Array.isArray(questions)) {
      return NextResponse.json({ error: "Invalid questions data" }, { status: 400 });
    }

    const validationIssues = validateQuestions(questions);
    if (validationIssues.length > 0) {
      const firstIssue = validationIssues[0];
      return NextResponse.json(
        { error: `Question ${firstIssue.index + 1}: ${firstIssue.message}` },
        { status: 400 }
      );
    }

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

    const { error } = await supabase.rpc("publish_worksheet", {
      p_worksheet_id: id,
      p_questions: questions,
    });

    if (error) throw error;

    return NextResponse.json({ success: true, message: "Worksheet published successfully" });
  } catch (error: unknown) {
    console.error("Publish Error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}
