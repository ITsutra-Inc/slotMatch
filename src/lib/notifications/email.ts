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
  scheduleUrl: string
): { subject: string; html: string } {
  const name = candidateName || "there";
  return {
    subject: "Action Required: Please submit your availability for interviews",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #111827; margin-bottom: 16px;">Hi ${name},</h2>
        <p style="color: #374151; line-height: 1.6;">
          We need your availability for the upcoming two weeks for interview scheduling.
          Please click the button below to fill in your available time slots.
        </p>
        <p style="color: #6B7280; font-size: 14px; margin-bottom: 24px;">
          You must provide at least 20 hours of availability per week (e.g., 5 hours on Monday–Thursday).
        </p>
        <a href="${scheduleUrl}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Submit Availability
        </a>
        <p style="color: #9CA3AF; font-size: 12px; margin-top: 32px;">
          This link will expire at the end of the current 2-week window.
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
