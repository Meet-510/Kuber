// Standalone SMTP smoke test — verifies Gmail creds by opening a live
// connection and sending one test message. Any auth/transport failure is
// surfaced with the raw nodemailer error so it's easy to diagnose.
// Usage: node scripts/test-email.js
import 'dotenv/config';
import nodemailer from 'nodemailer';

const { EMAIL_USER, EMAIL_PASS } = process.env;

if (!EMAIL_USER || !EMAIL_PASS) {
  console.error('❌ EMAIL_USER or EMAIL_PASS missing from .env');
  process.exit(1);
}

console.log(`→ EMAIL_USER=${EMAIL_USER}`);
console.log(`→ EMAIL_PASS length: ${EMAIL_PASS.length} (Gmail app passwords are 16 chars)`);
console.log(`→ EMAIL_PASS contains spaces: ${/\s/.test(EMAIL_PASS)}`);
console.log('');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: EMAIL_USER, pass: EMAIL_PASS },
});

try {
  console.log('1/2  Verifying SMTP handshake…');
  await transporter.verify();
  console.log('     ✅ Handshake OK — Gmail accepted the credentials.\n');

  console.log('2/2  Sending a test message to yourself…');
  const info = await transporter.sendMail({
    from: EMAIL_USER,
    to: EMAIL_USER,
    subject: 'Kuber SMTP smoke test',
    text: 'If you can read this, Gmail delivery works. You can delete this email.',
  });
  console.log(`     ✅ Sent. Message id: ${info.messageId}`);
  console.log('     Check your inbox (and spam folder).');
} catch (err) {
  console.error('\n❌ Gmail rejected the request:');
  console.error(`   code:      ${err.code}`);
  console.error(`   response:  ${err.response}`);
  console.error(`   message:   ${err.message}`);
  console.error('\nCommon causes:');
  console.error('  · The app password was copied wrong (should be 16 chars, no spaces)');
  console.error('  · 2-Step Verification is not enabled on the Google account');
  console.error('  · The app password was revoked (regenerate at myaccount.google.com/apppasswords)');
  console.error('  · EMAIL_USER is not the same Gmail account that owns the app password');
  process.exit(1);
}
