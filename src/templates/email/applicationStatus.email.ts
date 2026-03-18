export const applicationStatusTemplate = (data: {
  applicantName: string;
  jobTitle: string;
  oldStatus: string;
  newStatus: string;
  applicationId: string;
}) => ({
  subject: `Application Status Update: ${data.jobTitle}`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a2e; border-bottom: 2px solid #e8c45a; padding-bottom: 8px;">
        Application Status Changed
      </h2>
      <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
        <tr>
          <td style="padding: 8px; font-weight: bold; color: #555; width: 160px;">Application ID</td>
          <td style="padding: 8px; color: #222; font-family: monospace;">${data.applicationId}</td>
        </tr>
        <tr style="background: #f9f9f9;">
          <td style="padding: 8px; font-weight: bold; color: #555;">Position</td>
          <td style="padding: 8px; color: #222;">${data.jobTitle}</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold; color: #555;">Applicant</td>
          <td style="padding: 8px; color: #222;">${data.applicantName}</td>
        </tr>
        <tr style="background: #f9f9f9;">
          <td style="padding: 8px; font-weight: bold; color: #555;">Previous Status</td>
          <td style="padding: 8px; color: #888;">${data.oldStatus}</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold; color: #555;">New Status</td>
          <td style="padding: 8px;">
            <span style="
              background: #e8f5e9;
              color: #2e7d32;
              padding: 2px 10px;
              border-radius: 12px;
              font-weight: bold;
              font-size: 13px;
            ">${data.newStatus}</span>
          </td>
        </tr>
      </table>
      <p style="margin-top: 24px; font-size: 12px; color: #999;">
        Updated at ${new Date().toUTCString()}
      </p>
    </div>
  `,
});