import express from "express";
import multer from "multer";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  syncContactsFromVCF,
  syncContactsManual,
  getSyncStatus
} from "../controllers/webSync.controller.js";

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    // Only allow .vcf files
    if (file.mimetype === "text/vcard" || file.originalname.endsWith(".vcf")) {
      cb(null, true);
    } else {
      cb(new Error("Only .vcf files are allowed"));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Protect all routes
router.use(protectRoute);

// GET sync status
router.get("/status", getSyncStatus);

// POST VCF file upload
router.post("/vcf", upload.single("file"), syncContactsFromVCF);

// POST manual contact entry
router.post("/manual", syncContactsManual);

export default router;
