import express from "express";
import User from "../models/user.model.js";
import { verifyWebhook } from "@clerk/backend/webhooks";

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const signingSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
        if (!signingSecret) {
            res.status(503).json({ message: "Webhook secret is not provided" });
        return;
    }

    // clerk's verifier expects a Web Request with the raw body; express.raw gives a Buffer.
    const payload = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : String(req.body);
    const request = new Request("http://internal/webhooks/clerk", {
        method: "POST",
        headers: new Headers(req.headers),
        body: payload,
    });

    // throws if the signature is wrong or the body was tampered with; only then do we trust evt.
    const evt = await verifyWebhook(request, { signingSecret });

    if (evt.type === "user.created" || evt.type === "user.updated") {
        const u = evt.data;

        const email =
            u.email_addresses?.find((e) => e.id === u.primary_email_address_id)?.email_address ??
            u.email_addresses?.[0]?.email_address;

        const fullName =
            [u.first_name, u.last_name].filter(Boolean).join(" ") || u.username || email?.split("@")[0];

        let phoneNumber =
            u.phone_numbers?.find((p) => p.id === u.primary_phone_number_id)?.phone_number ??
            u.phone_numbers?.[0]?.phone_number;

        // Normalize phone number to E.164 format
        if (phoneNumber) {
            // Remove all non-digit characters except leading +
            phoneNumber = phoneNumber.replace(/[^\d+]/g, '');
            // Ensure it starts with +
            if (!phoneNumber.startsWith('+')) {
                phoneNumber = '+' + phoneNumber;
            }
            console.log(`[CLERK-WEBHOOK] Normalized phone: ${phoneNumber}`);
        }

        const updateData = { clerkId: u.id, email, fullName, profilePic: u.image_url };
        if (phoneNumber) {
            updateData.phoneNumber = phoneNumber;
        } else {
            updateData.phoneNumber = undefined;
        }
        
        console.log(`[CLERK-WEBHOOK] User synced - Email: ${email}, Phone: ${phoneNumber || 'none'}`);
        console.log(`[CLERK-WEBHOOK] Update data:`, updateData);

        await User.findOneAndUpdate(
            { clerkId: u.id },
            updateData,
            { new: true, upsert: true, setDefaultsOnInsert: true },
        );
    }

    if (evt.type === "user.deleted") {
        if (evt.data.id) await User.findOneAndDelete({ clerkId: evt.data.id });
    }

    res.status(200).json({ received: true });
    }
    catch (error) {
        console.error("Error in Clerk webhook:", error);
        res.status(400).json({ message: "Webhook verification failed" });
    }
});

export default router;