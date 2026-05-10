import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";
import { logAdminAction } from "@/lib/admin-audit";

async function getAdminUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", status: 401, userId: null };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: me } = await (supabase as any)
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (me?.role !== "super_admin") return { error: "Forbidden", status: 403, userId: null };
  return { error: null, status: 200, userId: user.id };
}

// GET /api/admin/payout-settings
// query: enabler_id (optional) — 없으면 글로벌 설정 반환
export async function GET(request: Request) {
  try {
    const { error, status } = await getAdminUser();
    if (error) return NextResponse.json({ error }, { status });

    let db: ReturnType<typeof createServiceClient>;
    try {
      db = createServiceClient();
    } catch {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const enablerId = searchParams.get("enabler_id");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dbAny = db as any;

    let query = dbAny
      .from("payout_settings")
      .select("*")
      .is("effective_to", null)
      .order("effective_from", { ascending: false })
      .limit(20);

    if (enablerId) {
      query = query.eq("enabler_id", enablerId);
    } else {
      query = query.is("enabler_id", null);
    }

    const { data, error: dbErr } = await query;
    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });

    return NextResponse.json({ settings: data ?? [] });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/admin/payout-settings
// body: { enabler_id?: string, platform_fee_pct: number, credit_rate: number, min_payout: number }
// 기존 유효 row의 effective_to=now() 처리 후 새 row INSERT
export async function POST(request: Request) {
  try {
    const { error, status, userId } = await getAdminUser();
    if (error || !userId) return NextResponse.json({ error }, { status });

    let db: ReturnType<typeof createServiceClient>;
    try {
      db = createServiceClient();
    } catch {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    const body = await request.json() as {
      enabler_id?: string | null;
      platform_fee_pct: number;
      credit_rate: number;
      min_payout: number;
    };

    const { enabler_id, platform_fee_pct, credit_rate, min_payout } = body;

    // 유효성 검증
    if (
      typeof platform_fee_pct !== "number" || platform_fee_pct < 0 || platform_fee_pct > 100 ||
      typeof credit_rate !== "number" || credit_rate <= 0 ||
      typeof min_payout !== "number" || min_payout < 0
    ) {
      return NextResponse.json(
        { error: "유효하지 않은 값입니다 (fee_pct: 0-100, credit_rate: >0, min_payout: >=0)" },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dbAny = db as any;
    const now = new Date().toISOString();

    // 기존 유효 row effective_to 마감
    let expireQuery = dbAny
      .from("payout_settings")
      .update({ effective_to: now })
      .is("effective_to", null);

    if (enabler_id) {
      expireQuery = expireQuery.eq("enabler_id", enabler_id);
    } else {
      expireQuery = expireQuery.is("enabler_id", null);
    }

    await expireQuery;

    // 새 row INSERT
    const { data, error: insertErr } = await dbAny
      .from("payout_settings")
      .insert({
        enabler_id: enabler_id ?? null,
        platform_fee_pct,
        credit_rate,
        min_payout,
        effective_from: now,
        effective_to: null,
        created_by: userId,
      })
      .select()
      .single();

    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

    logAdminAction(dbAny, userId!, {
      action: "update_payout_settings",
      targetType: "payout_settings",
    }).catch(() => {});

    return NextResponse.json({ setting: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
