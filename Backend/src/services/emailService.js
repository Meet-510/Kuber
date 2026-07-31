import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';
import { escapeHtml } from '../utils/sanitize.js';

// Same shape as Eventra: Gmail's SMTP shortcut ("service: 'gmail'") + an
// app-password. Simplest zero-config transport that reliably delivers.
// Falls back to a loud console logger when EMAIL_USER/EMAIL_PASS aren't set
// so the dev experience isn't silently broken.
let transporter = null;

const credsConfigured = () => Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);

// A very loud dev-mode logger for OTPs: the code is what the user actually
// needs — surfacing it as a bordered block makes it impossible to miss.
const logOtpToConsole = ({ to, subject }) => {
  const codeMatch = subject.match(/\b(\d{6})\b/);
  const code = codeMatch ? codeMatch[1] : null;
  if (code) {
    process.stdout.write(
      [
        '',
        '┌─────────────────────────────────────────────────┐',
        `│  📧  Dev OTP for ${to.padEnd(28)} │`,
        `│                                                 │`,
        `│           ${code.split('').join(' ').padStart(30).padEnd(37)}   │`,
        `│                                                 │`,
        `│  (EMAIL_USER/EMAIL_PASS not set — see .env)     │`,
        '└─────────────────────────────────────────────────┘',
        '',
      ].join('\n')
    );
  } else {
    logger.info(`📧 [DEV EMAIL] To: ${to} | Subject: ${subject}`);
  }
};

let transportMode = null; // 'gmail' | 'console' — set on first getTransporter()

const getTransporter = () => {
  if (transporter) return transporter;

  if (credsConfigured()) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
    transportMode = 'gmail';
    logger.info(`📮 Email transport: Gmail (${process.env.EMAIL_USER})`);
  } else {
    transporter = {
      sendMail: (opts) => {
        logOtpToConsole(opts);
        return Promise.resolve({ messageId: `dev-${Date.now()}` });
      },
    };
    transportMode = 'console';
    logger.info('📮 Email transport: console fallback (EMAIL_USER/EMAIL_PASS not set)');
  }
  return transporter;
};

export const getTransportMode = () => transportMode;

// Explicit warmup so the transport-mode log fires at server boot instead of
// on the first email send. Safe to call multiple times.
export const initEmail = () => {
  getTransporter();
};

const FROM = () => process.env.EMAIL_USER || 'noreply@kuber.dev';
const CLIENT = () => process.env.CLIENT_URL || 'http://localhost:5173';

const baseStyle = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 40px; border-radius: 16px;
`;

// ─── OTP for account verification (register) ───────────────────────────────
export const sendOtpEmail = async ({ recipientEmail, code }) => {
  const subject = `Your Kuber verification code: ${code}`;
  const t = getTransporter();
  try {
    const info = await t.sendMail({
      from: FROM(),
      to: recipientEmail,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
          <h2 style="color: #111;">Verify your Kuber account</h2>
          <p style="color: #555; font-size: 16px;">
            Please use the following OTP to verify your new Kuber account.
          </p>
          <div style="margin: 20px auto; padding: 15px; font-size: 24px; font-weight: bold;
                      background: #f4f4f4; width: max-content; letter-spacing: 5px;">
            ${escapeHtml(code)}
          </div>
          <p style="color: #999; font-size: 12px;">
            This code expires in 5 minutes. If you didn't request this, please ignore this email.
          </p>
        </div>
      `,
    });
    if (transportMode === 'gmail') {
      logger.info(`✉️  OTP email → ${recipientEmail} (messageId: ${info.messageId})`);
    }
  } catch (err) {
    logger.error(
      { err: { message: err.message, code: err.code, response: err.response } },
      `❌ OTP email to ${recipientEmail} FAILED — falling back to console`
    );
    logOtpToConsole({ to: recipientEmail, subject });
  }
};

// ─── Password-reset link (Eventra-style) ───────────────────────────────────
export const sendPasswordResetEmail = async ({ recipientEmail, recipientName, resetLink }) => {
  try {
    await getTransporter().sendMail({
      from: FROM(),
      to: recipientEmail,
      subject: 'Reset your Kuber password',
      html: `
        <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
          <h2 style="color: #111;">Reset your Kuber password</h2>
          <p style="color: #555; font-size: 16px;">
            Hi ${escapeHtml(recipientName || 'there')}, we received a request to reset your password.
            Click the button below to choose a new one.
          </p>
          <a href="${resetLink}"
             style="display: inline-block; margin: 20px auto; padding: 12px 30px;
                    font-size: 16px; font-weight: bold; color: #fff; background: #1f5c3d;
                    text-decoration: none; border-radius: 8px;">
            Reset password
          </a>
          <p style="color: #555; font-size: 14px;">Or copy this link into your browser:</p>
          <p style="color: #555; font-size: 12px; word-break: break-all;">${escapeHtml(resetLink)}</p>
          <p style="color: #999; font-size: 12px;">
            This link expires in 15 minutes and can only be used once. If you didn't request this,
            please ignore this email — your password will stay unchanged.
          </p>
        </div>
      `,
    });
  } catch (err) {
    logger.error({ err }, 'Password-reset email delivery failed');
    // Surface the link so a dev without SMTP can still test the flow.
    process.stdout.write(`\n🔑  Password reset link for ${recipientEmail}:\n    ${resetLink}\n\n`);
  }
};

// ─── Transfer receipt ──────────────────────────────────────────────────────
export const sendTransferReceivedEmail = async ({
  recipientEmail,
  recipientName,
  senderName,
  amount,
  message,
}) => {
  const sender = escapeHtml(senderName);
  const name = escapeHtml(recipientName);
  const note = escapeHtml(message);

  await getTransporter().sendMail({
    from: FROM(),
    to: recipientEmail,
    subject: `💰 You received $${amount} CAD from ${senderName}`,
    html: `
      <div style="${baseStyle}">
        <h2 style="color:#a78bfa;margin-bottom:8px">You've received money!</h2>
        <p>Hi ${name || 'there'},</p>
        <p><strong style="color:#f1f5f9">${sender}</strong> sent you
           <strong style="color:#a78bfa; font-size:1.4em">$${amount} CAD</strong>.</p>
        ${note ? `<p style="color:#94a3b8;font-style:italic">"${note}"</p>` : ''}
        <p>The funds have been added to your account.</p>
        <a href="${CLIENT()}" style="display:inline-block;background:#1f5c3d;color:#f2f0e9;
           padding:14px 28px;text-decoration:none;border-radius:10px;font-weight:600;margin-top:20px">
          View your account
        </a>
      </div>
    `,
  });
};
