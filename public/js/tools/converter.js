// =========================
// DOM references
// =========================

const convertFormEl = document.getElementById("convertForm");
const fileInputEl = document.getElementById("fileInput");

const loaderEl = document.getElementById("loader");
const toastEl = document.getElementById("toast");

const errorModalEl = document.getElementById("errorModal");
const errorTextEl = document.getElementById("errorText");
const errorTitleEl = document.getElementById("errorTitle");
const closeErrorEl = document.getElementById("closeError");


// =========================
// Submit handler (SAFE)
// =========================

convertFormEl.addEventListener("submit", async (e) => {

  // 🚨 block accidental submit
  if (!e.submitter) {
    e.preventDefault();
    return;
  }

  e.preventDefault();

  // ✅ No file selected
  if (!fileInputEl.files.length) {
    showError(
      "No file selected",
      "Please select an image before converting."
    );
    return;
  }

  const formData = new FormData(convertFormEl);

  loaderEl.classList.remove("hidden");

  try {

    const res = await fetch("/convert", {
      method: "POST",
      body: formData
    });

    const contentType = res.headers.get("content-type") || "";

    if (!res.ok || contentType.includes("text")) {

      const msg = await res.text();

      showError("Invalid file", msg);
      return;
    }

    // ✅ download PDF
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

    showError(
      "Conversion failed",
      err.message || "Something went wrong."
    );

  }

  finally {

    loaderEl.classList.add("hidden");

  }

});


// =========================
// UI helpers
// =========================

function showToast() {

  toastEl.classList.remove("hidden");

  setTimeout(() => {
    toastEl.classList.add("hidden");
  }, 3000);
}


function showError(title, message) {

  if (errorTitleEl) errorTitleEl.textContent = title;

  errorTextEl.textContent = message;

  errorModalEl.classList.remove("hidden");
}


closeErrorEl.addEventListener("click", () => {
  errorModalEl.classList.add("hidden");
});
