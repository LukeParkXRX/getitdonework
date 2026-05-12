import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { sendEmail, APP_URL } from "@/lib/email";
import { enablerApplicationReceivedEmail } from "@/lib/emails/templates";
import { rateLimit, getClientKey } from "@/lib/rate-limit";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "luke@xrx.studio";

export async function POST(request: Request) {
  const rl = await rateLimit(`enabler-apply:${getClientKey(request)}`, { max: 3, windowMs: 60 * 60 * 1000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "너무 많은 요청입니다. 잠시 후 다시 시도해 주세요." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  try {
    const body = await request.json();
    const {
      name,
      email,
      university,
      degreeType,
      location,
      photoUrl,
      specialties,
      bio,
      creditRate,
    } = body;

    // 서버 검증
    if (!name?.trim()) {
      return NextResponse.json({ error: "이름을 입력해 주세요." }, { status: 400 });
    }
    if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "유효한 이메일을 입력해 주세요." }, { status: 400 });
    }
    if (!university?.trim()) {
      return NextResponse.json({ error: "대학교를 입력해 주세요." }, { status: 400 });
    }
    if (!degreeType?.trim()) {
      return NextResponse.json({ error: "학위 유형을 선택해 주세요." }, { status: 400 });
    }
    if (!location?.trim()) {
      return NextResponse.json({ error: "활동 지역을 선택해 주세요." }, { status: 400 });
    }
    if (!Array.isArray(specialties) || specialties.length === 0) {
      return NextResponse.json({ error: "전문 분야를 1개 이상 선택해 주세요." }, { status: 400 });
    }
    if (!bio?.trim() || bio.trim().length < 100) {
      return NextResponse.json({ error: "자기소개를 100자 이상 입력해 주세요." }, { status: 400 });
    }

    const rate = Number(creditRate);
    if (!Number.isInteger(rate) || rate < 1 || rate > 10) {
      return NextResponse.json({ error: "유효한 크레딧 단가를 입력해 주세요." }, { status: 400 });
    }

    // RLS INSERT 공개 — 일반 server client 사용
    const supabase = await createServerSupabaseClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    const { data, error } = await db
      .from("enabler_applications")
      .insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        university: university.trim(),
        degree_type: degreeType.trim(),
        location: location.trim(),
        photo_url: photoUrl ?? null,
        specialties,
        bio: bio.trim(),
        credit_rate: rate,
      })
      .select("id")
      .single();

    if (error) {
      const isSchemaError =
        error.message?.includes("schema cache") ||
        error.message?.includes("does not exist") ||
        error.message?.includes("relation") ||
        error.code === "42P01";
      if (isSchemaError) {
        return NextResponse.json(
          { error: "신청 시스템이 현재 점검 중입니다. luke@xrx.studio 로 직접 문의해 주세요." },
          { status: 503 },
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 관리자 이메일 — fire-and-forget
    void (async () => {
      try {
        await sendEmail(
          ADMIN_EMAIL,
          enablerApplicationReceivedEmail({
            applicantName: name.trim(),
            applicantEmail: email.trim().toLowerCase(),
            university: university.trim(),
            degreeType: degreeType.trim(),
            location: location.trim(),
            specialties,
            bio: bio.trim(),
            creditRate: rate,
            applicationId: data.id,
          })
        );
      } catch { /* 이메일 실패는 응답에 영향 없음 */ }
    })();

    return NextResponse.json({ id: data.id });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
