import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';
import { escapeHtml } from '../utils/sanitize.js';

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  if (process.env.SENDGRID_API_KEY) {
    transporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: { user: 'apikey', pass: process.env.SENDGRID_API_KEY },
    });
  } else if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  } else {
    // Dev fallback — log to console instead of sending
    transporter = {
      sendMail: ({ to, subject }) => {
        logger.info(`📧 [DEV EMAIL] To: ${to} | Subject: ${subject}`);
        return Promise.resolve({ messageId: `dev-${Date.now()}` });
      },
    };
  }

  return transporter;
};

const FROM = () => process.env.FROM_EMAIL || 'noreply@kuber.dev';
const CLIENT = () => process.env.CLIENT_URL || 'http://localhost:5173';

const baseStyle = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 40px; border-radius: 16px;
`;
const btnStyle = `
  display: inline-block; background: linear-gradient(135deg, #8b5cf6, #3b82f6);
  color: white; padding: 14px 28px; text-decoration: none; border-radius: 10px;
  font-weight: 600; margin-top: 20px;
`;

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
        <a href="${CLIENT()}" style="${btnStyle}">View Your Account</a>
      </div>
    `,
  });
};

export const sendTransferInviteEmail = async ({ recipientEmail, senderName, amount, message }) => {
  const sender = escapeHtml(senderName);
  const note = escapeHtml(message);

  await getTransporter().sendMail({
    from: FROM(),
    to: recipientEmail,
    subject: `🎉 ${senderName} sent you $${amount} CAD — Claim it now!`,
    html: `
      <div style="${baseStyle}">
        <h2 style="color:#a78bfa;margin-bottom:8px">You have a pending transfer!</h2>
        <p><strong style="color:#f1f5f9">${sender}</strong> sent you
           <strong style="color:#a78bfa; font-size:1.4em">$${amount} CAD</strong>.</p>
        ${note ? `<p style="color:#94a3b8;font-style:italic">"${note}"</p>` : ''}
        <p>Create a free account to claim your money — it will be credited automatically.</p>
        <a href="${CLIENT()}/register" style="${btnStyle}">Claim $${amount} CAD</a>
      </div>
    `,
  });
};
