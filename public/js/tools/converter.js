document.addEventListener("DOMContentLoaded", () => {

  // ======================
  // ELEMENTS
  // ======================

  const uploadArea = document.getElementById("uploadArea");
  const fileInput = document.getElementById("fileInput");
  const form = document.getElementById("convertForm");

  const progress = document.getElementById("convertProgress");
  const bar = document.getElementById("convertBar");

  const uploadText = document.getElementById("uploadText");
  const uploadSub = document.getElementById("uploadSub");

  if (!uploadArea || !fileInput || !form) {
    console.error("Converter UI elements missing");
    return;
  }

  let selectedFile = null;

  // ======================
  // FILE PICKER
  // ======================

  fileInput.addEventListener("change", () => {

    const file = fileInput.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Only JPG or PNG images allowed");
      fileInput.value = "";
      return;
    }

    selectedFile = file;

    uploadText.innerHTML = `📄 <strong>${file.name}</strong>`;
    uploadSub.textContent = "Click to change file";

  });

  // ======================
  // DRAG & DROP
  // ======================

  uploadArea.addEventListener("dragover", e => {
    e.preventDefault();
    uploadArea.classList.add("drag-active");
  });

  uploadArea.addEventListener("dragleave", () => {
    uploadArea.classList.remove("drag-active");
  });

  uploadArea.addEventListener("drop", e => {

    e.preventDefault();
    uploadArea.classList.remove("drag-active");

    const file = e.dataTransfer.files[0];

    if (!file || !file.type.startsWith("image/")) {
      alert("Only JPG or PNG images allowed");
      return;
    }

    selectedFile = file;

    // Sync with input
    const dt = new DataTransfer();
    dt.items.add(file);
    fileInput.files = dt.files;

    uploadText.innerHTML = `📄 <strong>${file.name}</strong>`;
    uploadSub.textContent = "Click to change file";

  });

  // ======================
  // FORM SUBMIT
  // ======================

  form.addEventListener("submit", async e => {

    e.preventDefault();

    if (!selectedFile) {
      alert("Please upload an image first");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    // Show progress
    progress.classList.remove("hidden");

    let p = 0;
    const anim = setInterval(() => {
      p += 6;
      bar.style.width = p + "%";
      if (p >= 90) clearInterval(anim);
    }, 120);

    try {

      const res = await fetch("/convert", {
        method: "POST",
        body: formData
      });

      if (!res.ok) throw new Error();

      const blob = await res.blob();

      bar.style.width = "100%";

      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "converted.pdf";
      a.click();

    }

    catch {

      alert("Conversion failed");

    }

    finally {

      setTimeout(() => {
        progress.classList.add("hidden");
        bar.style.width = "0%";
      }, 1200);

    }

  });

});
