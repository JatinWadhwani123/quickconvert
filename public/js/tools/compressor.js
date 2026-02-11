document.addEventListener("DOMContentLoaded", () => {

  const uploadArea = document.getElementById("uploadArea");
  const fileInput = document.getElementById("fileInput");
  const form = document.getElementById("compressForm");

  let selectedFile = null;

  // =========================
  // CLICK → open file picker
  // =========================

  uploadArea.addEventListener("click", () => {
    fileInput.click();
  });

  // =========================
  // FILE PICK
  // =========================

  fileInput.addEventListener("change", () => {

    if (!fileInput.files.length) return;

    selectedFile = fileInput.files[0];

    showFile(selectedFile);

  });

  // =========================
  // DRAG & DROP
  // =========================

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
      alert("Please drop a valid image file.");
      return;
    }

    selectedFile = file;
    fileInput.files = e.dataTransfer.files;

    showFile(file);

  });

  // =========================
  // SHOW FILE NAME
  // =========================

  function showFile(file) {

    uploadArea.innerHTML = `
      📄 <strong>${file.name}</strong>
      <br><span>Click to change file</span>
    `;

  }

  // =========================
  // FORM SUBMIT
  // =========================

form.addEventListener("submit", async e => {

  e.preventDefault();

  if (!selectedFile) {
    alert("Please upload an image first.");
    return;
  }

  const formData = new FormData();
  formData.append("image", selectedFile);

  try {

    const res = await fetch("/compress", {
  method: "POST",
  body: formData
});

if (!res.ok) {
  throw new Error("Server conversion failed");
}


    const blob = await res.blob();

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "compressed-image.jpg";

    document.body.appendChild(a);
    a.click();
    a.remove();

  } catch (err) {

    alert(err.message);

  }

});


});
