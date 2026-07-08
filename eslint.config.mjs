import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import boundaries from "eslint-plugin-boundaries";
import prettierConfig from "eslint-config-prettier";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: { boundaries },
    settings: {
      "boundaries/elements": [
        { type: "domain", pattern: "src/modules/*/domain/**" },
        { type: "application", pattern: "src/modules/*/application/**" },
        { type: "infrastructure", pattern: "src/modules/*/infrastructure/**" },
        { type: "presentation", pattern: "src/modules/*/presentation/**" },
        { type: "app-router", pattern: "src/app/**" },
        { type: "shared", pattern: "src/shared/**" },
        { type: "components", pattern: "src/components/**" },
      ],
    },
    rules: {
      "boundaries/element-types": [
        "error",
        {
          default: "allow",
          rules: [
            {
              from: "domain",
              disallow: ["application", "infrastructure", "presentation", "app-router"],
            },
            { from: "application", disallow: ["infrastructure", "presentation", "app-router"] },
            { from: "presentation", disallow: ["infrastructure"] },
          ],
        },
      ],
      "max-lines": ["warn", { max: 300, skipBlankLines: true, skipComments: true }],
      "max-lines-per-function": ["warn", 50],
    },
  },
  prettierConfig,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "src/generated/**",
  ]),
]);

export default eslintConfig;
