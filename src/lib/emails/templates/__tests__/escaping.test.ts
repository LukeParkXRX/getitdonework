import { describe, expect, test } from "bun:test";
import { contactInquiryReceivedEmail } from "@/lib/emails/templates/contact-inquiry-received";
import { enablerApplicationReceivedEmail } from "@/lib/emails/templates/enabler-application-received";
import { paymentSetupSubmissionEmail } from "@/lib/emails/templates/payment-setup-submission";

describe("email html escaping", () => {
  test("escapes contact inquiry user input in html", () => {
    const payload = contactInquiryReceivedEmail({
      name: "<b>Alice</b>",
      company: "<script>alert(1)</script>",
      email: "alice@example.com",
      inquiryType: "general",
      message: "<img src=x onerror=alert(1)>",
      inquiryId: "inq_1",
    });

    expect(payload.html).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(payload.html).not.toContain("<img src=x onerror=alert(1)>");
    expect(payload.html).not.toContain("<script>alert(1)</script>");
  });

  test("escapes enabler application bio in html", () => {
    const payload = enablerApplicationReceivedEmail({
      applicantName: "Bob",
      applicantEmail: "bob@example.com",
      university: "Stanford",
      degreeType: "MBA",
      location: "San Francisco",
      specialties: ["SaaS"],
      bio: "<iframe src='https://example.com'></iframe>",
      creditRate: 1,
      applicationId: "app_1",
    });

    expect(payload.html).toContain("&lt;iframe src=&#39;https://example.com&#39;&gt;&lt;/iframe&gt;");
    expect(payload.html).not.toContain("<iframe");
  });

  test("escapes payment setup notes in html", () => {
    const payload = paymentSetupSubmissionEmail({
      submittedAt: "2026-06-05 00:00:00",
      submitterName: "Carol",
      submitterEmail: "carol@example.com",
      companyName: "Example Inc.",
      representativeName: "Carol",
      companyAddress: "123 Main St",
      contactEmail: "ops@example.com",
      taxFormType: "W-9",
      hasUsBankAccount: "예",
      bankInfo: "Chase pending",
      stripeConnectStatus: "진행 중",
      tokenUsdRate: "100",
      platformFeePct: "10",
      refundDays: "30",
      additionalNotes: "<style>body{display:none}</style>",
    });

    expect(payload.html).toContain("&lt;style&gt;body{display:none}&lt;/style&gt;");
    expect(payload.html).not.toContain("<style>body{display:none}</style>");
  });
});
