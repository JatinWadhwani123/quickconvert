// =============================
// IMAGE COMPRESSOR LOGIC
// =============================

const form = document.getElementById("compressForm");
const fileInput = document.getElementById("fileInput");
const dropArea = document.getElementById("dropArea");

const loader = document.getElementById("loader");
const toast = document.getElementById("toast");

const errorModal = document.getElementById("errorModal");
const errorText = document.getElementById("errorText");
const closeError = document.getElementById("closeError");

// =============================
// ERROR POPUP
// =============================

function showError(msg) {
  errorText.textContent = msg;
  errorModal.classList.remove("hidden");
}

closeError.onclick = () => {
  errorModal.classList.add("hidden");
};

// =============================
// FILE VALIDATION
// =============================

function validateFile(file) {
  if (!file.type.startsWith("image/")) {
    showError("Only JPG, PNG, or WebP images are allowed.");
    return false;
  }
  return true;
}

// =============================
// DRAG & DROP
// =============================

dropArea.addEventListener("click", () => fileInput.click());

dropArea.addEventListener("dragover", e => {
  e.preventDefault();
  dropArea.classList.add("drag");
});

dropArea.addEventListener("dragleave", () => {
  dropArea.classList.remove("drag");
});

dropArea.addEventListener("drop", e => {
  e.preventDefault();
  dropArea.classList.remove("drag");

  const file = e.dataTransfer.files[0];

  if (!validateFile(file)) return;

  fileInput.files = e.dataTransfer.files;
});

// =============================
// FORM SUBMIT — AJAX UPLOAD
// =============================

form.addEventListener("submit", async (e) => {

  e.preventDefault(); // 🚨 prevent redirect

  const file = fileInput.files[0];

  if (!file) {
    showError("Please upload an image first.");
    return;
  }

  if (!validateFile(file)) return;

  const formData = new FormData();
  formData.append("file", file);

  try {

    loader.classList.remove("hidden");

    const response = await fetch("/compress", {
      method: "POST",
      body: formData
    });

    if (!response.ok) throw new Error();

    const blob = await response.blob();

    // download file
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "compressed-image";
    a.click();

    toast.classList.remove("hidden");

    setTimeout(() => {
      toast.classList.add("hidden");
    }, 2500);

  } catch {

    showError("Compression failed. Try again.");

  } finally {

    loader.classList.add("hidden");

  }

});
