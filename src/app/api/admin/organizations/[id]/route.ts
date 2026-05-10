import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { logAdminAction } from "@/lib/admin-audit";

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

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { error, status, db, userId } = await getAdminDb();
    if (error || !db) return NextResponse.json({ error }, { status });

    const body = (await request.json()) as {
      name?: string;
      programName?: string;
      logoUrl?: string;
      totalCredits?: number;
    };

    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.programName !== undefined) updates.program_name = body.programName;
    if ("logoUrl" in body) updates.logo_url = body.logoUrl ?? null;
    if (body.totalCredits !== undefined) updates.total_credits = body.totalCredits;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const { data, error: dbError } = await db
      .from("organizations")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "대상을 찾을 수 없습니다" }, { status: 404 });

    logAdminAction(db, userId!, {
      action: "update_organization",
      targetType: "organization",
      targetId: id,
    }).catch(() => {});

    return NextResponse.json({ org: data });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { error, status, db, userId } = await getAdminDb();
    if (error || !db) return NextResponse.json({ error }, { status });

    const { error: dbError } = await db
      .from("organizations")
      .delete()
      .eq("id", id);

    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

    logAdminAction(db, userId!, {
      action: "delete_organization",
      targetType: "organization",
      targetId: id,
    }).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
