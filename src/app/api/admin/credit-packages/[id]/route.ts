import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

async function getAdminDb() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return { error: "Unauthorized", status: 401, db: null };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data: me } = await db
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (me?.role !== "super_admin")
    return { error: "Forbidden", status: 403, db: null };

  return { error: null, status: 200, db };
}

// PATCH /api/admin/credit-packages/[id] — 부분 수정
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, status, db } = await getAdminDb();
    if (error || !db) return NextResponse.json({ error }, { status });

    const { id } = await params;
    const body = await request.json();

    // 허용 필드만 추출
    const allowed = ["name", "credits", "price_krw", "stripe_price_id", "is_active", "sort_order"] as const;
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "수정할 필드가 없습니다." }, { status: 400 });
    }

    const { data, error: dbErr } = await db
      .from("credit_packages")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ package: data });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/admin/credit-packages/[id] — 삭제
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, status, db } = await getAdminDb();
    if (error || !db) return NextResponse.json({ error }, { status });

    const { id } = await params;

    const { error: dbErr } = await db
      .from("credit_packages")
      .delete()
      .eq("id", id);

    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
