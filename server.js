// ===============================
// IMPORTS
// ===============================

const express = require("express");
const multer = require("multer");
const { PDFDocument } = require("pdf-lib");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

// ===============================
// APP SETUP
// ===============================

const app = express();
const PORT = process.env.PORT || 3000;

// temp upload storage (Render safe)
const upload = multer({ dest: "uploads/" });

// static frontend
app.use(express.static("public"));

// ===============================
// PAGE ROUTES (clean URLs)
// ===============================

app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "public/pages/index.html"))
);

app.get("/converter", (req, res) =>
  res.sendFile(path.join(__dirname, "public/pages/converter.html"))
);

app.get("/compressor", (req, res) =>
  res.sendFile(path.join(__dirname, "public/pages/compressor.html"))
);

app.get("/merger", (req, res) =>
  res.sendFile(path.join(__dirname, "public/pages/merger.html"))
);

// ===============================
// FILE CLEANUP HELPER
// ===============================

function cleanup(file) {
  try {
    fs.unlinkSync(file);
  } catch {}
}

// ===============================
// IMAGE → PDF CONVERTER
// ===============================

app.post("/convert", upload.single("file"), async (req, res) => {

  if (!req.file)
    return res.status(400).send("No file uploaded");

  const filePath = req.file.path;

  try {

    const pdfDoc = await PDFDocument.create();
    const bytes = fs.readFileSync(filePath);

    let image;

    if (req.file.mimetype === "image/jpeg")
      image = await pdfDoc.embedJpg(bytes);

    else if (req.file.mimetype === "image/png")
      image = await pdfDoc.embedPng(bytes);

    else {
      cleanup(filePath);
      return res.status(400).send("Unsupported image format");
    }

    const page = pdfDoc.addPage([image.width, image.height]);
    page.drawImage(image, { x: 0, y: 0 });

    const pdfBytes = await pdfDoc.save();

    cleanup(filePath);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=converted.pdf"
    });

    res.end(Buffer.from(pdfBytes));

  }

  catch (err) {

    console.error("Convert error:", err);
    cleanup(filePath);

    res.status(500).send("Conversion failed");

  }

});

// ===============================
// IMAGE COMPRESSOR
// ===============================

app.post("/compress", upload.single("file"), async (req, res) => {

  if (!req.file)
    return res.status(400).send("No file uploaded");

  if (!req.file.mimetype.startsWith("image/")) {
    cleanup(req.file.path);
    return res.status(400).send("Only image files allowed");
  }

  try {

    const compressed = await sharp(req.file.path)
      .jpeg({ quality: 60 })
      .toBuffer();

    cleanup(req.file.path);

    res.set({
      "Content-Type": "image/jpeg",
      "Content-Disposition": "attachment; filename=compressed.jpg",
      "Content-Length": compressed.length
    });

    res.end(compressed);

  }

  catch (err) {

    console.error("Compression error:", err);
    cleanup(req.file.path);

    res.status(500).send("Compression failed");

  }

});

// ===============================
// PDF MERGER
// ===============================

app.post("/merge", upload.array("files"), async (req, res) => {

  if (!req.files || req.files.length < 2)
    return res.status(400).send("Upload at least 2 PDFs");

  try {

    const mergedPdf = await PDFDocument.create();

    for (const file of req.files) {

      const pdfBytes = fs.readFileSync(file.path);

      if (!pdfBytes.slice(0, 5).toString().includes("%PDF")) {
        cleanup(file.path);
        return res.status(400).send("Invalid PDF detected");
      }

      const pdf = await PDFDocument.load(pdfBytes);

      const pages = await mergedPdf.copyPages(
        pdf,
        pdf.getPageIndices()
      );

      pages.forEach(p => mergedPdf.addPage(p));

      cleanup(file.path);
    }

    const mergedBytes = await mergedPdf.save();

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=merged.pdf"
    });

    res.end(Buffer.from(mergedBytes));

  }

  catch (err) {

    console.error("Merge error:", err);
    req.files?.forEach(f => cleanup(f.path));

    res.status(500).send("Merge failed");

  }

});

// ===============================
// SERVER START
// ===============================

app.listen(PORT, () =>
  console.log(`🚀 QuickConvert running on port ${PORT}`)
);
