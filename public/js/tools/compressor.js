// ===============================
// Compressor script — clean version
// ===============================

const compressForm = document.getElementById("compressForm");
const fileInput = document.getElementById("fileInput");
const dropArea = document.getElementById("dropArea");
const fileText = document.getElementById("fileText");

const loader = document.getElementById("loader");
const toast = document.getElementById("toast");

const errorModal = document.getElementById("errorModal");
const errorText = document.getElementById("errorText");
const closeError = document.getElementById("closeError");

// ---------- upload UI ----------

dropArea.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", () => {
  if (fileInput.files.length) {
    fileText.textContent = fileInput.files[0].name;
  }
});

// drag/drop

dropArea.addEventListener("dragover", e => {
  e.preventDefault();
  dropArea.classList.add("dragging");
});

dropArea.addEventListener("dragleave", () => {
  dropArea.classList.remove("dragging");
});

dropArea.addEventListener("drop", e => {
  e.preventDefault();
  dropArea.classList.remove("dragging");

  const file = e.dataTransfer.files[0];

  if (!file.type.startsWith("image/")) {
    showError("Only image files allowed!");
    return;
  }

  fileInput.files = e.dataTransfer.files;
  fileText.textContent = file.name;
});

// ---------- submit ----------

compressForm.addEventListener("submit", async e => {

  e.preventDefault();

  const file = fileInput.files[0];

  if (!file) {
    showError("Select an image first.");
    return;
  }

  loader.classList.remove("hidden");

  const data = new FormData();
  data.append("file", file);

  try {

    const res = await fetch("/compress", {
      method: "POST",
      body: data
    });

    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg);
    }

    const blob = await res.blob();

    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "compressed.jpg";

    document.body.appendChild(a);
    a.click();
    a.remove();

    toast.classList.remove("hidden");
    setTimeout(() => toast.classList.add("hidden"), 2500);

  }

  catch (err) {

    showError(err.message || "Compression failed");

  }

  finally {

    loader.classList.add("hidden");

  }

});

// ---------- error modal ----------

function showError(msg) {
  errorText.textContent = msg;
  errorModal.classList.remove("hidden");
}

closeError.addEventListener("click", () => {
  errorModal.classList.add("hidden");
});
