const express = require("express");
const path = require("path");

const router = express.Router();
const pagesDir = path.join(__dirname, "..", "public", "pages");

function sendPage(file) {
  return (req, res) => res.sendFile(path.join(pagesDir, file));
}

router.get("/", sendPage("index.html"));
router.get("/login", sendPage("login.html"));
router.get("/register", sendPage("register.html"));
router.get("/dashboard", sendPage("dashboard.html"));
router.get("/pages/join-team.html", sendPage("join-team.html"));

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
  router.get(route, sendPage(file));
});

module.exports = router;
