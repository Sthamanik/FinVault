export const applicationNewAdminTemplate = (data: {
  applicantName: string;
  applicantEmail: string;
  phone?: string;
  jobTitle: string;
  jobId: string;
  coverLetter?: string;
}) => ({
  subject: `New Application: ${data.jobTitle}`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a2e; border-bottom: 2px solid #e8c45a; padding-bottom: 8px;">
        New Job Application
      </h2>
      <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
        <tr>
          <td style="padding: 8px; font-weight: bold; color: #555; width: 140px;">Position</td>
          <td style="padding: 8px; color: #222;">${data.jobTitle}</td>
        </tr>
        <tr style="background: #f9f9f9;">
          <td style="padding: 8px; font-weight: bold; color: #555;">Applicant</td>
          <td style="padding: 8px; color: #222;">${data.applicantName}</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold; color: #555;">Email</td>
          <td style="padding: 8px; color: #222;">
            <a href="mailto:${data.applicantEmail}" style="color: #1a73e8;">${data.applicantEmail}</a>
          </td>
        </tr>
        <tr style="background: #f9f9f9;">
          <td style="padding: 8px; font-weight: bold; color: #555;">Phone</td>
          <td style="padding: 8px; color: #222;">${data.phone || "—"}</td>
        </tr>
        ${data.coverLetter ? `
        <tr>
          <td style="padding: 8px; font-weight: bold; color: #555; vertical-align: top;">Cover Letter</td>
          <td style="padding: 8px; color: #222; line-height: 1.6;">${data.coverLetter}</td>
        </tr>` : ""}
      </table>
      <p style="margin-top: 24px; font-size: 12px; color: #999;">
        Submitted at ${new Date().toUTCString()}
      </p>
    </div>
  `,
});

export const applicationConfirmationTemplate = (data: {
  applicantName: string;
  jobTitle: string;
}) => ({
  subject: `Application Received — ${data.jobTitle}`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a2e; border-bottom: 2px solid #e8c45a; padding-bottom: 8px;">
        Application Received
      </h2>
      <p style="color: #222; line-height: 1.7; margin-top: 16px;">
        Hi <strong>${data.applicantName}</strong>,
      </p>
      <p style="color: #222; line-height: 1.7;">
        Thank you for applying for the <strong>${data.jobTitle}</strong> position.
        We've received your application and our team will review it shortly.
      </p>
      <p style="color: #222; line-height: 1.7;">
        We'll be in touch if your profile matches what we're looking for.
      </p>
      <p style="color: #222; line-height: 1.7; margin-top: 24px;">
        Best regards,<br/>
        <strong>The Hiring Team</strong>
      </p>
      <p style="margin-top: 32px; font-size: 12px; color: #999;">
        This is an automated message — please do not reply to this email.
      </p>
    </div>
  `,
});