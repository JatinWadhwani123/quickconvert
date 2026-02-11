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
// Submit handler
// =========================

convertFormEl.addEventListener("submit", async (e) => {

  e.preventDefault();

  // prevent ghost submit
  if (!fileInputEl.files.length) {

    showError(
      "No file selected",
      "Please choose an image before converting."
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
  if (errorTextEl) errorTextEl.textContent = message;

  errorModalEl.classList.remove("hidden");

}


// close modal

if (closeErrorEl) {

  closeErrorEl.addEventListener("click", () => {
    errorModalEl.classList.add("hidden");
  });

}


// click outside modal closes it

errorModalEl.addEventListener("click", (e) => {

  if (e.target === errorModalEl) {
    errorModalEl.classList.add("hidden");
  }

});

