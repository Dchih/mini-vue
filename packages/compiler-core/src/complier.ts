import { generate } from "./codegen";
import { baseParser } from "./parser";
import { transform } from "./transform";
import { transformElement } from "./transforms/transformElement";
import { transformExpression } from "./transforms/transformExpression";
import { transformText } from "./transforms/transformText";

export function baseCompiler(template) {
  const ast = baseParser(template);
  transform(ast, {
    nodeTransforms: [transformExpression, transformElement, transformText],
  });
  const { code } = generate(ast);
  return code;
}
