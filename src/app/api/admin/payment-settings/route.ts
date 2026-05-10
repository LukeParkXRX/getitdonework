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
  const db = supabase as any;
  const { data: me } = await db
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (me?.role !== "super_admin") return { error: "Forbidden", status: 403, userId: null };

  return { error: null, status: 200, userId: user.id };
}

// GET /api/admin/payment-settings
export async function GET() {
  try {
    const { error, status, userId } = await getAdminUser();
    if (error || !userId) return NextResponse.json({ error }, { status });

    let db: ReturnType<typeof createServiceClient>;
    try {
      db = createServiceClient();
    } catch {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error: dbErr } = await (db as any)
      .from("payment_settings")
      .select("*")
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });

    return NextResponse.json({ settings: data ?? null });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/admin/payment-settings
// body: { auto_approve_threshold_cents: number, approval_expiry_days: number }
export async function PATCH(request: Request) {
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
      auto_approve_threshold_cents?: number;
      approval_expiry_days?: number;
    };

    const { auto_approve_threshold_cents, approval_expiry_days } = body;

    if (
      (auto_approve_threshold_cents !== undefined && (
        typeof auto_approve_threshold_cents !== "number" ||
        auto_approve_threshold_cents < 0
      )) ||
      (approval_expiry_days !== undefined && (
        typeof approval_expiry_days !== "number" ||
        approval_expiry_days < 1
      ))
    ) {
      return NextResponse.json({ error: "유효하지 않은 값입니다." }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dbAny = db as any;

    // 현재 활성 설정 조회
    const { data: existing } = await dbAny
      .from("payment_settings")
      .select("id")
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      updated_by: userId,
    };
    if (auto_approve_threshold_cents !== undefined) {
      updatePayload.auto_approve_threshold_cents = auto_approve_threshold_cents;
    }
    if (approval_expiry_days !== undefined) {
      updatePayload.approval_expiry_days = approval_expiry_days;
    }

    let result;
    if (existing?.id) {
      result = await dbAny
        .from("payment_settings")
        .update(updatePayload)
        .eq("id", existing.id)
        .select()
        .single();
    } else {
      result = await dbAny
        .from("payment_settings")
        .insert({
          auto_approve_threshold_cents: auto_approve_threshold_cents ?? 1000000,
          auto_approve_currency: "krw",
          approval_expiry_days: approval_expiry_days ?? 7,
          is_active: true,
          updated_by: userId,
        })
        .select()
        .single();
    }

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    logAdminAction(dbAny, userId!, {
      action: "update_payment_settings",
      targetType: "payment_settings",
    }).catch(() => {});

    return NextResponse.json({ settings: result.data });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
