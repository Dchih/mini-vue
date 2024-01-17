const optionsKeyMap = {
    $el: instance => instance.vnode.el,
    $slots: instance => instance.slots
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

function initSlots(instance, children) {
    const { vnode } = instance;
    // 检测是否需要处理slot
    if (16 /* ShapeFlag.SLOT_CHILDREN */ & vnode.shapeFlag) {
        normilizeObjectSlots(children, instance.slots);
    }
}
function normilizeObjectSlots(children, slots) {
    for (const key in children) {
        const value = children[key];
        slots[key] = (props) => normilizeSlotArray(value(props));
    }
}
function normilizeSlotArray(slots) {
    return Array.isArray(slots) ? slots : [slots];
}

function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        slots: {},
        emit: () => { }
    };
    component.emit = emit.bind(null, component);
    return component;
}
function setupComponent(instance) {
    initProps(instance, instance.vnode.props);
    initSlots(instance, instance.vnode.children);
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.type;
    instance.proxy = new Proxy({ _: instance }, componentStatefulHandler);
    const setup = Component.setup;
    if (setup) {
        setCurrentInstance(instance);
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit
        });
        setCurrentInstance(null);
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
let currentInstance = null;
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(instance) {
    currentInstance = instance;
}

const Fragment = Symbol('Fragment');
const Text = Symbol('Text');
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
    if (vnode.shapeFlag & 2 /* ShapeFlag.STATEFUL_COMPONENT */) {
        if (isObject(children)) {
            vnode.shapeFlag |= 16 /* ShapeFlag.SLOT_CHILDREN */;
        }
    }
    return vnode;
}
function createTextNode(text) {
    return createVNode(Text, {}, text);
}
function getShapeFlag(type) {
    return typeof type === 'string' ? 1 /* ShapeFlag.ELEMENT */ : 2 /* ShapeFlag.STATEFUL_COMPONENT */;
}

function render(vnode, container) {
    patch(vnode, container);
}
function patch(vnode, container) {
    const { shapeFlag, type } = vnode;
    switch (type) {
        case Fragment:
            processFragment(vnode, container);
            break;
        case Text:
            processText(vnode, container);
            break;
        default:
            if (1 /* ShapeFlag.ELEMENT */ & shapeFlag) {
                processElement(vnode, container);
            }
            else if (2 /* ShapeFlag.STATEFUL_COMPONENT */ & shapeFlag) {
                processComponent(vnode, container);
            }
            break;
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
        mountChildren(vnode, el);
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
function mountChildren(vnode, el) {
    vnode.children.forEach(v => {
        patch(v, el);
    });
}
function setupRenderEffect(instance, initailVNode, container) {
    const { proxy } = instance;
    const subTree = instance.render.call(proxy);
    patch(subTree, container);
    initailVNode.el = subTree.el;
}
function processFragment(vnode, container) {
    mountChildren(vnode, container);
}
function processText(vnode, container) {
    const { children } = vnode;
    const textNode = (vnode.el = document.createTextNode(children));
    container.append(textNode);
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

function renderSlots(slots, name, props) {
    const slot = slots[name];
    if (slot) {
        if (typeof slot === 'function') {
            return createVNode(Fragment, {}, slot(props));
        }
    }
}

export { createApp, createTextNode, getCurrentInstance, h, renderSlots };
