// ===============================
// IMPORTS
// ===============================

const express = require("express");
const multer = require("multer");
const { PDFDocument } = require("pdf-lib");
const sharp = require("sharp");
const path = require("path");
const storage = multer.memoryStorage();

// ===============================
// APP SETUP
// ===============================

const app = express();
const PORT = process.env.PORT || 3000;

// =====================
// MULTER CONFIG — LARGE FILE SUPPORT
// =====================
const upload = multer({
  storage,

  limits: {
    fileSize: 50 * 1024 * 1024, // ✅ 50MB per file
    files: 20                   // ✅ allow multiple PDFs
  },

  fileFilter: (req, file, cb) => {

    if (
      file.mimetype === "application/pdf" ||
      file.mimetype.startsWith("image/")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"), false);
    }

  }

});


// static frontend
app.use(express.static("public"));

// ===============================
// PAGE ROUTES
// ===============================

// Dashboard
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/pages/index.html"));
});

// Converter
app.get("/converter", (req, res) => {
  res.sendFile(path.join(__dirname, "public/pages/converter.html"));
});

// Compressor
app.get("/compressor", (req, res) => {
  res.sendFile(path.join(__dirname, "public/pages/compressor.html"));
});
//Merger
app.get("/merger", (req, res) =>
  res.sendFile(path.join(__dirname, "public/pages/merger.html"))
);

app.get("/privacy", (req, res) => {
  res.sendFile(__dirname + "/public/privacy.html");
});

app.get("/terms", (req, res) => {
  res.sendFile(__dirname + "/public/terms.html");
});

app.get("/contact", (req, res) => {
  res.sendFile(__dirname + "/public/contact.html");
});


// backward compatibility
app.get("/converter.html", (_, res) => res.redirect("/converter"));
app.get("/compressor.html", (_, res) => res.redirect("/compressor"));
app.get("/merger.html", (_, res) => res.redirect("/merger"));

// ===============================
// IMAGE → PDF CONVERTER
// ===============================

app.post("/convert", upload.single("file"), async (req, res) => {

  try {

    if (!req.file)
      return res.status(400).send("No file uploaded");

    const allowed = ["image/jpeg", "image/png"];

    if (!allowed.includes(req.file.mimetype))
      return res.status(400).send("Only JPG or PNG supported");

    const buffer = req.file.buffer;

    // validate image buffer
    await sharp(buffer).metadata();

    const pdfDoc = await PDFDocument.create();

    let image;

    if (req.file.mimetype === "image/jpeg")
      image = await pdfDoc.embedJpg(buffer);

    if (req.file.mimetype === "image/png")
      image = await pdfDoc.embedPng(buffer);

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

    console.error("🔥 Conversion crash:", err);
    res.status(500).send("Server conversion failed");

  }

});

// ===============================
// IMAGE COMPRESSOR
// ===============================

app.post("/compress", upload.single("file"), async (req, res) => {

  try {

    if (!req.file)
      return res.status(400).send("No file uploaded");

    const allowed = ["image/jpeg", "image/png", "image/webp"];

    if (!allowed.includes(req.file.mimetype))
      return res.status(400).send("Only JPG, PNG or WEBP supported");

    const compressed = await sharp(req.file.buffer)
      .jpeg({ quality: 60 })
      .toBuffer();

    res.set({
      "Content-Type": "image/jpeg",
      "Content-Disposition": "attachment; filename=compressed.jpg"
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
