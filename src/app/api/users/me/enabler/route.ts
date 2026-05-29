import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { DbEnablerProfile } from "@/lib/db/types";
import { NextResponse } from "next/server";

export async function PATCH(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json() as Partial<Pick<
      DbEnablerProfile,
      "university" | "degree_type" | "specialties" | "location" | "bio" | "credit_rate"
    >>;

    const { university, degree_type, specialties, location, bio, credit_rate } = body;

    // credit_rate 검증: 1 이상 정수
    if (credit_rate !== undefined) {
      if (!Number.isInteger(credit_rate) || credit_rate < 1) {
        return NextResponse.json({ error: "credit_rate는 1 이상의 정수여야 합니다." }, { status: 400 });
      }
    }

    // specialties 검증: 배열 + 문자열만
    if (specialties !== undefined) {
      if (!Array.isArray(specialties) || specialties.some((s) => typeof s !== "string")) {
        return NextResponse.json({ error: "specialties는 문자열 배열이어야 합니다." }, { status: 400 });
      }
    }

    // bio 검증: 500~1000자
    if (bio !== undefined) {
      const trimmedBio = bio.trim();
      if (trimmedBio.length < 500 || trimmedBio.length > 1000) {
        return NextResponse.json({ error: "자기소개는 500자 이상 1000자 이하로 작성해 주세요." }, { status: 400 });
      }
    }

    const { data, error } = await db
      .from("enabler_profiles")
      .update({
        ...(university !== undefined && { university }),
        ...(degree_type !== undefined && { degree_type }),
        ...(specialties !== undefined && { specialties }),
        ...(location !== undefined && { location }),
        ...(bio !== undefined && { bio }),
        ...(credit_rate !== undefined && { credit_rate }),
      })
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ profile: data as DbEnablerProfile });
  } catch { return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}
