// ===============================
// ELEMENT REFERENCES
// ===============================

const dropArea = document.getElementById("dropArea");
const fileInput = document.getElementById("fileInput");
const fileText = document.getElementById("fileText");
const form = document.getElementById("uploadForm");
const loader = document.getElementById("loader");
const btn = document.getElementById("convertBtn");

const toggle = document.getElementById("modeToggle");
const label = document.getElementById("modeLabel");
const modeInput = document.getElementById("modeInput");

const modal = document.getElementById("modal");
const modalText = document.getElementById("modalText");
const closeModal = document.getElementById("closeModal");

const errorModal = document.getElementById("errorModal");
const errorText = document.getElementById("errorText");
const closeError = document.getElementById("closeError");

const progressContainer = document.getElementById("progressContainer");
const progressBar = document.getElementById("progressBar");

const toast = document.getElementById("toast");


// ===============================
// ERROR POPUP HELPER
// ===============================

function showError(message) {
  if (!errorModal || !errorText) return;

  errorText.textContent = message;
  errorModal.classList.remove("hidden");
}


// ===============================
// DRAG & DROP UPLOAD
// ===============================

if (dropArea && fileInput) {

  dropArea.addEventListener("dragover", e => {
  e.preventDefault();
  dropArea.classList.add("drag-active");
});

dropArea.addEventListener("dragleave", () => {
  dropArea.classList.remove("drag-active");
});

dropArea.addEventListener("drop", e => {
  e.preventDefault();
  dropArea.classList.remove("drag-active");
  fileInput.files = e.dataTransfer.files;
  updateFileName();
});


  fileInput.addEventListener("change", updateFileName);
}

function updateFileName() {
  if (fileInput.files.length > 0 && fileText) {
    fileText.textContent = fileInput.files[0].name;
  }
}


// ===============================
// TOGGLE MODE
// ===============================

if (toggle) {

  toggle.addEventListener("change", () => {

    if (toggle.checked) {
      label.textContent = "PDF → Image";
      modeInput.value = "pdf2img";
    } else {
      label.textContent = "Image → PDF";
      modeInput.value = "img2pdf";
    }

  });

}

// Mobile navbar toggle
document.querySelector(".menu-toggle")
?.addEventListener("click", () => {

  document.querySelector(".nav-links")
  ?.classList.toggle("active");

});



// ===============================
// SUBMIT + VALIDATION + UX FLOW
// ===============================

if (form) {

  form.addEventListener("submit", e => {

    if (!fileInput.files.length) return;

    const file = fileInput.files[0];
    const mode = modeInput.value;

    // Validate upload
    if (mode === "img2pdf" && !file.type.startsWith("image/")) {
      e.preventDefault();
      showError("Please upload a valid image file.");
      return;
    }

    if (mode === "pdf2img" && file.type !== "application/pdf") {
      e.preventDefault();
      showError("Please upload a PDF file.");
      return;
    }

    // Show loader
    if (loader) loader.classList.remove("hidden");

    if (btn) {
      btn.disabled = true;
      btn.textContent = "Converting...";
    }

    // Progress animation
    if (progressContainer && progressBar) {

      progressContainer.classList.remove("hidden");
      progressBar.style.width = "0%";

      let progress = 0;

      const interval = setInterval(() => {

        progress += 10;
        progressBar.style.width = progress + "%";

        if (progress >= 100)
          clearInterval(interval);

      }, 200);
    }

    // Success feedback
    setTimeout(() => {

      if (loader) loader.classList.add("hidden");

      if (btn) {
        btn.textContent = "Downloaded ✓";
        btn.style.background = "#4CAF50";
      }

      if (toast) {
        toast.classList.remove("hidden");

        setTimeout(() => {
          toast.classList.add("hidden");
        }, 3000);
      }

    }, 2000);

    // Reset UI
    setTimeout(() => {

      if (btn) {
        btn.disabled = false;
        btn.textContent = "Convert File";
        btn.style.background = "#00e0ff";
      }

      if (progressContainer)
        progressContainer.classList.add("hidden");

    }, 4000);

  });

}


// ===============================
// INFO MODAL SYSTEM
// ===============================

function openModal(type) {

  if (!modal || !modalText) return;

  let content = "";

  if (type === "privacy") {
    content = `
      <h2>Privacy Policy</h2>
      <p>Your files are processed temporarily and never stored permanently.
      We do not access, store, or share your data.</p>
    `;
  }

  if (type === "terms") {
    content = `
      <h2>Terms of Use</h2>
      <p>This tool is for personal conversion only.
      Uploading illegal content is prohibited.</p>
    `;
  }

  if (type === "contact") {
    content = `
      <h2>Contact</h2>
      <p>Email: mrtechworld123@gmail.com</p>
    `;
  }

  modalText.innerHTML = content;
  modal.classList.remove("hidden");
}


// Close info modal
if (closeModal) {
  closeModal.onclick = () => modal.classList.add("hidden");
}

if (modal) {
  modal.addEventListener("click", e => {
    if (e.target === modal)
      modal.classList.add("hidden");
  });
}


// ===============================
// ERROR MODAL CLOSE
// ===============================

if (closeError) {
  closeError.onclick = () => errorModal.classList.add("hidden");
}

if (errorModal) {
  errorModal.addEventListener("click", e => {
    if (e.target === errorModal)
      errorModal.classList.add("hidden");
  });
}
