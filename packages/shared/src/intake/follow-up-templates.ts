export interface FollowUpTemplate {
  id: string;
  trigger:
    | "post_intake"
    | "post_payment"
    | "package_ready"
    | "no_response_24h"
    | "no_response_72h";
  delayHours: number;
  subject: string;
  bodyTemplate: string;
}

export const FOLLOW_UP_TEMPLATES: FollowUpTemplate[] = [
  {
    id: "post_intake_confirmation",
    trigger: "post_intake",
    delayHours: 0,
    subject: "We received your exterior concept request",
    bodyTemplate: `Hi {{clientName}},

Thanks for submitting your exterior concept request for {{projectAddress}}.

Your intake is being reviewed. Once you complete your package selection, our team will begin generating your concepts.

Questions? Reply to this email anytime.

— The Kealee Team`,
  },
  {
    id: "post_payment_confirmation",
    trigger: "post_payment",
    delayHours: 0,
    subject: "Your {{packageName}} is confirmed — we're on it",
    bodyTemplate: `Hi {{clientName}},

Your payment for the {{packageName}} has been received.

Our design team is now generating your exterior concepts for {{projectAddress}}. Expect delivery within the timeframe specified for your package.

Track your order at: {{orderStatusUrl}}

— The Kealee Team`,
  },
  {
    id: "package_ready",
    trigger: "package_ready",
    delayHours: 0,
    subject: "Your concept package is ready to view",
    bodyTemplate: `Hi {{clientName}},

Your exterior concept package for {{projectAddress}} is ready.

View your concepts here: {{deliveryUrl}}

Your package includes your design brief, exterior renders, landscape concepts, and a preliminary permit path summary.

— The Kealee Team`,
  },
  {
    id: "no_response_24h",
    trigger: "no_response_24h",
    delayHours: 24,
    subject: "Still thinking about your project at {{projectAddress}}?",
    bodyTemplate: `Hi {{clientName}},

You started a concept intake for {{projectAddress}} but haven't completed your package selection yet.

Your intake data is saved. Pick up where you left off: {{resumeUrl}}

— The Kealee Team`,
  },
  {
    id: "no_response_72h",
    trigger: "no_response_72h",
    delayHours: 72,
    subject: "We saved your exterior concept request",
    bodyTemplate: `Hi {{clientName}},

Your concept request for {{projectAddress}} is still saved in our system.

If you have questions or want to adjust your package selection, we're here to help.

Resume your request: {{resumeUrl}}

— The Kealee Team`,
  },
];

export function renderTemplate(
  template: string,
  vars: Record<string, string>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

export interface ScheduledFollowUp {
  intakeId: string;
  email: string;
  templateId: string;
  sendAt: Date;
}

export function scheduleFollowUps(
  intakeId: string,
  contactEmail: string,
  _clientName: string,
  _projectAddress: string,
  triggers: FollowUpTemplate["trigger"][],
): ScheduledFollowUp[] {
  const now = Date.now();
  return FOLLOW_UP_TEMPLATES.filter((t) => triggers.includes(t.trigger)).map(
    (t) => ({
      intakeId,
      email: contactEmail,
      templateId: t.id,
      sendAt: new Date(now + t.delayHours * 60 * 60 * 1000),
    }),
  );
}
