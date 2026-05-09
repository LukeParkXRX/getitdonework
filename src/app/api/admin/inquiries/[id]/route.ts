import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    const { data: me } = await db
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (me?.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body as {
      action: "mark_replied" | "archive" | "reopen";
    };

    const STATUS_MAP: Record<string, string> = {
      mark_replied: "replied",
      archive: "archived",
      reopen: "new",
    };

    const newStatus = STATUS_MAP[action];
    if (!newStatus) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const { error } = await db
      .from("contact_inquiries")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, status: newStatus });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
