const nodemailer = require('nodemailer');

function buildTransporter() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return nodemailer.createTransport({ jsonTransport: true });
}

const transporter = buildTransporter();
const from = process.env.MAIL_FROM || 'no-reply@karateskillzdojo.local';

async function sendEmail({ to, subject, text, html }) {
  const info = await transporter.sendMail({ from, to, subject, text, html });
  return info;
}

function escape(input) {
  return String(input).replace(/[&<>"']/g, (char) => {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return map[char];
  });
}

module.exports = { sendEmail, escape };
