import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  syncContacts,
  checkRegistration,
  findUserByContact,
  updatePhoneNumber,
  inviteContact
} from "../controllers/contact.controller.js";

const router = express.Router();

router.use(protectRoute);

router.post("/sync", syncContacts);
router.get("/check", checkRegistration);
router.get("/find", findUserByContact);
router.put("/phone", updatePhoneNumber);
router.post("/invite", inviteContact);

export default router;
