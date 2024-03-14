import { isObject } from "../shared";
import { ShapeFlag } from "../shared/shapeFlag";

export const Fragment = Symbol("Fragment");
export const Text = Symbol("Text");

export function createVNode(type, props?, children?) {
  const vnode = {
    el: null,
    type,
    props,
    component: null,
    next: null,
    key: props && props.key,
    children,
    shapeFlag: getShapeFlag(type),
    setupState: {},
  };
  if (typeof children === "string") {
    vnode.shapeFlag |= ShapeFlag.TEXT_CHILDREN;
  } else if (Array.isArray(children)) {
    vnode.shapeFlag |= ShapeFlag.ARRAY_CHILDREN;
  }

  if (vnode.shapeFlag & ShapeFlag.STATEFUL_COMPONENT) {
    if (isObject(children)) {
      vnode.shapeFlag |= ShapeFlag.SLOT_CHILDREN;
    }
  }

  return vnode;
}

export function createTextNode(text) {
  return createVNode(Text, {}, text);
}

function getShapeFlag(type) {
  return typeof type === "string"
    ? ShapeFlag.ELEMENT
    : ShapeFlag.STATEFUL_COMPONENT;
}
