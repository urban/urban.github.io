import js from "@eslint/js";
import * as reactHooks from 'eslint-plugin-react-hooks';

const config = [
  {
    languageOptions: {
      parserOptions: {
        // project service will automatically find the closest `tsconfig.json`
        projectService: true,
        // import.meta.dirname is available after Node.js v20.11.0
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      react: {
        version: 'detect'
      },
      'import/resolver': {
        typescript: true,
        alias: true,
      },
    }
  },
  js.configs.recommended,
  {
    // plugins: reactHooks.configs['recommended-latest'].plugins,
    rules: reactHooks.configs['recommended-latest'].rules,
  }
];

export default config;
