"use strict";

module.exports = {
  env: { node: true },
  extends: ["eslint:recommended", "plugin:n/recommended"],
  parser: "@typescript-eslint/parser",
  parserOptions: { ecmaVersion: "latest" },
  root: true,
};
