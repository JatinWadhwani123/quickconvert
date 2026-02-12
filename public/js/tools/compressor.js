document.addEventListener("DOMContentLoaded", () => {

  const uploadArea = document.getElementById("uploadArea");
  const fileInput = document.getElementById("fileInput");
  const form = document.getElementById("compressForm");

  const progress = document.getElementById("convertProgress");
  const bar = document.getElementById("convertBar");

  const uploadText = document.getElementById("uploadText");
  const uploadSub = document.getElementById("uploadSub");

  if (!uploadArea || !fileInput || !form) {
    console.error("Compressor UI missing");
    return;
  }

  let selectedFile = null;

  // ======================
  // FILE PICKER
  // ======================

  fileInput.addEventListener("change", () => {

    const file = fileInput.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Only image files allowed");
      fileInput.value = "";
      return;
    }

    selectedFile = file;

    if (uploadText) uploadText.innerHTML = `📄 <strong>${file.name}</strong>`;
    if (uploadSub) uploadSub.textContent = "Click to change file";

  });

  // ======================
  // DRAG & DROP
  // ======================

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

    if (!file || !file.type.startsWith("image/")) {
      alert("Only image files allowed");
      return;
    }

    selectedFile = file;

    const dt = new DataTransfer();
    dt.items.add(file);
    fileInput.files = dt.files;

    if (uploadText) uploadText.innerHTML = `📄 <strong>${file.name}</strong>`;
    if (uploadSub) uploadSub.textContent = "Click to change file";

  });

  // ======================
  // SUBMIT
  // ======================

  form.addEventListener("submit", async e => {

    e.preventDefault();

    if (!selectedFile) {
      alert("Upload an image first");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    // safe progress animation
    let anim;
    if (progress && bar) {

      progress.classList.remove("hidden");

      let p = 0;
      anim = setInterval(() => {
        p += 5;
        bar.style.width = p + "%";
        if (p >= 90) clearInterval(anim);
      }, 120);

    }

    try {

      const res = await fetch("/compress", {
        method: "POST",
        body: formData
      });

      if (!res.ok) throw new Error();

      const blob = await res.blob();

      if (bar) bar.style.width = "100%";

      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "compressed.jpg";
      a.click();

    }

    catch {

      alert("Compression failed");

    }

    finally {

      setTimeout(() => {

        if (progress && bar) {
          progress.classList.add("hidden");
          bar.style.width = "0%";
        }

        selectedFile = null;
        fileInput.value = "";

        if (uploadText) uploadText.textContent = "Drag & drop image here";
        if (uploadSub) uploadSub.textContent = "or click to upload";

      }, 1000);

    }

  });

});
