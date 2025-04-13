import js from "@eslint/js";

const config = [
  {
    ignores: [
      '**/dist/*',
      '**/node_modules/*',
    ],
  },
  {
    languageOptions: {
      parserOptions: {
        // project service will automatically find the closest `tsconfig.json`
        projectService: true,
        // import.meta.dirname is available after Node.js v20.11.0
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  js.configs.recommended,
];

export default config; 
