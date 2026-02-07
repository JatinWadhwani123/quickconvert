const dropArea = document.getElementById("dropArea");
const fileInput = document.getElementById("fileInput");
const fileText = document.getElementById("fileText");
const form = document.getElementById("compressForm");
const btn = document.getElementById("compressBtn");
const progress = document.getElementById("progressContainer");
const bar = document.getElementById("progressBar");
const toast = document.getElementById("toast");


// =================
// Drag UI
// =================

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

  if (fileInput.files.length)
    fileText.textContent = fileInput.files[0].name;
});


// =================
// File preview
// =================

fileInput.addEventListener("change", () => {

  const file = fileInput.files[0];

  if (!file) return;

  if (!file.type.startsWith("image/")) {
  showToast("Only images allowed!", "error");
  return;
}


});



// =================
// Submit UX
// =================

form.addEventListener("submit", () => {

  btn.disabled = true;
  btn.textContent = "Compressing...";

  progress.classList.remove("hidden");
  bar.style.width = "0%";

  let p = 0;

  const interval = setInterval(() => {
    p += 10;
    bar.style.width = p + "%";

    if (p >= 100)
      clearInterval(interval);

  }, 150);

  setTimeout(() => {

    btn.textContent = "Downloaded ✓";
    btn.style.background = "#4CAF50";

    toast.classList.remove("hidden");

    setTimeout(() => {

      toast.classList.add("hidden");
      btn.disabled = false;
      btn.textContent = "Compress Image";
      btn.style.background = "#00e0ff";
      progress.classList.add("hidden");

    }, 3000);

  }, 2000);

});
