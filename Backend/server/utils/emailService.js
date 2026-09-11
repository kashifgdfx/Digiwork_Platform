const nodemailer = require('nodemailer');

const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: Number(port) === 465,
    auth: {
      user,
      pass,
    },
  });
};

function buildResetEmailHtml({ name, resetLink, expiresInMinutes }) {
  return `
    <div style="font-family: Arial, sans-serif; background:#f6f7fb; padding:32px 16px; color:#111827;">
      <div style="max-width:620px; margin:0 auto; background:#ffffff; border:1px solid #e5e7eb; border-radius:18px; overflow:hidden;">
        <div style="background:linear-gradient(135deg,#1dbf73,#12a46b); padding:24px 32px; color:#fff;">
          <div style="display:flex; align-items:center; gap:12px; font-weight:700; font-size:24px;">
            <div style="width:40px; height:40px; border-radius:12px; background:rgba(255,255,255,0.18); display:inline-flex; align-items:center; justify-content:center; font-size:22px;">F</div>
            <span>DigiWork</span>
          </div>
        </div>
        <div style="padding:32px;">
          <h2 style="margin:0 0 12px; font-size:28px; color:#111827;">Reset Your Password</h2>
          <p style="margin:0 0 24px; font-size:16px; line-height:1.7; color:#4b5563;">
            Hi <strong>${name}</strong>,
          </p>
          <p style="margin:0 0 24px; font-size:16px; line-height:1.7; color:#4b5563;">
            Click the button below to reset your password. This link is valid for <strong>${expiresInMinutes} minutes</strong>.
          </p>
          <div style="text-align:center; margin:28px 0;">
            <a href="${resetLink}" style="display:inline-block; background:#1dbf73; color:#ffffff; text-decoration:none; padding:14px 28px; border-radius:12px; font-weight:700; font-size:15px;">
              Reset Password
            </a>
          </div>
          <p style="margin:0 0 20px; font-size:14px; line-height:1.7; color:#6b7280;">
            If the button does not work, copy and paste this link into your browser:<br>
            <a href="${resetLink}" style="color:#1dbf73; word-break:break-all;">${resetLink}</a>
          </p>
          <div style="background:#fff7ed; border:1px solid #fed7aa; border-radius:12px; padding:14px 16px; color:#9a4d00; font-size:13px; line-height:1.6;">
            Security warning: this link expires in 15 minutes. If you did not request a password reset, please ignore this email and keep your account secure.
          </div>
        </div>
      </div>
    </div>
  `;
}

async function sendPasswordResetEmail({ to, name, resetLink, expiresInMinutes }) {
  const transporter = createTransporter();

  if (!transporter) {
    return {
      success: false,
      skipped: true,
      message: 'Email service not configured. Add SMTP credentials to enable password-reset emails.',
    };
  }

  const mail = await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to,
    subject: 'Reset Your DigiWork Password',
    html: buildResetEmailHtml({ name, resetLink, expiresInMinutes }),
  });

  return { success: true, messageId: mail.messageId };
}

module.exports = {
  sendPasswordResetEmail,
};
