import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

export default [
  { ignores: ["dist", "node_modules", "build", "*.config.js", "*.config.cjs"] },
  // Disable prop-types for UI components (they're typically well-structured and don't need runtime validation)
  {
    files: ["src/components/ui/**/*.{js,jsx}"],
    rules: {
      "react/prop-types": "off",
    },
  },
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.flat.recommended.rules,
      ...react.configs.flat["jsx-runtime"].rules,
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": "off", // Disabled - acceptable for contexts and utility exports

      // Best Practices (aligned with imriva-ui-framework)
      "array-callback-return": "error",
      curly: ["error", "all"],
      "dot-location": ["error", "property"],
      "dot-notation": "error",
      eqeqeq: ["error", "always"],
      "for-direction": "error",
      "getter-return": "error",
      "guard-for-in": "error",
      "no-alert": "warn",
      "no-caller": "error",
      "no-case-declarations": "error",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-constructor-return": "error",
      "no-delete-var": "error",
      "no-dupe-args": "error",
      "no-dupe-keys": "error",
      "no-duplicate-case": "error",
      "no-eval": "error",
      "no-ex-assign": "error",
      "no-fallthrough": "error",
      "no-func-assign": "error",
      "no-global-assign": "error",
      "no-implicit-coercion": "warn",
      "no-implied-eval": "error",
      "no-import-assign": "error",
      "no-inner-declarations": "error",
      "no-invalid-regexp": "error",
      "no-irregular-whitespace": "error",
      "no-labels": "error",
      "no-lone-blocks": "error",
      "no-loss-of-precision": "error",
      "no-misleading-character-class": "error",
      "no-mixed-operators": "warn",
      "no-mixed-spaces-and-tabs": "error",
      "no-obj-calls": "error",
      "no-octal": "error",
      "no-octal-escape": "error",
      "no-param-reassign": ["warn", { props: true }],
      "no-proto": "error",
      "no-redeclare": "error",
      "no-regex-spaces": "warn",
      "no-restricted-globals": ["error", "eval"],
      "no-return-assign": ["error", "except-parens"],
      "no-self-assign": "error",
      "no-self-compare": "error",
      "no-sequences": "error",
      "no-setter-return": "error",
      "no-shadow": ["warn", { builtinGlobals: false }],
      "no-shadow-restricted-names": "error",
      "no-sparse-arrays": "error",
      "no-this-before-super": "error",
      "no-throw-literal": "error",
      "no-undef": "error",
      "no-unexpected-multiline": "error",
      "no-unreachable": "error",
      "no-unsafe-finally": "error",
      "no-unsafe-negation": "error",
      "no-unsafe-optional-chaining": "error",
      "no-unused-labels": "error",
      "no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
      "no-useless-catch": "error",
      "no-useless-escape": "warn",
      "no-var": "error",
      "prefer-const": "error",
      "prefer-template": "warn",
      "require-yield": "error",
      "use-isnan": "error",
      "valid-typeof": "error",

      // React-specific (aligned with imriva-ui-framework)
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off", // Disabled - prop-types are optional in modern React
      "react/display-name": "warn",
      "react/no-array-index-key": "off", // Array index keys are acceptable for stable lists
      "react/no-children-prop": "error",
      "react/no-unescaped-entities": "warn",
      "react/require-render-return": "error",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // Code style (aligned with imriva-ui-framework)
      indent: ["error", 2],
      // Prefer "unix" (LF). Enable after normalizing: .gitattributes "* text=auto eol=lf" then eslint --fix
      "linebreak-style": ["off", "unix"],
      quotes: ["error", "single", { avoidEscape: true }],
      semi: ["error", "always"],
      "comma-dangle": ["error", "always-multiline"],
      "comma-spacing": "error",
      "key-spacing": "error",
      "keyword-spacing": "error",
      "object-curly-spacing": ["error", "always"],
      "space-before-blocks": "error",
      "space-infix-ops": "error",
      "space-unary-ops": "error",
    },
  },
  // Redux Toolkit uses Immer: mutating state in reducers is intentional (must be last to override)
  {
    files: ["src/store/**/*.js"],
    rules: {
      "no-param-reassign": "off",
    },
  },
];
