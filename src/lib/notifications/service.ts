import { prisma } from "../prisma";
import {
  sendEmail,
  buildAvailabilityRequestEmail,
  buildReminderEmail,
} from "./email";
import { sendSms, buildAvailabilityRequestSms, buildReminderSms } from "./sms";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function getScheduleUrl(token: string): string {
  return `${APP_URL}/schedule/${token}`;
}

export async function sendAvailabilityRequest(
  candidateId: string,
  windowToken: string,
  note?: string
) {
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
  });
  if (!candidate) return;

  const scheduleUrl = getScheduleUrl(windowToken);

  // Send email — pass window dates from note (format: "Window: Apr 6 – Apr 19, 2026")
  const windowDates = note?.replace(/^Window:\s*/, "");
  const emailContent = buildAvailabilityRequestEmail(
    candidate.name,
    scheduleUrl,
    windowDates
  );
  const emailSuccess = await sendEmail({
    to: candidate.email,
    ...emailContent,
  });

  await prisma.notificationLog.create({
    data: {
      type: "AVAILABILITY_REQUEST",
      channel: "EMAIL",
      status: emailSuccess ? "SENT" : "FAILED",
      sentAt: emailSuccess ? new Date() : undefined,
      note,
      candidateId,
    },
  });

  // Send SMS (only if phone provided)
  if (candidate.phone) {
    const smsMessage = buildAvailabilityRequestSms(scheduleUrl);
    const smsSuccess = await sendSms({ to: candidate.phone, message: smsMessage });

    await prisma.notificationLog.create({
      data: {
        type: "AVAILABILITY_REQUEST",
        channel: "SMS",
        status: smsSuccess ? "SENT" : "FAILED",
        sentAt: smsSuccess ? new Date() : undefined,
        note,
        candidateId,
      },
    });
  }
}

export async function sendReminder(
  candidateId: string,
  windowToken: string,
  note?: string
) {
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
  });
  if (!candidate) return;

  const scheduleUrl = getScheduleUrl(windowToken);

  // Send email
  const emailContent = buildReminderEmail(candidate.name, scheduleUrl);
  const emailSuccess = await sendEmail({
    to: candidate.email,
    ...emailContent,
  });

  await prisma.notificationLog.create({
    data: {
      type: "REMINDER",
      channel: "EMAIL",
      status: emailSuccess ? "SENT" : "FAILED",
      sentAt: emailSuccess ? new Date() : undefined,
      note,
      candidateId,
    },
  });

  // Send SMS (only if phone provided)
  if (candidate.phone) {
    const smsMessage = buildReminderSms(scheduleUrl);
    const smsSuccess = await sendSms({ to: candidate.phone, message: smsMessage });

    await prisma.notificationLog.create({
      data: {
        type: "REMINDER",
        channel: "SMS",
        status: smsSuccess ? "SENT" : "FAILED",
        sentAt: smsSuccess ? new Date() : undefined,
        note,
        candidateId,
      },
    });
  }
}
