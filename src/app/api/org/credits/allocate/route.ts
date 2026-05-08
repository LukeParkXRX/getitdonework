import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    // org_admin 인증 + org_id 확인
    const { data: me } = await db
      .from("users")
      .select("role, org_id")
      .eq("id", user.id)
      .maybeSingle();

    if (me?.role !== "org_admin" || !me?.org_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const myOrgId = me.org_id as string;

    // body 파싱
    const body = await req.json();
    const { startup_user_id, amount, description } = body as {
      startup_user_id: unknown;
      amount: unknown;
      description?: unknown;
    };

    if (typeof startup_user_id !== "string" || !startup_user_id) {
      return NextResponse.json(
        { error: "startup_user_id is required" },
        { status: 400 }
      );
    }

    const parsedAmount = Number(amount);
    if (!Number.isInteger(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: "amount must be a positive integer" },
        { status: 400 }
      );
    }

    // startup_user_id가 본인 org의 멤버인지 검증
    const { data: targetUser } = await db
      .from("users")
      .select("id, role, org_id")
      .eq("id", startup_user_id)
      .maybeSingle();

    if (
      !targetUser ||
      targetUser.role !== "startup" ||
      targetUser.org_id !== myOrgId
    ) {
      return NextResponse.json(
        { error: "Target user is not a member of your organization" },
        { status: 400 }
      );
    }

    // RPC 호출
    const { data: tx, error: rpcError } = await db.rpc(
      "allocate_credits_to_startup",
      {
        p_org_id: myOrgId,
        p_startup_id: startup_user_id,
        p_amount: parsedAmount,
        p_description:
          typeof description === "string" && description.trim()
            ? description.trim()
            : "크레딧 배분",
      }
    );

    if (rpcError) {
      return NextResponse.json({ error: rpcError.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      balance_after: (tx as { balance_after: number } | null)?.balance_after ?? null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
