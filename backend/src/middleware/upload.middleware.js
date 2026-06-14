import multer from "multer";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25mb

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    const isImage = file.mimetype.startsWith("image/");
    const isVideo = file.mimetype.startsWith("video/");
    const isPdf = file.mimetype.startsWith("pdf/");
 

    if (!isImage && !isVideo && !isPdf) {
      cb(new Error("Only image, video, and PDF uploads are allowed"));
      return;
    }

    cb(null, true);
  },
});