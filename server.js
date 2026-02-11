// ===============================
// IMPORTS
// ===============================

const express = require("express");
const multer = require("multer");
const { PDFDocument } = require("pdf-lib");
const sharp = require("sharp");
const path = require("path");

// ===============================
// APP SETUP
// ===============================

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ MEMORY upload — Render safe
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

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

// backward compatibility

app.get("/converter.html", (req, res) => res.redirect("/converter"));
app.get("/compressor.html", (req, res) => res.redirect("/compressor"));
app.get("/merger.html", (req, res) => res.redirect("/merger"));

// ===============================
// IMAGE → PDF CONVERTER
// ===============================

app.post("/convert", upload.single("image"), async (req, res) => {

  try {

    if (!req.file)
      return res.status(400).send("No file uploaded");

    if (!["image/jpeg", "image/png"].includes(req.file.mimetype))
      return res.status(400).send("Only JPG or PNG supported");

    const pdfDoc = await PDFDocument.create();

    let image;

    if (req.file.mimetype === "image/jpeg")
      image = await pdfDoc.embedJpg(req.file.buffer);

    if (req.file.mimetype === "image/png")
      image = await pdfDoc.embedPng(req.file.buffer);

    const page = pdfDoc.addPage([image.width, image.height]);

    page.drawImage(image, { x: 0, y: 0 });

    const pdfBytes = await pdfDoc.save();

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=converted.pdf"
    });

    res.end(Buffer.from(pdfBytes));

  }

  catch (err) {

    console.error("🔥 Convert crash:", err);
    res.status(500).send("Conversion failed");

  }

});

// ===============================
// IMAGE COMPRESSOR
// ===============================

app.post("/compress", upload.single("image"), async (req, res) => {

  try {

    if (!req.file)
      return res.status(400).send("No file uploaded");

    const allowed = ["image/jpeg", "image/png", "image/webp"];

    if (!allowed.includes(req.file.mimetype))
      return res.status(400).send(
        "Only JPG, PNG or WEBP supported"
      );

    const compressed = await sharp(req.file.buffer)
      .jpeg({ quality: 60 })
      .toBuffer();

    res.set({
      "Content-Type": "image/jpeg",
      "Content-Disposition": "attachment; filename=compressed.jpg",
      "Content-Length": compressed.length
    });

    res.end(compressed);

  }

  catch (err) {

    console.error("🔥 Compression crash:", err);
    res.status(500).send("Compression failed");

  }

});

// ===============================
// PDF MERGER
// ===============================

app.post("/merge", upload.array("files"), async (req, res) => {

  try {

    if (!req.files || req.files.length < 2)
      return res.status(400).send("Upload at least 2 PDFs");

    const mergedPdf = await PDFDocument.create();

    for (const file of req.files) {

      if (!file.buffer.slice(0, 5).toString().includes("%PDF"))
        return res.status(400).send("Invalid PDF detected");

      const pdf = await PDFDocument.load(file.buffer);

      const pages = await mergedPdf.copyPages(
        pdf,
        pdf.getPageIndices()
      );

      pages.forEach(p => mergedPdf.addPage(p));
    }

    const mergedBytes = await mergedPdf.save();

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=merged.pdf"
    });

    res.end(Buffer.from(mergedBytes));

  }

  catch (err) {

    console.error("🔥 Merge crash:", err);
    res.status(500).send("Merge failed");

  }

});

// ===============================
// SERVER START
// ===============================

app.listen(PORT, () =>
  console.log(`🚀 QuickConvert running on port ${PORT}`)
);
