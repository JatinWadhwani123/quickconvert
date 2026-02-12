document.addEventListener("DOMContentLoaded", () => {

  const uploadArea = document.getElementById("uploadArea");
  const fileInput = document.getElementById("fileInput");
  const form = document.getElementById("convertForm");
  const spinner = document.getElementById("spinner");

  let selectedFile = null;

  const allowedTypes = ["image/jpeg", "image/png"];


  // =====================
  // Click → file picker
  // =====================

  uploadArea.addEventListener("click", () => fileInput.click());


  // =====================
  // File selection
  // =====================

  fileInput.addEventListener("change", () => {

    const file = fileInput.files[0];

    if (!file) return;

    if (!allowedTypes.includes(file.type)) {

      alert("Only JPG or PNG images are allowed!");

      fileInput.value = "";
      selectedFile = null;
      resetUploadArea();

      return;
    }

    selectedFile = file;
    showFile(file);

  });


  // =====================
  // Drag & drop
  // =====================

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

    if (!file || !allowedTypes.includes(file.type)) {

      alert("Only JPG or PNG images are allowed!");

      resetUploadArea();
      return;
    }

    selectedFile = file;
    fileInput.files = e.dataTransfer.files;

    showFile(file);

  });


  // =====================
  // UI helpers
  // =====================

  function showFile(file) {

    uploadArea.innerHTML = `
      📄 <strong>${file.name}</strong>
      <br><span>Click to change file</span>
    `;

  }

  function resetUploadArea() {

    uploadArea.innerHTML = `
      <strong>Drag & drop image here</strong>
      <span>or click to upload</span>
    `;

  }


  // =====================
  // Submit conversion
  // =====================

  form.addEventListener("submit", async e => {

    e.preventDefault();

    if (!selectedFile) {
      alert("Please upload an image first.");
      return;
    }

    spinner.classList.remove("hidden");

    try {

      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/convert", {
        method: "POST",
        body: formData
      });

      if (!res.ok)
        throw new Error("Conversion failed");

      const blob = await res.blob();

      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "converted.pdf";
      a.click();

    }

    catch (err) {

      alert(err.message);

    }

    spinner.classList.add("hidden");

  });

});
