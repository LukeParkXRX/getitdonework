import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { sendEmail, APP_URL } from "@/lib/email";
import {
  applicationApprovedEmail,
  applicationRejectedEmail,
} from "@/lib/emails/templates";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    const { data: me } = await db
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (me?.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { action, notes } = body as { action: "approve" | "reject"; notes?: string };

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // 신청서 조회
    const { data: application, error: fetchError } = await db
      .from("enabler_applications")
      .select("id, name, email, status")
      .eq("id", id)
      .maybeSingle();

    if (fetchError || !application) {
      return NextResponse.json({ error: "신청서를 찾을 수 없습니다" }, { status: 404 });
    }

    const now = new Date().toISOString();

    if (action === "approve") {
      const { error: updateError } = await db
        .from("enabler_applications")
        .update({
          status: "approved",
          reviewed_by: user.id,
          reviewed_at: now,
          notes: notes ?? null,
        })
        .eq("id", id);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      // 가입 링크: application.id를 token으로 사용 (S22에서 연결)
      const signupLink = `${APP_URL}/signup?role=enabler&email=${encodeURIComponent(application.email)}&token=${application.id}`;

      await sendEmail(
        application.email,
        applicationApprovedEmail({
          applicantName: application.name,
          applicantEmail: application.email,
          signupLink,
        })
      );

      return NextResponse.json({ ok: true, status: "approved" });
    }

    // reject
    const { error: updateError } = await db
      .from("enabler_applications")
      .update({
        status: "rejected",
        reviewed_by: user.id,
        reviewed_at: now,
        notes: notes ?? null,
      })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    await sendEmail(
      application.email,
      applicationRejectedEmail({
        applicantName: application.name,
        applicantEmail: application.email,
        notes: notes,
      })
    );

    return NextResponse.json({ ok: true, status: "rejected" });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
