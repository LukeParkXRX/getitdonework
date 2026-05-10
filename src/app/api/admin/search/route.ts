import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

async function getAdminUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", status: 401 as const, userId: null };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: me } = await (supabase as any)
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (me?.role !== "super_admin") return { error: "Forbidden", status: 403 as const, userId: null };
  return { error: null, status: 200 as const, userId: user.id };
}

// GET /api/admin/search?q=...
export async function GET(request: Request) {
  try {
    const { error, status } = await getAdminUser();
    if (error) return NextResponse.json({ error }, { status });

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") ?? "").trim();

    if (q.length < 2) {
      return NextResponse.json({ error: "최소 2글자 이상 입력하세요" }, { status: 400 });
    }

    let db: ReturnType<typeof createServiceClient>;
    try {
      db = createServiceClient();
    } catch {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d = db as any;
    const pattern = `%${q}%`;

    const [usersRes, bookingsRes, applicationsRes, inquiriesRes, orgsRes] = await Promise.all([
      // users: full_name, email
      d
        .from("users")
        .select("id, full_name, email, role")
        .or(`full_name.ilike.${pattern},email.ilike.${pattern}`)
        .limit(5),

      // bookings: id prefix match (UUID), brief
      d
        .from("bookings")
        .select("id, status, scheduled_at, brief")
        .or(`id.ilike.${pattern},brief.ilike.${pattern}`)
        .limit(5),

      // enabler_applications: name, email
      d
        .from("enabler_applications")
        .select("id, name, email, status")
        .or(`name.ilike.${pattern},email.ilike.${pattern}`)
        .limit(5),

      // contact_inquiries: name, email
      d
        .from("contact_inquiries")
        .select("id, name, email, inquiry_type")
        .or(`name.ilike.${pattern},email.ilike.${pattern}`)
        .limit(5),

      // organizations: name, slug
      d
        .from("organizations")
        .select("id, name, slug")
        .or(`name.ilike.${pattern},slug.ilike.${pattern}`)
        .limit(5),
    ]);

    return NextResponse.json({
      users: (usersRes.data ?? []).map((u: { id: string; full_name: string | null; email: string | null; role: string | null }) => ({
        id: u.id,
        name: u.full_name,
        email: u.email,
        role: u.role,
        href: `/admin/users`,
      })),
      bookings: (bookingsRes.data ?? []).map((b: { id: string; status: string | null; scheduled_at: string | null }) => ({
        id: b.id,
        status: b.status,
        scheduled_at: b.scheduled_at,
        href: `/admin/credits?search=${encodeURIComponent(b.id)}`,
      })),
      applications: (applicationsRes.data ?? []).map((a: { id: string; name: string | null; email: string | null; status: string | null }) => ({
        id: a.id,
        name: a.name,
        email: a.email,
        status: a.status,
        href: `/admin/applications?id=${a.id}`,
      })),
      inquiries: (inquiriesRes.data ?? []).map((i: { id: string; name: string | null; email: string | null; inquiry_type: string | null }) => ({
        id: i.id,
        name: i.name,
        email: i.email,
        inquiry_type: i.inquiry_type,
        href: `/admin/inquiries?id=${i.id}`,
      })),
      organizations: (orgsRes.data ?? []).map((o: { id: string; name: string | null; slug: string | null }) => ({
        id: o.id,
        name: o.name,
        slug: o.slug,
        href: `/admin/organizations`,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
