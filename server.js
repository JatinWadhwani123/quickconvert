require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const authRoutes = require("./routes/auth");


/* ================= MULTER STORAGE ================= */

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const User = require("./models/user");
const otpRoutes = require("./routes/otp");
const resetRoutes = require("./routes/reset");

const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);

const archiver = require("archiver");
const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");
const mammoth = require("mammoth");
const { PDFDocument, StandardFonts } = require("pdf-lib");

class NodeCanvasFactory {
  create(width, height) {
    const Canvas = require("canvas");
    const canvas = Canvas.createCanvas(width, height);
    const context = canvas.getContext("2d");
    return { canvas, context };
  }
}
pdfjsLib.NodeCanvasFactory = NodeCanvasFactory;

/* ================= APP ================= */

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("Mongo error:", err));

app.use("/api", otpRoutes);
app.use("/api/reset", resetRoutes);
const contactRoutes = require("./routes/contact");
app.use("/api/contact", contactRoutes);
app.use("/api", authRoutes);





/* ================= ROUTES ================= */

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

app.get("/word-to-pdf", (req, res) =>
  res.sendFile(path.join(__dirname, "public/pages/word-to-pdf.html"))
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

/* ================= IMAGE → PDF ================= */

app.post("/convert", upload.single("file"), async (req, res) => {
  try {
    const pdfDoc = await PDFDocument.create();

    const image =
      req.file.mimetype === "image/jpeg"
        ? await pdfDoc.embedJpg(req.file.buffer)
        : await pdfDoc.embedPng(req.file.buffer);

    const page = pdfDoc.addPage([image.width, image.height]);
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

/* ================= COMPRESS ================= */

app.post("/compress", upload.single("file"), async (req, res) => {
  try {
    const inputPath = req.file.path;

    const compressedBuffer = await sharp(inputPath)
      .jpeg({ quality: 60 })
      .toBuffer();

    fs.unlinkSync(inputPath);

    res.set({
      "Content-Type": "image/jpeg",
      "Content-Disposition": "attachment; filename=compressed.jpg"
    });

    res.send(compressedBuffer);

  } catch (err) {
    console.error("Compression error:", err);
    res.status(500).send("Compression failed");
  }
});

/* ================= MERGE ================= */

app.post("/merge", upload.array("files"), async (req, res) => {
  try {
    const merged = await PDFDocument.create();

    for (const f of req.files) {
      const fileBytes = fs.readFileSync(f.path);
      const pdf = await PDFDocument.load(fileBytes);

      const pages = await merged.copyPages(pdf, pdf.getPageIndices());
      pages.forEach(p => merged.addPage(p));

      fs.unlinkSync(f.path);
    }

    const bytes = await merged.save();

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=merged.pdf"
    });

    res.end(Buffer.from(bytes));

  } catch (err) {
    console.error("MERGE ERROR:", err);
    res.status(500).send("Merge failed");
  }
});

/* ================= SPLIT (ONLY FIXED PART) ================= */

app.post("/split", upload.single("file"), async (req, res) => {
  try {
    const fileBytes = fs.readFileSync(req.file.path);

    const pdf = await PDFDocument.load(fileBytes);
    const newPdf = await PDFDocument.create();

    const [page] = await newPdf.copyPages(pdf, [0]);
    newPdf.addPage(page);

    const bytes = await newPdf.save();

    fs.unlinkSync(req.file.path);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=split.pdf"
    });

    res.end(Buffer.from(bytes));

  } catch (err) {
    console.error("SPLIT ERROR:", err);
    res.status(500).send("Split failed");
  }
});


// Pdf to word 

app.post("/api/pdf-to-word", upload.single("file"), async (req, res) => {
  try {
    const fs = require("fs");
    const pdf = require("pdf-parse");
    const { Document, Packer, Paragraph } = require("docx");

    // READ FILE FROM DISK (because multer uses diskStorage)
    const pdfBuffer = fs.readFileSync(req.file.path);

    // EXTRACT TEXT
    const data = await pdf(pdfBuffer);
    const text = data.text || "No readable text found.";

    // CREATE DOCX FILE
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: text.split("\n").map(line => new Paragraph(line))
        }
      ]
    });

    const buffer = await Packer.toBuffer(doc);

    // DELETE TEMP FILE
    fs.unlinkSync(req.file.path);

    // SEND DOCX
    res.set({
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": "attachment; filename=converted.docx"
    });

    res.end(buffer);

  } catch (err) {
    console.error("PDF → Word error:", err);
    res.status(500).send("Conversion failed");
  }
});


/* ================= STATIC ================= */

app.use(express.static("public"));

/* ================= START ================= */

app.listen(PORT, () =>
  console.log(`🚀 QuickConvert running on ${PORT}`)
);
