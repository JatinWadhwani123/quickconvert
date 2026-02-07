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
// IMAGE COMPRESSOR
// ===============================

app.post("/compress", upload.single("file"), async (req, res) => {

  if (!req.file) return res.send("No file uploaded");
  if (!req.file.mimetype.startsWith("image/")) {
  return res.status(400).send("Only images allowed");
}


  const filePath = req.file.path;

  try {

    const original = req.file.originalname.split(".")[0];
    const output = `uploads/${original}-compressed.jpg`;

    await sharp(filePath)
      .jpeg({ quality: 60 }) // adjust compression level
      .toFile(output);

    res.download(output, `${original}-compressed.jpg`, () => {
      cleanup(filePath);
      cleanup(output);
    });

  } catch (err) {

    console.error("Compression error:", err);
    cleanup(filePath);

    res.send("Compression failed");

  }

});
app.post("/merge", upload.array("file"), async (req, res) => {

  if (!req.files || req.files.length < 2) {
    return res.status(400).json({ error: "Upload at least 2 PDFs" });
  }

  try {

    const mergedPdf = await PDFDocument.create();

    for (const file of req.files) {

      const bytes = fs.readFileSync(file.path);
      const pdf = await PDFDocument.load(bytes);

      const pages = await mergedPdf.copyPages(
        pdf,
        pdf.getPageIndices()
      );

      pages.forEach(p => mergedPdf.addPage(p));
    }

    const mergedBytes = await mergedPdf.save();

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=merged.pdf"
    );

    res.send(Buffer.from(mergedBytes));

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: "Merge failed" });

  }

});




// ===============================
// SERVER START
// ===============================

app.listen(PORT, () =>
  console.log(`🚀 Converter running on port ${PORT}`)
);
