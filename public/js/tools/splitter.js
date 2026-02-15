document.addEventListener("DOMContentLoaded", () => {

  const uploadArea = document.getElementById("uploadArea");
  const fileInput = document.getElementById("fileInput");
  const form = document.getElementById("convertForm");

  const progress = document.getElementById("convertProgress");
  const bar = document.getElementById("convertBar");

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

  form.addEventListener("submit", async e => {

    e.preventDefault();

    if (!selectedFile) {
      alert("Upload a PDF first");
      return;
    }

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

      const res = await fetch("/split", {
        method: "POST",
        body: formData
      });

      const blob = await res.blob();

      bar.style.width = "100%";

      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "split.pdf";
      a.click();

    } catch {

      alert("Split failed");

    } finally {

      setTimeout(() => {
        progress.classList.add("hidden");
        bar.style.width = "0%";
      }, 1200);

    }

  });

});
