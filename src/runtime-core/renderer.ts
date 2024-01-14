import { ShapeFlag } from "../shared/shapeFlag"
import { createComponentInstance, setupComponent } from "./component"

export function render(vnode, container) {
  patch(vnode, container)
}

export function patch(vnode,container) {
  const { shapeFlag } = vnode
  if(ShapeFlag.ELEMENT & shapeFlag) {
    processElement(vnode, container)
  } else if(ShapeFlag.STATEFUL_COMPONENT & shapeFlag) {
    processComponent(vnode, container)
  }
}

function processComponent(vnode, container) {
  mountComponent(vnode, container)
}

function mountComponent(initailVNode, container) {
  const instance = createComponentInstance(initailVNode)

  setupComponent(instance)
  setupRenderEffect(instance,initailVNode, container)
}

function processElement(vnode: any, container: any) {
  mountElement(vnode, container)
}

function mountElement(vnode: any, container: any) {
  const el = document.createElement(vnode.type)

  const { children, props, shapeFlag } = vnode
  if(ShapeFlag.TEXT_CHILDREN & shapeFlag) {
    el.textContent = children
  } else if(ShapeFlag.ARRAY_CHILDREN & shapeFlag) {
    mountChildren(children, el)
  }

  for(const key in props) {
    let val = props[key]
    const isOn = (key) => /^on[A-Z]/.test(key)
    const getEventName = (key) => key.slice(2).toLowerCase()
    if(isOn(key)) {
      el.addEventListener(getEventName(key), val)
    } else {
      el.setAttribute(key, val)
    }
  }

  container.append(el)
}

function mountChildren(children, el: any) {
  children.forEach( v => {
    patch(v, el)
  });
}

function setupRenderEffect(instance, initailVNode, container) {
  const { proxy } = instance
  const subTree = instance.render.call(proxy)
  patch(subTree, container)
  initailVNode.el = subTree
}
