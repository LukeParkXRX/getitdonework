import { baseEmail, textStyles, infoCard, highlightBox, escapeHtml } from "./_layout";
import type { EmailPayload } from "./welcome";

export type EnablerApplicationSubmittedInput = {
  applicantName: string;
  applicantEmail: string;
  university: string;
  degreeType: string;
  location: string;
  specialties: string[];
  resumeFileName: string;
  linkedinUrl: string;
};

export function enablerApplicationSubmittedEmail(
  input: EnablerApplicationSubmittedInput
): EmailPayload<EnablerApplicationSubmittedInput> {
  const subject = "[Get It Done] Enabler application received";
  const safeApplicantName = escapeHtml(input.applicantName);

  const children = `
    <h1 style="${textStyles.h1}">Your Enabler application has been received.</h1>

    <p style="${textStyles.body}">
      Hi ${safeApplicantName}, thanks for applying to become an Enabler on Get It Done at Work.
      Our team will review your application and email you if you are approved.
    </p>

    ${infoCard([
      { label: "Name", value: input.applicantName },
      { label: "Email", value: input.applicantEmail },
      { label: "School", value: input.university },
      { label: "Degree", value: input.degreeType },
      { label: "Location", value: input.location },
      { label: "Resume", value: input.resumeFileName },
      { label: "LinkedIn", value: input.linkedinUrl },
      { label: "Expertise", value: input.specialties.join(", ") },
    ])}

    ${highlightBox(
      "If approved, you will receive a private sign-up link. Please use that link to create your Enabler account."
    )}
  `;

  const html = baseEmail({
    preheader: "We received your Enabler application. Our team will review it shortly.",
    title: subject,
    children,
  });

  const text = `
Your Enabler application has been received.

Hi ${input.applicantName},

Thanks for applying to become an Enabler on Get It Done at Work.
Our team will review your application and email you if you are approved.

Name: ${input.applicantName}
Email: ${input.applicantEmail}
School: ${input.university}
Degree: ${input.degreeType}
Location: ${input.location}
Resume: ${input.resumeFileName}
LinkedIn: ${input.linkedinUrl}
Expertise: ${input.specialties.join(", ")}

If approved, you will receive a private sign-up link. Please use that link to create your Enabler account.

Get It Done at Work
https://getitdonework.com
  `.trim();

  return { subject, html, text, props: input };
}
