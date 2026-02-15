document.addEventListener("DOMContentLoaded", () => {

  const fileInput = document.getElementById("fileInput");
  const form = document.getElementById("resizeForm");

  const progress = document.getElementById("resizeProgress");
  const bar = document.getElementById("resizeBar");

  const widthInput = document.getElementById("width");
  const heightInput = document.getElementById("height");

  const uploadText = document.getElementById("uploadText");
  const uploadSub = document.getElementById("uploadSub");

  let selectedFile = null;

  fileInput.addEventListener("change", () => {

    const file = fileInput.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Only image files allowed");
      return;
    }

    selectedFile = file;
    uploadText.innerHTML = `📄 <strong>${file.name}</strong>`;
    uploadSub.textContent = "Ready to resize";
  });

  form.addEventListener("submit", async e => {

    e.preventDefault();

    if (!selectedFile) return alert("Upload image first");

    const width = widthInput.value;
    const height = heightInput.value;

    if (!width || !height) {
      alert("Enter width & height");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("width", width);
    formData.append("height", height);

    progress.classList.remove("hidden");

    let p = 0;
    const anim = setInterval(() => {
      p += 6;
      bar.style.width = p + "%";
      if (p >= 90) clearInterval(anim);
    }, 120);

    try {
      const res = await fetch("/resize-image", {
        method: "POST",
        body: formData
      });

      const blob = await res.blob();

      bar.style.width = "100%";

      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "resized.jpg";
      a.click();

    } catch {
      alert("Resize failed");
    }

    setTimeout(() => {
      progress.classList.add("hidden");
      bar.style.width = "0%";
    }, 1500);

  });

});
