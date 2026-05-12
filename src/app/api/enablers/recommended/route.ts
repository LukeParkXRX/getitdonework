import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// ── Score calculation ──────────────────────────────────────────────────────────

type EnablerRow = {
  user_id: string;
  specialties: string[];
  rating: number;
  session_count: number;
  re_request_rate: number;
  enabler_score: number;
  university: string;
  degree_type: string;
  location: string;
  bio: string;
  credit_rate: number;
  badge_level: string;
  users:
    | { full_name: string; avatar_url: string | null }
    | { full_name: string; avatar_url: string | null }[]
    | null;
};

type StartupProfile = {
  industry: string[];
  stage: string;
  us_goal: string;
};

function calculateScore(
  enabler: EnablerRow,
  startup: StartupProfile | null,
): number {
  let score = 0;

  // 평점 가중치 (0~50)
  score += (enabler.rating ?? 0) * 10;

  // 세션 수 가중치 (0~20, 100세션에서 saturate)
  score += Math.min((enabler.session_count ?? 0) / 5, 20);

  // 재요청률 (0~30)
  score += (enabler.re_request_rate ?? 0) * 0.3;

  // enabler_score (0~30)
  score += (enabler.enabler_score ?? 0) * 0.3;

  if (startup) {
    const industries = startup.industry ?? [];
    // us_goal에서 키워드 추출 (공백 split)
    const goalKeywords = (startup.us_goal ?? "")
      .split(/[\s,]+/)
      .filter((k) => k.length > 2)
      .map((k) => k.toLowerCase());

    const specs = (enabler.specialties ?? []).map((s) => s.toLowerCase());

    // 업종 매칭 (15점/매칭)
    for (const ind of industries) {
      if (specs.some((s) => s.includes(ind.toLowerCase()))) {
        score += 15;
      }
    }

    // us_goal 키워드 매칭 (5점/키워드)
    for (const kw of goalKeywords) {
      if (specs.some((s) => s.includes(kw))) {
        score += 5;
      }
    }

    // stage 매칭 — seed/pre-seed enabler 우선
    const stage = (startup.stage ?? "").toLowerCase();
    if (stage && specs.some((s) => s.includes(stage))) {
      score += 10;
    }
  }

  return score;
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    // 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // startup 프로필 fetch
    const { data: startupData } = await supabase
      .from("startup_profiles")
      .select("industry, stage, us_goal")
      .eq("user_id", user.id)
      .single();

    const startup = startupData as StartupProfile | null;

    // 승인된 enabler 전체 fetch
    const { data: enablerData, error: enablerError } = await supabase
      .from("enabler_profiles")
      .select(
        `user_id,
         specialties,
         rating,
         session_count,
         re_request_rate,
         enabler_score,
         university,
         degree_type,
         location,
         bio,
         credit_rate,
         badge_level,
         users!inner ( full_name, avatar_url )`,
      )
      .eq("status", "approved");

    if (enablerError) {
      return NextResponse.json(
        { error: enablerError.message },
        { status: 500 },
      );
    }

    const enablers = (enablerData ?? []) as unknown as EnablerRow[];

    // 점수 계산 + 정렬
    const scored = enablers
      .map((e) => ({
        enabler: e,
        score: calculateScore(e, startup),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    // 매칭 사유 생성
    function buildReasons(e: EnablerRow, startup: StartupProfile | null): string[] {
      const reasons: string[] = [];

      if (startup) {
        const specs = (e.specialties ?? []).map((s) => s.toLowerCase());
        for (const ind of startup.industry ?? []) {
          if (specs.some((s) => s.includes(ind.toLowerCase()))) {
            reasons.push(`${ind} 전문`);
          }
        }
      }

      if (e.university) {
        reasons.push(e.university);
      }

      if ((e.rating ?? 0) >= 4.5) {
        reasons.push(`평점 ${Number(e.rating).toFixed(1)}`);
      }

      if ((e.re_request_rate ?? 0) >= 70) {
        reasons.push(`재요청률 ${Math.round(e.re_request_rate)}%`);
      }

      return reasons.slice(0, 3);
    }

    const recommended = scored.map(({ enabler: e, score }) => {
      const usersRaw = Array.isArray(e.users) ? e.users[0] : e.users;
      const fullName = usersRaw?.full_name ?? "";
      const avatarUrl = usersRaw?.avatar_url ?? null;
      const avatarInitial = fullName
        ? fullName
            .split(" ")
            .map((w: string) => w[0] ?? "")
            .join("")
            .slice(0, 2)
            .toUpperCase()
        : "";

      return {
        userId: e.user_id,
        fullName,
        avatarUrl,
        avatarInitial,
        university: e.university,
        degreeType: e.degree_type,
        specialties: e.specialties ?? [],
        location: e.location,
        bio: e.bio,
        creditRate: e.credit_rate,
        badgeLevel: e.badge_level,
        sessionCount: e.session_count,
        rating: Number(e.rating),
        reRequestRate: e.re_request_rate,
        score,
        reasons: buildReasons(e, startup),
      };
    });

    return NextResponse.json({ recommended });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
