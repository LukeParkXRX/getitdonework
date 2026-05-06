import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

async function getAdminDb() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", status: 401, db: null, userId: null };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data: me } = await db.from("users").select("role").eq("id", user.id).maybeSingle();
  if (me?.role !== "super_admin") return { error: "Forbidden", status: 403, db: null, userId: null };

  return { error: null, status: 200, db, userId: user.id };
}

export async function POST(request: Request) {
  try {
    const { error, status, db } = await getAdminDb();
    if (error || !db) return NextResponse.json({ error }, { status });

    const body = (await request.json()) as {
      name: string;
      slug: string;
      programName: string;
      logoUrl?: string;
      inviteCode: string;
      totalCredits?: number;
    };

    if (!body.name || !body.slug || !body.programName || !body.inviteCode) {
      return NextResponse.json({ error: "필수 필드가 누락되었습니다" }, { status: 400 });
    }

    const { data, error: dbError } = await db
      .from("organizations")
      .insert({
        name: body.name,
        slug: body.slug,
        program_name: body.programName,
        logo_url: body.logoUrl ?? null,
        invite_code: body.inviteCode,
        total_credits: body.totalCredits ?? 0,
      })
      .select()
      .single();

    if (dbError) {
      if (dbError.code === "23505") {
        return NextResponse.json({ error: "slug 또는 초대코드가 이미 존재합니다" }, { status: 400 });
      }
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({
      org: {
        id: data.id,
        name: data.name,
        slug: data.slug,
        programName: data.program_name,
        logoUrl: data.logo_url ?? undefined,
        inviteCode: data.invite_code,
        totalCredits: data.total_credits ?? 0,
        memberCount: 0,
        createdAt: data.created_at ?? "",
      },
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
