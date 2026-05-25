import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";

const recommendedReactRules = reactPlugin.configs.recommended.rules;
const recommendedTsRules = tsPlugin.configs.recommended.rules;
const recommendedHooksRules = reactHooksPlugin.configs.recommended.rules;

export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/lib/**",
      "**/coverage/**",
      "**/deploy/**",
      "**/*.config.ts",
      "**/*.config.js",
      ".eslintrc.cjs",
      "eslint.config.js",
    ],
  },
  {
    files: ["packages/**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
    },
    settings: { react: { version: "18" } },
    rules: {
      ...recommendedTsRules,
      ...recommendedReactRules,
      ...recommendedHooksRules,
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-react": "off",
      "no-alert": "error",
      "no-eval": "error",
      "no-new-func": "error",
      "react/no-danger": "error",
      "react/no-danger-with-children": "error",
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "features/[^/]+/.+",
              message:
                "Cross-feature imports forbidden. Import from feature index.ts only.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["packages/web/src/features/**/*.{ts,tsx}"],
    ignores: ["**/__tests__/**", "**/*.test.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex:
                "^\\.\\./\\.\\./(?!shared|auth|infrastructure|onboarding)[a-z-]+/(ui|lib|i18n)",
              message:
                "Cross-feature UI/lib/i18n import forbidden. Use the feature's barrel (import from \"../<feature>\") or move shared code to packages/web/src/shared/. Data hooks (../X/hooks/) are temporarily allowed pending migration to shared/data/.",
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      "**/*.test.ts",
      "**/*.test.tsx",
      "**/__tests__/**",
      "**/e2e/**",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "react/display-name": "off",
      "react/prop-types": "off",
      "react/no-children-prop": "off",
      "react-hooks/rules-of-hooks": "off",
    },
  },
];
