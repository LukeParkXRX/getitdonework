export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { verifyLaunchEmail } from "@/lib/launch-dashboard-auth";
import { createUntypedAdminClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function extractEmail(req: Request): string {
  return req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ?? "";
}

export async function POST(req: Request, { params }: RouteParams) {
  const email = extractEmail(req);

  if (!verifyLaunchEmail(email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const supabase = createUntypedAdminClient();

    // 1. Get file content as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const fileExt = file.name.split(".").pop() ?? "bin";
    
    // 2. Generate a secure, unique path inside bucket
    const safeFileName = `${Date.now()}_checklist_file.${fileExt}`;
    const filePath = `${id}/${safeFileName}`;

    // 3. Upload to private 'launch-attachments' storage bucket
    const { error: uploadErr } = await supabase.storage
      .from("launch-attachments")
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadErr) {
      return NextResponse.json({ error: uploadErr.message }, { status: 500 });
    }

    // 4. Update the DB record with file details
    const { data, error: dbErr } = await supabase
      .from("launch_checklist_items")
      .update({
        file_url: filePath,
        file_name: file.name,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (dbErr) {
      // Clean up uploaded storage file if database update fails
      await supabase.storage.from("launch-attachments").remove([filePath]);
      return NextResponse.json({ error: dbErr.message }, { status: 500 });
    }

    return NextResponse.json({ item: data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
