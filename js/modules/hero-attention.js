/**
 * hero-attention.js
 * Turns the homepage headline into a live self-attention demo. Every word
 * becomes a button; pointing at, tapping or tabbing to a word draws arcs to
 * the words it "attends" to, weighted by a real softmax over dot products.
 */

import { tokenize, attentionToOthers } from "./attention.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const MIN_WEIGHT = 0.04;

function percent(value) {
  return `${Math.round(value * 100)}%`;
}

function buildWordButtons(sentence) {
  const words = sentence.textContent.trim().split(/\s+/);
  sentence.textContent = "";
  const entries = [];

  words.forEach((word, i) => {
    const [token] = tokenize(word);
    if (i > 0) {
      sentence.append(" ");
    }
    if (!token) {
      sentence.append(word);
      return;
    }
    const button = document.createElement("button");
    button.type = "button";
    button.className = "hero-word";
    button.textContent = word;
    button.setAttribute("aria-pressed", "false");
    sentence.append(button);
    entries.push({ button, token });
  });

  return entries;
}

/**
 * Words on the same line get an arc above them. Words on different lines get
 * an S-curve that travels through the gap between the two lines, so arcs
 * never cut through the headline text.
 */
function arcPath(from, to, maxLift) {
  if (Math.abs(from.top - to.top) < 4) {
    const lift = Math.min(12 + Math.abs(to.x - from.x) * 0.2, maxLift);
    const peak = from.top - lift;
    const midX = (from.x + to.x) / 2;
    return {
      d: `M ${from.x} ${from.top} Q ${midX} ${peak} ${to.x} ${to.top}`,
      end: { x: to.x, y: to.top },
    };
  }
  const goingDown = to.top > from.top;
  const startY = goingDown ? from.bottom : from.top;
  const endY = goingDown ? to.top : to.bottom;
  const midY = (startY + endY) / 2;
  return {
    d: `M ${from.x} ${startY} C ${from.x} ${midY} ${to.x} ${midY} ${to.x} ${endY}`,
    end: { x: to.x, y: endY },
  };
}

export function initHeroAttention(root) {
  if (!root) {
    return;
  }
  const sentence = root.querySelector(".hero-sentence");
  const svg = root.querySelector(".attention-arcs");
  const caption = document.querySelector(".hero-caption");
  const entries = buildWordButtons(sentence);
  const tokens = entries.map((entry) => entry.token);

  const defaultIndex = Math.max(tokens.indexOf("sees"), 0);
  let pinned = defaultIndex;
  let preview = null;

  function anchor(button) {
    const box = button.getBoundingClientRect();
    const frame = root.getBoundingClientRect();
    return {
      x: box.left - frame.left + box.width / 2,
      top: box.top - frame.top,
      bottom: box.bottom - frame.top,
    };
  }

  /** Space between two lines of the headline, so arcs stay out of the text. */
  function lineGap() {
    const lineHeight = parseFloat(getComputedStyle(sentence).lineHeight);
    return Math.max(lineHeight - entries[0].button.offsetHeight, 16);
  }

  function drawArcs(queryIndex, weights, max) {
    svg.replaceChildren();
    const maxLift = lineGap() * 0.85;
    const from = anchor(entries[queryIndex].button);
    weights.forEach((weight, j) => {
      if (j === queryIndex || weight < MIN_WEIGHT) {
        return;
      }
      const relative = weight / max;
      const to = anchor(entries[j].button);
      const arc = arcPath(from, to, maxLift);
      const path = document.createElementNS(SVG_NS, "path");
      path.setAttribute("d", arc.d);
      path.setAttribute("class", "attention-arc");
      path.setAttribute("pathLength", "1");
      path.style.setProperty("--weight", relative.toFixed(3));
      svg.append(path);

      const dot = document.createElementNS(SVG_NS, "circle");
      dot.setAttribute("cx", arc.end.x);
      dot.setAttribute("cy", arc.end.y);
      dot.setAttribute("r", 2 + relative * 3);
      dot.setAttribute("class", "attention-dot");
      svg.append(dot);
    });
  }

  function render() {
    const queryIndex = preview ?? pinned;
    const weights = attentionToOthers(tokens, queryIndex, { head: "meaning" });
    const max = Math.max(...weights);

    entries.forEach(({ button }, j) => {
      const weight = weights[j];
      const isQuery = j === queryIndex;
      button.classList.toggle("is-query", isQuery);
      button.classList.toggle("is-target", !isQuery && weight >= MIN_WEIGHT);
      button.setAttribute("aria-pressed", String(j === pinned));
      if (!isQuery && weight >= MIN_WEIGHT) {
        button.style.setProperty("--heat", (weight / max).toFixed(3));
        button.dataset.weight = percent(weight);
      } else {
        button.style.removeProperty("--heat");
        delete button.dataset.weight;
      }
    });

    drawArcs(queryIndex, weights, max);

    const ranked = weights
      .map((weight, j) => ({ weight, token: tokens[j] }))
      .filter((_, j) => j !== queryIndex)
      .sort((a, b) => b.weight - a.weight);
    const [first, second] = ranked;
    caption.textContent =
      `“${tokens[queryIndex]}” looks mostly at “${first.token}” (${percent(first.weight)})` +
      (second.weight >= 0.1
        ? ` and “${second.token}” (${percent(second.weight)}).`
        : ".") +
      " Point at, tap or tab to any word.";
  }

  entries.forEach(({ button }, i) => {
    button.addEventListener("pointerenter", () => {
      preview = i;
      render();
    });
    button.addEventListener("focus", () => {
      preview = i;
      render();
    });
    button.addEventListener("click", () => {
      pinned = i;
      preview = null;
      render();
    });
  });

  sentence.addEventListener("pointerleave", () => {
    preview = null;
    render();
  });
  sentence.addEventListener("focusout", (event) => {
    if (!sentence.contains(event.relatedTarget)) {
      preview = null;
      render();
    }
  });

  new ResizeObserver(render).observe(root);
  root.classList.add("is-live");
  render();
}
