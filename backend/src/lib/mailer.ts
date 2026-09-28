import nodemailer from 'nodemailer';
import { env } from '../config/env';

// With no SMTP host configured, fall back to logging the email to this
// server's own console — lets the whole OTP flow be tested locally with
// nothing else running at all. SMTP_USER/PASSWORD are only needed for a real
// authenticated provider (Gmail, Outlook, ...); local catchers like Mailpit
// need neither.
const transporter = env.SMTP_HOST
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } : undefined,
    })
  : nodemailer.createTransport({ jsonTransport: true });

export async function sendOtpEmail(to: string, code: string): Promise<void> {
  const text = `Your PadosiPro verification code is ${code}. It expires in ${env.OTP_TTL_MINUTES} minutes. If you didn't request this, you can ignore this email.`;

  try {
    await transporter.sendMail({
      from: env.SMTP_FROM,
      to,
      subject: 'Your PadosiPro verification code',
      text,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #1B6B4C;">Verify your email</h2>
          <p>Your PadosiPro verification code is:</p>
          <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px;">${code}</p>
          <p>This code expires in ${env.OTP_TTL_MINUTES} minutes and can only be used once.</p>
          <p style="color: #667085; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });
  } catch (err) {
    // A configured SMTP_HOST that's unreachable (e.g. Mailpit not started)
    // shouldn't break registration/login — fall back to the console instead
    // of a 500, same as the no-SMTP-configured case below.
    console.error(`[mailer] Could not reach SMTP server (${env.SMTP_HOST}):`, err instanceof Error ? err.message : err);
    console.log(`\n[dev-mail] OTP for ${to}: ${code}\n`);
    return;
  }

  if (!env.SMTP_HOST) {
    console.log(`\n[dev-mail] OTP for ${to}: ${code}\n`);
  }
}
