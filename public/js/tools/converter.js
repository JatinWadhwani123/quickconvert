document.addEventListener("DOMContentLoaded", () => {

  const uploadArea = document.getElementById("uploadArea");
  const fileInput = document.getElementById("fileInput");
  const form = document.getElementById("convertForm");

  const progress = document.getElementById("convertProgress");
  const bar = document.getElementById("convertBar");

  const uploadTitle = document.getElementById("uploadTitle");
  const uploadSubtitle = document.getElementById("uploadSubtitle");

  if (!uploadArea || !fileInput || !form) {
    console.error("Converter UI elements missing");
    return;
  }

  let selectedFile = null;

  // ======================
  // Click upload
  // ======================

  uploadArea.addEventListener("click", () => fileInput.click());

  // ======================
  // File picker
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

    // UI feedback
    if (uploadTitle && uploadSubtitle) {
      uploadTitle.textContent = "Selected file:";
      uploadSubtitle.textContent = file.name;
    }

    uploadArea.classList.add("has-file");

  });

  // ======================
  // Drag & drop
  // ======================

  uploadArea.addEventListener("dragover", e => {
    e.preventDefault();
    uploadArea.classList.add("drag-active");
  });

  uploadArea.addEventListener("dragleave", () =>
    uploadArea.classList.remove("drag-active")
  );

  uploadArea.addEventListener("drop", e => {

    e.preventDefault();
    uploadArea.classList.remove("drag-active");

    const file = e.dataTransfer.files[0];

    if (!file || !file.type.startsWith("image/")) {
      alert("Only JPG or PNG images allowed");
      return;
    }

    selectedFile = file;

    // sync input element
    const dt = new DataTransfer();
    dt.items.add(file);
    fileInput.files = dt.files;

    // UI feedback
    if (uploadTitle && uploadSubtitle) {
      uploadTitle.textContent = "Selected file:";
      uploadSubtitle.textContent = file.name;
    }

    uploadArea.classList.add("has-file");

  });

  // ======================
  // Submit conversion
  // ======================

  form.addEventListener("submit", async e => {

    e.preventDefault();

    if (!selectedFile) {
      alert("Please upload an image first");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    // show progress UI
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
