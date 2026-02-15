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




app.post("/contact", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ message: "All fields required" });
    }

    // =========================
    // PRODUCTION → USE RESEND
    // =========================
    if (process.env.RESEND_API_KEY) {

      await resend.emails.send({
        from: "QuickConvert <onboarding@resend.dev>",

        to: process.env.EMAIL_USER,
        subject: `Contact: ${subject}`,
        html: `
          <h3>New Contact Message</h3>
          <p><b>Name:</b> ${name}</p>
          <p><b>Email:</b> ${email}</p>
          <p><b>Message:</b><br>${message}</p>
        `
      });

    } else {
      // =========================
      // LOCAL → USE NODEMAILER
      // =========================
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      await transporter.sendMail({
        from: `"QuickConvert Contact" <${process.env.EMAIL_USER}>`,
        to: ["jatinwadhwaniofficial@gmail.com"],
        subject: `Contact: ${subject}`,
        html: `
          <h3>New Message</h3>
          <p><b>Name:</b> ${name}</p>
          <p><b>Email:</b> ${email}</p>
          <p><b>Message:</b><br>${message}</p>
        `
      });
    }

    res.json({ message: "Message sent successfully!" });

  } catch (err) {
    console.error("CONTACT ERROR:", err);
    res.status(500).json({ message: "Failed to send" });
  }
});


// ===============================
// AUTH MIDDLEWARE
// ===============================

function auth(req, res, next) {

  const token = req.header("Authorization");

  if (!token)
    return res.status(401).json({ msg: "No token" });

  try {

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "secret"
    );

    req.user = decoded;
    next();

  } catch {

    res.status(401).json({ msg: "Invalid token" });

  }

}

// ===============================
// AUTH ROUTES
// ===============================

// REGISTER
app.post("/api/register", async (req, res) => {

  try {

    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Missing fields" });

    const exists = await User.findOne({ email });

    if (exists)
      return res.status(400).json({ message: "User exists" });

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashed
    });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );

    res.json({ token });

  } catch (err) {

    console.error(err);
    res.status(500).json({ message: "Server error" });

  }

});

// LOGIN
app.post("/api/login", async (req, res) => {

  try {

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user)
      return res.status(400).json({ message: "User not found" });

    const match = await bcrypt.compare(password, user.password);

    if (!match)
      return res.status(400).json({ message: "Wrong password" });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "2h" }
    );

    res.json({ token });

  } catch (err) {

    console.error(err);
    res.status(500).json({ message: "Server error" });

  }

});

// PROTECTED TEST
app.get("/api/protected", auth, (req, res) => {

  res.json({
    msg: "Protected route success",
    user: req.user
  });

});

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

app.get("/compressor", (req, res) =>
  res.sendFile(path.join(__dirname, "public/pages/compressor.html"))
);

app.get("/merger", (req, res) =>
  res.sendFile(path.join(__dirname, "public/pages/merger.html"))
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
// STATIC FILES
// ===============================

app.use(express.static("public"));

// ===============================
// START SERVER
// ===============================

app.listen(PORT, () =>
  console.log(`🚀 QuickConvert running on ${PORT}`)
);
