import { verifyLaunchEmail } from "@/lib/launch-dashboard-auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email : "";

  if (!verifyLaunchEmail(email)) {
    return new Response(JSON.stringify({ error: "not_authorized" }), { status: 401 });
  }

  return new Response(
    JSON.stringify({ ok: true, email: email.trim().toLowerCase() }),
    { status: 200 }
  );
}
