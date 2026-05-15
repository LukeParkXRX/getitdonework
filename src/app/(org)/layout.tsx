import type { ReactNode } from "react";
import Navbar from "@/components/layout/Navbar";
import { requireRole } from "@/lib/supabase/guards";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";

export default async function OrgLayout({ children }: { children: ReactNode }) {
  // 기관 관리 영역: org_admin 또는 super_admin만 허용.
  await requireRole(["org_admin", "super_admin"], "/org/dashboard");
  return (
    <>
      <Navbar />
      <OnboardingWizard />
      <div style={{ paddingTop: 56 }}>{children}</div>
    </>
  );
}
