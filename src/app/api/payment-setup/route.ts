import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import {
  paymentSetupSubmissionEmail,
  type PaymentSetupSubmissionInput,
} from "@/lib/emails/templates";

export const runtime = "nodejs";

const TO = process.env.PAYMENT_SETUP_RECIPIENT ?? "luke@xrx.studio";

function asString(v: unknown): string {
  if (typeof v === "string") return v.trim();
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "예" : "아니오";
  return "";
}

export async function POST(req: NextRequest) {
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
    bankInfo: asString(body.bankInfo),
    stripeConnectStatus: asString(body.stripeConnectStatus),

    tokenUsdRate: asString(body.tokenUsdRate),
    platformFeePct: asString(body.platformFeePct),

    refundDays: asString(body.refundDays),

    additionalNotes: asString(body.additionalNotes),
  };

  const payload = paymentSetupSubmissionEmail(input);
  const result = await sendEmail(TO, payload);

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: `이메일 전송 실패: ${result.error}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
