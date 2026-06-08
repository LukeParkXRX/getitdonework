export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createServerSupabaseClient, createUntypedAdminClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data: me } = await db.from("users").select("role").eq("id", user.id).maybeSingle();

  if (me?.role !== "super_admin") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const admin = createUntypedAdminClient();
  const { data: application, error } = await admin
    .from("enabler_applications")
    .select("resume_file_path")
    .eq("id", id)
    .maybeSingle();

  if (error || !application?.resume_file_path) {
    return new NextResponse("Resume not found", { status: 404 });
  }

  const { data: signed, error: signedError } = await admin.storage
    .from("application-assets")
    .createSignedUrl(application.resume_file_path, 60);

  if (signedError || !signed?.signedUrl) {
    return new NextResponse(signedError?.message ?? "Could not create download link", { status: 500 });
  }

  return NextResponse.redirect(signed.signedUrl);
}
