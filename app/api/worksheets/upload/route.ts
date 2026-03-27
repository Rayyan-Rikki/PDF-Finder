import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { extractQuizFromPDF } from "@/lib/ai/gemini";
import { ensureBucketExists } from "@/lib/supabase/storage";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
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

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const class_name = formData.get("class") as string;
    const subject = formData.get("subject") as string;
    const title = formData.get("title") as string;
    const topic = formData.get("topic") as string || "";

    if (!file || !class_name || !subject || !title) {
      return NextResponse.json({ error: "Missing required fields: file, class, subject, title are required." }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF uploads are supported." }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: "PDF exceeds the 10MB upload limit." }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 0. Ensure bucket exists
    await ensureBucketExists("worksheets");

    // 1. Upload to Storage
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${class_name}/${subject}/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from("worksheets")
      .upload(filePath, fileBuffer, {
        contentType: file.type,
      });

    if (uploadError) {
      console.error("Storage Upload Error:", uploadError);
      throw new Error(`Failed to upload PDF: ${uploadError.message}`);
    }

    // 2. Create Worksheet Record
    const { data: worksheet, error: worksheetError } = await supabase
      .from("worksheets")
      .insert({
        class: class_name,
        subject,
        title,
        topic,
        storage_path: filePath,
        status: "processing",
        created_by: user.id,
      })
      .select("id")
      .single();

    if (worksheetError) {
      console.error("Database Insert Error:", worksheetError);
      await supabase.storage.from("worksheets").remove([filePath]);
      throw new Error(`Failed to create worksheet record: ${worksheetError.message}`);
    }

    // 3. Process with Gemini
    try {
      const base64 = fileBuffer.toString("base64");
      
      const extractionResult = await extractQuizFromPDF(base64);

      // 4. Store Raw Processing & Update status
      const { error: rawError } = await supabase.from("raw_processing").upsert({
        worksheet_id: worksheet.id,
        ai_output_json: extractionResult,
      }, {
        onConflict: "worksheet_id",
      });

      if (rawError) console.error("Raw Processing Insert Error:", rawError);

      await supabase.from("worksheets").update({ status: "draft_generated" }).eq("id", worksheet.id);

      return NextResponse.json({ 
        success: true, 
        worksheetId: worksheet.id,
        message: "Worksheet uploaded and processed successfully." 
      });

    } catch (processError: unknown) {
      console.error("Extraction Processing Error:", processError);
      await supabase.from("worksheets").update({ status: "failed" }).eq("id", worksheet.id);
      return NextResponse.json({ 
        error: "Worksheet uploaded but extraction failed.", 
        worksheetId: worksheet.id,
        details: processError instanceof Error ? processError.message : "AI extraction failed."
      }, { status: 500 });
    }

  } catch (error: unknown) {
    console.error("Global Upload/Extraction Error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}
