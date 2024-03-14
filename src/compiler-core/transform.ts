export function transform(root, options) {
  const context = createTransformContext(root, options);
  traverseNode(root, context);
}
function traverseNode(node: any, context) {
  const { nodeTransform } = context;
  for (let i = 0; i < nodeTransform.length; i++) {
    const transform = nodeTransform[i];
    transform(node);
  }
  traverseChildren(context, node);
}

function traverseChildren(context, node) {
  const children = node.children;
  if (children) {
    for (let i = 0; i < children.length; i++) {
      const childNode = children[i];
      traverseNode(childNode, context);
    }
  }
}

function createTransformContext(root: any, options: any) {
  return {
    root,
    nodeTransform: options.nodeTransform || [],
  };
}
