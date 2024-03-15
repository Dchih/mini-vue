import { generate } from "../src/codegen";
import { baseParser } from "../src/parser";
import { transform } from "../src/transform";
import { transformExpression } from "../src/transforms/transformExpression";

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
});
