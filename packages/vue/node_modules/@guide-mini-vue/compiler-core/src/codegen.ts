import { isString } from "@guide-mini-vue/shared";
import { NodeTypes } from "./ast";
import {
  CREATE_ELEMENT_BLOCK,
  TO_DISPLAY_STRING,
  helperNameMap,
} from "./runtimeHelpers";

export function generate(ast) {
  const context = createCodegenContext();
  const { push } = context;

  generateFunctionPreamble(ast, context);

  const functionName = "render";
  const args = ["_ctx", "_cache"];
  const signature = args.join(", ");
  push(`return function ${functionName}(${signature}) {`);

  push(`return `);
  genNode(ast.codegen, context);
  push(`}`);
  return {
    code: context.code,
  };

  function generateFunctionPreamble(ast, context) {
    const { push, helper } = context;
    const VueBinging = "Vue";
    const aliasHelper = (s) => `${helper(s)}:_${helper(s)}`;
    if (ast.helpers.length > 0) {
      push(
        `const { ${ast.helpers.map(aliasHelper).join(", ")} } = ${VueBinging}`
      );
    }
    push("\n");
  }
}

function genNode(node, context) {
  switch (node.type) {
    case NodeTypes.TEXT:
      genText(node, context);
      break;
    case NodeTypes.INTERPOLATION:
      genInterpolation(node, context);
      break;
    case NodeTypes.SIMPLE_EXPRESSION:
      genExpression(node, context);
      break;
    case NodeTypes.ELEMENT:
      genElement(node, context);
      break;
    case NodeTypes.COMPOUND_EXPRESSION:
      genCompoundExpression(node, context);
      break;
    default:
      break;
  }
}

function createCodegenContext() {
  const context = {
    code: "",
    push(source) {
      context.code += source;
    },
    helper(key) {
      return helperNameMap[key];
    },
  };
  return context;
}

function genText(node, context) {
  const { push } = context;
  push(`'${node.content}'`);
}

function genInterpolation(node, context) {
  const { push, helper } = context;
  push(`_${helper(TO_DISPLAY_STRING)}(`);
  genNode(node.content, context);
  push(`)`);
}
function genExpression(node: any, context: any) {
  const { push } = context;
  push(`${node.content}`);
}

function genElement(node, context) {
  const { push, helper } = context;
  const { tag, children, props } = node;
  push(`_${helper(CREATE_ELEMENT_BLOCK)}(`);
  // push(`${tag}, null, `);
  const nodeList = transformNullVar([tag, props, children]);
  genNodeList(nodeList, context);
  push(`)`);
}
function genCompoundExpression(node: any, context: any) {
  const { push } = context;
  const { children } = node;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (isString(child)) {
      push(child);
    } else {
      genNode(child, context);
    }
  }
}

function genNodeList(list: any[], context) {
  const { push } = context;
  for (let i = 0; i < list.length; i++) {
    const listItem = list[i];
    if (isString(listItem)) {
      push(listItem);
    } else {
      genNode(listItem, context);
    }
    if (i < list.length - 1) push(", ");
  }
}

function transformNullVar(properties) {
  return properties.map((p) => (p ? p : `null`));
}
