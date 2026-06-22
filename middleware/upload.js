const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const fileType = require("file-type");
const multer = require("multer");
const sanitize = require("sanitize-filename");

const env = require("../config/env");
const { badRequest } = require("../utils/httpError");

const uploadRoot = path.join(__dirname, "..", "uploads");
fs.mkdirSync(uploadRoot, { recursive: true });

const allowed = {
  image: {
    extensions: new Set([".jpg", ".jpeg", ".png", ".webp"]),
    mimes: new Set(["image/jpeg", "image/png", "image/webp"])
  },
  pdf: {
    extensions: new Set([".pdf"]),
    mimes: new Set(["application/pdf"])
  },
  word: {
    extensions: new Set([".doc", ".docx"]),
    mimes: new Set([
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/zip"
    ])
  }
};

function safeUploadName(originalName) {
  const parsed = path.parse(sanitize(originalName || "upload"));
  const base = parsed.name.slice(0, 80) || "upload";
  const ext = parsed.ext.toLowerCase();
  return `${Date.now()}-${crypto.randomBytes(8).toString("hex")}-${base}${ext}`;
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadRoot),
  filename: (req, file, cb) => cb(null, safeUploadName(file.originalname))
});

const upload = multer({
  storage,
  limits: {
    fileSize: env.maxUploadBytes,
    files: env.MAX_UPLOAD_FILES
  }
});

async function cleanupFiles(files) {
  await Promise.all(
    files
      .filter(Boolean)
      .map(file => fs.promises.unlink(file.path).catch(() => {}))
  );
}

async function validateOneFile(file, kind) {
  if (!file) throw badRequest("No file uploaded.", "NO_FILE");

  const rule = allowed[kind];
  if (!rule) throw badRequest("Unsupported upload type.", "UNSUPPORTED_UPLOAD_TYPE");

  const ext = path.extname(file.originalname || file.filename).toLowerCase();
  if (!rule.extensions.has(ext)) {
    throw badRequest(`Invalid file extension for ${kind} upload.`, "INVALID_EXTENSION");
  }

  const detected = await fileType.fromFile(file.path);
  const detectedMime = detected?.mime || file.mimetype;

  if (!rule.mimes.has(detectedMime)) {
    throw badRequest(`Invalid file type. Expected ${kind} file.`, "INVALID_MIME_TYPE");
  }

  file.detectedMime = detectedMime;
}

function validateUploadedFiles(kind) {
  return async (req, res, next) => {
    const files = req.files || (req.file ? [req.file] : []);

    try {
      for (const file of files) {
        await validateOneFile(file, kind);
      }
      next();
    } catch (err) {
      await cleanupFiles(files);
      next(err);
    }
  };
}

module.exports = {
  upload,
  uploadRoot,
  cleanupFiles,
  validateUploadedFiles
};
