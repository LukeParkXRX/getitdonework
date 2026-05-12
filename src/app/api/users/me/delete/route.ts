import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET — 삭제 요청 현황 조회
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data } = await db
      .from("account_deletion_requests")
      .select("scheduled_for")
      .eq("user_id", user.id)
      .is("cancelled_at", null)
      .is("completed_at", null)
      .maybeSingle();

    return NextResponse.json(data ?? {});
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST — 삭제 요청 등록
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let reason: string | undefined;
    try {
      const body = (await request.json()) as { reason?: string };
      reason = body.reason;
    } catch {
      // body 없어도 OK
    }

    const scheduledFor = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await db
      .from("account_deletion_requests")
      .upsert(
        {
          user_id: user.id,
          requested_at: new Date().toISOString(),
          scheduled_for: scheduledFor,
          reason: reason ?? null,
          cancelled_at: null,
          completed_at: null,
        },
        { onConflict: "user_id" }
      )
      .select("scheduled_for")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ scheduled_for: (data as { scheduled_for: string }).scheduled_for });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE — 삭제 요청 취소
export async function DELETE() {
  try {
    const supabase = await createServerSupabaseClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { error } = await db
      .from("account_deletion_requests")
      .update({ cancelled_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .is("cancelled_at", null)
      .is("completed_at", null);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
