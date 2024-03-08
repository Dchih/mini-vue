import { effect } from "../reactivity/effect";
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
    patch(null, vnode, container, undefined);
  }

  function patch(n1, n2, container, parentComponent) {
    const { shapeFlag, type } = n2;
    switch (type) {
      case Fragment:
        processFragment(n1, n2, container, parentComponent);
        break;
      case Text:
        processText(n1, n2, container);
        break;
      default:
        if (ShapeFlag.ELEMENT & shapeFlag) {
          processElement(n1, n2, container, parentComponent);
        } else if (ShapeFlag.STATEFUL_COMPONENT & shapeFlag) {
          processComponent(n1, n2, container, parentComponent);
        }
        break;
    }
  }

  function processComponent(n1, n2, container, parentComponent) {
    mountComponent(n2, container, parentComponent);
  }

  function mountComponent(initailVNode, container, parentComponent) {
    const instance = createComponentInstance(initailVNode, parentComponent);

    setupComponent(instance);
    setupRenderEffect(instance, initailVNode, container);
  }

  function processElement(n1, n2: any, container: any, parentComponent) {
    if (!n1) {
      mountElement(n2, container, parentComponent);
    } else {
      patchElement(n1, n2, container);
    }
  }

  function patchElement(n1, n2, container) {
    console.log("patchElement");
    console.log("n1: ", n1);
    console.log("n2: ", n2);
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
      patch(null, v, el, parentComponent);
    });
  }

  function processFragment(n1, n2: any, container: any, parentComponent) {
    mountChildren(n2, container, parentComponent);
  }

  function processText(n1, n2: any, container: any) {
    const { children } = n2;
    const textNode = (n2.el = document.createTextNode(children));
    container.append(textNode);
  }

  function setupRenderEffect(instance, initailVNode, container) {
    effect(() => {
      if (!instance.isMounted) {
        const { proxy } = instance;
        const subTree = (instance.subTree = instance.render.call(proxy));
        patch(null, subTree, container, instance);
        initailVNode.el = subTree.el;
        instance.isMounted = true;
      } else {
        const { proxy } = instance;
        const subTree = instance.render.call(proxy);
        const prevSubTree = instance.subTree;
        instance.subTree = subTree;
        patch(prevSubTree, subTree, container, instance);
      }
    });
  }
  return {
    createApp: createAppApi(render),
  };
}
