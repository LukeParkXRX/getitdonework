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

    if (!body.amount || body.amount === 0) {
      return NextResponse.json(
        { error: "amount는 0이 아니어야 합니다" },
        { status: 400 }
      );
    }
    if (!body.org_id && !body.startup_id) {
      return NextResponse.json(
        { error: "org_id 또는 startup_id 중 하나는 필수입니다" },
        { status: 400 }
      );
    }

    const txType = body.amount > 0 ? "allocate" : "release";

    // credit_transactions INSERT
    const { data: tx, error: txError } = await db
      .from("credit_transactions")
      .insert({
        tx_type: txType,
        amount: body.amount,
        org_id: body.org_id ?? null,
        startup_id: body.startup_id ?? null,
        description: body.description ?? (body.amount > 0 ? "관리자 크레딧 발급" : "관리자 크레딧 회수"),
      })
      .select()
      .single();

    if (txError) {
      return NextResponse.json({ error: txError.message }, { status: 500 });
    }

    // startup_id가 있으면 startup_profiles.credit_balance 갱신
    if (body.startup_id) {
      const { data: profile } = await db
        .from("startup_profiles")
        .select("credit_balance")
        .eq("user_id", body.startup_id)
        .maybeSingle();

      if (profile) {
        await db
          .from("startup_profiles")
          .update({ credit_balance: (profile.credit_balance ?? 0) + body.amount })
          .eq("user_id", body.startup_id);
      }
    }

    // org_id가 있으면 organizations.total_credits 갱신
    if (body.org_id) {
      const { data: org } = await db
        .from("organizations")
        .select("total_credits")
        .eq("id", body.org_id)
        .maybeSingle();

      if (org) {
        await db
          .from("organizations")
          .update({ total_credits: (org.total_credits ?? 0) + body.amount })
          .eq("id", body.org_id);
      }
    }

    logAdminAction(db, userId!, {
      action: "allocate_credits",
      targetType: "credit_transaction",
      targetId: tx?.id,
      metadata: { amount: body.amount, target: body.org_id ?? body.startup_id },
    }).catch(() => {});

    return NextResponse.json({ tx }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
