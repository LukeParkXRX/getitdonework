import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { logAdminAction } from "@/lib/admin-audit";

async function getAdminDb() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return { error: "Unauthorized", status: 401, db: null, userId: null };

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

// POST /api/admin/credits — 크레딧 발급 (allocate)
export async function POST(request: Request) {
  try {
    const { error, status, db, userId } = await getAdminDb();
    if (error || !db) return NextResponse.json({ error }, { status });

    const body = (await request.json()) as {
      org_id?: string;
      startup_id?: string;
      amount: number;
      description?: string;
    };

    const amount = Number(body.amount);
    if (!Number.isInteger(amount) || amount === 0) {
      return NextResponse.json(
        { error: "amount는 0이 아닌 정수여야 합니다" },
        { status: 400 }
      );
    }
    if ((body.org_id ? 1 : 0) + (body.startup_id ? 1 : 0) !== 1) {
      return NextResponse.json(
        { error: "org_id 또는 startup_id 중 하나만 선택해야 합니다" },
        { status: 400 }
      );
    }

    // 원자적 지급/회수: 잔액 증감 + 거래기록을 단일 RPC로 (race 방지)
    const { data: tx, error: rpcError } = await db.rpc("admin_adjust_credits", {
      p_startup_id: body.startup_id ?? null,
      p_org_id: body.org_id ?? null,
      p_amount: amount,
      p_description: body.description ?? null,
    });

    if (rpcError) {
      const message = rpcError.message ?? "크레딧 처리에 실패했습니다.";
      const status =
        message.includes("permission") ? 403 :
        message.includes("Insufficient") || message.includes("not found") ? 400 :
        500;
      return NextResponse.json({ error: message }, { status });
    }

    logAdminAction(db, userId!, {
      action: "allocate_credits",
      targetType: "credit_transaction",
      targetId: tx?.id,
      metadata: { amount, target: body.org_id ?? body.startup_id },
    }).catch(() => {});

    return NextResponse.json({ tx }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
