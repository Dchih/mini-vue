import { NodeTypes } from "../ast";

function isText(node) {
  return node.type === NodeTypes.TEXT || node.type === NodeTypes.INTERPOLATION;
}

// 处理 ELEMENT, 将其子节点转换为一个夹带 " + " 的数组
// 故 INTERPOLATION 被覆盖在此节点中
export function transformText(node, context) {
  if (node.type === NodeTypes.ELEMENT) {
    return () => {
      const children = node.children;
      let currentContainer;
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (isText(child)) {
          for (let j = i + 1; j < children.length; j++) {
            const nextChild = children[j];
            if (isText(nextChild)) {
              if (!currentContainer) {
                currentContainer = children[i] = {
                  type: NodeTypes.COMPOUND_EXPRESSION,
                  children: [child],
                };
              }
              currentContainer.children.push(" + ");
              currentContainer.children.push(nextChild);
              children.splice(j, 1);
              j--;
            } else {
              currentContainer = undefined;
              break;
            }
          }
        }
      }
    };
  }
}
