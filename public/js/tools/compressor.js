document.addEventListener("DOMContentLoaded", () => {

const form = document.getElementById("compressForm");
const input = document.getElementById("fileInput");
const uploadText = document.getElementById("uploadText");
const loader = document.getElementById("loader");
const progress = document.getElementById("progress");
const bar = document.getElementById("progressBar");

if (!form || !input) return;

// ✅ show selected filename

input.addEventListener("change", () => {

if (input.files.length > 0) {
uploadText.textContent = input.files[0].name;
}

});

// ✅ form submit simulation

form.addEventListener("submit", e => {

e.preventDefault();

if (!input.files.length) {
alert("Please select an image first");
return;
}

loader.classList.remove("hidden");
progress.classList.remove("hidden");

let percent = 0;

const interval = setInterval(() => {

percent += 10;
bar.style.width = percent + "%";

if (percent >= 100) {

clearInterval(interval);

loader.classList.add("hidden");

setTimeout(() => {

progress.classList.add("hidden");
bar.style.width = "0%";

alert("Compression complete!");

}, 500);

}

}, 120);

});

});
