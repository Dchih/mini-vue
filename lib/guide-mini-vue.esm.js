const optionsKeyMap = {
    $el: instance => instance.vnode.el
};
const componentStatefulHandler = {
    get({ _: instance }, key) {
        const { setupState } = instance;
        if (key in setupState) {
            return setupState[key];
        }
        if (key in optionsKeyMap) {
            return optionsKeyMap[key](instance);
        }
    }
};

function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type
    };
    return component;
}
function setupComponent(instance) {
    // initProps
    // initSlots
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.type;
    instance.proxy = new Proxy({ _: instance }, componentStatefulHandler);
    const setup = Component.setup;
    if (setup) {
        const setupResult = setup();
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    // TODO: function
    if (typeof setupResult === 'object') {
        instance.setupState = setupResult;
    }
    finishComponentResult(instance);
}
function finishComponentResult(instance) {
    const Component = instance.type;
    if (Component.render) {
        instance.render = Component.render;
    }
}

function render(vnode, container) {
    patch(vnode, container);
}
function patch(vnode, container) {
    const { shapeFlag } = vnode;
    if (1 /* ShapeFlag.ELEMENT */ & shapeFlag) {
        processElement(vnode, container);
    }
    else if (2 /* ShapeFlag.STATEFUL_COMPONENT */ & shapeFlag) {
        processComponent(vnode, container);
    }
}
function processComponent(vnode, container) {
    mountComponent(vnode, container);
}
function mountComponent(initailVNode, container) {
    const instance = createComponentInstance(initailVNode);
    setupComponent(instance);
    setupRenderEffect(instance, initailVNode, container);
}
function processElement(vnode, container) {
    mountElement(vnode, container);
}
function mountElement(vnode, container) {
    const el = document.createElement(vnode.type);
    const { children, props, shapeFlag } = vnode;
    if (4 /* ShapeFlag.TEXT_CHILDREN */ & shapeFlag) {
        el.textContent = children;
    }
    else if (8 /* ShapeFlag.ARRAY_CHILDREN */ & shapeFlag) {
        mountChildren(children, el);
    }
    for (const key in props) {
        let val = props[key];
        const isOn = (key) => /^on[A-Z]/.test(key);
        const getEventName = (key) => key.slice(2).toLowerCase();
        if (isOn(key)) {
            el.addEventListener(getEventName(key), val);
        }
        else {
            el.setAttribute(key, val);
        }
    }
    container.append(el);
}
function mountChildren(children, el) {
    children.forEach(v => {
        patch(v, el);
    });
}
function setupRenderEffect(instance, initailVNode, container) {
    const { proxy } = instance;
    const subTree = instance.render.call(proxy);
    patch(subTree, container);
    initailVNode.el = subTree;
}

function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        shapeFlag: getShapeFlag(type),
        setupState: {}
    };
    if (typeof children === 'string') {
        vnode.shapeFlag |= 4 /* ShapeFlag.TEXT_CHILDREN */;
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlag |= 8 /* ShapeFlag.ARRAY_CHILDREN */;
    }
    return vnode;
}
function getShapeFlag(type) {
    return typeof type === 'string' ? 1 /* ShapeFlag.ELEMENT */ : 2 /* ShapeFlag.STATEFUL_COMPONENT */;
}

function createApp(rootComponent) {
    return {
        mount(rootContainer) {
            const vnode = createVNode(rootComponent);
            render(vnode, rootContainer);
        }
    };
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

export { createApp, h };
