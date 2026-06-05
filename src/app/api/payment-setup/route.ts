import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import {
  paymentSetupSubmissionEmail,
  type PaymentSetupSubmissionInput,
} from "@/lib/emails/templates";
import { getPaymentSetupRecipientEmails } from "@/lib/admin-notifications";
import { findSensitivePaymentSetupInput } from "@/lib/security/sensitive-input";
import { getClientKey, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

function asString(v: unknown): string {
  if (typeof v === "string") return v.trim();
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "예" : "아니오";
  return "";
}

export async function POST(req: NextRequest) {
  const rl = await rateLimit(`payment-setup:${getClientKey(req)}`, { max: 3, windowMs: 60 * 60 * 1000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: "너무 많은 요청입니다. 잠시 후 다시 시도해 주세요." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON 파싱 실패" }, { status: 400 });
  }

  // honeypot
  if (asString(body.website)) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const submitterEmail = asString(body.submitterEmail);
  if (!submitterEmail || !submitterEmail.includes("@")) {
    return NextResponse.json(
      { ok: false, error: "회신 받으실 이메일을 입력해주세요." },
      { status: 400 }
    );
  }

  const bankInfo = asString(body.bankInfo);
  const additionalNotes = asString(body.additionalNotes);
  const sensitive = findSensitivePaymentSetupInput({
    bankInfo,
    additionalNotes,
  });
  if (sensitive) {
    return NextResponse.json(
      {
        ok: false,
        error:
          sensitive.field === "bankInfo"
            ? "은행 계좌번호나 라우팅 번호는 이 폼에 입력하지 마세요. 은행명 또는 준비 상황만 적어주세요."
            : "Stripe secret key, webhook secret, 개인 키 같은 민감정보는 이 폼에 입력하지 마세요. 별도 승인된 보안 채널로 전달해 주세요.",
      },
      { status: 400 },
    );
  }

  const input: PaymentSetupSubmissionInput = {
    submittedAt: new Date().toLocaleString("ko-KR", {
      timeZone: "Asia/Seoul",
      hour12: false,
    }),

    submitterName: asString(body.submitterName),
    submitterEmail,
    companyName: asString(body.companyName),
    representativeName: asString(body.representativeName),
    companyAddress: asString(body.companyAddress),
    contactEmail: asString(body.contactEmail),

    taxFormType: asString(body.taxFormType),
    hasUsBankAccount: asString(body.hasUsBankAccount),
    bankInfo,
    stripeConnectStatus: asString(body.stripeConnectStatus),

    tokenUsdRate: asString(body.tokenUsdRate),
    platformFeePct: asString(body.platformFeePct),

    refundDays: asString(body.refundDays),

    additionalNotes,
  };

  const payload = paymentSetupSubmissionEmail(input);
  const result = await sendEmail(getPaymentSetupRecipientEmails(), payload);

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: `이메일 전송 실패: ${result.error}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
