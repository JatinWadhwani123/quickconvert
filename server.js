const express = require("express");
const multer = require("multer");
const { PDFDocument } = require("pdf-lib");
const fs = require("fs");
const poppler = require("pdf-poppler");
const PORT = process.env.PORT || 3000;

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(express.static("public"));

app.post("/convert", upload.single("file"), async (req, res) => {
  try {

    const type = req.body.mode;

    // IMAGE → PDF
    if (type === "img2pdf") {

      const pdfDoc = await PDFDocument.create();
      const bytes = fs.readFileSync(req.file.path);

      let image;

      if (req.file.mimetype === "image/jpeg")
        image = await pdfDoc.embedJpg(bytes);
      else if (req.file.mimetype === "image/png")
        image = await pdfDoc.embedPng(bytes);
      else
        return res.send("Unsupported image");

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

    }

    // PDF → IMAGE
    else if (type === "pdf2img") {

      const opts = {
        format: "png",
        out_dir: "uploads",
        out_prefix: "page",
        page: null
      };

      await poppler.convert(req.file.path, opts);

      res.download("uploads/page-1.png", "converted-image.png");


    }

  } catch (err) {
    console.error(err);
    res.send("Conversion failed");
  }
});

app.listen(PORT, () =>
  console.log("🚀 Universal converter running → http://localhost:3000")
);
