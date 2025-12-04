module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
    "google",
    "plugin:@typescript-eslint/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["tsconfig.json", "tsconfig.dev.json"],
    sourceType: "module",
  },
  ignorePatterns: [
    "/lib/**/*", // Ignore built files.
  ],
  plugins: [
    "@typescript-eslint",
    "import",
  ],
  rules: {
    "@typescript-eslint/no-var-requires": "off",
    "quotes": ["error", "double"],
    "import/no-unresolved": 0,
    "indent": ["error", 2],
    "max-len": ["warn", { "code": 170 }], // Changed to warn and increased to 120
    "require-jsdoc": "off", // Disable JSDoc requirement
    "valid-jsdoc": "off", // Disable JSDoc validation
    "@typescript-eslint/no-explicit-any": "off", // Allow 'any' type
    "object-curly-spacing": ["error", "always"],
    "comma-dangle": ["error", "only-multiline"],
    "arrow-parens": ["error", "as-needed"],
    "linebreak-style": "off", // Disable linebreak check
    "no-trailing-spaces": ["error", { "skipBlankLines": true }],
    "brace-style": ["error", "1tbs", { "allowSingleLine": true }],
    "semi": ["error", "always"],
    "no-multiple-empty-lines": ["error", { "max": 2, "maxEOF": 1 }],
    "padded-blocks": "off",
    "spaced-comment": "off",
    "prefer-const": "warn",
  },
};
