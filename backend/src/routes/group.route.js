import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";
import {
  createGroup,
  joinGroup,
  getGroups,
  getPublicGroups,
  getGroupMessages,
  sendGroupMessage,
  addReaction,
} from "../controllers/group.controller.js";

const router = express.Router();

router.use(protectRoute);

router.get("/", getGroups);
router.get("/public", getPublicGroups);
router.post("/create", createGroup);
router.post("/join", joinGroup);
router.get("/:id", getGroupMessages);
router.post("/send/:id", upload.single("media"), sendGroupMessage);
router.post("/messages/:messageId/reactions", addReaction);

export default router;
