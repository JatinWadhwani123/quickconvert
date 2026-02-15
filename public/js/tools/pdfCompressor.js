document.addEventListener("DOMContentLoaded", () => {

  const uploadArea = document.getElementById("uploadArea");
  const fileInput = document.getElementById("fileInput");
  const form = document.getElementById("compressForm");

  const progress = document.getElementById("compressProgress");
  const bar = document.getElementById("compressBar");

  const uploadText = document.getElementById("uploadText");
  const uploadSub = document.getElementById("uploadSub");

  let selectedFile = null;

  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      alert("Only PDF files allowed");
      return;
    }

    selectedFile = file;
    uploadText.innerHTML = `📄 <strong>${file.name}</strong>`;
    uploadSub.textContent = "Click to change file";
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
    if (file.type !== "application/pdf") return;

    selectedFile = file;

    const dt = new DataTransfer();
    dt.items.add(file);
    fileInput.files = dt.files;

    uploadText.innerHTML = `📄 <strong>${file.name}</strong>`;
    uploadSub.textContent = "Click to change file";
  });

  form.addEventListener("submit", async e => {
    e.preventDefault();
    if (!selectedFile) return alert("Upload PDF first");

    const formData = new FormData();
    formData.append("file", selectedFile);

    progress.classList.remove("hidden");

    let p = 0;
    const anim = setInterval(() => {
      p += 6;
      bar.style.width = p + "%";
      if (p >= 90) clearInterval(anim);
    }, 120);

    try {
      const res = await fetch("/compress-pdf-file", {
        method: "POST",
        body: formData
      });

      const blob = await res.blob();

      bar.style.width = "100%";

      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "compressed.pdf";
      a.click();
    } catch {
      alert("Compression failed");
    }

    setTimeout(() => {
      progress.classList.add("hidden");
      bar.style.width = "0%";
    }, 1200);
  });

});
