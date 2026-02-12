document.addEventListener("DOMContentLoaded", () => {

const uploadArea = document.getElementById("uploadArea");
const fileInput = document.getElementById("fileInput");
const form = document.getElementById("mergeForm");

const pdfList = document.getElementById("pdfList");

const progress = document.getElementById("mergeProgress");
const bar = document.getElementById("mergeBar");

let files = [];

// =======================
// ADD FILES
// =======================

function addFiles(newFiles) {

for (let file of newFiles) {

if (file.type !== "application/pdf") {
alert("Only PDFs allowed");
continue;
}

files.push(file);

}

renderList();
}

// =======================
// RENDER LIST
// =======================

function renderList() {

pdfList.innerHTML = "";

files.forEach((file, index) => {

const li = document.createElement("li");

li.draggable = true;
li.className = "pdf-item";

li.innerHTML = `
<span>${index + 1}. ${file.name}</span>
<button data-index="${index}">✕</button>
`;

pdfList.appendChild(li);
});

// remove buttons

pdfList.querySelectorAll("button").forEach(btn => {

btn.onclick = e => {

files.splice(e.target.dataset.index, 1);
renderList();

};

});

// drag reorder

let dragIndex;

pdfList.querySelectorAll(".pdf-item").forEach((item, i) => {

item.addEventListener("dragstart", () => dragIndex = i);

item.addEventListener("dragover", e => e.preventDefault());

item.addEventListener("drop", () => {

const temp = files[dragIndex];
files[dragIndex] = files[i];
files[i] = temp;

renderList();

});

});

}

// =======================
// INPUT PICKER
// =======================

fileInput.addEventListener("change", () => {

addFiles(fileInput.files);
fileInput.value = "";

});

// =======================
// DRAG DROP
// =======================

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

addFiles(e.dataTransfer.files);

});

// =======================
// MERGE
// =======================

form.addEventListener("submit", async e => {

e.preventDefault();

if (!files.length) {
alert("Upload PDFs first");
return;
}

const formData = new FormData();

files.forEach(file => formData.append("files", file));

// progress animation

progress.classList.remove("hidden");

let p = 0;

const anim = setInterval(() => {

p += 6;
bar.style.width = p + "%";

if (p >= 90) clearInterval(anim);

}, 120);

try {

const res = await fetch("/merge", {
method: "POST",
body: formData
});

if (!res.ok) throw new Error();

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
