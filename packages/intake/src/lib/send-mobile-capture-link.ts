export interface SendMobileCaptureLinkInput {
  captureSessionId: string;
  captureSessionToken: string;
  phoneNumber: string;
  baseUrl: string;
  projectPath: string;
  clientName?: string;
}

export interface SendMobileCaptureLinkResult {
  ok: boolean;
  messageId?: string;
  error?: string;
}

export function buildCaptureUrl(baseUrl: string, token: string): string {
  return `${baseUrl}/capture/${token}`;
}

export function buildCaptureSmsBody(args: {
  captureUrl: string;
  clientName?: string;
  projectPath: string;
}): string {
  const name = args.clientName ? `, ${args.clientName.split(" ")[0]}` : "";
  const pathLabel = args.projectPath.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return `Hi${name}! Your Kealee guided capture link for "${pathLabel}" is ready. Open on your phone to begin: ${args.captureUrl} — This link expires in 48 hours.`;
}

export async function sendMobileCaptureLinkViaTwilio(
  input: SendMobileCaptureLinkInput,
): Promise<SendMobileCaptureLinkResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.warn("[sendMobileCaptureLink] Twilio not configured — skipping SMS");
    return { ok: true, messageId: "mock_sms_not_configured" };
  }

  const captureUrl = buildCaptureUrl(input.baseUrl, input.captureSessionToken);
  const body = buildCaptureSmsBody({
    captureUrl,
    clientName: input.clientName,
    projectPath: input.projectPath,
  });

  const formData = new URLSearchParams({
    From: fromNumber,
    To: input.phoneNumber,
    Body: body,
  });

  try {
    const resp = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        },
        body: formData.toString(),
      },
    );
    const json = (await resp.json()) as { sid?: string; message?: string };
    if (!resp.ok) {
      return { ok: false, error: json.message ?? "Twilio error" };
    }
    return { ok: true, messageId: json.sid };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg };
  }
}
