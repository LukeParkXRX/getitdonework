import { NextResponse } from "next/server";
import { verifyLaunchToken } from "@/lib/launch-dashboard-auth";
import { createUntypedAdminClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ token: string }>;
}

interface PostBody {
  author_name: string;
  author_role: "korea_dev" | "us_partner";
  type: "daily" | "feedback" | "question" | "blocker" | "milestone";
  title: string;
  body: string;
  related_item_id?: string | null;
}

export async function POST(req: Request, { params }: RouteParams) {
  const { token } = await params;

  if (!verifyLaunchToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: PostBody;
  try {
    body = (await req.json()) as PostBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.author_name || !body.author_role || !body.type || !body.title || !body.body) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = createUntypedAdminClient();

  const { data, error } = await supabase
    .from("launch_updates")
    .insert({
      author_name: body.author_name,
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
