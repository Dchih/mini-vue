import { NodeTypes } from "./ast";
import { TO_DISPLAY_STRING } from "./runtimeHelpers";

export function transform(root, options = {}) {
  const context = createTransformContext(root, options);
  traverseNode(root, context);
  createRootCodegen(root);
  root.helpers = context.helpers;
}

function createRootCodegen(ast) {
  const child = ast.children[0];
  if (child.type === NodeTypes.ELEMENT) {
    ast.codegen = child.codegen;
  } else {
    ast.codegen = ast.children[0];
  }
}

function traverseNode(node: any, context) {
  const { nodeTransforms } = context;
  const onExits = [] as any[];
  for (let i = 0; i < nodeTransforms.length; i++) {
    const transform = nodeTransforms[i];
    const exitFn = transform(node, context);
    if (exitFn) onExits.push(exitFn);
  }

  switch (node.type) {
    case NodeTypes.INTERPOLATION:
      context.pushHelper(TO_DISPLAY_STRING);
      break;
    case NodeTypes.ROOT:
    case NodeTypes.ELEMENT:
      traverseChildren(context, node);
      break;
    default:
      break;
  }

  let i = onExits.length;
  while (i--) {
    onExits[i]();
  }
}

function traverseChildren(context, node) {
  const children = node.children;
  for (let i = 0; i < children.length; i++) {
    const childNode = children[i];
    traverseNode(childNode, context);
  }
}

function createTransformContext(root: any, options: any) {
  const context = {
    root,
    nodeTransforms: options.nodeTransforms || [],
    helpers: [] as any[],
    pushHelper(helper: any) {
      context.helpers.push(helper);
    },
  };
  return context;
}
