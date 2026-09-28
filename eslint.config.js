// ESLint flat config.
// If your class provides its own eslint.config.js, replace this file with it.
import globals from "globals";
import pluginJs from "@eslint/js";

export default [
  { ignores: ["node_modules/**", "docs/**"] },
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.browser,
    },
  },
  pluginJs.configs.recommended,
];
