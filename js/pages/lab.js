/**
 * lab.js
 * Entry point for lab.html: an attention heatmap that recomputes as you type.
 */

import { tokenize, attentionMatrix, conceptOf } from "../modules/attention.js";
import { viridisCss, textColorFor } from "../modules/colormap.js";

const MAX_WORDS = 12;

const HEAD_NOTES = {
  meaning:
    "Words from the same concept group (vision, language, hardware, learning, data, sorting) pull strongly toward each other. Unknown words fall back to spelling and position.",
  spelling:
    "Each word is broken into three-letter chunks. Words that share chunks, like “model” and “models”, look alike.",
  position:
    "Only word order matters. Each word looks mostly at itself and its neighbours, and the pull fades with distance.",
  untrained:
    "Random projection matrices, like a head before training. Attention is spread almost evenly, which is why models need data.",
};

function percent(value) {
  return `${Math.round(value * 100)}%`;
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  if (text !== undefined) {
    element.textContent = text;
  }
  return element;
}

/** Picks the first word whose concept group has another member in the sentence. */
function interestingRow(tokens) {
  const concepts = tokens.map(conceptOf);
  const index = concepts.findIndex(
    (concept, i) =>
      concept !== null &&
      concepts.some((other, j) => j !== i && other === concept)
  );
  return Math.max(index, 0);
}

function initLab(root) {
  if (!root) {
    return;
  }
  const form = root.querySelector(".lab-controls");
  const input = root.querySelector(".lab-input");
  const causal = root.querySelector(".lab-causal");
  const temperature = root.querySelector(".lab-temperature");
  const temperatureValue = root.querySelector(".lab-temperature-value");
  const headNote = root.querySelector(".lab-head-note");
  const wordCount = root.querySelector(".lab-word-count");
  const table = root.querySelector(".heatmap");
  const readout = root.querySelector(".lab-readout");
  let selectedRow = 0;

  const currentHead = () => form.querySelector(".lab-head:checked").value;

  function buildTable(tokens, matrix, isCausal) {
    const head = createElement("thead");
    const headerRow = createElement("tr");
    const corner = createElement("th", "heatmap-corner", "Query");
    corner.scope = "col";
    headerRow.append(corner);
    tokens.forEach((token) => {
      const th = createElement("th", "heatmap-col");
      th.scope = "col";
      th.append(createElement("span", "heatmap-col-label", token));
      headerRow.append(th);
    });
    head.append(headerRow);

    const body = createElement("tbody");
    matrix.forEach((row, i) => {
      const tr = createElement("tr");
      tr.classList.toggle("is-selected", i === selectedRow);
      const th = createElement("th", "heatmap-row");
      th.scope = "row";
      const button = createElement("button", "heatmap-row-button", tokens[i]);
      button.type = "button";
      button.setAttribute("aria-pressed", String(i === selectedRow));
      button.addEventListener("click", () => {
        selectedRow = i;
        render();
      });
      th.append(button);
      tr.append(th);

      row.forEach((value, j) => {
        const masked = isCausal && j > i;
        const td = createElement(
          "td",
          "heatmap-cell",
          masked ? "" : percent(value)
        );
        if (masked) {
          td.classList.add("is-masked");
          td.title = `“${tokens[i]}” cannot see “${tokens[j]}” (causal mask)`;
        } else {
          td.style.backgroundColor = viridisCss(value);
          td.style.color = textColorFor(value);
          td.title = `“${tokens[i]}” → “${tokens[j]}”: ${percent(value)}`;
        }
        tr.append(td);
      });
      body.append(tr);
    });

    const caption = createElement(
      "caption",
      "visually-hidden",
      `Attention weights for: ${tokens.join(" ")}`
    );
    table.replaceChildren(caption, head, body);
  }

  function describeRow(tokens, matrix) {
    const query = tokens[selectedRow];
    const ranked = matrix[selectedRow]
      .map((weight, j) => ({ weight, token: tokens[j] }))
      .filter(({ weight }) => weight >= 0.005)
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 3)
      .map(({ weight, token }) => `“${token}” (${percent(weight)})`);

    let sentence = `“${query}” spends most of its attention on ${ranked.join(", ")}.`;
    if (currentHead() === "meaning") {
      const concept = conceptOf(query);
      sentence += concept
        ? ` In the lexicon, “${query}” belongs to the ${concept} group.`
        : ` “${query}” isn't in the lexicon, so spelling and position decide.`;
    }
    readout.textContent = sentence;
  }

  function render() {
    const tokens = tokenize(input.value, MAX_WORDS);
    const total = tokenize(input.value, 1000).length;
    wordCount.textContent =
      total > MAX_WORDS
        ? `Using the first ${MAX_WORDS} of ${total} words.`
        : `${tokens.length} of ${MAX_WORDS} words.`;
    temperatureValue.textContent = Number(temperature.value).toFixed(2);
    headNote.textContent = HEAD_NOTES[currentHead()];

    if (tokens.length < 2) {
      table.replaceChildren();
      readout.textContent = "Type at least two words to see attention.";
      return;
    }

    selectedRow = Math.min(selectedRow, tokens.length - 1);
    const matrix = attentionMatrix(tokens, {
      head: currentHead(),
      causal: causal.checked,
      temperature: Number(temperature.value),
    });
    buildTable(tokens, matrix, causal.checked);
    describeRow(tokens, matrix);
  }

  form.addEventListener("input", render);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    render();
  });

  root.querySelectorAll(".preset-button").forEach((button) => {
    button.addEventListener("click", () => {
      input.value = button.dataset.sentence;
      selectedRow = interestingRow(tokenize(input.value, MAX_WORDS));
      render();
      input.focus();
    });
  });

  selectedRow = interestingRow(tokenize(input.value, MAX_WORDS));
  render();
}

initLab(document.querySelector(".lab"));
