import { NodeTypes } from "../ast";
import { CREATE_ELEMENT_BLOCK } from "../runtimeHelpers";

export function transformElement(node, context) {
  const { pushHelper } = context;
  if (node.type === NodeTypes.ELEMENT) {
    return () => {
      pushHelper(CREATE_ELEMENT_BLOCK);

      const vnodeTag = `'${node.tag}'`;
      let vnodeProps;
      const vnodeChildren = node.children[0];

      const vnodeElement = {
        type: NodeTypes.ELEMENT,
        tag: vnodeTag,
        props: vnodeProps,
        children: vnodeChildren,
      };

      node.codegen = vnodeElement;
    };
  }
}
