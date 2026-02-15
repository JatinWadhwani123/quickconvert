const form = document.getElementById("convertForm");
const fileInput = document.getElementById("fileInput");
const uploadText = document.getElementById("uploadText");
const uploadSub = document.getElementById("uploadSub");
const loader = document.getElementById("loader");
const progress = document.getElementById("convertProgress");
const bar = document.getElementById("convertBar");

let selectedFile = null;
let isProcessing = false;

/* ================= FILE SELECT ================= */

fileInput.addEventListener("change", () => {
  selectedFile = fileInput.files[0];

  if (!selectedFile) return;

  uploadText.innerText = selectedFile.name;
  uploadSub.innerText = "Click to change file";
});

/* ================= FORM SUBMIT ================= */

form.addEventListener("submit", async e => {
  e.preventDefault();

  if (isProcessing) return;

  if (!selectedFile) {
    alert("Please upload a PDF file");
    return;
  }

  isProcessing = true;

  loader.classList.remove("hidden");
  progress.classList.remove("hidden");
  bar.style.width = "0%";

  const data = new FormData();
  data.append("file", selectedFile);

  try {
    const res = await fetch("/api/pdf-to-word", {
      method: "POST",
      body: data
    });

    const blob = await res.blob();

    /* ================= PROGRESS ANIMATION ================= */

    let width = 0;
    const interval = setInterval(() => {
      width += 8;
      bar.style.width = width + "%";
      if (width >= 100) clearInterval(interval);
    }, 100);

    /* ================= DOWNLOAD FIX ================= */

    setTimeout(() => {

      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "converted.docx";

      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);

      loader.classList.add("hidden");
      progress.classList.add("hidden");

      showSuccessPopup();

      isProcessing = false;

    }, 1200);

  } catch (err) {
    alert("Conversion failed");
    loader.classList.add("hidden");
    progress.classList.add("hidden");
    isProcessing = false;
  }
});

/* ================= SUCCESS POPUP ================= */

function showSuccessPopup() {
  document.getElementById("successPopup").classList.remove("hidden");
}

function closePopup() {
  document.getElementById("successPopup").classList.add("hidden");

  uploadText.innerText = "Drag & drop PDF here";
  uploadSub.innerText = "or click to upload";
  fileInput.value = "";
  selectedFile = null;
}
