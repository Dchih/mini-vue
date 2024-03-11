'use strict';

const extend = Object.assign;
const isObject = (value) => {
    return typeof value === "object" && value !== null;
};
const hasChanged = (a, b) => !Object.is(a, b);
const EMPTY_OBJ = {};

const Fragment = Symbol("Fragment");
const Text = Symbol("Text");
function createVNode(type, props, children) {
    const vnode = {
        el: null,
        type,
        props,
        key: props && props.key,
        children,
        shapeFlag: getShapeFlag(type),
        setupState: {},
    };
    if (typeof children === "string") {
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
    return typeof type === "string"
        ? 1 /* ShapeFlag.ELEMENT */
        : 2 /* ShapeFlag.STATEFUL_COMPONENT */;
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

let activeEffect;
let shouldTrack = false;
class ReactiveEffect {
    constructor(fn, scheduler) {
        this.deps = [];
        this.active = false;
        this._fn = fn;
        this._scheduler = scheduler;
    }
    run() {
        if (this.active) {
            this._fn();
            return;
        }
        activeEffect = this;
        shouldTrack = true;
        const result = this._fn();
        shouldTrack = false;
        return result;
    }
    stop() {
        if (!this.active) {
            clearEffect(this);
            if (this.onStop) {
                this.onStop();
            }
            this.active = true;
        }
    }
}
function clearEffect(effect) {
    effect.deps.forEach((dep) => {
        dep.delete(effect);
    });
}
function effect(fn, options = {}) {
    const _effect = new ReactiveEffect(fn, options.scheduler);
    extend(_effect, options);
    _effect.run();
    const runner = _effect.run.bind(_effect);
    runner._effect = _effect;
    return runner;
}
const targetMap = new Map();
function track(target, key) {
    if (!isTracking())
        return;
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }
    let dep = depsMap.get(key);
    if (!dep) {
        dep = new Set();
        depsMap.set(key, dep);
    }
    trackEffects(dep);
}
function trackEffects(dep) {
    if (dep.has(activeEffect))
        return;
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
}
function isTracking() {
    return shouldTrack && activeEffect !== undefined;
}
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
        if (!isReadonly) {
            track(target, key);
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

class RefImpl {
    constructor(value) {
        this.__IS_REF__ = true;
        this.raw = value;
        this._value = convert(value);
        this.dep = new Set();
    }
    get value() {
        trackRefImpl(this.dep);
        return this._value;
    }
    set value(newVal) {
        if (hasChanged(this.raw, newVal)) {
            this.raw = newVal;
            this._value = convert(newVal);
            triggerEffects(this.dep);
        }
    }
}
function convert(value) {
    return isObject(value) ? reactive(value) : value;
}
function trackRefImpl(dep) {
    if (isTracking()) {
        trackEffects(dep);
    }
}
function ref(value) {
    return new RefImpl(value);
}
function isRef(value) {
    return !!value.__IS_REF__;
}
function unRef(ref) {
    return isRef(ref) ? ref.value : ref;
}
function proxyRef(target) {
    return new Proxy(target, {
        get(target, key) {
            return unRef(Reflect.get(target, key));
        },
        set(target, key, value) {
            if (isRef(target[key]) && !isRef(value)) {
                return target[key].value = value;
            }
            else {
                return Reflect.set(target, key, value);
            }
        }
    });
}

function createComponentInstance(vnode, parent) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        slots: {},
        provide: parent ? parent.provide : {},
        parent,
        isMounted: false, //init flag
        emit: () => { },
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
            emit: instance.emit,
        });
        setCurrentInstance(null);
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    // TODO: function
    if (typeof setupResult === "object") {
        instance.setupState = proxyRef(setupResult);
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

function provide(key, value) {
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        let { provide } = currentInstance;
        const parnetProvide = currentInstance.parent.provide;
        if (provide === parnetProvide) {
            provide = currentInstance.provide = Object.create(parnetProvide);
        }
        provide[key] = value;
    }
}
function inject(key, defaultValue) {
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        const { provide } = currentInstance.parent;
        if (provide[key]) {
            return provide[key];
        }
        else if (defaultValue) {
            if (typeof defaultValue === 'function') {
                return defaultValue();
            }
            return defaultValue;
        }
    }
}

