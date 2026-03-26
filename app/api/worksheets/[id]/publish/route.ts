import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Question } from "@/lib/types";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { questions } = await req.json();

    if (!questions || !Array.isArray(questions)) {
      return NextResponse.json({ error: "Invalid questions data" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 1. Delete existing questions for this worksheet (if any)
    const { error: deleteError } = await supabase
      .from("questions")
      .delete()
      .eq("worksheet_id", id);

    if (deleteError) throw deleteError;

    // 2. Insert the reviewed questions
    const { error: insertError } = await supabase
      .from("questions")
      .insert(
        questions.map((q: Question) => ({
          worksheet_id: id,
          question_text: q.question_text,
          answer_text: q.answer_text,
          question_type: q.question_type || "short",
          explanation: q.explanation || "",
          source_page: q.source_page || null,
          is_published: true,
        }))
      );

    if (insertError) {
      console.error("Insert Questions Error:", insertError);
      throw new Error(`Failed to insert questions: ${insertError.message}`);
    }

    // 3. Update worksheet status
    const { error: updateError } = await supabase
      .from("worksheets")
      .update({ status: "published" })
      .eq("id", id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, message: "Worksheet published successfully" });
  } catch (error: unknown) {
    console.error("Publish Error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}
