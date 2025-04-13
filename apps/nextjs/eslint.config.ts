import react from '@urban/config-eslint/react'
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  // import.meta.dirname is available after Node.js v20.11.0
  baseDirectory: import.meta.dirname,
});

const config = [
  {
    ignores: [
      '**/dist/*',
      '**/node_modules/*',
      '**/.next/*',
      "next.config.js"
    ],
  },
  ...react,
  ...compat.config({
    extends: [
      "next/core-web-vitals",
      "next/typescript",
    ],
  }),
];

export default config;
