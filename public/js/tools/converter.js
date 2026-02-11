document.addEventListener("DOMContentLoaded", () => {

  // =========================
  // DOM references
  // =========================

  const form = document.getElementById("convertForm");
  const fileInput = document.getElementById("fileInput");

  const uploadArea = document.querySelector(".upload-area");

  const loader = document.getElementById("loader");
  const toast = document.getElementById("toast");

  const errorModal = document.getElementById("errorModal");
  const errorText = document.getElementById("errorText");
  const closeError = document.getElementById("closeError");

  // =========================
  // Clean UI state
  // =========================

  loader?.classList.add("hidden");
  toast?.classList.add("hidden");
  errorModal?.classList.remove("show");

  // =========================
  // File preview helper
  // =========================

  function showFileName(file) {

    uploadArea.innerHTML = `
      <strong>📄 ${file.name}</strong>
      <small>Click to change file</small>
    `;

  }

  // =========================
  // Click upload
  // =========================

  uploadArea.addEventListener("click", () => {
    fileInput.click();
  });

  fileInput.addEventListener("change", () => {

    if (fileInput.files.length) {
      showFileName(fileInput.files[0]);
    }

  });

  // =========================
  // Drag & drop support
  // =========================

  ["dragenter", "dragover"].forEach(event => {

    uploadArea.addEventListener(event, e => {

      e.preventDefault();
      uploadArea.style.background = "#f3f3f3";

    });

  });

  ["dragleave", "drop"].forEach(event => {

    uploadArea.addEventListener(event, e => {

      e.preventDefault();
      uploadArea.style.background = "";

    });

  });

  uploadArea.addEventListener("drop", e => {

    const files = e.dataTransfer.files;

    if (files.length) {

      fileInput.files = files;
      showFileName(files[0]);

    }

  });

  // =========================
  // Submit handler
  // =========================

  form.addEventListener("submit", async e => {

    e.preventDefault();

    if (!fileInput.files.length) {
      showError("Please select an image first.");
      return;
    }

    const formData = new FormData(form);

    loader.classList.remove("hidden");

    try {

      const res = await fetch("/convert", {
        method: "POST",
        body: formData
      });

      const contentType = res.headers.get("content-type") || "";

      if (!res.ok || contentType.includes("text")) {
        throw new Error(await res.text());
      }

      const blob = await res.blob();

      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "converted.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();

      showToast();

    }

    catch (err) {

      console.error(err);
      showError(err.message || "Conversion failed");

    }

    finally {

      loader.classList.add("hidden");

    }

  });

  // =========================
  // UI helpers
  // =========================

  function showToast() {

    toast.classList.remove("hidden");

    setTimeout(() => {
      toast.classList.add("hidden");
    }, 3000);

  }

  function showError(msg) {

    errorText.textContent = msg;
    errorModal.classList.add("show");

  }

  closeError.addEventListener("click", () => {
    errorModal.classList.remove("show");
  });

  errorModal.addEventListener("click", e => {
    if (e.target === errorModal) {
      errorModal.classList.remove("show");
    }
  });

});
