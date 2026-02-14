document.addEventListener("DOMContentLoaded", () => {

const uploadArea = document.getElementById("uploadArea");
const fileInput = document.getElementById("fileInput");
const form = document.getElementById("mergeForm");

const pdfList = document.getElementById("pdfList");
const progress = document.getElementById("mergeProgress");
const bar = document.getElementById("mergeBar");

let files = [];
let dragIndex = null;

function addFiles(newFiles) {
  for (let file of newFiles) {
    if (file.type !== "application/pdf") continue;
    files.push(file);
  }
  renderList();
}

function renderList() {
  pdfList.innerHTML = "";

  files.forEach((file, index) => {
    const li = document.createElement("li");
    li.className = "pdf-item";
    li.draggable = true;

    li.innerHTML = `
      <span>${index + 1}. ${file.name}</span>
      <button data-index="${index}">✕</button>
    `;

    li.addEventListener("dragstart", e => {
      dragIndex = index;
      e.dataTransfer.setData("text/plain", index);
    });

    li.addEventListener("dragover", e => e.preventDefault());

    li.addEventListener("drop", () => {
      const temp = files[dragIndex];
      files[dragIndex] = files[index];
      files[index] = temp;
      renderList();
    });

    pdfList.appendChild(li);
  });

  pdfList.querySelectorAll("button").forEach(btn => {
    btn.onclick = e => {
      files.splice(e.target.dataset.index, 1);
      renderList();
    };
  });
}

fileInput.addEventListener("change", () => {
  addFiles(fileInput.files);
  fileInput.value = "";
});

uploadArea.addEventListener("dragover", e => e.preventDefault());

uploadArea.addEventListener("drop", e => {
  e.preventDefault();
  addFiles(e.dataTransfer.files);
});

form.addEventListener("submit", async e => {
  e.preventDefault();
  if (!files.length) return alert("Upload PDFs first");

  const formData = new FormData();
  files.forEach(file => formData.append("files", file));

  progress.classList.remove("hidden");

  let p = 0;
  const anim = setInterval(() => {
    p += 6;
    bar.style.width = p + "%";
    if (p >= 90) clearInterval(anim);
  }, 120);

  try {
    const res = await fetch("/merge", { method: "POST", body: formData });
    const blob = await res.blob();

    bar.style.width = "100%";

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "merged.pdf";
    a.click();
  }
  catch {
    alert("Merge failed");
  }
  finally {
    setTimeout(() => {
      progress.classList.add("hidden");
      bar.style.width = "0%";
    }, 1200);
  }
});

});
