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

    if (!res.ok) throw new Error("Conversion failed");

    const blob = await res.blob();

    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "converted-file";
    document.body.appendChild(a);
    a.click();
    a.remove();

    showToast();

  } catch (err) {

    console.error(err);
    showError("Conversion failed. Try again.");

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
