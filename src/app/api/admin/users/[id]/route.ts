import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const VALID_ROLES = ["startup", "enabler", "org_admin", "super_admin"] as const;
type Role = (typeof VALID_ROLES)[number];

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    const { data: me } = await db
      .from("users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (me?.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as {
      role?: Role;
      is_verified?: boolean;
      org_id?: string | null;
    };

    const updates: Record<string, unknown> = {};

    if (body.role !== undefined) {
      if (!VALID_ROLES.includes(body.role)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }
      updates.role = body.role;
    }

    if (body.is_verified !== undefined) {
      updates.is_verified = body.is_verified;
    }

    if ("org_id" in body) {
      updates.org_id = body.org_id;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const { data, error } = await db
      .from("users")
      .update(updates)
      .eq("id", id)
      .select();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "변경할 수 없습니다. 권한 또는 대상 확인 필요" },
        { status: 403 }
      );
    }
    return NextResponse.json({ user: data[0] });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
