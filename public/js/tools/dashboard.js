const tools = [

  {
    title: "📄 Image ↔ PDF",
    desc: "Convert images and PDFs instantly.",
    link: "converter.html",
    active: true
  },

  {
    title: "🗜 Image Compressor",
    desc: "Reduce file size while keeping quality.",
    link: "compressor.html",
    active: true
  },

  {
  title: "📑 PDF Merger",
  desc: "Combine PDFs easily.",
  link: "merger.html",
  active: true
}
,

  {
    title: "🖼 Background Remover",
    desc: "AI-powered image cleanup.",
    active: false
  }

];

const grid = document.getElementById("toolGrid");

tools.forEach(tool => {

  const card = document.createElement(tool.active ? "a" : "div");

  card.className = "tool-card";

  if (!tool.active) card.classList.add("coming");

  if (tool.active) card.href = tool.link;

  card.innerHTML = `
    <h2>${tool.title}</h2>
    <p>${tool.desc}</p>
    ${tool.active ? "" : "<span>Coming soon</span>"}
  `;

  grid.appendChild(card);

});
document.addEventListener("DOMContentLoaded", () => {

  const cards = document.querySelectorAll(".tool-card");

  cards.forEach((card, i) => {

    card.style.opacity = 0;
    card.style.transform = "translateY(20px)";

    setTimeout(() => {
      card.style.transition = "all 0.5s ease";
      card.style.opacity = 1;
      card.style.transform = "translateY(0)";
    }, i * 120);

  });

});
