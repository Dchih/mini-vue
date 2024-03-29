import { NodeTypes } from "../src/ast";
import { baseParser } from "../src/parser";
import { transform } from "../src/transform";

describe("transform", () => {
  test("happy path", () => {
    const ast = baseParser("<div>hi,{{message}}</div>");
    const plugin = (node) => {
      if (node.type === NodeTypes.TEXT) {
        node.content += "mini-vue";
      }
    };
    transform(ast, {
      nodeTransforms: [plugin],
    });

    const nodeText = ast.children[0].children[0].content;
    expect(nodeText).toBe("hi,mini-vue");
  });
});
