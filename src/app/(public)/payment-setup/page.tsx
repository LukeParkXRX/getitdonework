import type { Metadata } from "next";
import PaymentSetupForm from "./PaymentSetupForm";

export const metadata: Metadata = {
  title: "결제 셋업 정보 입력",
  description: "Get It Done at Work 결제·정산 시스템 도입을 위한 정보 입력 폼",
  robots: { index: false, follow: false, nocache: true },
};

export default function PaymentSetupPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-16">
      <header className="mb-10">
        <p className="mb-2 text-sm font-medium uppercase tracking-wider text-[var(--color-accent)]">
          Internal · Payment Setup
        </p>
        <h1 className="mb-3 text-3xl font-bold tracking-tight text-neutral-50 sm:text-4xl">
          결제 셋업 정보 입력
        </h1>
        <p className="text-base leading-relaxed text-neutral-300">
          USD 정산을 받기 위한 핵심 정보 5가지를 입력해주세요.
          제출하면 개발자(Luke)에게 이메일로 전달되어 즉시 개발에 반영됩니다.
        </p>
        <p className="mt-3 text-sm text-neutral-400">
          예상 소요 시간 약 5분. 추후 어드민에서 모두 수정 가능합니다.
        </p>
      </header>

      <PaymentSetupForm />
    </main>
  );
}
