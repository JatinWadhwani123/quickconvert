document.addEventListener("DOMContentLoaded", () => {

  const uploadArea = document.getElementById("uploadArea");
  const fileInput = document.getElementById("fileInput");
  const form = document.getElementById("convertForm");

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

    uploadArea.innerHTML = `
      📄 <strong>${file.name}</strong>
      <br><span>Click to change file</span>
      <input type="file" id="fileInput" name="file" hidden>
    `;

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

    const dt = new DataTransfer();
    dt.items.add(file);
    fileInput.files = dt.files;

    uploadArea.innerHTML = `
      📄 <strong>${file.name}</strong>
      <br><span>Click to change file</span>
      <input type="file" id="fileInput" name="file" hidden>
    `;

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

    try {

      const res = await fetch("/convert", {
        method: "POST",
        body: formData
      });

      if (!res.ok) throw new Error();

      const blob = await res.blob();

      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "converted.pdf";
      a.click();

    } catch {

      alert("Conversion failed");

    }

  });

});
