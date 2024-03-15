import { NodeTypes } from "../src/ast";
import { baseParser } from "../src/parser";

describe("parser", () => {
  describe("interpolation", () => {
    it("simple interpolation", () => {
      const content = "{{ message }}";
      const ast: any = baseParser(content);
      expect(ast.children[0]).toStrictEqual({
        type: NodeTypes.INTERPOLATION,
        content: {
          type: NodeTypes.SIMPLE_EXPRESSION,
          content: "message",
        },
      });
    });
  });

  describe("element", () => {
    it("simple element div", () => {
      const element = "<div></div>";
      const ast = baseParser(element);
      expect(ast.children[0]).toStrictEqual({
        children: [],
        type: NodeTypes.ELEMENT,
        tag: "div",
      });
    });
  });

  describe("text", () => {
    it("simple text", () => {
      const text = "simple text";
      const ast = baseParser(text);
      expect(ast.children[0]).toStrictEqual({
        type: NodeTypes.TEXT,
        content: "simple text",
      });
    });
  });

  test("joint 3 kinds of type", () => {
    const text = "<div>hi,{{message}}</div>";
    const ast = baseParser(text);
    expect(ast.children[0]).toStrictEqual({
      type: NodeTypes.ELEMENT,
      tag: "div",
      children: [
        {
          type: NodeTypes.TEXT,
          content: "hi,",
        },
        {
          type: NodeTypes.INTERPOLATION,
          content: {
            type: NodeTypes.SIMPLE_EXPRESSION,
            content: "message",
          },
        },
      ],
    });
  });

  test("nested tag", () => {
    const text = "<div><p>hi</p>{{message}}</div>";
    const ast = baseParser(text);
    expect(ast.children[0]).toStrictEqual({
      type: NodeTypes.ELEMENT,
      tag: "div",
      children: [
        {
          type: NodeTypes.ELEMENT,
          tag: "p",
          children: [
            {
              type: NodeTypes.TEXT,
              content: "hi",
            },
          ],
        },
        {
          type: NodeTypes.INTERPOLATION,
          content: {
            type: NodeTypes.SIMPLE_EXPRESSION,
            content: "message",
          },
        },
      ],
    });
  });

  test("should throw an error when it's lack of end tag", () => {
    expect(() => baseParser("<div><span></div>")).toThrow();
  });
});
