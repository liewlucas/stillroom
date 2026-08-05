// eslint-config-next v16 ships native flat configs. Routing them through
// FlatCompat (the v15-era pattern) makes ESLint resolve them as legacy
// eslintrc shareable configs and crash before linting a single file.
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [".next/**", "node_modules/**"],
  },
];

export default eslintConfig;
