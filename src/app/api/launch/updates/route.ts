import { NextResponse } from "next/server";
import { verifyLaunchEmail } from "@/lib/launch-dashboard-auth";
import { createUntypedAdminClient } from "@/lib/supabase/server";

interface PostBody {
  author_name?: string;
  author_role: "korea_dev" | "us_partner";
  type: "daily" | "feedback" | "question" | "blocker" | "milestone";
  title: string;
  body: string;
  related_item_id?: string | null;
}

function extractEmail(req: Request): string {
  return req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ?? "";
}

function emailToName(email: string): string {
  const local = email.split("@")[0] ?? email;
  return local.charAt(0).toUpperCase() + local.slice(1);
}

export async function POST(req: Request) {
  const email = extractEmail(req);

  if (!verifyLaunchEmail(email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: PostBody;
  try {
    body = (await req.json()) as PostBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.author_role || !body.type || !body.title || !body.body) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const authorName =
    typeof body.author_name === "string" && body.author_name.trim().length > 0
      ? body.author_name.trim()
      : emailToName(email);

  const supabase = createUntypedAdminClient();

  const { data, error } = await supabase
    .from("launch_updates")
    .insert({
      author_name: authorName,
      author_role: body.author_role,
      type: body.type,
      title: body.title,
      body: body.body,
      related_item_id: body.related_item_id ?? null,
      resolved: false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ update: data }, { status: 201 });
}
