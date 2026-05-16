import { NextResponse } from "next/server";
import { verifyLaunchEmail } from "@/lib/launch-dashboard-auth";
import { createUntypedAdminClient } from "@/lib/supabase/server";

function extractEmail(req: Request): string {
  return req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ?? "";
}

export async function GET(req: Request) {
  const email = extractEmail(req);
  if (!verifyLaunchEmail(email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createUntypedAdminClient();
  const { data, error } = await supabase
    .from("launch_services")
    .select("*")
    .order("display_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ services: data });
}

export async function POST(req: Request) {
  const email = extractEmail(req);
  if (!verifyLaunchEmail(email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body.id !== "string" || typeof body.name !== "string") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const supabase = createUntypedAdminClient();
  const { data, error } = await supabase
    .from("launch_services")
    .insert({
      id: body.id,
      name: body.name,
      category: body.category ?? "",
      url: body.url ?? null,
      description: body.description ?? "",
      monthly_cost_usd: body.monthly_cost_usd ?? 0,
      cost_note: body.cost_note ?? "",
      is_active: body.is_active ?? true,
      display_order: body.display_order ?? 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ service: data }, { status: 201 });
}
