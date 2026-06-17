import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getEmails,
  sendEmail,
  saveDraft,
  updateEmailStatus,
} from "../controllers/email.controller.js";

const router = express.Router();

router.use(protectRoute);

router.get("/", getEmails);
router.post("/send", sendEmail);
router.post("/draft", saveDraft);
router.put("/:id", updateEmailStatus);

export default router;
