export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { verifyLaunchEmail } from "@/lib/launch-dashboard-auth";
import { createUntypedAdminClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email")?.trim() ?? "";

  if (!verifyLaunchEmail(email)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const supabase = createUntypedAdminClient();

  // 1. Fetch file_url from database
  const { data, error } = await supabase
    .from("launch_checklist_items")
    .select("file_url")
    .eq("id", id)
    .single();

  if (error || !data || !data.file_url) {
    return new NextResponse("File not found", { status: 404 });
  }

  // 2. Generate signed URL for 60 seconds
  const { data: signedData, error: signedErr } = await supabase.storage
    .from("launch-attachments")
    .createSignedUrl(data.file_url, 60);

  if (signedErr || !signedData || !signedData.signedUrl) {
    return new NextResponse(signedErr?.message ?? "Failed to create download link", { status: 500 });
  }

  // 3. Redirect user to signed download URL
  return NextResponse.redirect(signedData.signedUrl);
}
