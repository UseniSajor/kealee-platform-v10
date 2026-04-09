import { tool } from "@langchain/core/tools";
import { z } from "zod";

async function notifyCall(
  endpoint: string,
  payload: unknown
): Promise<{ success: boolean; error?: string }> {
  const apiBase = process.env.INTERNAL_API_URL ?? "http://localhost:3001";
  try {
    const res = await fetch(`${apiBase}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-token": process.env.INTERNAL_API_TOKEN ?? "",
      },
      body: JSON.stringify(payload),
    });
    return res.ok ? { success: true } : { success: false, error: `HTTP ${res.status}` };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export const sendEmailNotificationTool = tool(
  async ({ to, subject, templateId, variables }: {
    to: string;
    subject: string;
    templateId?: string;
    variables?: Record<string, string>;
  }) => {
    return notifyCall("/api/v1/notifications/email", { to, subject, templateId, variables });
  },
  {
    name: "send_email_notification",
    description: "Send a transactional email notification via the Kealee notification service.",
    schema: z.object({
      to:         z.string().email(),
      subject:    z.string(),
      templateId: z.string().optional(),
      variables:  z.record(z.string()).optional(),
    }),
  }
);

export const sendSmsNotificationTool = tool(
  async ({ to, message }: { to: string; message: string }) => {
    return notifyCall("/api/v1/notifications/sms", { to, message });
  },
  {
    name: "send_sms_notification",
    description: "Send an SMS notification via the Kealee notification service.",
    schema: z.object({
      to:      z.string().describe("E.164 phone number"),
      message: z.string().max(160),
    }),
  }
);
