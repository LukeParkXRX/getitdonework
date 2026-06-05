import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { sendEmail, APP_URL } from "@/lib/email";
import {
  applicationApprovedEmail,
  applicationRejectedEmail,
} from "@/lib/emails/templates";
import { logAdminAction } from "@/lib/admin-audit";

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

      // 가입 매칭 토큰 생성
      const { data: signupToken, error: tokenError } = await db.rpc(
        "generate_application_signup_token",
        { p_application_id: id, p_expires_days: 30 }
      );
      if (tokenError) {
        return NextResponse.json({ error: tokenError.message }, { status: 500 });
      }

      const signupLink = `${APP_URL}/signup?token=${signupToken as string}&role=enabler`;

      const emailResult = await sendEmail(
        application.email,
        applicationApprovedEmail({
          applicantName: application.name,
          applicantEmail: application.email,
          signupLink,
        })
      );

      logAdminAction(db, user.id, {
        action: "approve_application",
        targetType: "application",
        targetId: id,
        metadata: { applicantName: application.name, email: application.email },
      }).catch(() => {});

      return NextResponse.json({
        ok: true,
        status: "approved",
        emailWarning: emailResult.ok
          ? null
          : `승인은 완료됐지만 지원자 이메일 발송에 실패했습니다: ${emailResult.error}`,
      });
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

    const emailResult = await sendEmail(
      application.email,
      applicationRejectedEmail({
        applicantName: application.name,
        applicantEmail: application.email,
        notes: notes,
      })
    );

    logAdminAction(db, user.id, {
      action: "reject_application",
      targetType: "application",
      targetId: id,
      metadata: { reason: notes },
    }).catch(() => {});

    return NextResponse.json({
      ok: true,
      status: "rejected",
      emailWarning: emailResult.ok
        ? null
        : `거절 처리는 완료됐지만 지원자 이메일 발송에 실패했습니다: ${emailResult.error}`,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
