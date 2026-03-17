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

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (isProcessing) return;

  if (!selectedFile) {
    alert("Please upload a Word file first.");
    return;
  }

  isProcessing = true;

  loader.classList.remove("hidden");
  progress.classList.remove("hidden");
  bar.style.width = "0%";

  const formData = new FormData();
  formData.append("file", selectedFile);

  try {
    const response = await fetch("/api/word-to-pdf", {
      method: "POST",
      body: formData
    });

    const blob = await response.blob();

    /* Progress animation */
    let width = 0;
    const interval = setInterval(() => {
      width += 8;
      bar.style.width = width + "%";
      if (width >= 100) clearInterval(interval);
    }, 100);

    /* Download */
    setTimeout(() => {
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "converted.pdf";

      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);

      loader.classList.add("hidden");
      progress.classList.add("hidden");

      /* Reset upload UI */
      uploadText.innerText = "Drag & drop Word file here";
      uploadSub.innerText = "or click to upload";
      fileInput.value = "";
      selectedFile = null;

      isProcessing = false;
    }, 1200);

  } catch (error) {
    alert("Conversion failed. Please try again.");
    loader.classList.add("hidden");
    progress.classList.add("hidden");
    isProcessing = false;
  }
});
