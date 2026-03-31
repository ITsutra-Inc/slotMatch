import { SDK } from "@ringcentral/sdk";

let rcSdk: SDK | null = null;

function getRingCentralSdk(): SDK | null {
  if (
    !process.env.RINGCENTRAL_CLIENT_ID ||
    !process.env.RINGCENTRAL_CLIENT_SECRET
  ) {
    return null;
  }

  if (!rcSdk) {
    rcSdk = new SDK({
      server: process.env.RINGCENTRAL_SERVER_URL || "https://platform.devtest.ringcentral.com",
      clientId: process.env.RINGCENTRAL_CLIENT_ID,
      clientSecret: process.env.RINGCENTRAL_CLIENT_SECRET,
    });
  }

  return rcSdk;
}

async function ensureLoggedIn(sdk: SDK): Promise<void> {
  const platform = sdk.platform();
  const isLoggedIn = await platform.loggedIn();
  if (!isLoggedIn) {
    await platform.login({
      jwt: process.env.RINGCENTRAL_JWT_TOKEN!,
    });
  }
}

interface SmsParams {
  to: string;
  message: string;
}

export async function sendSms({ to, message }: SmsParams): Promise<boolean> {
  const sdk = getRingCentralSdk();

  if (!sdk) {
    console.log(`[SMS MOCK] To: ${to} | Message: ${message}`);
    return true;
  }

  try {
    await ensureLoggedIn(sdk);

    const platform = sdk.platform();
    await platform.post("/restapi/v1.0/account/~/extension/~/sms", {
      from: { phoneNumber: process.env.RINGCENTRAL_FROM_NUMBER },
      to: [{ phoneNumber: to }],
      text: message,
    });

    return true;
  } catch (error) {
    console.error("[SMS ERROR]", error);
    return false;
  }
}

export function buildAvailabilityRequestSms(scheduleUrl: string): string {
  return `SlotMatch: Please submit your interview availability for the next 2 weeks. ${scheduleUrl}`;
}

export function buildReminderSms(scheduleUrl: string): string {
  return `SlotMatch Reminder: Your interview availability is still needed. Please submit ASAP: ${scheduleUrl}`;
}
