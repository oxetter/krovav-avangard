document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll(".tab-btn");
  const contents = document.querySelectorAll(".tab-content");

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.tab;

      buttons.forEach((b) => b.classList.remove("active"));
      contents.forEach((c) => c.classList.remove("active"));

      btn.classList.add("active");
      const targetEl = document.getElementById(target);
      if (targetEl) targetEl.classList.add("active");

      history.replaceState(null, "", "#" + target);
    });
  });

  const hash = window.location.hash.replace("#", "");
  if (hash) {
    const btn = document.querySelector('.tab-btn[data-tab="' + hash + '"]');
    if (btn) btn.click();
  }
});
