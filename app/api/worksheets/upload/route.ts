import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractQuizFromPDF } from "@/lib/ai/gemini";
import { ensureBucketExists } from "@/lib/supabase/storage";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const class_name = formData.get("class") as string;
    const subject = formData.get("subject") as string;
    const title = formData.get("title") as string;
    const topic = formData.get("topic") as string || "";

    if (!file || !class_name || !subject || !title) {
      return NextResponse.json({ error: "Missing required fields: file, class, subject, title are required." }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 0. Ensure bucket exists
    await ensureBucketExists("worksheets");

    // 1. Upload to Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from("worksheets")
      .upload(fileName, await file.arrayBuffer(), {
        contentType: file.type,
      });

    if (uploadError) {
      console.error("Storage Upload Error:", uploadError);
      throw new Error(`Failed to upload PDF: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage.from("worksheets").getPublicUrl(fileName);

    // 2. Create Worksheet Record
    const { data: worksheet, error: worksheetError } = await supabase
      .from("worksheets")
      .insert({
        class: class_name,
        subject,
        title,
        topic,
        pdf_url: publicUrl,
        status: "processing",
      })
      .select()
      .single();

    if (worksheetError) {
      console.error("Database Insert Error:", worksheetError);
      throw new Error(`Failed to create worksheet record: ${worksheetError.message}`);
    }

    // 3. Process with Gemini
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64 = buffer.toString("base64");
      
      const extractionResult = await extractQuizFromPDF(base64);

      // 4. Store Raw Processing & Update status
      const { error: rawError } = await supabase.from("raw_processing").insert({
        worksheet_id: worksheet.id,
        ai_output_json: extractionResult,
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
        details: processError instanceof Error ? processError.message : String(processError)
      }, { status: 500 });
    }

  } catch (error: unknown) {
    console.error("Global Upload/Extraction Error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}
