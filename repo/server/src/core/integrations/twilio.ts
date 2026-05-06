
import twilio from 'twilio';

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export interface SMSParams {
    to: string;
    body: string;
}

export async function sendSMS(params: SMSParams): Promise<string> {
    const message = await client.messages.create({
        body: params.body,
        to: params.to,
        from: process.env.TWILIO_PHONE_NUMBER,
    });

    console.log(`[Twilio] SMS sent to ${params.to}: ${message.sid}`);
    return message.sid;
}
