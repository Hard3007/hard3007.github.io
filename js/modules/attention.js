/**
 * attention.js
 * A tiny, dependency-free implementation of scaled dot-product self-attention.
 *
 * Real Transformers learn their embeddings and projection matrices from data.
 * This module builds small, hand-made embeddings instead, so the result is
 * explainable in a browser without a trained model:
 *   - spelling:  character trigram hashing (similar spellings look alike)
 *   - position:  sinusoidal positional encoding (nearby words look alike)
 *   - meaning:   a small hand-written lexicon of ML/engineering concepts
 *   - untrained: random, seeded projections (what a head looks like before training)
 */

const DIM = 48;

/** Concept groups for the "meaning" head. Keys are word stems. */
const LEXICON = {
  vision: [
    "see",
    "vision",
    "image",
    "orbit",
    "satellite",
    "camera",
    "pixel",
    "detect",
    "detection",
    "detector",
    "spot",
    "yolo",
    "frame",
    "video",
    "look",
    "eye",
    "photo",
  ],
  language: [
    "read",
    "print",
    "fine",
    "text",
    "word",
    "contract",
    "language",
    "token",
    "sentence",
    "clause",
    "legal",
    "document",
    "write",
    "comment",
    "agreement",
  ],
  hardware: [
    "chip",
    "fpga",
    "fit",
    "edge",
    "device",
    "hardware",
    "latency",
    "quantize",
    "memory",
    "fast",
    "small",
    "tiny",
    "board",
    "gpu",
  ],
  learning: [
    "machine",
    "learning",
    "learn",
    "model",
    "train",
    "neural",
    "network",
    "transformer",
    "attention",
    "build",
    "ai",
    "deep",
    "predict",
  ],
  data: [
    "data",
    "pipeline",
    "record",
    "dataset",
    "sql",
    "database",
    "query",
    "table",
    "etl",
    "clean",
  ],
  sorting: [
    "sort",
    "waste",
    "recycle",
    "trash",
    "bin",
    "conveyor",
    "belt",
    "bottle",
    "can",
  ],
};

const CONCEPTS = Object.keys(LEXICON);

/** Split a sentence into display tokens (punctuation trimmed from edges). */
export function tokenize(text, maxTokens = 24) {
  return text
    .split(/\s+/)
    .map((word) => word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ""))
    .filter((word) => word.length > 0)
    .slice(0, maxTokens);
}

/** Very small stemmer so "sees", "reading" and "models" match the lexicon. */
export function stem(word) {
  const lower = word.toLowerCase();
  const rules = [
    [/ies$/, "y"],
    [/(ss)$/, "$1"],
    [/ing$/, ""],
    [/ed$/, ""],
    [/es$/, "e"],
    [/s$/, ""],
  ];
  for (const [pattern, replacement] of rules) {
    if (pattern.test(lower) && lower.length > 3) {
      return lower.replace(pattern, replacement);
    }
  }
  return lower;
}

/** Deterministic 32-bit string hash (FNV-1a). */
function hash(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Seeded pseudo-random generator (mulberry32) so "random" heads are repeatable. */
function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function normalize(vector) {
  const length = Math.hypot(...vector);
  return length === 0 ? vector : vector.map((value) => value / length);
}

function dot(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i += 1) {
    sum += a[i] * b[i];
  }
  return sum;
}

/** Character trigram embedding using the hashing trick. */
export function spellingEmbedding(word) {
  const padded = `^${word.toLowerCase()}$`;
  const vector = new Array(DIM).fill(0);
  for (let i = 0; i < padded.length - 2; i += 1) {
    const h = hash(padded.slice(i, i + 3));
    const sign = h & 1 ? 1 : -1;
    vector[h % DIM] += sign;
  }
  return normalize(vector);
}

/** Sinusoidal positional encoding from "Attention Is All You Need". */
export function positionalEncoding(position) {
  const vector = new Array(DIM);
  for (let i = 0; i < DIM; i += 2) {
    const angle = position / 10 ** ((4 * i) / DIM);
    vector[i] = Math.sin(angle);
    vector[i + 1] = Math.cos(angle);
  }
  return normalize(vector);
}

