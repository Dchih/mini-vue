export * from "./runtime-core";
export * from "./runtime-dom";
export * from "./reactivity";

import * as runtimeCore from "./runtime-core";
import { baseCompiler } from "./compiler-core/src";
import { registerFunctionCompiler } from "./runtime-core";
export function compileToFunction(template) {
  const code = baseCompiler(template);
  const render = new Function("Vue", code)(runtimeCore);
  return render;
}

registerFunctionCompiler(compileToFunction);
