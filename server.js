const express = require("express");
const multer = require("multer");
const { PDFDocument } = require("pdf-lib");
const fs = require("fs");
const os = require("os");

const app = express();
const PORT = process.env.PORT || 3000;

const upload = multer({ dest: "uploads/" });

app.use(express.static("public"));


// ===============================
// CONVERSION ROUTE
// ===============================

app.post("/convert", upload.single("file"), async (req, res) => {

  if (!req.file) return res.send("No file uploaded");

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
      } else if (req.file.mimetype === "image/png") {
        image = await pdfDoc.embedPng(bytes);
      } else {
        cleanup(filePath);
        return res.send("Unsupported image format");
      }

      const page = pdfDoc.addPage([image.width, image.height]);
      page.drawImage(image, { x: 0, y: 0 });

      const pdfBytes = await pdfDoc.save();

      const original = req.file.originalname.split(".")[0];
      const filename = `${original}.pdf`;

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );

      res.send(Buffer.from(pdfBytes));

      cleanup(filePath);
    }


    // ===============================
    // PDF → IMAGE (disabled on Linux)
    // ===============================

    else if (type === "pdf2img") {

      if (os.platform() !== "win32") {
        cleanup(filePath);
        return res.send(
          "PDF → Image conversion is not available on the hosted version yet."
        );
      }

      cleanup(filePath);
      res.send("Feature coming soon.");
    }


    else {
      cleanup(filePath);
      res.send("Invalid conversion mode");
    }

  } catch (err) {

    console.error("Conversion error:", err);

    cleanup(filePath);
    res.send("Conversion failed");

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
// SERVER START
// ===============================

app.listen(PORT, () =>
  console.log(`🚀 Converter running on port ${PORT}`)
);
