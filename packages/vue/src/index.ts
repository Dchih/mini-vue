export * from "@guide-mini-vue/runtime-core";
export * from "@guide-mini-vue/runtime-dom";

import * as runtimeCore from "@guide-mini-vue/runtime-core";
import { baseCompiler } from "@guide-mini-vue/compiler-core/";
import { registerFunctionCompiler } from "@guide-mini-vue/runtime-core";
export function compileToFunction(template) {
  const code = baseCompiler(template);
  const render = new Function("Vue", code)(runtimeCore);
  return render;
}

registerFunctionCompiler(compileToFunction);
