import { createComponentInstance, setupComponent } from "./component"

export function render(vnode, container) {
  patch(vnode, container)
}

export function patch(vnode,container) {
  if(typeof vnode.type === 'string') {
    processElement(vnode, container)
  } else if(typeof vnode.type === 'object') {
    processComponent(vnode, container)
  }
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

function processElement(vnode: any, container: any) {
  mountElement(vnode, container)
}

function mountElement(vnode: any, container: any) {
  const el = document.createElement(vnode.type)

  const { children, props } = vnode
  if(typeof children === 'string') {
    el.textContent = children
  } else if(Array.isArray(children)) {
    mountChildren(children, el)
  }

  for(const key in props) {
    let val = props[key]
    el.setAttribute(key, val)
  }

  container.append(el)
}

function mountChildren(children, el: any) {
  children.forEach( v => {
    patch(v, el)
  });
}