/** One-hot concept vector from the lexicon (all zeros if the word is unknown). */
export function meaningEmbedding(word) {
  const root = stem(word);
  return CONCEPTS.map((concept) =>
    LEXICON[concept].some(
      (entry) => entry === root || entry === word.toLowerCase(),
    )
      ? 1
      : 0,
  );
}

/** Returns the concept name for a word, or null. Used for explanations in the UI. */
export function conceptOf(word) {
  const index = meaningEmbedding(word).indexOf(1);
  return index === -1 ? null : CONCEPTS[index];
}

function softmax(scores) {
  const finite = scores.filter((value) => Number.isFinite(value));
  const max = Math.max(...finite);
  const exps = scores.map((value) =>
    Number.isFinite(value) ? Math.exp(value - max) : 0,
  );
  const total = exps.reduce((sum, value) => sum + value, 0);
  return exps.map((value) => value / total);
}

/** Builds a random projection matrix (rows x cols) from a seed. */
function randomMatrix(rows, cols, seed) {
  const random = seededRandom(seed);
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => (random() * 2 - 1) / Math.sqrt(cols)),
  );
}

function project(matrix, vector) {
  return matrix.map((row) => dot(row, vector));
}

/** Pairwise score functions, one per head. Each returns score(i, j). */
const HEADS = {
  meaning(tokens) {
    const meaning = tokens.map(meaningEmbedding);
    const spelling = tokens.map(spellingEmbedding);
    const position = tokens.map((_, i) => positionalEncoding(i));
    return (i, j) =>
      5 * dot(meaning[i], meaning[j]) +
      1.2 * dot(spelling[i], spelling[j]) +
      0.6 * dot(position[i], position[j]);
  },
  spelling(tokens) {
    const spelling = tokens.map(spellingEmbedding);
    return (i, j) => 4 * dot(spelling[i], spelling[j]);
  },
  position(tokens) {
    const position = tokens.map((_, i) => positionalEncoding(i));
    return (i, j) => 6 * dot(position[i], position[j]);
  },
  untrained(tokens) {
    const inputs = tokens.map((token, i) =>
      spellingEmbedding(token).map(
        (value, k) => value + positionalEncoding(i)[k],
      ),
    );
    const size = 16;
    const wq = randomMatrix(size, DIM, 7);
    const wk = randomMatrix(size, DIM, 11);
    const queries = inputs.map((x) => project(wq, x));
    const keys = inputs.map((x) => project(wk, x));
    return (i, j) => (dot(queries[i], keys[j]) / Math.sqrt(size)) * 12;
  },
};

export const HEAD_NAMES = Object.keys(HEADS);

/**
 * Computes an n x n attention matrix. Row i holds how much token i attends to
 * every token j; each row sums to 1.
 *
 * @param {string[]} tokens
 * @param {object} options
 * @param {string} options.head         one of HEAD_NAMES
 * @param {boolean} options.causal      if true, tokens cannot attend to later tokens
 * @param {number} options.temperature  higher = flatter distribution
 * @returns {number[][]}
 */
export function attentionMatrix(
  tokens,
  { head = "meaning", causal = false, temperature = 1 } = {},
) {
  if (!HEADS[head]) {
    throw new Error(
      `Unknown head "${head}". Use one of: ${HEAD_NAMES.join(", ")}`,
    );
  }
  const score = HEADS[head](tokens);
  const t = Math.max(temperature, 0.05);
  return tokens.map((_, i) =>
    softmax(
      tokens.map((__, j) => (causal && j > i ? -Infinity : score(i, j) / t)),
    ),
  );
}

/**
 * Attention from one token to all *other* tokens, renormalised to sum to 1.
 * Used by the homepage hero, where the self-weight isn't interesting.
 */
export function attentionToOthers(tokens, index, options) {
  const row = attentionMatrix(tokens, options)[index];
  const others = row.map((value, j) => (j === index ? 0 : value));
  const total = others.reduce((sum, value) => sum + value, 0) || 1;
  return others.map((value) => value / total);
}
