// ===============================
// IMAGE COMPRESSOR — FRONTEND
// ===============================

const form = document.getElementById("compressForm");
const fileInput = document.getElementById("fileInput");

const errorModal = document.getElementById("errorModal");
const errorText = document.getElementById("errorText");
const closeError = document.getElementById("closeError");

const loader = document.getElementById("loader");

// Allowed image MIME types
const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

// ===============================
// Popup helper
// ===============================

function showError(msg) {
  errorText.textContent = msg;
  errorModal.classList.remove("hidden");
}

closeError.onclick = () => {
  errorModal.classList.add("hidden");
};

// ===============================
// Submit handler
// ===============================

form.addEventListener("submit", async (e) => {

  e.preventDefault(); // 🚀 STOP browser redirect

  const file = fileInput.files[0];

  if (!file) {
    showError("Please upload an image.");
    return;
  }

  // ❌ Block PDFs and other formats
  if (!allowedTypes.includes(file.type)) {
    showError("Only JPG, PNG, or WEBP images are allowed.");
    return;
  }

  try {

    loader?.classList.remove("hidden");

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/compress", {
      method: "POST",
      body: formData
    });

    if (!res.ok) {
      throw new Error("Compression failed");
    }

    const blob = await res.blob();

    // ✅ Auto download
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "compressed-image.jpg";

    document.body.appendChild(a);
    a.click();

    a.remove();
    window.URL.revokeObjectURL(url);

  } catch (err) {

    console.error(err);
    showError("Compression failed. Try again.");

  } finally {

    loader?.classList.add("hidden");

  }

});
