const form = document.getElementById("compressForm");
const input = document.getElementById("fileInput");
const loader = document.getElementById("loader");
const toast = document.getElementById("toast");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const file = input.files[0];

  if (!file) {
    alert("Select an image first");
    return;
  }

  // 🚨 BLOCK PDF uploads
  if (!file.type.startsWith("image/")) {
    alert("Only image files allowed!");
    input.value = "";
    return;
  }

  loader.classList.remove("hidden");

  const data = new FormData();
  data.append("file", file);

  try {
    const res = await fetch("/compress", {
      method: "POST",
      body: data
    });

    if (!res.ok) throw new Error("Compression failed");

    const blob = await res.blob();

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "compressed-image.jpg";
    document.body.appendChild(a);
    a.click();
    a.remove();

    toast.classList.remove("hidden");
    setTimeout(() => toast.classList.add("hidden"), 2000);

  } catch (err) {
    alert("Compression failed");
  }

  loader.classList.add("hidden");
});
