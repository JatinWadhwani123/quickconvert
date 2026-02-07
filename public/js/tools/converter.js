const form = document.getElementById("convertForm");
const fileInput = document.getElementById("fileInput");
const toggle = document.getElementById("modeToggle");

form.addEventListener("submit", async (e) => {

  e.preventDefault();

  if (!fileInput.files.length) {
    alert("Select a file first");
    return;
  }

  const formData = new FormData();

  formData.append("file", fileInput.files[0]);

  // toggle decides mode
  const mode = toggle.checked ? "pdf2img" : "img2pdf";
  formData.append("mode", mode);

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
    window.URL.revokeObjectURL(url);

  } catch (err) {

    console.error(err);
    alert("Conversion failed");

  }

});
