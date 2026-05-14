import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { verifyImpersonationToken } from "@/lib/impersonation";

export type EffectiveUser = {
  userId: string;
  impersonating: boolean;
  adminId?: string;
};

export async function getEffectiveUserId(): Promise<EffectiveUser | null> {
  const cookieStore = await cookies();
  const impCookie = cookieStore.get("__impersonate")?.value;
  if (impCookie) {
    const payload = verifyImpersonationToken(impCookie);
    if (payload) {
      return {
        userId: payload.targetUserId,
        impersonating: true,
        adminId: payload.adminId,
      };
    }
  }
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;
  return { userId: session.user.id, impersonating: false };
}
