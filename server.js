// ===============================
// IMPORTS
// ===============================

require("dotenv").config();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("./models/user");

const express = require("express");
const multer = require("multer");
const { PDFDocument } = require("pdf-lib");
const sharp = require("sharp");
const path = require("path");

const mongoose = require("mongoose");
const cors = require("cors");

// ===============================
// APP SETUP
// ===============================

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ===============================
// MONGODB CONNECTION
// ===============================

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("✅ MongoDB connected"))
.catch(err => console.error("Mongo error:", err));


// ===============================
// USER MODEL
// ===============================

// const User = mongoose.model("User", new mongoose.Schema({

//   email: { type: String, unique: true, required: true },
//   password: { type: String, required: true },
//   createdAt: { type: Date, default: Date.now }

// }));


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
      process.env.JWT_SECRET
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
app.post("/api/register", express.json(), async (req, res) => {

  try {

    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ msg: "Missing fields" });

    const exists = await User.findOne({ email });

    if (exists)
      return res.status(400).json({ msg: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);

    const user = new User({
      email,
      password: hashed
    });

    await user.save();

    res.json({ msg: "Account created ✅" });

  }

  catch (err) {

    console.error(err);
    res.status(500).json({ msg: "Server error" });

  }

});



// LOGIN
app.post("/api/login", express.json(), async (req, res) => {

  try {

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user)
      return res.status(400).json({ msg: "User not found" });

    const match = await bcrypt.compare(password, user.password);

    if (!match)
      return res.status(400).json({ msg: "Wrong password" });

    const token = jwt.sign(

      { id: user._id },

      process.env.JWT_SECRET,

      { expiresIn: "2h" }

    );

    res.json({

      msg: "Login success ✅",
      token

    });

  }

  catch (err) {

    console.error(err);
    res.status(500).json({ msg: "Server error" });

  }

});


// PROTECTED TEST ROUTE
app.get("/api/protected", auth, (req, res) => {

  res.json({
    msg: "Protected route success",
    user: req.user
  });

});


// ===============================
// MULTER CONFIG
// ===============================

const storage = multer.memoryStorage();

const upload = multer({

  storage,

  limits: {
    fileSize: 50 * 1024 * 1024,
    files: 20
  },

  fileFilter: (req, file, cb) => {

    if (
      file.mimetype === "application/pdf" ||
      file.mimetype.startsWith("image/")
    ) cb(null, true);
    else cb(new Error("Invalid file"), false);

  }

});


// ===============================
// STATIC FRONTEND
// ===============================

app.use(express.static("public"));


// ===============================
// PAGE ROUTES
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

//SIGNUP route

app.post("/signup", express.json(), async (req, res) => {

  try {

    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ msg: "Missing fields" });

    const exists = await User.findOne({ email });

    if (exists)
      return res.status(400).json({ msg: "User already exists" });

    const hash = await bcrypt.hash(password, 10);

    const user = new User({ email, password: hash });

    await user.save();

    res.json({ msg: "Signup successful" });

  }

  catch (err) {

    console.error(err);
    res.status(500).json({ msg: "Signup failed" });

  }

});

// Login Route 
app.post("/login", express.json(), async (req, res) => {

  try {

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user)
      return res.status(400).json({ msg: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);

    if (!match)
      return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token });

  }

  catch (err) {

    console.error(err);
    res.status(500).json({ msg: "Login failed" });

  }

});


// ===============================
// IMAGE → PDF
// ===============================

app.post("/convert", upload.single("file"), async (req, res) => {

  try {

    if (!req.file)
      return res.status(400).send("No file");

    const buffer = req.file.buffer;

    await sharp(buffer).metadata();

    const pdfDoc = await PDFDocument.create();

    let image =
      req.file.mimetype === "image/jpeg"
      ? await pdfDoc.embedJpg(buffer)
      : await pdfDoc.embedPng(buffer);

    const page = pdfDoc.addPage([
      image.width,
      image.height
    ]);

    page.drawImage(image, { x: 0, y: 0 });

    const pdfBytes = await pdfDoc.save();

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment"
    });

    res.end(Buffer.from(pdfBytes));

  }

  catch (err) {

    console.error(err);
    res.status(500).send("Conversion failed");

  }

});


// ===============================
// COMPRESS
// ===============================

app.post("/compress", upload.single("file"), async (req, res) => {

  try {

    const compressed = await sharp(req.file.buffer)
      .jpeg({ quality: 60 })
      .toBuffer();

    res.set({
      "Content-Type": "image/jpeg",
      "Content-Disposition": "attachment"
    });

    res.end(compressed);

  }

  catch {
    res.status(500).send("Compression failed");
  }

});


// ===============================
// MERGE
// ===============================

app.post("/merge", upload.array("files"), async (req, res) => {

  try {

    const mergedPdf = await PDFDocument.create();

    for (const file of req.files) {

      const pdf = await PDFDocument.load(file.buffer);

      const pages = await mergedPdf.copyPages(
        pdf,
        pdf.getPageIndices()
      );

      pages.forEach(p =>
        mergedPdf.addPage(p)
      );

    }

    const mergedBytes = await mergedPdf.save();

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment"
    });

    res.end(Buffer.from(mergedBytes));

  }

  catch {
    res.status(500).send("Merge failed");
  }

});


// ===============================
// SERVER START
// ===============================

app.listen(PORT, () =>
  console.log(`🚀 QuickConvert running on ${PORT}`)
);
