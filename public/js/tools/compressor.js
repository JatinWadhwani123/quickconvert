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
  const progress = document.getElementById("compressProgress");
const bar = document.getElementById("compressBar");


  // SUBMIT
  form.addEventListener("submit", async e => {

  e.preventDefault();

  if (!selectedFile) {
    alert("Please upload an image first.");
    return;
  }

  progress.classList.remove("hidden");

  let p = 0;
  const anim = setInterval(() => {
    p += 6;
    bar.style.width = p + "%";
    if (p >= 90) clearInterval(anim);
  }, 120);

  const formData = new FormData();
  formData.append("file", selectedFile);

  try {

    const res = await fetch("/compress", {
      method: "POST",
      body: formData
    });

    if (!res.ok) throw new Error("Compression failed");

    const blob = await res.blob();

    bar.style.width = "100%";

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "compressed.jpg";
    a.click();

  } catch (err) {

    alert(err.message);

  }

  setTimeout(() => {

    progress.classList.add("hidden");
    bar.style.width = "0%";

  }, 1200);

});

});
