document.addEventListener("DOMContentLoaded", () => {

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
    uploadSub.textContent = "Ready to convert";
  });


  form.addEventListener("submit", async e => {

    e.preventDefault();

    if (!selectedFile) {
      alert("Upload a PDF first");
      return;
    }

    progress.classList.remove("hidden");

    const zip = new JSZip();

    const arrayBuffer = await selectedFile.arrayBuffer();

    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    for (let i = 1; i <= pdf.numPages; i++) {

      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2 });

      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;

      const imageData = canvas.toDataURL("image/png");

      const base64 = imageData.split(",")[1];

      zip.file(`page-${i}.png`, base64, { base64: true });

      const percent = Math.floor((i / pdf.numPages) * 100);
      bar.style.width = percent + "%";
    }

    const content = await zip.generateAsync({ type: "blob" });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(content);
    a.download = "images.zip";
    a.click();

    setTimeout(() => {
      progress.classList.add("hidden");
      bar.style.width = "0%";
    }, 1500);

  });

});
