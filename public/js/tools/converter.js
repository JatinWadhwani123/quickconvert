document.addEventListener("DOMContentLoaded", () => {

  const uploadArea = document.getElementById("uploadArea");
  const fileInput = document.getElementById("fileInput");
  const form = document.getElementById("convertForm");

  const progress = document.getElementById("convertProgress");
  const bar = document.getElementById("convertBar");

  const uploadText = document.getElementById("uploadText");
  const uploadSub = document.getElementById("uploadSub");

  let selectedFiles = [];


  fileInput.addEventListener("change", () => {

  selectedFiles = Array.from(fileInput.files);

  if (!selectedFiles.length) return;

  // validate all files
  for (let file of selectedFiles) {
    if (!file.type.startsWith("image/")) {
      alert("Only images allowed");
      selectedFiles = [];
      return;
    }
  }

  uploadText.innerHTML = `📄 <strong>${selectedFiles.length} image(s) selected</strong>`;
  uploadSub.textContent = "Click to change files";
});


  uploadArea.addEventListener("dragover", e => {
    e.preventDefault();
    uploadArea.classList.add("drag-active");
  });

  uploadArea.addEventListener("dragleave", () => {
    uploadArea.classList.remove("drag-active");
  });

  uploadArea.addEventListener("drop", e => {
    e.preventDefault();
    uploadArea.classList.remove("drag-active");

    const file = e.dataTransfer.files[0];
    selectedFile = file;

    const dt = new DataTransfer();
    dt.items.add(file);
    fileInput.files = dt.files;

    uploadText.innerHTML = `📄 <strong>${file.name}</strong>`;
    uploadSub.textContent = "Click to change file";
  });

  form.addEventListener("submit", async e => {
  e.preventDefault();

  if (!selectedFiles.length) {
  document.querySelector("#successPopup h2").textContent = "⚠️ No Files Selected";
  document.querySelector("#successPopup p").textContent = "Please upload images before converting.";
  showPopup();
  return;
}


  progress.classList.remove("hidden");

  let p = 0;
  const anim = setInterval(() => {
    p += 6;
    bar.style.width = p + "%";
    if (p >= 90) clearInterval(anim);
  }, 120);

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();

  let first = true;

  for (let file of selectedFiles) {
    const imgData = await new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.readAsDataURL(file);
    });

    const img = new Image();
    img.src = imgData;

    await new Promise(res => img.onload = res);

    const width = pdf.internal.pageSize.getWidth();
    const height = (img.height * width) / img.width;

    if (!first) pdf.addPage();
    first = false;

    pdf.addImage(imgData, "JPEG", 0, 0, width, height);
  }

  bar.style.width = "100%";

  pdf.save("converted.pdf");
  showPopup();

  setTimeout(() => {
    progress.classList.add("hidden");
    bar.style.width = "0%";
  }, 1200);
});

// POPUP FUNCTIONS
function showPopup() {
  const popup = document.getElementById("successPopup");
  popup.classList.remove("hidden");

  // auto close after 2 seconds
  setTimeout(() => {
    popup.classList.add("hidden");
    location.reload();
  }, 2000);
}


function closePopup() {
  document.getElementById("successPopup").classList.add("hidden");
  location.reload();
}

});
