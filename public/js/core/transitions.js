document.querySelectorAll("a").forEach(link => {

  if (link.hostname === window.location.hostname) {

    link.addEventListener("click", e => {

      e.preventDefault();

      document.body.style.opacity = 0;

      setTimeout(() => {
        window.location = link.href;
      }, 250);

    });

  }

});

window.addEventListener("load", () => {
  document.body.style.opacity = 1;
  document.body.style.transition = "opacity 0.25s ease";
});
