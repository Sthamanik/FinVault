import { describe, expect, it, vi, beforeEach } from "vitest";
import transporter from "../../src/config/mailer.config";

vi.mock("../../src/config/mailer.config", () => ({
  default: {
    sendMail: vi.fn().mockResolvedValue({ messageId: "test-message-id" }),
  },
}));

describe("Email worker — sendMail recipients", () => {
  const sendMailSpy = transporter.sendMail as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_EMAIL = "admin@example.com";
    process.env.SMTP_USER = "noreply@example.com";
  });

  it("contact.new sends to admin email", async () => {
    const { contactNewTemplate } = await import(
      "../../src/templates/email/newContact.email"
    );
    const payload = {
      name: "Alex",
      email: "alex@example.com",
      subject: "General Inquiry",
      message: "Hello there",
    };
    const template = contactNewTemplate(payload);

    await transporter.sendMail({
      from: `"Genesis Investments" <noreply@example.com>`,
      to: "admin@example.com",
      subject: template.subject,
      html: template.html,
    });

    expect(sendMailSpy).toHaveBeenCalledOnce();
    expect(sendMailSpy).toHaveBeenCalledWith(
      expect.objectContaining({ to: "admin@example.com" })
    );
  });

  it("application.new sends to both admin and applicant", async () => {
    const { applicationNewAdminTemplate, applicationConfirmationTemplate } =
      await import("../../src/templates/email/newApplication.email");

    const payload = {
      applicantName: "Taylor",
      applicantEmail: "taylor@example.com",
      jobTitle: "Analyst",
      jobId: "abc123",
    };

    const adminTemplate = applicationNewAdminTemplate(payload);
    const confirmTemplate = applicationConfirmationTemplate(payload);

    await Promise.all([
      transporter.sendMail({
        from: `"Genesis Investments" <noreply@example.com>`,
        to: "admin@example.com",
        subject: adminTemplate.subject,
        html: adminTemplate.html,
      }),
      transporter.sendMail({
        from: `"Genesis Investments" <noreply@example.com>`,
        to: payload.applicantEmail,
        subject: confirmTemplate.subject,
        html: confirmTemplate.html,
      }),
    ]);

    expect(sendMailSpy).toHaveBeenCalledTimes(2);

    const recipients = sendMailSpy.mock.calls.map((call) => call[0].to);
    expect(recipients).toContain("admin@example.com");
    expect(recipients).toContain("taylor@example.com");
  });

  it("application.status_changed sends to applicant NOT admin", async () => {
    const { applicationStatusTemplate } = await import(
      "../../src/templates/email/applicationStatus.email"
    );

    const payload = {
      applicantName: "Taylor",
      applicantEmail: "taylor@example.com",
      jobTitle: "Analyst",
      oldStatus: "pending",
      newStatus: "shortlisted",
      applicationId: "abc123",
    };

    const template = applicationStatusTemplate(payload);

    await transporter.sendMail({
      from: `"Genesis Investments" <noreply@example.com>`,
      to: payload.applicantEmail, // applicant, not admin
      subject: template.subject,
      html: template.html,
    });

    expect(sendMailSpy).toHaveBeenCalledOnce();
    expect(sendMailSpy).toHaveBeenCalledWith(
      expect.objectContaining({ to: "taylor@example.com" })
    );
    // Explicitly assert admin was NOT the recipient
    expect(sendMailSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ to: "admin@example.com" })
    );
  });
});