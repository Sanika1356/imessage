import nodemailer from "nodemailer";

let transporter = null;

export function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn("SMTP credentials (SMTP_HOST, SMTP_USER, SMTP_PASS) not found in env. Actual email sending will be simulated.");
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
  });

  return transporter;
}

export async function sendMail({ from, to, cc, bcc, subject, text, html, attachments }) {
  // 1. Try Resend API first if configured
  if (process.env.RESEND_API_KEY) {
    try {
      const sender = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
      const payload = {
        from: sender,
        to: Array.isArray(to) ? to : [to],
        subject: subject || "(No Subject)",
        text: text || "",
        html: html || `<div>${text}</div>`
      };

      if (cc && cc.length > 0) payload.cc = cc;
      if (bcc && bcc.length > 0) payload.bcc = bcc;

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const resData = await response.json();
      if (response.ok) {
        console.log("Email sent successfully via Resend API: " + resData.id);
        return { messageId: resData.id, service: "resend" };
      } else {
        throw new Error(resData.message || JSON.stringify(resData));
      }
    } catch (error) {
      console.error("Failed to send email via Resend API, falling back to SMTP/Simulation:", error.message);
    }
  }

  // 2. Fall back to SMTP
  const mailTransporter = getTransporter();

  if (!mailTransporter) {
    console.log(`[SIMULATED EMAIL]
From: ${from}
To: ${to}
CC: ${cc ? cc.join(", ") : ""}
BCC: ${bcc ? bcc.join(", ") : ""}
Subject: ${subject}
Body: ${text}
----------------------------------------`);
    return { messageId: "simulated-" + Date.now(), simulated: true };
  }

  const mailOptions = {
    from,
    to,
    cc,
    bcc,
    subject,
    text,
    html,
    attachments: attachments?.map(att => ({ path: att }))
  };

  try {
    const info = await mailTransporter.sendMail(mailOptions);
    console.log("Email sent successfully: " + info.messageId);
    return info;
  } catch (error) {
    console.error("Failed to send real email via SMTP, falling back to simulation:", error.message);
    return { messageId: "simulated-fallback-" + Date.now(), simulated: true, error: error.message };
  }
}

// Helper function for simple email sending
export async function sendEmail({ to, subject, text, html }) {
  const from = process.env.RESEND_FROM_EMAIL || process.env.SMTP_USER || "noreply@imessage.app";
  
  return await sendMail({
    from,
    to,
    subject,
    text,
    html: html || text
  });
}
