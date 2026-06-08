import { baseEmail, textStyles, infoCard, highlightBox, escapeHtml } from "./_layout";
import type { EmailPayload } from "./welcome";

export type ApplicationApprovedInput = {
  applicantName: string;
  applicantEmail: string;
  signupLink: string;
};

export function applicationApprovedEmail(
  input: ApplicationApprovedInput
): EmailPayload<ApplicationApprovedInput> {
  const subject = "[Get It Done] Your Enabler application has been approved";
  const safeApplicantName = escapeHtml(input.applicantName);

  const details = infoCard([
    { label: "Applicant", value: input.applicantName },
    { label: "Email", value: input.applicantEmail },
  ]);

  const children = `
    <h1 style="${textStyles.h1}">Your Enabler application has been approved.</h1>
    <p style="${textStyles.body}">
      Hi <strong>${safeApplicantName}</strong>, your Get It Done at Work Enabler application has been reviewed and approved.
      Please use the private link below to create your Enabler account.
    </p>

    ${details}

    ${highlightBox(
      `Click the button below to create your Enabler account and complete your profile.<br>
       This link is private and should only be used by you.`
    )}
  `;

  const html = baseEmail({
    preheader: "Your Enabler application has been approved. Create your account now.",
    title: subject,
    children,
    ctaButton: {
      label: "Create Enabler account",
      href: input.signupLink,
    },
  });

  const text = `
[Get It Done at Work] Enabler application approved

Hi ${input.applicantName},

Your Get It Done at Work Enabler application has been approved.
Please create your account and complete your profile using the private link below.

Sign-up link: ${input.signupLink}

Thank you,
Get It Done at Work
https://getitdonework.com
  `.trim();

  return { subject, html, text, props: input };
}
