import Email from "../models/email.model.js";
import User from "../models/user.model.js";
import { sendMail } from "../lib/nodemailer.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export async function sendEmail(req, res) {
  try {
    const { recipient, cc, bcc, subject, body, attachments, draftId } = req.body;
    const userId = req.user._id;
    const senderEmail = req.user.email;

    if (!recipient) {
      return res.status(400).json({ message: "Recipient email is required" });
    }

    // Parse array if sent as string
    const ccList = (Array.isArray(cc) ? cc : cc ? [cc] : []).map(e => String(e).trim()).filter(Boolean);
    const bccList = (Array.isArray(bcc) ? bcc : bcc ? [bcc] : []).map(e => String(e).trim()).filter(Boolean);
    const attachmentList = Array.isArray(attachments) ? attachments.map(String) : [];

    // If sending a draft, delete or update the draft record
    if (draftId) {
      await Email.deleteOne({ _id: draftId, userId });
    }

    // 1. Save sent email record for the sender
    const sentEmail = new Email({
      userId,
      sender: senderEmail,
      recipient,
      cc: ccList,
      bcc: bccList,
      subject: subject || "(No Subject)",
      body: body || "",
      attachments: attachmentList,
      folder: "sent",
      isRead: true
    });
    await sentEmail.save();

    // 2. Dispatch the actual email asynchronously via Nodemailer
    // We await this for invitations or critical emails to ensure delivery status is known
    try {
      const emailResult = await sendMail({
        from: senderEmail,
        to: recipient,
        cc: ccList,
        bcc: bccList,
        subject: subject || "(No Subject)",
        text: body || "",
        html: `<div style="font-family: sans-serif; line-height: 1.5;">${body}</div>`,
        attachments: attachmentList
      });
      
      if (emailResult.simulated) {
        console.log(`[EMAIL-DELIVERY-INFO] Email to ${recipient} was SIMULATED because SMTP/Resend is not configured.`);
      } else {
        console.log(`[EMAIL-DELIVERY-SUCCESS] Email delivered to ${recipient}. ID: ${emailResult.messageId}`);
      }
    } catch (err) {
      console.error("[EMAIL-DELIVERY-FAILURE] Failed to dispatch email:", err.message);
    }

    // 3. Deliver internally if the recipient or any CC/BCC is a registered app user
    const allInternalRecipients = [recipient, ...ccList, ...bccList];
    const uniqueRecipients = [...new Set(allInternalRecipients.map(e => String(e).trim().toLowerCase()))];

    for (const emailAddr of uniqueRecipients) {
      // Don't send to self inbox
      if (emailAddr === senderEmail.toLowerCase()) continue;

      const recipientUser = await User.findOne({ email: new RegExp(`^${emailAddr}$`, "i") });
      if (recipientUser) {
        const inboxEmail = new Email({
          userId: recipientUser._id,
          sender: senderEmail,
          recipient,
          cc: ccList,
          bcc: bccList,
          subject: subject || "(No Subject)",
          body: body || "",
          attachments: attachmentList,
          folder: "inbox",
          isRead: false
        });
        await inboxEmail.save();

        // Notify the recipient user in real-time
        const socketId = getReceiverSocketId(recipientUser._id);
        if (socketId) {
          io.to(socketId).emit("newEmail", inboxEmail);
          console.log(`[EMAIL-DELIVERY-REALTIME] Email notification sent to recipient ${recipientUser._id} via socket`);
        } else {
          console.log(`[EMAIL-DELIVERY-OFFLINE] Recipient ${recipientUser._id} is offline - email saved to inbox`);
        }
        
        console.log(`[EMAIL-CREATED] Email from ${senderEmail} to ${emailAddr} saved to inbox`);
      } else {
        console.log(`[EMAIL-NOT-INTERNAL] Recipient ${emailAddr} not found in app - external email only`);
      }
    }
    
    console.log(`[EMAIL-SENT] Email sent from ${senderEmail} to ${recipient}. Internal recipients: ${uniqueRecipients.length}`);

    res.status(201).json(sentEmail);
  } catch (error) {
    console.error("Error in sendEmail:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function saveDraft(req, res) {
  try {
    const { recipient, cc, bcc, subject, body, attachments } = req.body;
    const userId = req.user._id;
    const senderEmail = req.user.email;

    const attachmentList = Array.isArray(attachments) ? attachments.map(String) : [];

    const draftEmail = new Email({
      userId,
      sender: senderEmail,
      recipient: recipient || "",
      cc: (Array.isArray(cc) ? cc : cc ? [cc] : []).map(e => String(e).trim()).filter(Boolean),
      bcc: (Array.isArray(bcc) ? bcc : bcc ? [bcc] : []).map(e => String(e).trim()).filter(Boolean),
      subject: subject || "(No Subject)",
      body: body || "",
      attachments: attachmentList,
      folder: "draft",
      isRead: true
    });

    await draftEmail.save();
    res.status(201).json(draftEmail);
  } catch (error) {
    console.error("Error in saveDraft:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getEmails(req, res) {
  try {
    const userId = req.user._id;
    const { folder = "inbox" } = req.query;

    const emails = await Email.find({ userId, folder })
      .sort({ createdAt: -1 });

    res.status(200).json(emails);
  } catch (error) {
    console.error("Error in getEmails:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateEmailStatus(req, res) {
  try {
    const { id } = req.params;
    const { folder, isRead } = req.body;
    const userId = req.user._id;

    const email = await Email.findOne({ _id: id, userId });
    if (!email) {
      return res.status(404).json({ message: "Email not found" });
    }

    if (folder !== undefined) email.folder = folder;
    if (isRead !== undefined) email.isRead = isRead;

    await email.save();
    res.status(200).json(email);
  } catch (error) {
    console.error("Error in updateEmailStatus:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}
