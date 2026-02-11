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

// static frontend files
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
// BACKWARD COMPATIBILITY ROUTES
// ===============================

app.get("/converter.html", (req, res) =>
  res.redirect("/converter")
);

app.get("/compressor.html", (req, res) =>
  res.redirect("/compressor")
);

app.get("/merger.html", (req, res) =>
  res.redirect("/merger")
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
// IMAGE → PDF CONVERTER (SAFE)
// ===============================

app.post("/convert", upload.single("file"), async (req, res) => {

  if (!req.file)
    return res.status(400).send("No file uploaded");

  const filePath = req.file.path;

  try {

    // ✅ Only allow supported formats
    if (
      req.file.mimetype !== "image/jpeg" &&
      req.file.mimetype !== "image/png"
    ) {
      cleanup(filePath);
      return res.status(400).send(
        "Only JPG or PNG images are supported"
      );
    }

    const pdfDoc = await PDFDocument.create();
    const bytes = fs.readFileSync(filePath);

    let image;

    try {

      if (req.file.mimetype === "image/jpeg")
        image = await pdfDoc.embedJpg(bytes);

      if (req.file.mimetype === "image/png")
        image = await pdfDoc.embedPng(bytes);

    } catch (embedErr) {

      console.error("Embed error:", embedErr);
      cleanup(filePath);

      return res.status(500).send(
        "Image format not supported for PDF conversion"
      );

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

    console.error("Conversion crash:", err);
    cleanup(filePath);

    res.status(500).send("Conversion failed");

  }

});

// ===============================
// IMAGE COMPRESSOR — SAFE VERSION
// ===============================

app.post("/compress", upload.single("file"), async (req, res) => {

  if (!req.file)
    return res.status(400).send("No file uploaded");

  const filePath = req.file.path;

  try {

    // ✅ Validate supported image formats
    const allowed = ["image/jpeg", "image/png", "image/webp"];

    if (!allowed.includes(req.file.mimetype)) {
      cleanup(filePath);
      return res.status(400).send(
        "Only JPG, PNG or WEBP images supported"
      );
    }

    // ✅ Read buffer safely
    const inputBuffer = fs.readFileSync(filePath);

    const compressed = await sharp(inputBuffer)
      .jpeg({ quality: 60 })
      .toBuffer();

    cleanup(filePath);

    res.set({
      "Content-Type": "image/jpeg",
      "Content-Disposition": "attachment; filename=compressed.jpg",
      "Content-Length": compressed.length
    });

    res.end(compressed);

  }

  catch (err) {

    console.error("🔥 Sharp compression crash:", err);

    cleanup(filePath);

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
