import { effect } from "../reactivity/effect";
import { EMPTY_OBJ } from "../shared";
import { ShapeFlag } from "../shared/shapeFlag";
import { createComponentInstance, setupComponent } from "./component";
import { createAppApi } from "./createApp";
import { Fragment, Text, createVNode } from "./vnode";

export function createRenderer(options) {
  const {
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText,
  } = options;
  function render(vnode, container) {
    patch(null, vnode, container, undefined);
  }

  function patch(n1, n2, container, parentComponent, anchor = null) {
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
          processElement(n1, n2, container, parentComponent, anchor);
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

  function processElement(
    n1,
    n2: any,
    container: any,
    parentComponent,
    anchor
  ) {
    if (!n1) {
      mountElement(n2, container, parentComponent, anchor);
    } else {
      patchElement(n1, n2, container, parentComponent);
    }
  }

  function patchElement(n1, n2, container, parentComponent) {
    const oldProps = n1.props || EMPTY_OBJ;
    const newProps = n2.props || EMPTY_OBJ;
    const el = (n2.el = n1.el);
    patchProps(el, newProps, oldProps, container);
    patchChildren(n1, n2, el, parentComponent);
  }

  function patchChildren(n1, n2, container, parentComponent) {
    const prevShapeFlag = n1.shapeFlag;
    const { shapeFlag } = n2;
    const c1 = n1.children;
    const c2 = n2.children;
    if (shapeFlag & ShapeFlag.TEXT_CHILDREN) {
      if (shapeFlag !== prevShapeFlag) {
        unmountChildren(c1);
      }
      if (c1 !== c2) {
        hostSetElementText(n2.el, c2);
      }
    } else {
      if (prevShapeFlag & ShapeFlag.TEXT_CHILDREN) {
        hostSetElementText(n1.el, "");
        mountChildren(c2, container, parentComponent);
      } else {
        patchKeyedChildren(c1, c2, container, parentComponent);
      }
    }
  }

  function patchKeyedChildren(c1, c2, container, parentComponent) {
    let i = 0;
    let e1 = c1.length - 1;
    let e2 = c2.length - 1;

    function isSameNodeType(n1, n2) {
      return n1.type === n2.type && n1.key === n2.key;
    }

    // 重复在左 从左往右
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];

      if (isSameNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent);
      } else {
        break;
      }

      i++;
    }
    // 重复在右 从右往左
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];

      if (isSameNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent);
      } else {
        break;
      }

      e1--;
      e2--;
    }
    // 新的比老的多 从左到右
    if (i > e1) {
      if (i <= e2) {
        const nextPos = e2 + 1;
        // c2 中存在el为null的节点，因为没有mount。但不影响此处的判断，因为nextPos一定是在ab这个范围内
        const anchor = nextPos > c2.length - 1 ? null : c2[nextPos].el;
        while (i <= e2) {
          patch(null, c2[i], container, parentComponent, anchor);
          i++;
        }
      }
    } else if (i > e2) {
      while (i <= e1) {
        hostRemove(c1[i].el);
        i++;
      }
    } else {
    }
  }

  function unmountChildren(children) {
    for (let i = 0; i < children.length; i++) {
      const el = children[i].el;
      hostRemove(el);
    }
  }

  function patchProps(el, newProps, oldProps, container) {
    if (newProps !== oldProps) {
      for (const key in newProps) {
        const prevProp = oldProps[key];
        const nextProp = newProps[key];
        if (prevProp !== nextProp) {
          hostPatchProp(el, key, prevProp, nextProp);
        }
      }
      if (oldProps !== EMPTY_OBJ) {
        for (const key in oldProps) {
          if (!(key in newProps)) {
            hostPatchProp(el, key, oldProps[key], null);
          }
        }
      }
    }
  }

  function mountElement(vnode: any, container: any, parentComponent, anchor) {
    const el = (vnode.el = hostCreateElement(vnode.type));

    const { children, props, shapeFlag } = vnode;
    if (ShapeFlag.TEXT_CHILDREN & shapeFlag) {
      el.textContent = children;
    } else if (ShapeFlag.ARRAY_CHILDREN & shapeFlag) {
      mountChildren(vnode.children, el, parentComponent);
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
      hostPatchProp(el, key, null, val);
    }

    // container.append(el)
    hostInsert(el, container, anchor);
  }

  function mountChildren(children, el: any, parentComponent) {
    children.forEach((v) => {
      patch(null, v, el, parentComponent);
    });
  }

  function processFragment(n1, n2: any, container: any, parentComponent) {
    mountChildren(n2.children, container, parentComponent);
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
