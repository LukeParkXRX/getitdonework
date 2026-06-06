export type PublicEnablerProfileFields = {
  fullName?: string | null;
  university?: string | null;
  degreeType?: string | null;
  location?: string | null;
  bio?: string | null;
  specialties?: string[] | null;
};

const PLACEHOLDER_PATTERN = /\b(test|placeholder|sample|dummy|todo|tbd|n\/a)\b/i;

function hasRealText(value: string | null | undefined, minLength = 2): boolean {
  const text = value?.trim() ?? "";
  return text.length >= minLength && !PLACEHOLDER_PATTERN.test(text);
}

export function getPublicEnablerProfileIssues(
  profile: PublicEnablerProfileFields
): string[] {
  const issues: string[] = [];

  if (!hasRealText(profile.fullName)) issues.push("name");
  if (!hasRealText(profile.university)) issues.push("university");
  if (!hasRealText(profile.degreeType)) issues.push("degree");
  if (!hasRealText(profile.location)) issues.push("location");
  if (!hasRealText(profile.bio, 20)) issues.push("bio");

  const specialties = Array.isArray(profile.specialties)
    ? profile.specialties.map((item) => item.trim()).filter(Boolean)
    : [];

  if (
    specialties.length === 0 ||
    specialties.some((item) => !hasRealText(item))
  ) {
    issues.push("specialties");
  }

  return issues;
}

export function isPublicEnablerProfileComplete(
  profile: PublicEnablerProfileFields
): boolean {
  return getPublicEnablerProfileIssues(profile).length === 0;
}
