// ===============================
// IMPORTS
// ===============================

require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const sharp = require("sharp");
const { PDFDocument } = require("pdf-lib");
const path = require("path");

const User = require("./models/user");
const otpRoutes = require("./routes/otp");
const resetRoutes = require("./routes/reset");
const nodemailer = require("nodemailer");
const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);
const archiver = require("archiver");
const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");




class NodeCanvasFactory {
  create(width, height) {
    const Canvas = require("canvas");
    const canvas = Canvas.createCanvas(width, height);
    const context = canvas.getContext("2d");
    return { canvas, context };
  }
}
pdfjsLib.NodeCanvasFactory = NodeCanvasFactory;



// ===============================
// APP SETUP
// ===============================

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ===============================
// DATABASE
// ===============================

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("Mongo error:", err));

// ===============================
// ROUTES
// ===============================

app.use("/api", otpRoutes);
app.use("/api/reset", resetRoutes);

// ===============================
// CLEAN PAGE ROUTES
// ===============================

app.get("/login", (req, res) =>
  res.sendFile(path.join(__dirname, "public/pages/login.html"))
);

app.get("/register", (req, res) =>
  res.sendFile(path.join(__dirname, "public/pages/register.html"))
);

app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "public/pages/index.html"))
);

app.get("/converter", (req, res) =>
  res.sendFile(path.join(__dirname, "public/pages/converter.html"))
);

/* ⭐⭐⭐ THIS IS THE NEW SEO ROUTE ⭐⭐⭐ */
app.get("/image-to-pdf", (req, res) =>
  res.sendFile(path.join(__dirname, "public/pages/image-to-pdf.html"))
);
app.get("/compress-pdf", (req, res) =>
  res.sendFile(path.join(__dirname, "public/pages/compress-pdf.html"))
);
app.get("/merge-pdf", (req, res) =>
  res.sendFile(path.join(__dirname, "public/pages/merge-pdf.html"))
);
app.get("/split-pdf", (req, res) =>
  res.sendFile(path.join(__dirname, "public/pages/split-pdf.html"))
);
app.get("/pdf-to-jpg", (req, res) =>
  res.sendFile(path.join(__dirname, "public/pages/pdf-to-jpg.html"))
);
app.get("/pdf-to-word", (req, res) =>
  res.sendFile(path.join(__dirname, "public/pages/pdf-to-word.html"))
);




app.get("/compressor", (req, res) =>
  res.sendFile(path.join(__dirname, "public/pages/compressor.html"))
);

app.get("/merger", (req, res) =>
  res.sendFile(path.join(__dirname, "public/pages/merger.html"))
);

app.get("/disclaimer", (req, res) =>
  res.sendFile(path.join(__dirname, "public/pages/disclaimer.html"))
);

// ===============================
// MULTER CONFIG
// ===============================

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
});

// ===============================
// IMAGE → PDF
// ===============================

app.post("/convert", upload.single("file"), async (req, res) => {
  try {
    const pdfDoc = await PDFDocument.create();

    const image =
      req.file.mimetype === "image/jpeg"
        ? await pdfDoc.embedJpg(req.file.buffer)
        : await pdfDoc.embedPng(req.file.buffer);

    const page = pdfDoc.addPage([
      image.width,
      image.height
    ]);

    page.drawImage(image, { x: 0, y: 0 });

    const bytes = await pdfDoc.save();

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment"
    });

    res.end(Buffer.from(bytes));

  } catch {
    res.status(500).send("Conversion failed");
  }
});

// ===============================
// COMPRESS
// ===============================

app.post("/compress", upload.single("file"), async (req, res) => {
  try {
    const out = await sharp(req.file.buffer)
      .jpeg({ quality: 60 })
      .toBuffer();

    res.set({
      "Content-Type": "image/jpeg",
      "Content-Disposition": "attachment"
    });

    res.end(out);

  } catch {
    res.status(500).send("Compression failed");
  }
});

// ===============================
// MERGE PDFs
// ===============================

app.post("/merge", upload.array("files"), async (req, res) => {
  try {
    const merged = await PDFDocument.create();

    for (const f of req.files) {
      const pdf = await PDFDocument.load(f.buffer);

      const pages = await merged.copyPages(
        pdf,
        pdf.getPageIndices()
      );

      pages.forEach(p => merged.addPage(p));
    }

    const bytes = await merged.save();

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment"
    });

    res.end(Buffer.from(bytes));

  } catch {
    res.status(500).send("Merge failed");
  }
});


// ===============================
// SPLIT PDF
// ===============================

app.post("/split", upload.single("file"), async (req, res) => {

  try {

    const pdf = await PDFDocument.load(req.file.buffer);

    const newPdf = await PDFDocument.create();

    const pageIndex = 0; // first page only for now

    const [page] = await newPdf.copyPages(pdf, [pageIndex]);
    newPdf.addPage(page);

    const bytes = await newPdf.save();

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment"
    });

    res.end(Buffer.from(bytes));

  } catch {

    res.status(500).send("Split failed");

  }

});
// ===============================
// PDF → WORD (REAL DOCX)
// ===============================

const pdfParse = require("pdf-parse");
const { Document, Packer, Paragraph, TextRun } = require("docx");

app.post("/pdf-to-word", upload.single("file"), async (req, res) => {

  try {

    if (!req.file)
      return res.status(400).send("No file uploaded");

    // Extract text from PDF
    const data = await pdfParse(req.file.buffer);

    const text = data.text || "No text found in PDF.";

    // Split into paragraphs
    const lines = text.split("\n");

    // Create Word document
    const doc = new Document({
      sections: [
        {
          children: lines.map(line =>
            new Paragraph({
              children: [
                new TextRun({
                  text: line,
                  size: 22
                })
              ],
              spacing: { after: 200 }
            })
          )
        }
      ]
    });

    // Convert to buffer
    const buffer = await Packer.toBuffer(doc);

    // Send download
    res.set({
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": "attachment; filename=converted.docx"
    });

    res.end(buffer);

  } catch (err) {

    console.error("PDF TO WORD ERROR:", err);
    res.status(500).send("Conversion failed");

  }

});





// ===============================
// STATIC FILES
// ===============================

app.use(express.static("public"));

// ===============================
// START SERVER
// ===============================

app.listen(PORT, () =>
  console.log(`🚀 QuickConvert running on ${PORT}`)
);
