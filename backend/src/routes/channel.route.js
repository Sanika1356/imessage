import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";
import {
  createChannel,
  subscribeChannel,
  getChannels,
  getChannelPosts,
  postToChannel,
  pinPost,
} from "../controllers/channel.controller.js";

const router = express.Router();

router.use(protectRoute);

router.get("/", getChannels);
router.post("/create", createChannel);
router.post("/subscribe", subscribeChannel);
router.get("/:id", getChannelPosts);
router.post("/send/:id", upload.single("media"), postToChannel);
router.post("/pin", pinPost);

export default router;
