/**
 * colormap.js
 * A five-stop approximation of matplotlib's "viridis" colormap, the default
 * heatmap palette most ML practitioners already know how to read.
 */

const VIRIDIS = [
  [68, 1, 84],
  [59, 82, 139],
  [33, 145, 140],
  [94, 201, 98],
  [253, 231, 37],
];

function clamp(value) {
  return Math.min(1, Math.max(0, value));
}

/** Returns [r, g, b] for a value between 0 and 1. */
export function viridis(value) {
  const scaled = clamp(value) * (VIRIDIS.length - 1);
  const index = Math.min(Math.floor(scaled), VIRIDIS.length - 2);
  const t = scaled - index;
  const [a, b] = [VIRIDIS[index], VIRIDIS[index + 1]];
  return a.map((channel, i) => Math.round(channel + (b[i] - channel) * t));
}

/** CSS rgb() string, optionally with alpha. */
export function viridisCss(value, alpha = 1) {
  const [r, g, b] = viridis(value);
  return alpha === 1 ? `rgb(${r} ${g} ${b})` : `rgb(${r} ${g} ${b} / ${alpha})`;
}

/** WCAG relative luminance of an [r, g, b] color. */
function luminance(rgb) {
  const [r, g, b] = rgb.map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

const TEXT_CHOICES = [
  { css: "#ffffff", rgb: [255, 255, 255] },
  { css: "#14213a", rgb: [20, 33, 58] },
  { css: "#000000", rgb: [0, 0, 0] },
];

/**
 * Picks a text color for a viridis background that meets WCAG AA (4.5:1).
 * White or site ink is preferred; pure black covers the mid-teal band where
 * neither of those reaches 4.5:1.
 */
export function textColorFor(value) {
  const background = viridis(value);
  const passing = TEXT_CHOICES.find(
    (choice) => contrast(choice.rgb, background) >= 4.5
  );
  return passing ? passing.css : "#000000";
}