function createAppApi(render) {
    return function createApp(rootComponent) {
        return {
            mount(rootContainer) {
                const vnode = createVNode(rootComponent);
                render(vnode, rootContainer);
            },
        };
    };
}

function createRenderer(options) {
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert, remove: hostRemove, setElementText: hostSetElementText, } = options;
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
                if (1 /* ShapeFlag.ELEMENT */ & shapeFlag) {
                    processElement(n1, n2, container, parentComponent, anchor);
                }
                else if (2 /* ShapeFlag.STATEFUL_COMPONENT */ & shapeFlag) {
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
    function processElement(n1, n2, container, parentComponent, anchor) {
        if (!n1) {
            mountElement(n2, container, parentComponent, anchor);
        }
        else {
            patchElement(n1, n2, container, parentComponent);
        }
    }
    function patchElement(n1, n2, container, parentComponent) {
        const oldProps = n1.props || EMPTY_OBJ;
        const newProps = n2.props || EMPTY_OBJ;
        const el = (n2.el = n1.el);
        patchProps(el, newProps, oldProps);
        patchChildren(n1, n2, el, parentComponent);
    }
    function patchChildren(n1, n2, container, parentComponent) {
        const prevShapeFlag = n1.shapeFlag;
        const { shapeFlag } = n2;
        const c1 = n1.children;
        const c2 = n2.children;
        if (shapeFlag & 4 /* ShapeFlag.TEXT_CHILDREN */) {
            if (shapeFlag !== prevShapeFlag) {
                unmountChildren(c1);
            }
            if (c1 !== c2) {
                hostSetElementText(n2.el, c2);
            }
        }
        else {
            if (prevShapeFlag & 4 /* ShapeFlag.TEXT_CHILDREN */) {
                hostSetElementText(n1.el, "");
                mountChildren(c2, container, parentComponent);
            }
            else {
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
            }
            else {
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
            }
            else {
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
        }
        else if (i > e2) {
            while (i <= e1) {
                hostRemove(c1[i].el);
                i++;
            }
        }
        else ;
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
    function mountElement(vnode, container, parentComponent, anchor) {
        const el = (vnode.el = hostCreateElement(vnode.type));
        const { children, props, shapeFlag } = vnode;
        if (4 /* ShapeFlag.TEXT_CHILDREN */ & shapeFlag) {
            el.textContent = children;
        }
        else if (8 /* ShapeFlag.ARRAY_CHILDREN */ & shapeFlag) {
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
    function mountChildren(children, el, parentComponent) {
        children.forEach((v) => {
            patch(null, v, el, parentComponent);
        });
    }
    function processFragment(n1, n2, container, parentComponent) {
        mountChildren(n2.children, container, parentComponent);
    }
    function processText(n1, n2, container) {
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
            }
            else {
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

function createElement(type) {
    return document.createElement(type);
}
function patchProp(el, key, prevVal, nextVal) {
    const isOn = (key) => /^on[A-Z]/.test(key);
    const getEventName = (key) => key.slice(2).toLowerCase();
    if (isOn(key)) {
        el.addEventListener(getEventName(key), nextVal);
    }
    else {
        if (nextVal === undefined || nextVal === null) {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, nextVal);
        }
    }
}
function insert(el, container, anchor) {
    // container.append(el);
    // insertBefore 当 el = null 时， 相当于append
    container.insertBefore(el, anchor);
}
function remove(child) {
    const parent = child.parentNode;
    if (parent) {
        parent.removeChild(child);
    }
}
function setElementText(el, text) {
    el.textContent = text;
}
const renderer = createRenderer({
    createElement,
    patchProp,
    insert,
    remove,
    setElementText,
});
function createApp(...args) {
    return renderer.createApp(...args);
}

exports.createApp = createApp;
exports.createRenderer = createRenderer;
exports.createTextNode = createTextNode;
exports.getCurrentInstance = getCurrentInstance;
exports.h = h;
exports.inject = inject;
exports.provide = provide;
exports.ref = ref;
exports.renderSlots = renderSlots;
