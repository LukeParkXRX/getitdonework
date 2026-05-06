import { baseEmail, textStyles, infoCard, highlightBox } from "./_layout";
import type { EmailPayload } from "./welcome";

export type EnablerApplicationReceivedInput = {
  applicantName: string;
  applicantEmail: string;
  university: string;
  degreeType: string;
  location: string;
  specialties: string[];
  bio: string;
  creditRate: number;
  applicationId: string;
};

export function enablerApplicationReceivedEmail(
  input: EnablerApplicationReceivedInput
): EmailPayload<EnablerApplicationReceivedInput> {
  const {
    applicantName,
    applicantEmail,
    university,
    degreeType,
    location,
    specialties,
    bio,
    creditRate,
    applicationId,
  } = input;

  const APP_URL =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://getitdonework.com";

  const subject = `[새 Enabler 지원] ${applicantName} (${university})`;

  const children = `
    <h1 style="${textStyles.h1}">새 Enabler 지원서가 도착했습니다.</h1>

    <p style="${textStyles.body}">
      아래 지원자를 검토하고 승인 여부를 결정해 주세요.
    </p>

    ${infoCard([
      { label: "지원자", value: applicantName },
      { label: "이메일", value: applicantEmail },
      { label: "대학교", value: university },
      { label: "학위 유형", value: degreeType },
      { label: "활동 지역", value: location },
      { label: "전문 분야", value: specialties.join(", ") },
      { label: "크레딧 단가", value: `${creditRate} 크레딧 / 시간` },
      { label: "지원서 ID", value: applicationId },
    ])}

    <h2 style="${textStyles.h2}">자기소개</h2>
    <p style="${textStyles.body}; background-color: #f9fafb; border-radius: 8px; padding: 14px 18px; font-size: 14px; color: #374151; white-space: pre-wrap;">
      ${bio}
    </p>

    ${highlightBox(
      "관리자 페이지에서 지원서를 검토하고 승인 또는 거절할 수 있습니다."
    )}
  `;

  const html = baseEmail({
    preheader: `${applicantName} (${university}) 님이 Enabler로 지원했습니다.`,
    title: subject,
    children,
    ctaButton: {
      label: "지원서 검토하기",
      href: `${APP_URL}/admin/enablers`,
    },
  });

  const text = `
[새 Enabler 지원] ${applicantName} (${university})

새 Enabler 지원서가 도착했습니다.

지원자: ${applicantName}
이메일: ${applicantEmail}
대학교: ${university}
학위 유형: ${degreeType}
활동 지역: ${location}
전문 분야: ${specialties.join(", ")}
크레딧 단가: ${creditRate} 크레딧 / 시간
지원서 ID: ${applicationId}

자기소개:
${bio}

관리자 페이지에서 검토: ${APP_URL}/admin/enablers

---
Get It Done at Work
https://getitdonework.com
  `.trim();

  return { subject, html, text, props: input };
}
