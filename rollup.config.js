import pkg from "./package.json" assert { type: "json" };
import typescript from "@rollup/plugin-typescript";
import json from "@rollup/plugin-json";
export default {
  input: "./packages/vue/src/index.ts",
  output: [
    {
      format: "cjs",
      file: "packages/vue/dist/guide-mini-vue.cjs.js",
      // file: 'lib/guide-mini-vue.cjs.js'
    },
    {
      format: "es",
      file: "packages/vue/dist/guide-mini-vue.esm.js",
      // file: 'lib/guide-mini-vue.esm.js'
    },
  ],
  plugins: [typescript(), json()],
};
