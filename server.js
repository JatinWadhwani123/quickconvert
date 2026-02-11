const express = require("express");
const multer = require("multer");
const { PDFDocument } = require("pdf-lib");
const fs = require("fs");
const os = require("os");
const sharp = require("sharp");
const CloudConvert = require("cloudconvert");

const cloudConvert = new CloudConvert(
  process.env.CLOUDCONVERT_API_KEY
);



const app = express();
const PORT = process.env.PORT || 3000;

const upload = multer({ dest: "uploads/" });

app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/pages/index.html");
});

app.get("/converter.html", (req, res) => {
  res.sendFile(__dirname + "/public/pages/converter.html");
});

app.get("/compressor.html", (req, res) => {
  res.sendFile(__dirname + "/public/pages/compressor.html");
});

app.get("/merger.html", (req, res) => {
  res.sendFile(__dirname + "/public/pages/merger.html");
});



// ===============================
// CONVERSION ROUTE — SAFE VERSION
// ===============================

app.post("/convert", upload.single("file"), async (req, res) => {

  if (!req.file) {
    return res.status(400).send("No file uploaded");
  }

  const filePath = req.file.path;
  const type = req.body.mode;

  try {

    // ===============================
    // IMAGE → PDF
    // ===============================

    if (type === "img2pdf") {

      const pdfDoc = await PDFDocument.create();
      const bytes = fs.readFileSync(filePath);

      let image;

      if (req.file.mimetype === "image/jpeg") {
        image = await pdfDoc.embedJpg(bytes);
      }

      else if (req.file.mimetype === "image/png") {
        image = await pdfDoc.embedPng(bytes);
      }

      else {
        cleanup(filePath);
        return res.status(400).send("Unsupported image format");
      }

      const page = pdfDoc.addPage([image.width, image.height]);
      page.drawImage(image, { x: 0, y: 0 });

      const pdfBytes = await pdfDoc.save();

      cleanup(filePath);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="converted.pdf"`
      );

      return res.send(Buffer.from(pdfBytes));

    }


    // ===============================
    // PDF → IMAGE (placeholder)
    // ===============================

    else if (type === "pdf2img") {

      cleanup(filePath);

      return res.status(501).send(
        "PDF → Image conversion not enabled on server."
      );

    }


    // ===============================
    // INVALID MODE
    // ===============================

    else {

      cleanup(filePath);

      return res.status(400).send("Invalid conversion mode");

    }

  }

  catch (err) {

    console.error("Conversion error:", err);

    cleanup(filePath);

    return res.status(500).send("Conversion failed");

  }

});


// ===============================
// FILE CLEANUP
// ===============================

function cleanup(path) {
  try {
    fs.unlinkSync(path);
  } catch {}
}
// ===============================
// IMAGE COMPRESSOR — MEMORY SAFE
// ===============================

app.post("/compress", upload.single("file"), async (req, res) => {

  console.log("🔥 Compress request received");

  if (!req.file) {
    return res.status(400).send("No file uploaded");
  }

  if (!req.file.mimetype.startsWith("image/")) {
    cleanup(req.file.path);
    return res.status(400).send("Only images allowed");
  }

  try {

    const compressedBuffer = await sharp(req.file.path)
      .jpeg({ quality: 60 })
      .toBuffer();

    cleanup(req.file.path);

    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="compressed.jpg"'
    );

    res.send(compressedBuffer);

    console.log("✅ Compression success");

  }

  catch (err) {

    console.error("💥 Sharp crash:", err);

    cleanup(req.file.path);

    res.status(500).send("Compression failed");

  }

});

// ===============================
// PDF MERGE ROUTE — FINAL SAFE VERSION
// ===============================

app.post("/merge", upload.array("files"), async (req, res) => {

  console.log("Merge request received");

  if (!req.files || req.files.length < 2) {
    return res.status(400).send("Upload at least 2 PDFs");
  }

  try {

    const mergedPdf = await PDFDocument.create();

    for (const file of req.files) {

      console.log("Processing:", file.originalname);

      const pdfBytes = fs.readFileSync(file.path);

      // 🔥 Validate PDF header
      if (!pdfBytes.slice(0, 5).toString().includes("%PDF")) {
        cleanup(file.path);
        return res.status(400).send(
          `Invalid PDF: ${file.originalname}`
        );
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

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="merged.pdf"`
    );

    res.end(Buffer.from(mergedBytes));

  }

  catch (err) {

    console.error("Merge crash:", err);

    req.files?.forEach(f => cleanup(f.path));

    res.status(500).send("Merge failed — invalid or corrupted PDF");

  }

});





// ===============================
// SERVER START
// ===============================

app.listen(PORT, () =>
  console.log(`🚀 Converter running on port ${PORT}`)
);
