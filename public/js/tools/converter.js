document.addEventListener("DOMContentLoaded", () => {

  // =========================
  // DOM references
  // =========================

  const convertForm = document.getElementById("convertForm");
  const fileInput = document.getElementById("fileInput");

  const loader = document.getElementById("loader");
  const toast = document.getElementById("toast");

  const errorModal = document.getElementById("errorModal");
  const errorText = document.getElementById("errorText");
  const closeBtn = document.getElementById("closeError");

  // =========================
  // CLEAN startup state
  // =========================

  loader?.classList.add("hidden");
  toast?.classList.add("hidden");
  errorModal?.classList.remove("show");

  // =========================
  // Submit conversion
  // =========================

  convertForm?.addEventListener("submit", async (e) => {

    e.preventDefault();

    if (!fileInput || fileInput.files.length === 0) {
      showError("Please select an image first.");
      return;
    }

    loader?.classList.remove("hidden");

    const formData = new FormData(convertForm);

    try {

      const res = await fetch("/convert", {
        method: "POST",
        body: formData
      });

      const type = res.headers.get("content-type") || "";

      if (!res.ok || type.includes("text")) {
        throw new Error(await res.text());
      }

      // download PDF

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

      console.error("Conversion failed:", err);
      showError(err.message || "Conversion failed");

    }

    finally {

      loader?.classList.add("hidden");

    }

  });

  // =========================
  // UI helpers
  // =========================

  function showToast() {

    if (!toast) return;

    toast.classList.remove("hidden");

    setTimeout(() => {
      toast.classList.add("hidden");
    }, 3000);

  }

  function showError(message) {

    if (!errorModal || !errorText) return;

    errorText.textContent = message;
    errorModal.classList.add("show");

  }

  // =========================
  // Modal closing
  // =========================

  closeBtn?.addEventListener("click", () => {
    errorModal?.classList.remove("show");
  });

  // click outside modal closes it

  errorModal?.addEventListener("click", (e) => {

    if (e.target === errorModal) {
      errorModal.classList.remove("show");
    }

  });

});
