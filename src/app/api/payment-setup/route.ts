import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import {
  paymentSetupSubmissionEmail,
  type PaymentSetupSubmissionInput,
  type PaymentSetupPackage,
} from "@/lib/emails/templates";

export const runtime = "nodejs";

const TO = process.env.PAYMENT_SETUP_RECIPIENT ?? "luke@xrx.studio";

function asString(v: unknown): string {
  if (typeof v === "string") return v.trim();
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "예" : "아니오";
  return "";
}

function asStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => asString(x)).filter(Boolean);
  return [];
}

function asPackages(v: unknown): PaymentSetupPackage[] {
  if (!Array.isArray(v)) return [];
  const result: PaymentSetupPackage[] = [];
  for (const p of v) {
    if (typeof p !== "object" || p === null) continue;
    const obj = p as Record<string, unknown>;
    result.push({
      name: asString(obj.name),
      tokens: asString(obj.tokens),
      priceKrw: asString(obj.priceKrw),
    });
  }
  return result;
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON 파싱 실패" }, { status: 400 });
  }

  // Honeypot — bots fill this hidden field
  if (asString(body.website)) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const submitterEmail = asString(body.submitterEmail);
  if (!submitterEmail || !submitterEmail.includes("@")) {
    return NextResponse.json(
      { ok: false, error: "제출자 이메일을 입력해주세요." },
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

    bizRegNumber: asString(body.bizRegNumber),
    bizName: asString(body.bizName),
    representativeName: asString(body.representativeName),
    representativeBirth: asString(body.representativeBirth),
    bizAddress: asString(body.bizAddress),
    bizPhone: asString(body.bizPhone),
    bizEmail: asString(body.bizEmail),
    isCorporation: body.isCorporation === true || body.isCorporation === "true",
    corporationDetails: asString(body.corporationDetails),

    bankName: asString(body.bankName),
    accountNumber: asString(body.accountNumber),
    accountHolder: asString(body.accountHolder),
    swiftCode: asString(body.swiftCode),

    serviceDescription: asString(body.serviceDescription),
    customerSupportEmail: asString(body.customerSupportEmail),

    paymentMethods: asStringArray(body.paymentMethods),

    autoApprovalThresholdKrw: asString(body.autoApprovalThresholdKrw),
    approvalExpirationDays: asString(body.approvalExpirationDays),

    refundDays: asString(body.refundDays),
    partialRefund: asString(body.partialRefund),
    cancelWithin24hPercent: asString(body.cancelWithin24hPercent),
    refundProcessingDays: asString(body.refundProcessingDays),

    packages: asPackages(body.packages),

    taxpayerType: asString(body.taxpayerType),
    vatDisplay: asString(body.vatDisplay),
    useStripeTax: asString(body.useStripeTax),

    invoiceLanguage: asString(body.invoiceLanguage),

    tokenUsdRate: asString(body.tokenUsdRate),
    platformFeePct: asString(body.platformFeePct),
    hasEnablerTiers: asString(body.hasEnablerTiers),
    enablerTierDetails: asString(body.enablerTierDetails),
    minPayoutUsd: asString(body.minPayoutUsd),

    taxAdvisorNotes: asString(body.taxAdvisorNotes),
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
