import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createNotification } from "@/lib/notifications";
import { logAdminAction } from "@/lib/admin-audit";

async function getAdminDb() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", status: 401, db: null, userId: null };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data: me } = await db
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (me?.role !== "super_admin")
    return { error: "Forbidden", status: 403, db: null, userId: null };

  return { error: null, status: 200, db, userId: user.id };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { error, status, db } = await getAdminDb();
    if (error || !db) return NextResponse.json({ error }, { status });

    const { data: dispute, error: fetchErr } = await db
      .from("disputes")
      .select(
        `id, status, filer_role, reason, details, evidence_urls,
         resolved_at, resolution_notes, refund_amount, created_at,
         booking:bookings!disputes_booking_id_fkey(
           id, credits_amount, scheduled_at, type, brief,
           startup:users!bookings_startup_id_fkey(id, full_name, email, avatar_url),
           enabler:users!bookings_enabler_id_fkey(id, full_name, email, avatar_url)
         ),
         filer:users!disputes_filer_id_fkey(id, full_name, email, avatar_url),
         resolver:users!disputes_resolved_by_fkey(id, full_name)`
      )
      .eq("id", id)
      .maybeSingle();

    if (fetchErr || !dispute) {
      return NextResponse.json({ error: "분쟁을 찾을 수 없습니다" }, { status: 404 });
    }

    return NextResponse.json({ dispute });
  } catch (e) {
    console.warn("GET /api/admin/disputes/[id] error", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { error, status, db, userId: adminId } = await getAdminDb();
    if (error || !db || !adminId) return NextResponse.json({ error }, { status });

    const body = (await request.json()) as {
      action: "mark_in_review" | "resolve";
      refundAmount?: number;
      notes?: string;
    };

    const { action } = body;

    if (action === "mark_in_review") {
      // 현재 status 확인
      const { data: dispute } = await db
        .from("disputes")
        .select("id, status, booking_id")
        .eq("id", id)
        .maybeSingle();

      if (!dispute) {
        return NextResponse.json({ error: "분쟁을 찾을 수 없습니다" }, { status: 404 });
      }
      if (dispute.status !== "open") {
        return NextResponse.json({ error: "open 상태에서만 검토 시작 가능합니다" }, { status: 409 });
      }

      const { data: updated, error: updateErr } = await db
        .from("disputes")
        .update({ status: "in_review" })
        .eq("id", id)
        .select()
        .single();

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }

      await logAdminAction(db, adminId, {
        action: "mark_dispute_in_review",
        targetType: "dispute",
        targetId: id,
        metadata: { booking_id: dispute.booking_id },
      });

      return NextResponse.json({ dispute: updated });
    }

    if (action === "resolve") {
      const refundAmount = body.refundAmount ?? 0;
      const notes = body.notes ?? "분쟁 처리 완료";

      if (typeof refundAmount !== "number" || refundAmount < 0) {
        return NextResponse.json({ error: "유효하지 않은 환불 금액" }, { status: 400 });
      }

      // RPC 호출 — resolve_dispute_refund
      const { data: resolved, error: rpcErr } = await db.rpc("resolve_dispute_refund", {
        p_dispute_id: id,
        p_admin_id: adminId,
        p_refund_amount: refundAmount,
        p_notes: notes,
      });

      if (rpcErr) {
        return NextResponse.json({ error: rpcErr.message }, { status: 500 });
      }

      // booking 양쪽 사용자 조회
      const { data: disputeRow } = await db
        .from("disputes")
        .select(
          `status, booking:bookings!disputes_booking_id_fkey(startup_id, enabler_id, credits_amount)`
        )
        .eq("id", id)
        .maybeSingle();

      const booking = Array.isArray(disputeRow?.booking)
        ? disputeRow.booking[0]
        : disputeRow?.booking;

      const resolvedStatus: string = resolved?.status ?? disputeRow?.status ?? "";
      const refundLabel =
        resolvedStatus === "resolved_refund"
          ? `전액 환불 (${refundAmount} 토큰)`
          : resolvedStatus === "resolved_partial"
          ? `부분 환불 (${refundAmount} 토큰)`
          : "기각 (환불 없음)";

      // 양쪽 알림
      const notifPromises = [];
      if (booking?.startup_id) {
        notifPromises.push(
          createNotification(db, {
            userId: booking.startup_id,
            type: "dispute_resolved",
            title: "분쟁 처리 결과",
            body: `분쟁 검토가 완료되었습니다. 결정: ${refundLabel}. 사유: ${notes}`,
            link: `/bookings`,
          })
        );
      }
      if (booking?.enabler_id) {
        notifPromises.push(
          createNotification(db, {
            userId: booking.enabler_id,
            type: "dispute_resolved",
            title: "분쟁 처리 결과",
            body: `분쟁 검토가 완료되었습니다. 결정: ${refundLabel}. 사유: ${notes}`,
            link: `/my`,
          })
        );
      }

      await Promise.allSettled(notifPromises);

      await logAdminAction(db, adminId, {
        action: "resolve_dispute",
        targetType: "dispute",
        targetId: id,
        metadata: {
          refundAmount,
          dispute_status: resolvedStatus,
          notes,
        },
      });

      return NextResponse.json({ dispute: resolved });
    }

    return NextResponse.json({ error: "유효하지 않은 action" }, { status: 400 });
  } catch (e) {
    console.warn("PATCH /api/admin/disputes/[id] error", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
