import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
  {
    ignores: [".next/**", "node_modules/**"],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
      globals: {
        // Browser globals
        window: "readonly",
        document: "readonly",
        fetch: "readonly",
        caches: "readonly",
        crypto: "readonly",
        AudioContext: "readonly",
        AudioBuffer: "readonly",
        AudioBufferSourceNode: "readonly",
        GainNode: "readonly",
        ReadableStream: "readonly",
        Response: "readonly",
        TextEncoder: "readonly",
        KeyboardEvent: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        console: "readonly",
        URL: "readonly",
        // Node globals
        process: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        // React JSX
        React: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];
