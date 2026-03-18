export const contactNewTemplate = (data: {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}) => ({
  subject: `New Contact Inquiry: ${data.subject}`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a2e; border-bottom: 2px solid #e8c45a; padding-bottom: 8px;">
        New Contact Inquiry
      </h2>
      <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
        <tr>
          <td style="padding: 8px; font-weight: bold; color: #555; width: 120px;">Name</td>
          <td style="padding: 8px; color: #222;">${data.name}</td>
        </tr>
        <tr style="background: #f9f9f9;">
          <td style="padding: 8px; font-weight: bold; color: #555;">Email</td>
          <td style="padding: 8px; color: #222;">
            <a href="mailto:${data.email}" style="color: #1a73e8;">${data.email}</a>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold; color: #555;">Phone</td>
          <td style="padding: 8px; color: #222;">${data.phone || "—"}</td>
        </tr>
        <tr style="background: #f9f9f9;">
          <td style="padding: 8px; font-weight: bold; color: #555;">Subject</td>
          <td style="padding: 8px; color: #222;">${data.subject}</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold; color: #555; vertical-align: top;">Message</td>
          <td style="padding: 8px; color: #222; line-height: 1.6;">${data.message}</td>
        </tr>
      </table>
      <p style="margin-top: 24px; font-size: 12px; color: #999;">
        Received at ${new Date().toUTCString()}
      </p>
    </div>
  `,
});