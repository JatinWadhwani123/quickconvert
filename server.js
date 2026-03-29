require("dotenv").config();
const helmet = require("helmet");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const passport = require("./config/passport");

// ROUTES
const authRoutes = require("./routes/auth");
const otpRoutes = require("./routes/otp");
const resetRoutes = require("./routes/reset");
const contactRoutes = require("./routes/contact");
const teamRoutes = require("./routes/team");

// LIBS
const sharp = require("sharp");
const archiver = require("archiver");
const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");
const mammoth = require("mammoth");
const { PDFDocument } = require("pdf-lib");

/* ================= MULTER ================= */

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

/* ================= APP ================= */

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use(
  helmet({
    contentSecurityPolicy: false
  })
);

// ✅ IMPORTANT (FIX FOR RENDER)
app.use(express.static(path.join(__dirname, "public")));

/* ================= DB ================= */

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("Mongo error:", err));

/* ================= AUTH ================= */

app.use(passport.initialize());
app.set("trust proxy", 1);

/* ================= API ROUTES ================= */

app.use("/api", otpRoutes);
app.use("/api/reset", resetRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api", authRoutes);
app.use("/api/team", teamRoutes);

/* ================= PAGE ROUTES ================= */

app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "public/pages/index.html"))
);

app.get("/login", (req, res) =>
  res.sendFile(path.join(__dirname, "public/pages/login.html"))
);

app.get("/register", (req, res) =>
  res.sendFile(path.join(__dirname, "public/pages/register.html"))
);

app.get("/dashboard", (req, res) =>
  res.sendFile(path.join(__dirname, "public/pages/dashboard.html"))
);

// ✅ 🔥 VERY IMPORTANT (YOUR ISSUE FIXED HERE)
app.get("/pages/join-team.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public/pages/join-team.html"));
});

/* ================= GOOGLE LOGIN ================= */

app.get("/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false
  })
);

app.get("/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
    session: false
  }),
  (req, res) => {
    const user = req.user;

    const token = jwt.sign(
      { email: user.emails[0].value },
      process.env.JWT_SECRET || "secret123",
      { expiresIn: "7d" }
    );

    res.redirect(`/auth-success.html?token=${token}`);
  }
);

/* ================= FILE FEATURES (UNCHANGED) ================= */


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

/* ================= PDF COMPRESS ================= */

app.post("/compress-pdf-file", upload.single("file"), async (req, res) => {
  try {
    const inputBytes = fs.readFileSync(req.file.path);

    const pdfDoc = await PDFDocument.load(inputBytes);

    // Basic optimization/compression
    const compressedBytes = await pdfDoc.save({
      useObjectStreams: true,
      compress: true
    });

    fs.unlinkSync(req.file.path);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=compressed.pdf"
    });

    res.end(Buffer.from(compressedBytes));

  } catch (err) {
    console.error("PDF Compression error:", err);
    res.status(500).send("PDF Compression failed");
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
/* ================= IMAGE RESIZER ================= */

app.post("/resize-image", upload.single("file"), async (req, res) => {
  try {
    const { width, height } = req.body;

    const resizedBuffer = await sharp(req.file.path)
      .resize(parseInt(width), parseInt(height))
      .toBuffer();

    fs.unlinkSync(req.file.path);

    res.set({
      "Content-Type": "image/jpeg",
      "Content-Disposition": "attachment; filename=resized.jpg"
    });

    res.send(resizedBuffer);

  } catch (err) {
    console.error("Resize error:", err);
    res.status(500).send("Resize failed");
  }
});



/* ================= FALLBACK (IMPORTANT FOR RENDER) ================= */

// ✅ prevents "Cannot GET"
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public/pages/index.html"));
});

/* ================= START ================= */

app.listen(PORT, () =>
  console.log(`🚀 QuickConvert running on ${PORT}`)
);