import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ booking: null });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    // 이미 리뷰 작성한 booking_id 목록
    const { data: reviewed } = await db
      .from("reviews")
      .select("booking_id")
      .eq("author_id", user.id);

    const reviewedIds = (reviewed ?? []).map((r: { booking_id: string }) => r.booking_id);

    // 완료된 booking 중 리뷰 미작성 건 최신 1건
    let query = db
      .from("bookings")
      .select(`
        id,
        completed_at,
        enabler:users!enabler_id ( id, full_name )
      `)
      .eq("startup_id", user.id)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(1);

    if (reviewedIds.length > 0) {
      query = query.not("id", "in", `(${reviewedIds.join(",")})`);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ booking: null });

    const row = data?.[0] ?? null;
    if (!row) return NextResponse.json({ booking: null });

    const enablerRaw = Array.isArray(row.enabler) ? row.enabler[0] : row.enabler;

    return NextResponse.json({
      booking: {
        id: row.id,
        enabler_id: enablerRaw?.id ?? null,
        enabler_name: enablerRaw?.full_name ?? "Enabler",
        completed_at: row.completed_at,
      },
    });
  } catch {
    return NextResponse.json({ booking: null });
  }
}
