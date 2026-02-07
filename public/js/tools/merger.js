const dropArea = document.getElementById("dropArea");
const fileInput = document.getElementById("fileInput");
const form = document.getElementById("mergeForm");

const progress = document.getElementById("progressContainer");
const bar = document.getElementById("progressBar");
const btn = document.getElementById("mergeBtn");

const fileListUI = document.getElementById("fileList");
const toast = document.getElementById("toast");

let fileArray = [];


// ======================
// Drag + Drop upload
// ======================

dropArea.addEventListener("dragover", e => {
  e.preventDefault();
  dropArea.style.background = "rgba(255,255,255,0.2)";
});

dropArea.addEventListener("dragleave", () => {
  dropArea.style.background = "";
});

dropArea.addEventListener("drop", e => {
  e.preventDefault();
  addFiles(e.dataTransfer.files);
  dropArea.style.background = "";
});

fileInput.addEventListener("change", () => {
  addFiles(fileInput.files);
});


// ======================
// Add + validate files
// ======================

function addFiles(files) {

  Array.from(files).forEach(file => {

    if (file.type !== "application/pdf") {
      showInvalidGlow();
      return;
    }

    fileArray.push(file);
  });

  rebuildInput();
  renderList();
}

function showInvalidGlow() {
  dropArea.style.boxShadow = "0 0 15px red";
  setTimeout(() => dropArea.style.boxShadow = "", 600);
}


// ======================
// Render list UI
// ======================

function renderList() {

  fileListUI.innerHTML = "";

  fileArray.forEach((file, index) => {

    const item = document.createElement("div");
    item.className = "file-item valid";
    item.draggable = true;

    item.innerHTML = `
      <span>${file.name}</span>
      <span class="remove-btn">✖</span>
    `;

    item.querySelector(".remove-btn").onclick = () => {
      fileArray.splice(index, 1);
      rebuildInput();
      renderList();
    };

    // drag reorder
    item.addEventListener("dragstart", () => {
      item.classList.add("dragging");
      item.dataset.index = index;
    });

    item.addEventListener("dragend", () => {
      item.classList.remove("dragging");
      updateOrder();
    });

    fileListUI.appendChild(item);
  });
}


// ======================
// Reorder logic
// ======================

fileListUI.addEventListener("dragover", e => {

  e.preventDefault();

  const dragging = document.querySelector(".dragging");
  const after = getDragAfter(fileListUI, e.clientY);

  if (!after) fileListUI.appendChild(dragging);
  else fileListUI.insertBefore(dragging, after);
});

function getDragAfter(container, y) {

  const elements = [...container.querySelectorAll(".file-item:not(.dragging)")];

  return elements.reduce((closest, child) => {

    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;

    if (offset < 0 && offset > closest.offset)
      return { offset, element: child };
    else return closest;

  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function updateOrder() {

  const items = [...fileListUI.children];

  fileArray = items.map(el => {
    const name = el.querySelector("span").textContent;
    return fileArray.find(f => f.name === name);
  });

  rebuildInput();
}


// ======================
// Sync input
// ======================

function rebuildInput() {

  const dt = new DataTransfer();
  fileArray.forEach(f => dt.items.add(f));
  fileInput.files = dt.files;
}


// ======================
// Animated merge submit
// ======================

form.addEventListener("submit", async e => {

  e.preventDefault();

  if (fileArray.length < 2) {
    showInvalidGlow();
    return;
  }

  btn.disabled = true;
  btn.textContent = "Merging…";

  progress.classList.remove("hidden");

  let p = 0;

  const anim = setInterval(() => {
    p += 5;
    bar.style.width = p + "%";
    if (p >= 95) clearInterval(anim);
  }, 120);

  try {

    const formData = new FormData();
    fileArray.forEach(f => formData.append("files", f));

    const res = await fetch("/merge", {
      method: "POST",
      body: formData
    });

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "merged.pdf";
    a.click();

    bar.style.width = "100%";

    showToast();

  } catch {

    alert("Merge failed");
  }

  setTimeout(() => {

    btn.disabled = false;
    btn.textContent = "Merge PDFs";
    progress.classList.add("hidden");
    bar.style.width = "0%";

  }, 2000);

});


// ======================
// Toast popup
// ======================

function showToast() {

  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}
