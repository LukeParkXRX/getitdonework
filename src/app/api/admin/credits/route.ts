import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

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
    const { error, status, db } = await getAdminDb();
    if (error || !db) return NextResponse.json({ error }, { status });

    const body = (await request.json()) as {
      org_id?: string;
      startup_id?: string;
      amount: number;
      description?: string;
    };

    if (!body.amount || body.amount <= 0) {
      return NextResponse.json(
        { error: "amount는 양수여야 합니다" },
        { status: 400 }
      );
    }
    if (!body.org_id && !body.startup_id) {
      return NextResponse.json(
        { error: "org_id 또는 startup_id 중 하나는 필수입니다" },
        { status: 400 }
      );
    }

    // credit_transactions INSERT
    const { data: tx, error: txError } = await db
      .from("credit_transactions")
      .insert({
        tx_type: "allocate",
        amount: body.amount,
        org_id: body.org_id ?? null,
        startup_id: body.startup_id ?? null,
        description: body.description ?? "관리자 크레딧 발급",
      })
      .select()
      .single();

    if (txError) {
      return NextResponse.json({ error: txError.message }, { status: 500 });
    }

    // org_id가 있으면 organizations.total_credits increment
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

    return NextResponse.json({ tx }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
