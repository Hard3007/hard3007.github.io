/**
 * projects.js
 * Filters the project list by area. The active filter is kept in the URL
 * hash (e.g. projects.html#vision) so a filtered view can be shared.
 */

const LABELS = {
  all: "projects",
  language: "language and LLM projects",
  vision: "computer vision projects",
  systems: "systems and deployment projects",
};

function initProjectFilter(toolbar) {
  if (!toolbar) {
    return;
  }
  const buttons = [...toolbar.querySelectorAll(".filter-button")];
  const projects = [...document.querySelectorAll(".project-item")];
  const status = document.querySelector(".filter-status");

  function applyFilter(filter) {
    let shown = 0;
    projects.forEach((project) => {
      const tags = project.dataset.tags.split(" ");
      const matches = filter === "all" || tags.includes(filter);
      project.hidden = !matches;
      if (matches) {
        shown += 1;
      }
    });

    buttons.forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.filter === filter)
      );
    });

    status.textContent =
      filter === "all"
        ? `Showing all ${projects.length} projects.`
        : `Showing ${shown} ${LABELS[filter]}.`;

    const hash = filter === "all" ? "" : `#${filter}`;
    history.replaceState(null, "", `${location.pathname}${hash}`);
  }

  buttons.forEach((button) => {
    button.addEventListener("click", () => applyFilter(button.dataset.filter));
  });

  const fromHash = location.hash.slice(1);
  applyFilter(LABELS[fromHash] ? fromHash : "all");
}

initProjectFilter(document.querySelector(".filter-toolbar"));
