import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";
import {
  createGroup,
  joinGroup,
  getGroups,
  getGroupMessages,
  sendGroupMessage,
} from "../controllers/group.controller.js";

const router = express.Router();

router.use(protectRoute);

router.get("/", getGroups);
router.post("/create", createGroup);
router.post("/join", joinGroup);
router.get("/:id", getGroupMessages);
router.post("/send/:id", upload.single("media"), sendGroupMessage);

export default router;
