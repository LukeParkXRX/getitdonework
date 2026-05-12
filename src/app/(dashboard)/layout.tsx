import type { ReactNode } from "react";
import Navbar from "@/components/layout/Navbar";
import { requireRole } from "@/lib/supabase/guards";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";
import ReviewPromptModal from "@/components/reviews/ReviewPromptModal";
import TermsAcceptanceGate from "@/components/legal/TermsAcceptanceGate";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  // 모든 역할 보유자는 대시보드 그룹 접근 허용. 미인증·미온보딩은 guards가 리다이렉트.
  await requireRole(["startup", "enabler", "org_admin", "super_admin"], "/my");
  return (
    <>
      <Navbar />
      <TermsAcceptanceGate />
      <OnboardingWizard />
      <ReviewPromptModal />
      {children}
    </>
  );
}
