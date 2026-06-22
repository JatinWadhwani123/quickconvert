const express = require("express");

const { upload, validateUploadedFiles } = require("../middleware/upload");
const { uploadLimiter } = require("../middleware/rateLimiters");
const tools = require("../services/fileToolsService");

const router = express.Router();

router.post("/convert", uploadLimiter, upload.single("file"), validateUploadedFiles("image"), tools.imageToPdf);
router.post("/compress", uploadLimiter, upload.single("file"), validateUploadedFiles("image"), tools.compressImage);
router.post("/resize-image", uploadLimiter, upload.single("file"), validateUploadedFiles("image"), tools.resizeImage);

router.post("/compress-pdf-file", uploadLimiter, upload.single("file"), validateUploadedFiles("pdf"), tools.compressPdf);
router.post("/merge", uploadLimiter, upload.array("files"), validateUploadedFiles("pdf"), tools.mergePdf);
router.post("/split", uploadLimiter, upload.single("file"), validateUploadedFiles("pdf"), tools.splitPdf);
router.post("/api/pdf-to-word", uploadLimiter, upload.single("file"), validateUploadedFiles("pdf"), tools.pdfToWord);
router.post("/api/word-to-pdf", uploadLimiter, upload.single("file"), validateUploadedFiles("word"), tools.wordToPdf);

module.exports = router;
