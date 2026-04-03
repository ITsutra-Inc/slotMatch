import sgMail from "@sendgrid/mail";

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || "noreply@slotmatch.com";

interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailParams): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.log(`[EMAIL MOCK] To: ${to} | Subject: ${subject}`);
    return true;
  }

  try {
    await sgMail.send({
      to,
      from: FROM_EMAIL,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error("[EMAIL ERROR]", error);
    return false;
  }
}

export function buildAvailabilityRequestEmail(
  candidateName: string | null,
  scheduleUrl: string,
  windowDates?: string
): { subject: string; html: string } {
  const name = candidateName || "there";
  const windowInfo = windowDates
    ? `<p style="color: #111827; font-weight: 600; font-size: 15px; margin-bottom: 16px;">
        📅 Availability window: ${windowDates}
      </p>`
    : "";
  return {
    subject: "ITsutra – Action Required: Please submit your availability",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="margin-bottom: 24px;">
          <h1 style="color: #4F46E5; font-size: 20px; margin: 0;">ITsutra</h1>
        </div>
        <h2 style="color: #111827; margin-bottom: 16px;">Hi ${name},</h2>
        <p style="color: #374151; line-height: 1.6;">
          We need you to submit your availability for interview scheduling.
          Please use the link below to select the time slots when you are available.
        </p>
        ${windowInfo}
        <p style="color: #374151; font-size: 14px; line-height: 1.6; margin-bottom: 8px;">
          <strong>How to fill it out:</strong>
        </p>
        <ol style="color: #374151; font-size: 14px; line-height: 1.8; margin-bottom: 24px; padding-left: 20px;">
          <li>Click the button below to open the scheduling calendar.</li>
          <li>Select the 2-hour time blocks when you are available (in CST).</li>
          <li>You must provide at least <strong>20 hours per week</strong>.</li>
          <li>Review your selections and hit Submit.</li>
        </ol>
        <a href="${scheduleUrl}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Submit Availability
        </a>
        <p style="color: #9CA3AF; font-size: 12px; margin-top: 32px;">
          This link will expire in 14 days. If you have any questions, please reach out to your ITsutra contact.
        </p>
      </div>
    `,
  };
}

export function buildReminderEmail(
  candidateName: string | null,
  scheduleUrl: string
): { subject: string; html: string } {
  const name = candidateName || "there";
  return {
    subject: "Reminder: Your interview availability is still needed",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #111827; margin-bottom: 16px;">Hi ${name},</h2>
        <p style="color: #374151; line-height: 1.6;">
          This is a friendly reminder that we're still waiting for your interview availability.
          Please submit it as soon as possible.
        </p>
        <a href="${scheduleUrl}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Submit Availability
        </a>
      </div>
    `,
  };
}
