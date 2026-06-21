import nodemailer from "nodemailer";

let transporter = null;
let emailServiceStatus = "unchecked";

export function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn("[EMAIL-CONFIG] SMTP credentials not found. Email sending will be simulated.");
    emailServiceStatus = "simulated";
    return null;
  }

  try {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: {
        user,
        pass,
      },
      connectionTimeout: 10000,
      socketTimeout: 10000,
    });

    console.log(`[EMAIL-CONFIG] ✓ SMTP transporter configured: ${host}:${port}`);
    emailServiceStatus = "configured";
    return transporter;
  } catch (error) {
    console.error("[EMAIL-CONFIG] ✗ Failed to create SMTP transporter:", error.message);
    emailServiceStatus = "error";
    return null;
  }
}

/**
 * Get email service status
 */
export function getEmailServiceStatus() {
  return {
    status: emailServiceStatus,
    resendConfigured: !!process.env.RESEND_API_KEY,
    smtpConfigured: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
    fromEmail: process.env.RESEND_FROM_EMAIL || process.env.SMTP_USER || "noreply@example.com"
  };
}

export async function sendMail({ from, to, cc, bcc, subject, text, html, attachments }) {
  const logPrefix = `[EMAIL-SEND] To: ${to}`;

  try {
    // 1. Try Resend API first if configured
    if (process.env.RESEND_API_KEY) {
      console.log(`${logPrefix} Attempting to send via Resend API...`);
      
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

        console.log(`${logPrefix} Resend payload prepared. Sending...`);

        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload),
          timeout: 15000
        });

        const resData = await response.json();

        if (response.ok && resData.id) {
          console.log(`${logPrefix} ✓ Email sent successfully via Resend. ID: ${resData.id}`);
          return { 
            messageId: resData.id, 
            service: "resend",
            status: "delivered"
          };
        } else {
          const errorMsg = resData.message || resData.error || JSON.stringify(resData);
          console.error(`${logPrefix} ✗ Resend API error: ${errorMsg}`);
          throw new Error(errorMsg);
        }
      } catch (resendError) {
        console.error(`${logPrefix} ✗ Resend failed: ${resendError.message}. Falling back to SMTP...`);
      }
    } else {
      console.log(`${logPrefix} Resend not configured. Trying SMTP...`);
    }

    // 2. Fall back to SMTP
    const mailTransporter = getTransporter();

    if (!mailTransporter) {
      console.log(`${logPrefix} ⚠️  No email service configured. Simulating delivery...`);
      console.log(`${logPrefix} [SIMULATED EMAIL]`);
      console.log(`  From: ${from}`);
      console.log(`  To: ${to}`);
      if (cc && cc.length > 0) console.log(`  CC: ${cc.join(", ")}`);
      if (bcc && bcc.length > 0) console.log(`  BCC: ${bcc.join(", ")}`);
      console.log(`  Subject: ${subject}`);
      console.log(`  Body Preview: ${text?.substring(0, 100)}...`);
      console.log(`  ----------------------------------------`);
      
      return { 
        messageId: "simulated-" + Date.now(), 
        simulated: true,
        status: "simulated",
        service: "none"
      };
    }

    console.log(`${logPrefix} Attempting to send via SMTP (${process.env.SMTP_HOST}:${process.env.SMTP_PORT})...`);

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

    const info = await mailTransporter.sendMail(mailOptions);
    
    console.log(`${logPrefix} ✓ Email sent successfully via SMTP. ID: ${info.messageId}`);
    return {
      ...info,
      service: "smtp",
      status: "delivered"
    };

  } catch (error) {
    console.error(`${logPrefix} ✗ All email services failed: ${error.message}`);
    
    // Last resort: simulate
    console.log(`${logPrefix} ⚠️  Falling back to simulation...`);
    return { 
      messageId: "simulated-fallback-" + Date.now(), 
      simulated: true,
      status: "simulated",
      service: "fallback",
      error: error.message
    };
  }
}

<<<<<<< HEAD
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
=======
/**
 * Verify email configuration on startup
 */
export async function verifyEmailConfig() {
  console.log("[EMAIL-STARTUP] Verifying email configuration...");
  
  const status = getEmailServiceStatus();
  
  if (status.resendConfigured) {
    console.log("[EMAIL-STARTUP] ✓ Resend API configured");
  } else {
    console.log("[EMAIL-STARTUP] ⚠️  Resend API not configured");
  }

  if (status.smtpConfigured) {
    console.log(`[EMAIL-STARTUP] ✓ SMTP configured (${process.env.SMTP_HOST}:${process.env.SMTP_PORT})`);
    
    // Try to verify SMTP connection
    const transporter = getTransporter();
    if (transporter) {
      try {
        await transporter.verify();
        console.log("[EMAIL-STARTUP] ✓ SMTP connection verified successfully");
      } catch (error) {
        console.error("[EMAIL-STARTUP] ✗ SMTP connection failed:", error.message);
      }
    }
  } else {
    console.log("[EMAIL-STARTUP] ⚠️  SMTP not configured");
  }

  if (!status.resendConfigured && !status.smtpConfigured) {
    console.warn("[EMAIL-STARTUP] ⚠️  WARNING: No email service configured!");
    console.warn("[EMAIL-STARTUP] All emails will be simulated.");
    console.warn("[EMAIL-STARTUP] To enable real emails, configure either:");
    console.warn("[EMAIL-STARTUP]   1. RESEND_API_KEY + RESEND_FROM_EMAIL");
    console.warn("[EMAIL-STARTUP]   2. SMTP_HOST + SMTP_PORT + SMTP_USER + SMTP_PASS");
  }
}

export default {
  getTransporter,
  sendMail,
  getEmailServiceStatus,
  verifyEmailConfig
};
>>>>>>> 634060a04e5d93827230372655c18bea0f5d5851
