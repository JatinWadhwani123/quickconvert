document.addEventListener("DOMContentLoaded", () => {

  const uploadArea = document.getElementById("uploadArea");
  const fileInput = document.getElementById("fileInput");
  const form = document.getElementById("compressForm");

  const uploadText = document.getElementById("uploadText");
  const uploadSub = document.getElementById("uploadSub");

  let selectedFile = null;

  // CLICK → open picker
  uploadArea.addEventListener("click", () => fileInput.click());

  // FILE SELECT
  fileInput.addEventListener("change", () => {

    if (!fileInput.files.length) return;

    selectedFile = fileInput.files[0];

    showFile(selectedFile);

  });

  // DRAG OVER
  uploadArea.addEventListener("dragover", e => {
    e.preventDefault();
    uploadArea.classList.add("drag-active");
  });

  uploadArea.addEventListener("dragleave", () => {
    uploadArea.classList.remove("drag-active");
  });

  // DROP
  uploadArea.addEventListener("drop", e => {

    e.preventDefault();
    uploadArea.classList.remove("drag-active");

    const file = e.dataTransfer.files[0];

    if (!file || !file.type.startsWith("image/")) {
      alert("Please drop a valid image file.");
      return;
    }

    selectedFile = file;
    fileInput.files = e.dataTransfer.files;

    showFile(file);

  });

  // SHOW FILE
  function showFile(file) {

    uploadText.textContent = file.name;
    uploadSub.textContent = "Click to change file";

  }

  // SUBMIT
  form.addEventListener("submit", async e => {

    e.preventDefault();

    if (!selectedFile) {
      alert("Please upload an image first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile); // ✅ matches server

    try {

      const res = await fetch("/compress", {
        method: "POST",
        body: formData
      });

      if (!res.ok) throw new Error("Compression failed");

      const blob = await res.blob();

      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "compressed-image.jpg";

      document.body.appendChild(a);
      a.click();
      a.remove();

    }

    catch (err) {

      alert(err.message);

    }

  });

});
