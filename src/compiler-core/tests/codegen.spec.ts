import { generate } from "../src/codegen";
import { baseParser } from "../src/parser";
import { transform } from "../src/transform";
import { transformElement } from "../src/transforms/transformElement";
import { transformExpression } from "../src/transforms/transformExpression";
import { transformText } from "../src/transforms/transformText";

describe("generate code", () => {
  test("string", () => {
    const ast = baseParser("hi");
    transform(ast);
    const { code } = generate(ast);

    expect(code).toMatchSnapshot();
  });
  test("interpolation", () => {
    const ast = baseParser("{{message}}");
    transform(ast, {
      nodeTransforms: [transformExpression],
    });
    const { code } = generate(ast);

    expect(code).toMatchSnapshot();
  });
  test("element", () => {
    const ast = baseParser("<div></div>");
    transform(ast, {
      nodeTransforms: [transformElement],
    });
    const { code } = generate(ast);

    expect(code).toMatchSnapshot();
  });
  test("union type", () => {
    const ast = baseParser("<div>hi,{{message}}</div>");
    transform(ast, {
      nodeTransforms: [transformExpression, transformElement, transformText],
    });
    const { code } = generate(ast);

    expect(code).toMatchSnapshot();
  });
});
