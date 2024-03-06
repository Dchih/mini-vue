import { ShapeFlag } from "../shared/shapeFlag";
import { createComponentInstance, setupComponent } from "./component";
import { createAppApi } from "./createApp";
import { Fragment, Text, createVNode } from "./vnode";

export function createRenderer(options) {
  const {
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert,
  } = options;
  function render(vnode, container) {
    patch(vnode, container, undefined);
  }

  function patch(vnode, container, parentComponent) {
    const { shapeFlag, type } = vnode;
    switch (type) {
      case Fragment:
        processFragment(vnode, container, parentComponent);
        break;
      case Text:
        processText(vnode, container);
        break;
      default:
        if (ShapeFlag.ELEMENT & shapeFlag) {
          processElement(vnode, container, parentComponent);
        } else if (ShapeFlag.STATEFUL_COMPONENT & shapeFlag) {
          processComponent(vnode, container, parentComponent);
        }
        break;
    }
  }

  function processComponent(vnode, container, parentComponent) {
    mountComponent(vnode, container, parentComponent);
  }

  function mountComponent(initailVNode, container, parentComponent) {
    const instance = createComponentInstance(initailVNode, parentComponent);

    setupComponent(instance);
    setupRenderEffect(instance, initailVNode, container);
  }

  function processElement(vnode: any, container: any, parentComponent) {
    mountElement(vnode, container, parentComponent);
  }

  function mountElement(vnode: any, container: any, parentComponent) {
    const el = hostCreateElement(vnode.type);

    const { children, props, shapeFlag } = vnode;
    if (ShapeFlag.TEXT_CHILDREN & shapeFlag) {
      el.textContent = children;
    } else if (ShapeFlag.ARRAY_CHILDREN & shapeFlag) {
      mountChildren(vnode, el, parentComponent);
    }

    for (const key in props) {
      let val = props[key];
      // const isOn = (key) => /^on[A-Z]/.test(key)
      // const getEventName = (key) => key.slice(2).toLowerCase()
      // if(isOn(key)) {
      //   el.addEventListener(getEventName(key), val)
      // } else {
      //   el.setAttribute(key, val)
      // }
      hostPatchProp(el, key, val);
    }

    // container.append(el)
    hostInsert(el, container);
  }

  function mountChildren(vnode, el: any, parentComponent) {
    vnode.children.forEach((v) => {
      patch(v, el, parentComponent);
    });
  }

  function setupRenderEffect(instance, initailVNode, container) {
    const { proxy } = instance;
    const subTree = instance.render.call(proxy);
    patch(subTree, container, instance);
    initailVNode.el = subTree.el;
  }
  function processFragment(vnode: any, container: any, parentComponent) {
    mountChildren(vnode, container, parentComponent);
  }

  function processText(vnode: any, container: any) {
    const { children } = vnode;
    const textNode = (vnode.el = document.createTextNode(children));
    container.append(textNode);
  }
  return {
    createApp: createAppApi(render),
  };
}
