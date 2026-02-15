document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("lockForm");
  const fileInput = document.getElementById("fileInput");
  const passwordInput = document.getElementById("password");

  const progress = document.getElementById("lockProgress");
  const bar = document.getElementById("lockBar");

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
    uploadSub.textContent = "Ready to lock";
  });

  form.addEventListener("submit", async e => {
    e.preventDefault();

    if (!selectedFile) {
      alert("Upload a PDF first");
      return;
    }

    const password = passwordInput.value.trim();
    if (!password) {
      alert("Enter password");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("password", password);

    progress.classList.remove("hidden");

    let p = 0;
    const anim = setInterval(() => {
      p += 5;
      bar.style.width = p + "%";
      if (p >= 90) clearInterval(anim);
    }, 120);

    try {
      const res = await fetch("/lock-pdf", {
        method: "POST",
        body: formData
      });

      const blob = await res.blob();

      bar.style.width = "100%";

      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "locked.pdf";
      a.click();

    } catch (err) {
      alert("Locking failed");
    }

    setTimeout(() => {
      progress.classList.add("hidden");
      bar.style.width = "0%";
    }, 1200);
  });

});
