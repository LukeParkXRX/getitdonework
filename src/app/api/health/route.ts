import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const start = Date.now();

  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from("enabler_profiles").select("user_id").limit(1);

    if (error) {
      return Response.json(
        { status: "degraded", db: "error", error: error.message, timestamp: new Date().toISOString() },
        { status: 503 }
      );
    }

    return Response.json({
      status: "ok",
      db: "ok",
      latency_ms: Date.now() - start,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return Response.json(
      {
        status: "error",
        error: err instanceof Error ? err.message : "unknown",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
