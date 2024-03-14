import { NodeTypes } from "../ast";
import { baseParser } from "../parser";
import { transform } from "../transform";

describe("transform", () => {
  test("happy path", () => {
    const ast = baseParser("<div>hi,{{message}}</div>");
    const plugin = (node) => {
      if (node.type === NodeTypes.TEXT) {
        node.content += "mini-vue";
      }
    };
    transform(ast, {
      nodeTransform: [plugin],
    });

    const nodeText = ast.children[0].children[0].content;
    expect(nodeText).toBe("hi,mini-vue");
  });
});
