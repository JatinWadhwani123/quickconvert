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
fileInput.value = ""; // allow re-upload
});

// ======================
// Add files
// ======================

function addFiles(files) {

Array.from(files).forEach(file => {

```
if (file.type !== "application/pdf") {
  glowInvalid();
  return;
}

fileArray.push(file);
```

});

renderList();
}

function glowInvalid() {
dropArea.style.boxShadow = "0 0 15px red";
setTimeout(() => dropArea.style.boxShadow = "", 600);
}

// ======================
// Render list
// ======================

function renderList() {

fileListUI.innerHTML = "";

fileArray.forEach((file, index) => {

```
const item = document.createElement("div");
item.className = "file-item";

item.innerHTML = `
  <span>${file.name}</span>
  <span class="remove-btn">✖</span>
`;

item.querySelector(".remove-btn").onclick = () => {
  fileArray.splice(index, 1);
  renderList();
};

fileListUI.appendChild(item);
```

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
const anim = setInterval(() => {
p += 5;
bar.style.width = p + "%";
if (p >= 95) clearInterval(anim);
}, 120);

try {

```
const formData = new FormData();
fileArray.forEach(file =>
  formData.append("files", file)
);

const res = await fetch("/merge", {
  method: "POST",
  body: formData
});

if (!res.ok) throw new Error();

const blob = await res.blob();

const a = document.createElement("a");
a.href = URL.createObjectURL(blob);
a.download = "merged.pdf";
a.click();

bar.style.width = "100%";

showToast();
```

} catch {

```
alert("Merge failed");
```

}

setTimeout(() => {

```
btn.disabled = false;
btn.textContent = "Merge PDFs";

progress.classList.add("hidden");
bar.style.width = "0%";
```

}, 2000);

});

// ======================
// Toast
// ======================

function showToast() {

toast.classList.add("show");

setTimeout(() =>
toast.classList.remove("show"),
2500
);
}
