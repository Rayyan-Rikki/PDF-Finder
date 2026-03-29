import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { processWorksheetPDF } from "@/lib/worksheets/process";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  let worksheetId: string | null = null;
  try {
    const { id } = await params;
    worksheetId = id;
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
      .select("id, storage_path, status, processing_attempts")
      .eq("id", id)
      .single();

    if (worksheetError || !worksheet) {
      return NextResponse.json({ error: "Worksheet not found." }, { status: 404 });
    }

    const { error: statusError } = await supabase
      .from("worksheets")
      .update({
        status: "processing",
        processing_error: null,
        last_retry_at: new Date().toISOString(),
        processing_attempts: (worksheet.processing_attempts || 0) + 1,
      })
      .eq("id", id);

    if (statusError) {
      throw new Error(`Failed to update worksheet status: ${statusError.message}`);
    }

    const { data: fileData, error: downloadError } = await supabase.storage
      .from("worksheets")
      .download(worksheet.storage_path);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download stored PDF: ${downloadError?.message || "missing file data"}`);
    }

    const fileBuffer = Buffer.from(await fileData.arrayBuffer());
    await processWorksheetPDF({
      worksheetId: id,
      pdfBase64: fileBuffer.toString("base64"),
    });

    return NextResponse.json({
      success: true,
      worksheetId: id,
      message: "Worksheet processing retried successfully.",
    });
  } catch (error: unknown) {
    const details = error instanceof Error ? error.message : "Retry failed.";
    console.error("Retry Processing Error:", details);
    if (worksheetId) {
      const supabase = createAdminClient();
      await supabase
        .from("worksheets")
        .update({ status: "failed", processing_error: details })
        .eq("id", worksheetId);
    }
    return NextResponse.json({ error: details }, { status: 500 });
  }
}
