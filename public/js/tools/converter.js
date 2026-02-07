// =========================
// DOM references
// =========================

const convertFormEl = document.getElementById("convertForm");
const fileInputEl = document.getElementById("fileInput");

const modeToggleEl = document.getElementById("modeToggle");
const modeInputEl = document.getElementById("modeInput");
const modeLabelEl = document.getElementById("modeLabel");

const loaderEl = document.getElementById("loader");
const toastEl = document.getElementById("toast");

const errorModalEl = document.getElementById("errorModal");
const errorTextEl = document.getElementById("errorText");
const closeErrorEl = document.getElementById("closeError");

// =========================
// Toggle conversion mode
// =========================

modeToggleEl.addEventListener("change", () => {

  if (modeToggleEl.checked) {
    modeInputEl.value = "pdf2img";
    modeLabelEl.textContent = "PDF → Image";
  } else {
    modeInputEl.value = "img2pdf";
    modeLabelEl.textContent = "Image → PDF";
  }

});

// =========================
// Submit handler
// =========================

convertFormEl.addEventListener("submit", async (e) => {

  e.preventDefault();

  if (!fileInputEl.files.length) {
    showError("Please select a file first.");
    return;
  }

  const formData = new FormData(convertFormEl);

  loaderEl.classList.remove("hidden");

  try {

    const res = await fetch("/convert", {
      method: "POST",
      body: formData
    });

    const contentType = res.headers.get("content-type");

    // 🚨 backend returned error text/html
    if (!res.ok || contentType.includes("text")) {

      const msg = await res.text();
      throw new Error(msg);

    }

    // ✅ real file download
    const blob = await res.blob();

    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;

    // detect file type
    if (contentType.includes("pdf"))
      a.download = "converted.pdf";
    else
      a.download = "converted.png";

    document.body.appendChild(a);
    a.click();
    a.remove();

    showToast();

  } catch (err) {

    console.error(err);
    showError(err.message || "Conversion failed");

  } finally {

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

function showError(msg) {

  errorTextEl.textContent = msg;
  errorModalEl.classList.remove("hidden");

}

closeErrorEl.addEventListener("click", () => {
  errorModalEl.classList.add("hidden");
});
