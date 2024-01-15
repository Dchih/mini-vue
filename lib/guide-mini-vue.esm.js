const optionsKeyMap = {
    $el: instance => instance.vnode.el
};
const componentStatefulHandler = {
    get({ _: instance }, key) {
        const { setupState, props } = instance;
        const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key);
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
        if (key in optionsKeyMap) {
            return optionsKeyMap[key](instance);
        }
    }
};

function initProps(instance, rawProps) {
    instance.props = rawProps || {};
}

const extend = Object.assign;
const isObject = (value) => {
    return typeof value === 'object' && value !== null;
};

const targetMap = new Map();
function trigger(target, key) {
    const deps = targetMap.get(target);
    const dep = deps.get(key);
    triggerEffects(dep);
}
function triggerEffects(dep) {
    for (const effect of dep) {
        if (effect._scheduler) {
            effect._scheduler();
        }
        else {
            effect.run();
        }
    }
}

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
function createGetter(isReadonly = false, isShallowReadonly = false) {
    return function (target, key) {
        const result = Reflect.get(target, key);
        if (key === "__REACTIVE__") {
            return !isReadonly;
        }
        else if (key === "__READONLY__") {
            return isReadonly;
        }
        if (isShallowReadonly) {
            return result;
        }
        if (isObject(result)) {
            return isReadonly ? readonly(result) : reactive(result);
        }
        return result;
    };
}
function createSetter(isShallowReadonly = false) {
    return function (target, key, value) {
        const result = Reflect.set(target, key, value);
        trigger(target, key);
        return result;
    };
}
const mutableHandler = {
    get,
    set
};
const readonlyHandler = {
    get: readonlyGet,
    set(target, key) {
        console.warn(`key: ${String(key)} 为 readonly`);
        return true;
    }
};
const shallowReadonlyHandller = extend({}, readonlyHandler, {
    get: shallowReadonlyGet,
});

function reactive(target) {
    return createActiveObject(target, mutableHandler);
}
function readonly(target) {
    return createActiveObject(target, readonlyHandler);
}
function shallowReadonly(target) {
    return createActiveObject(target, shallowReadonlyHandller);
}
function createActiveObject(target, baseHandler) {
    // if(!isObject(target)) {
    //   console.warn(`target: ${target} must be an object`)
    //   return
    // }
    return new Proxy(target, baseHandler);
}

function emit(instance, event) {
    console.log('emit ', event);
    const { props } = instance;
    const camelize = (str) => {
        return str.replace(/-(\w)/g, (_, c) => {
            return c.toLocaleUpperCase();
        });
    };
    const capitalize = (str) => {
        return str.charAt(0).toLocaleUpperCase() + str.slice(1);
    };
    const toHandlerKey = (str) => {
        return str ? 'on' + capitalize(str) : '';
    };
    const handler = props[toHandlerKey(camelize(event))];
    handler && handler();
}

function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        emit: () => { }
    };
    component.emit = emit.bind(null, component);
    return component;
}
function setupComponent(instance) {
    initProps(instance, instance.vnode.props);
    // initSlots
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.type;
    instance.proxy = new Proxy({ _: instance }, componentStatefulHandler);
    const setup = Component.setup;
    if (setup) {
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit
        });
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
