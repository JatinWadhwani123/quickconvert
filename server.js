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
const User = require("./models/user");

// ROUTES
const authRoutes = require("./routes/auth");
const otpRoutes = require("./routes/otp");
const resetRoutes = require("./routes/reset");
const contactRoutes = require("./routes/contact");
const teamRoutes = require("./routes/team");

// LIBS
const sharp = require("sharp");
const archiver = require("archiver");
const mammoth = require("mammoth");
const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");

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
app.use("/api/auth", authRoutes);
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

const pageRoutes = {
  "/image-to-pdf": "image-to-pdf.html",
  "/compress-pdf": "compress-pdf.html",
  "/merge-pdf": "merge-pdf.html",
  "/split-pdf": "split-pdf.html",
  "/pdf-to-jpg": "pdf-to-jpg.html",
  "/pdf-to-png": "pdf-to-png.html",
  "/pdf-to-word": "pdf-to-word.html",
  "/word-to-pdf": "word-to-pdf.html",
  "/pdf-compressor": "pdf-compressor.html",
  "/image-resizer": "image-resizer.html",
  "/resize-image": "image-resizer.html",
  "/about": "about.html",
  "/contact": "contact.html",
  "/privacy": "privacy.html",
  "/terms": "terms.html",
  "/disclaimer": "disclaimer.html"
};

Object.entries(pageRoutes).forEach(([route, file]) => {
  app.get(route, (req, res) => {
    res.sendFile(path.join(__dirname, "public/pages", file));
  });
});

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
    const profile = req.user;
    const email = profile.emails?.[0]?.value;
    const name = profile.displayName || "";

    if (!email) {
      return res.redirect("/login");
    }

    User.findOneAndUpdate(
      { email },
      { $setOnInsert: { email, name, password: "", authProvider: "google" } },
      { new: true, upsert: true }
    ).then(user => {
      const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "secret123",
      { expiresIn: "7d" }
    );

    res.redirect(`/auth-success.html?token=${token}`);
    }).catch(err => {
      console.error("Google login error:", err);
      res.redirect("/login");
    });
  }
);

/* ================= FILE FEATURES (UNCHANGED) ================= */


/* ================= IMAGE → PDF ================= */

app.post("/convert", upload.single("file"), async (req, res) => {
  try {
    const pdfDoc = await PDFDocument.create();
    const imageBytes = fs.readFileSync(req.file.path);

    const image =
      req.file.mimetype === "image/jpeg"
        ? await pdfDoc.embedJpg(imageBytes)
        : await pdfDoc.embedPng(imageBytes);

    const page = pdfDoc.addPage([image.width, image.height]);
    page.drawImage(image, { x: 0, y: 0 });

    const bytes = await pdfDoc.save();
    fs.unlinkSync(req.file.path);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=converted.pdf"
    });

    res.end(Buffer.from(bytes));

  } catch (err) {
    console.error("Image to PDF error:", err);
    if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
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

/* ================= WORD → PDF ================= */

app.post("/api/word-to-pdf", upload.single("file"), async (req, res) => {
  try {
    const result = await mammoth.extractRawText({ path: req.file.path });
    const text = result.value?.trim() || "No readable text found.";

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const pageSize = [595.28, 841.89];
    const margin = 54;
    const fontSize = 11;
    const lineHeight = 16;
    const maxWidth = pageSize[0] - margin * 2;

    let page = pdfDoc.addPage(pageSize);
    let y = pageSize[1] - margin;

    page.drawText("QuickConvert Word to PDF", {
      x: margin,
      y,
      size: 16,
      font: boldFont,
      color: rgb(0.12, 0.12, 0.16)
    });

    y -= 28;

    const wrapText = (line) => {
      const words = line.split(/\s+/).filter(Boolean);
      const lines = [];
      let current = "";

      words.forEach(word => {
        const next = current ? `${current} ${word}` : word;
        if (font.widthOfTextAtSize(next, fontSize) <= maxWidth) {
          current = next;
        } else {
          if (current) lines.push(current);
          current = word;
        }
      });

      if (current) lines.push(current);
      return lines.length ? lines : [""];
    };

    text.split(/\r?\n/).forEach(rawLine => {
      wrapText(rawLine).forEach(line => {
        if (y < margin) {
          page = pdfDoc.addPage(pageSize);
          y = pageSize[1] - margin;
        }

        page.drawText(line, {
          x: margin,
          y,
          size: fontSize,
          font,
          color: rgb(0.18, 0.18, 0.22)
        });

        y -= line ? lineHeight : lineHeight / 2;
      });
    });

    const bytes = await pdfDoc.save();
    fs.unlinkSync(req.file.path);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=converted.pdf"
    });

    res.end(Buffer.from(bytes));

  } catch (err) {
    console.error("Word to PDF error:", err);
    if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).send("Word to PDF conversion failed");
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

// ✅ prevents "Cannot GET" — use a catch-all middleware to avoid path-to-regexp issues
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "public/pages/index.html"));
});

/* ================= START ================= */

app.listen(PORT, () =>
  console.log(`🚀 QuickConvert running on ${PORT}`)
);
