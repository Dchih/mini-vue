import { ShapeFlag } from "../shared/shapeFlag"

export function createVNode(type, props?, children?) {
  const vnode = {
    type,
    props,
    children,
    shapeFlag: getShapeFlag(type),
    setupState: {}
  }
  if(typeof children === 'string') {
    vnode.shapeFlag |= ShapeFlag.TEXT_CHILDREN
  } else if(Array.isArray(children)) {
    vnode.shapeFlag |= ShapeFlag.ARRAY_CHILDREN
  }
  return vnode
}

function getShapeFlag(type) {
  return typeof type === 'string' ? ShapeFlag.ELEMENT : ShapeFlag.STATEFUL_COMPONENT
}