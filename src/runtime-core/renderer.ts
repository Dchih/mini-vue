import { createComponentInstance, setupComponent } from "./component"

export function render(vnode, container) {
  patch(vnode, container)
}

export function patch(vnode,container) {
  // patch 需要判断 vnode 类型
  // 此处先认为 vnode 为 Component 类型
  processComponent(vnode, container)
}

function processComponent(vnode, container) {
  mountComponent(vnode, container)
}

function mountComponent(vnode, container) {
  const instance = createComponentInstance(vnode)

  setupComponent(instance)
  setupRenderEffect(instance, container)
}



function setupRenderEffect(instance, container) {
  const subTree = instance.render()
  patch(subTree, container)
}

