// ======================
// DOM references
// ======================

const dropArea = document.getElementById("dropArea");
const fileInput = document.getElementById("fileInput");
const form = document.getElementById("mergeForm");

const progress = document.getElementById("progressContainer");
const bar = document.getElementById("progressBar");
const btn = document.getElementById("mergeBtn");

const fileListUI = document.getElementById("fileList");
const toast = document.getElementById("toast");

let fileArray = [];
let dragIndex = null;
let progressAnim = null;


// ======================
// Upload handlers
// ======================

dropArea.addEventListener("click", () => fileInput.click());

dropArea.addEventListener("dragover", e => {
  e.preventDefault();
  dropArea.classList.add("drag-active");
});

dropArea.addEventListener("dragleave", () =>
  dropArea.classList.remove("drag-active")
);

dropArea.addEventListener("drop", e => {
  e.preventDefault();
  dropArea.classList.remove("drag-active");
  addFiles(e.dataTransfer.files);
});

fileInput.addEventListener("change", () => {
  addFiles(fileInput.files);
  fileInput.value = "";
});


// ======================
// Add files safely
// ======================

function addFiles(files) {

  Array.from(files).forEach(file => {

    if (file.type !== "application/pdf") {
      glowInvalid();
      return;
    }

    const exists = fileArray.some(f =>
      f.name === file.name &&
      f.size === file.size
    );

    if (!exists)
      fileArray.push(file);

  });

  renderList();
}


// ======================
// Invalid glow
// ======================

function glowInvalid() {

  dropArea.style.boxShadow = "0 0 15px red";

  setTimeout(() =>
    dropArea.style.boxShadow = "",
    600
  );
}


// ======================
// Render + drag reorder
// ======================

function renderList() {

  fileListUI.innerHTML = "";

  fileArray.forEach((file, index) => {

    const item = document.createElement("div");
    item.className = "file-item";
    item.draggable = true;

    item.innerHTML = `
      <span>${file.name}</span>
      <span class="remove-btn">✖</span>
    `;

    // remove button
    item.querySelector(".remove-btn").onclick = () => {
      fileArray.splice(index, 1);
      renderList();
    };

    // drag start
    item.addEventListener("dragstart", () => {
      dragIndex = index;
      item.classList.add("dragging");
    });

    // drag end
    item.addEventListener("dragend", () => {
      item.classList.remove("dragging");
      dragIndex = null;
    });

    fileListUI.appendChild(item);
  });
}


// reorder logic
fileListUI.addEventListener("dragover", e => {

  e.preventDefault();

  const dragging = document.querySelector(".dragging");
  const afterElement = getDragAfterElement(e.clientY);

  if (!dragging) return;

  if (afterElement == null) {
    fileListUI.appendChild(dragging);
  } else {
    fileListUI.insertBefore(dragging, afterElement);
  }

  updateArrayOrder();
});


function getDragAfterElement(y) {

  const items = [
    ...fileListUI.querySelectorAll(".file-item:not(.dragging)")
  ];

  return items.reduce((closest, child) => {

    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;

    if (offset < 0 && offset > closest.offset)
      return { offset, element: child };
    else
      return closest;

  }, { offset: Number.NEGATIVE_INFINITY }).element;
}


function updateArrayOrder() {

  const items = [...fileListUI.children];

  fileArray = items.map(el => {

    const name = el.querySelector("span").textContent;

    return fileArray.find(f => f.name === name);

  });
}


// ======================
// Submit merge
// ======================

form.addEventListener("submit", async e => {

  e.preventDefault();

  if (fileArray.length < 2) {
    glowInvalid();
    return;
  }

  btn.disabled = true;
  btn.textContent = "Merging…";

  progress.classList.remove("hidden");

  let p = 0;

  clearInterval(progressAnim);

  progressAnim = setInterval(() => {

    p += 5;
    bar.style.width = p + "%";

    if (p >= 95)
      clearInterval(progressAnim);

  }, 120);

  try {

    const formData = new FormData();

    fileArray.forEach(file =>
      formData.append("files", file)
    );

    const res = await fetch("/merge", {
      method: "POST",
      body: formData
    });

    if (!res.ok)
      throw new Error();

    const blob = await res.blob();

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "merged.pdf";
    a.click();

    bar.style.width = "100%";

    showToast();

  }

  catch {

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

  setTimeout(() =>
    toast.classList.remove("show"),
    2500
  );
}
