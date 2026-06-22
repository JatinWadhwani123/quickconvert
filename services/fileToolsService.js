const fs = require("fs");

const mammoth = require("mammoth");
const sharp = require("sharp");
const pdfParse = require("pdf-parse");
const { Document, Packer, Paragraph } = require("docx");
const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");

const { cleanupFiles } = require("../middleware/upload");
const { badRequest } = require("../utils/httpError");
const { parsePageSelection } = require("../utils/pdfPages");

function sendDownload(res, buffer, contentType, filename) {
  res.set({
    "Content-Type": contentType,
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Cache-Control": "no-store"
  });
  res.end(Buffer.from(buffer));
}

async function imageToPdf(req, res) {
  try {
    const imageBytes = await fs.promises.readFile(req.file.path);
    const pdfDoc = await PDFDocument.create();

    const image = req.file.detectedMime === "image/png"
      ? await pdfDoc.embedPng(imageBytes)
      : await pdfDoc.embedJpg(imageBytes);

    const page = pdfDoc.addPage([image.width, image.height]);
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });

    const bytes = await pdfDoc.save();
    sendDownload(res, bytes, "application/pdf", "converted.pdf");
  } finally {
    await cleanupFiles([req.file]);
  }
}

async function compressImage(req, res) {
  try {
    const buffer = await sharp(req.file.path)
      .rotate()
      .jpeg({ quality: 70, mozjpeg: true })
      .toBuffer();

    sendDownload(res, buffer, "image/jpeg", "compressed.jpg");
  } finally {
    await cleanupFiles([req.file]);
  }
}

async function resizeImage(req, res) {
  try {
    const width = Number(req.body.width);
    const height = Number(req.body.height);

    if (!Number.isInteger(width) || !Number.isInteger(height)) {
      throw badRequest("Width and height must be whole numbers.", "INVALID_DIMENSIONS");
    }

    if (width < 1 || height < 1 || width > 8000 || height > 8000 || width * height > 25000000) {
      throw badRequest("Image dimensions are outside the allowed range.", "DIMENSIONS_OUT_OF_RANGE");
    }

    const buffer = await sharp(req.file.path)
      .rotate()
      .resize(width, height, { fit: "inside", withoutEnlargement: false })
      .jpeg({ quality: 85, mozjpeg: true })
      .toBuffer();

    sendDownload(res, buffer, "image/jpeg", "resized.jpg");
  } finally {
    await cleanupFiles([req.file]);
  }
}

async function compressPdf(req, res) {
  try {
    const inputBytes = await fs.promises.readFile(req.file.path);
    const pdfDoc = await PDFDocument.load(inputBytes, { ignoreEncryption: false });
    const compressedBytes = await pdfDoc.save({ useObjectStreams: true, compress: true });

    sendDownload(res, compressedBytes, "application/pdf", "compressed.pdf");
  } finally {
    await cleanupFiles([req.file]);
  }
}

async function mergePdf(req, res) {
  try {
    if (!req.files?.length || req.files.length < 2) {
      throw badRequest("Upload at least two PDF files to merge.", "NOT_ENOUGH_FILES");
    }

    const merged = await PDFDocument.create();

    for (const file of req.files) {
      const fileBytes = await fs.promises.readFile(file.path);
      const pdf = await PDFDocument.load(fileBytes, { ignoreEncryption: false });
      const pages = await merged.copyPages(pdf, pdf.getPageIndices());
      pages.forEach(page => merged.addPage(page));
    }

    const bytes = await merged.save({ useObjectStreams: true });
    sendDownload(res, bytes, "application/pdf", "merged.pdf");
  } finally {
    await cleanupFiles(req.files || []);
  }
}

async function splitPdf(req, res) {
  try {
    const fileBytes = await fs.promises.readFile(req.file.path);
    const pdf = await PDFDocument.load(fileBytes, { ignoreEncryption: false });
    const selectedPages = parsePageSelection(req.body.pages, pdf.getPageCount());

    const output = await PDFDocument.create();
    const copiedPages = await output.copyPages(pdf, selectedPages);
    copiedPages.forEach(page => output.addPage(page));

    const bytes = await output.save({ useObjectStreams: true });
    sendDownload(res, bytes, "application/pdf", "split.pdf");
  } finally {
    await cleanupFiles([req.file]);
  }
}

async function pdfToWord(req, res) {
  try {
    const pdfBuffer = await fs.promises.readFile(req.file.path);
    const data = await pdfParse(pdfBuffer);
    const text = data.text?.trim() || "No readable text found. Scanned PDFs require OCR support.";

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: text.split(/\r?\n/).map(line => new Paragraph(line))
        }
      ]
    });

    const buffer = await Packer.toBuffer(doc);
    sendDownload(
      res,
      buffer,
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "converted.docx"
    );
  } finally {
    await cleanupFiles([req.file]);
  }
}

async function wordToPdf(req, res) {
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

    const wrapText = line => {
      const words = line.split(/\s+/).filter(Boolean);
      const lines = [];
      let current = "";

      for (const word of words) {
        const next = current ? `${current} ${word}` : word;
        if (font.widthOfTextAtSize(next, fontSize) <= maxWidth) {
          current = next;
        } else {
          if (current) lines.push(current);
          current = word;
        }
      }

      if (current) lines.push(current);
      return lines.length ? lines : [""];
    };

    for (const rawLine of text.split(/\r?\n/)) {
      for (const line of wrapText(rawLine)) {
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
      }
    }

    const bytes = await pdfDoc.save({ useObjectStreams: true });
    sendDownload(res, bytes, "application/pdf", "converted.pdf");
  } finally {
    await cleanupFiles([req.file]);
  }
}

module.exports = {
  imageToPdf,
  compressImage,
  resizeImage,
  compressPdf,
  mergePdf,
  splitPdf,
  pdfToWord,
  wordToPdf
};
