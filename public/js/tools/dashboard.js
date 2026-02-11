// ===============================
// Dashboard tools data
// ===============================

const tools = [

  {
    icon: "📄",
    title: "Image ↔ PDF",
    desc: "Convert images and PDFs instantly.",
    link: "/converter"
  },

  {
    icon: "🗜",
    title: "Image Compressor",
    desc: "Reduce image size while keeping quality.",
    link: "/compressor"
  },

  {
    icon: "📑",
    title: "PDF Merger",
    desc: "Combine multiple PDFs into one.",
    link: "/merger"
  }

];

// ===============================
// Render dashboard cards
// ===============================

document.addEventListener("DOMContentLoaded", () => {

  const grid = document.getElementById("toolGrid");

  tools.forEach((tool, index) => {

    const card = document.createElement("a");

    card.href = tool.link;
    card.className = "tool-card";

    card.innerHTML = `
      <div class="tool-icon">${tool.icon}</div>
      <h3>${tool.title}</h3>
      <p>${tool.desc}</p>
    `;

    // animation
    card.style.opacity = 0;
    card.style.transform = "translateY(25px)";

    setTimeout(() => {
      card.style.transition = "all 0.4s ease";
      card.style.opacity = 1;
      card.style.transform = "translateY(0)";
    }, index * 120);

    grid.appendChild(card);

  });

});
