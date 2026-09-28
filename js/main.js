/**
 * main.js
 * Shared behaviour for every page: mobile navigation and the footer year.
 */

function initNavigation() {
  const toggle = document.querySelector(".nav-toggle");
  const menu = document.querySelector(".nav-list");
  if (!toggle || !menu) {
    return;
  }

  const setOpen = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.textContent = open ? "Close" : "Menu";
    menu.classList.toggle("is-open", open);
  };

  toggle.addEventListener("click", () => {
    setOpen(toggle.getAttribute("aria-expanded") !== "true");
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menu.classList.contains("is-open")) {
      setOpen(false);
      toggle.focus();
    }
  });
}

function setCurrentYear() {
  const year = String(new Date().getFullYear());
  document.querySelectorAll(".current-year").forEach((element) => {
    element.textContent = year;
  });
}

document.documentElement.classList.add("has-js");
initNavigation();
setCurrentYear();
