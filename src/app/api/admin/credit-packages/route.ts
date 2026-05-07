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

// GET /api/admin/credit-packages — 전체 목록 (비활성 포함)
export async function GET() {
  try {
    const { error, status, db } = await getAdminDb();
    if (error || !db) return NextResponse.json({ error }, { status });

    const { data, error: dbErr } = await db
      .from("credit_packages")
      .select("*")
      .order("sort_order", { ascending: true });

    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
    return NextResponse.json({ packages: data });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/admin/credit-packages — 신규 패키지 생성
export async function POST(request: Request) {
  try {
    const { error, status, db } = await getAdminDb();
    if (error || !db) return NextResponse.json({ error }, { status });

    const body = await request.json();
    const { name, credits, price_krw, stripe_price_id, is_active, sort_order } = body as {
      name: string;
      credits: number;
      price_krw: number;
      stripe_price_id?: string;
      is_active?: boolean;
      sort_order?: number;
    };

    if (!name || !credits || !price_krw) {
      return NextResponse.json(
        { error: "name, credits, price_krw는 필수입니다." },
        { status: 400 }
      );
    }

    const { data, error: dbErr } = await db
      .from("credit_packages")
      .insert({
        name,
        credits,
        price_krw,
        stripe_price_id: stripe_price_id ?? null,
        is_active: is_active ?? true,
        sort_order: sort_order ?? 0,
      })
      .select()
      .single();

    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
    return NextResponse.json({ package: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
