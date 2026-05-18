/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    ecmaFeatures: { jsx: true },
  },
  plugins: ["@typescript-eslint", "react", "react-hooks"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
  ],
  settings: { react: { version: "18" } },
  rules: {
    "react/react-in-jsx-scope": "off",
    "react/jsx-uses-react": "off",
    "no-alert": "error",
    "no-eval": "error",
    "no-new-func": "error",
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            regex: "features/[^/]+/.+",
            message: "Cross-feature imports forbidden. Import from feature index.ts only."
          }
        ]
      }
    ]
  },
  ignorePatterns: [
    "node_modules/", "dist/", "build/", "lib/", "coverage/",
    "**/*.config.ts", "**/*.config.js", ".eslintrc.cjs"
  ],
  overrides: [
    {
      files: ["**/*.test.ts", "**/*.test.tsx", "**/__tests__/**"],
      rules: {
        "@typescript-eslint/no-explicit-any": "off"
      }
    }
  ]
};
