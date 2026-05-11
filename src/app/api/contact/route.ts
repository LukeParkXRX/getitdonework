import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { contactInquiryReceivedEmail } from "@/lib/emails/templates";
import { rateLimit, getClientKey } from "@/lib/rate-limit";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "luke@xrx.studio";

export async function POST(request: Request) {
  const rl = rateLimit(`contact:${getClientKey(request)}`, { max: 5, windowMs: 60 * 60 * 1000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "너무 많은 요청입니다. 잠시 후 다시 시도해 주세요." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  try {
    const body = await request.json();
    const { name, company, email, inquiryType, message } = body;

    // 서버 검증
    if (!name?.trim()) {
      return NextResponse.json({ error: "이름을 입력해 주세요." }, { status: 400 });
    }
    if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "유효한 이메일을 입력해 주세요." }, { status: 400 });
    }
    if (!inquiryType?.trim()) {
      return NextResponse.json({ error: "문의 유형을 선택해 주세요." }, { status: 400 });
    }
    if (!message?.trim() || message.trim().length < 10) {
      return NextResponse.json({ error: "문의 내용을 10자 이상 입력해 주세요." }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    const { data, error } = await db
      .from("contact_inquiries")
      .insert({
        name: name.trim(),
        company: company?.trim() || null,
        email: email.trim().toLowerCase(),
        inquiry_type: inquiryType.trim(),
        message: message.trim(),
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
          { error: "문의 시스템이 현재 점검 중입니다. luke@xrx.studio 로 직접 문의해 주세요." },
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
          contactInquiryReceivedEmail({
            name: name.trim(),
            company: company?.trim() || undefined,
            email: email.trim().toLowerCase(),
            inquiryType: inquiryType.trim(),
            message: message.trim(),
            inquiryId: data.id,
          })
        );
      } catch { /* 이메일 실패는 응답에 영향 없음 */ }
    })();

    return NextResponse.json({ id: data.id });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
