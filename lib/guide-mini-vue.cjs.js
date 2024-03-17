'use strict';

function toDisplayString(args) {
    return String(args);
}

const extend = Object.assign;
const isObject = (value) => {
    return typeof value === "object" && value !== null;
};
const isString = (value) => typeof value === "string";
const hasChanged = (a, b) => !Object.is(a, b);
const EMPTY_OBJ = {};

const Fragment = Symbol("Fragment");
const Text = Symbol("Text");
function createVNode(type, props, children) {
    const vnode = {
        el: null,
        type,
        props,
        component: null,
        next: null,
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
    $el: (instance) => instance.vnode.el,
    $slots: (instance) => instance.slots,
    $props: (instance) => instance.props,
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
    },
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
    if (_compiler && !Component.render) {
        if (Component.template) {
            instance.render = _compiler(Component.template);
        }
    }
    else if (Component.render) {
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
let _compiler;
function registerFunctionCompiler(compiler) {
    _compiler = compiler;
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

let queue = [];
let isFlushPending = false;
function nextTick(fn) {
    return fn ? Promise.resolve().then(fn) : Promise.resolve();
}
function queueJobs(job) {
    if (!queue.includes(job)) {
        queue.push(job);
    }
    queueFlush();
}
function queueFlush() {
    if (isFlushPending)
        return;
    isFlushPending = true;
    nextTick(flushJobs);
}
function flushJobs() {
    isFlushPending = false;
    let job;
    while ((job = queue.shift())) {
        job && job();
    }
}

function shouldUpdateComponent(prev, next) {
    const { props: prevProps } = prev;
    const { props: nextProps } = next;
    for (let key in nextProps) {
        if (prevProps[key] !== nextProps[key]) {
            return true;
        }
    }
    return false;
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
        if (!n1) {
            mountComponent(n2, container, parentComponent);
        }
        else {
            updateComponent(n1, n2);
        }
    }
    function updateComponent(n1, n2) {
        const instance = (n2.component = n1.component);
        if (shouldUpdateComponent(n1, n2)) {
            instance.next = n2;
            instance.update();
        }
        else {
            n2.el = n1.el;
            instance.vnode = n2;
        }
    }
    function mountComponent(initailVNode, container, parentComponent) {
        const instance = (initailVNode.component = createComponentInstance(initailVNode, parentComponent));
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
        else {
            // 中间对比
            let s1 = i;
            let s2 = i;
            const keyInNewChildrenMap = new Map();
            for (let i = s2; i <= e2; i++) {
                const nextChild = c2[i];
                keyInNewChildrenMap.set(nextChild.key, i);
            }
            let patched = 0;
            let toBePatched = e2 - s2 + 1;
            const newIndexToOldIndexMap = new Array(toBePatched);
            let moved = false;
            let maxIndexCurrent = 0;
            for (let i = 0; i < toBePatched; i++)
                newIndexToOldIndexMap[i] = 0;
            for (let i = s1; i <= e1; i++) {
                if (patched >= toBePatched) {
                    hostRemove(c1[i].el);
                    continue;
                }
                const prevChild = c1[i];
                let newKeyIndex;
                if (prevChild.key !== null) {
                    newKeyIndex = keyInNewChildrenMap.get(prevChild.key);
                }
                else {
                    for (let j = s2; j <= e2; j++) {
                        if (isSameNodeType(prevChild, c2[j])) {
                            newKeyIndex = j;
                        }
                    }
                }
                if (newKeyIndex === undefined) {
                    hostRemove(prevChild.el);
                }
                else {
                    newIndexToOldIndexMap[newKeyIndex - s2] = i + 1;
                    if (newKeyIndex > maxIndexCurrent) {
                        maxIndexCurrent = newKeyIndex;
                    }
                    else {
                        moved = true;
                    }
                    patch(prevChild, c2[newKeyIndex], container, parentComponent);
                    patched++;
                }
            }
            const increasingNewIndexSequence = moved
                ? getSequence(newIndexToOldIndexMap)
                : [];
            let j = increasingNewIndexSequence.length - 1;
            for (let i = toBePatched - 1; i >= 0; i--) {
                const nextIndex = i + s2;
                const nextChild = c2[nextIndex];
                const anchor = nextIndex + 1 < c2.length ? c2[nextIndex + 1].el : null;
                if (newIndexToOldIndexMap[i] === 0) {
                    patch(null, nextChild, container, parentComponent, anchor);
                }
                else if (moved) {
                    if (i !== increasingNewIndexSequence[j]) {
                        hostInsert(nextChild.el, container, anchor);
                    }
                    else {
                        j++;
                    }
                }
            }
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
        instance.update = effect(() => {
            if (!instance.isMounted) {
                const { proxy } = instance;
                const subTree = (instance.subTree = instance.render.call(proxy, proxy));
                patch(null, subTree, container, instance);
                initailVNode.el = subTree.el;
                instance.isMounted = true;
            }
            else {
                const { next, vnode } = instance;
                if (next) {
                    next.el = vnode.el;
                    updateComponentBeforeRender(instance, next);
                }
                const { proxy } = instance;
                const subTree = instance.render.call(proxy, proxy);
                const prevSubTree = instance.subTree;
                instance.subTree = subTree;
                patch(prevSubTree, subTree, container, instance);
            }
        }, {
            scheduler() {
                queueJobs(instance.update);
            },
        });
    }
    return {
        createApp: createAppApi(render),
    };
}
function updateComponentBeforeRender(instance, nextVNode) {
    instance.vnode = nextVNode;
    instance.next = null;
    instance.props = nextVNode.props;
}
function getSequence(arr) {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
            j = result[result.length - 1];
            if (arr[j] < arrI) {
                p[i] = j;
                result.push(i);
                continue;
            }
            u = 0;
            v = result.length - 1;
            while (u < v) {
                c = (u + v) >> 1;
                if (arr[result[c]] < arrI) {
                    u = c + 1;
                }
                else {
                    v = c;
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1];
                }
                result[u] = i;
            }
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    return result;
}

var runtimeCore = /*#__PURE__*/Object.freeze({
    __proto__: null,
    createElementBlock: createVNode,
    createRenderer: createRenderer,
    createTextNode: createTextNode,
    getCurrentInstance: getCurrentInstance,
    h: h,
    inject: inject,
    provide: provide,
    registerFunctionCompiler: registerFunctionCompiler,
    renderSlots: renderSlots,
    toDisplayString: toDisplayString
});

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

const TO_DISPLAY_STRING = Symbol("toDisplayString");
const CREATE_ELEMENT_BLOCK = Symbol("createElementBlock");
const helperNameMap = {
    [TO_DISPLAY_STRING]: "toDisplayString",
    [CREATE_ELEMENT_BLOCK]: "createElementBlock",
};

function generate(ast) {
    const context = createCodegenContext();
    const { push } = context;
    generateFunctionPreamble(ast, context);
    const functionName = "render";
    const args = ["_ctx", "_cache"];
    const signature = args.join(", ");
    push(`return function ${functionName}(${signature}) {`);
    push(`return `);
    genNode(ast.codegen, context);
    push(`}`);
    return {
        code: context.code,
    };
    function generateFunctionPreamble(ast, context) {
        const { push, helper } = context;
        const VueBinging = "Vue";
        const aliasHelper = (s) => `${helper(s)}:_${helper(s)}`;
        if (ast.helpers.length > 0) {
            push(`const { ${ast.helpers.map(aliasHelper).join(", ")} } = ${VueBinging}`);
        }
        push("\n");
    }
}
function genNode(node, context) {
    switch (node.type) {
        case 3 /* NodeTypes.TEXT */:
            genText(node, context);
            break;
        case 0 /* NodeTypes.INTERPOLATION */:
            genInterpolation(node, context);
            break;
        case 1 /* NodeTypes.SIMPLE_EXPRESSION */:
            genExpression(node, context);
            break;
        case 2 /* NodeTypes.ELEMENT */:
            genElement(node, context);
            break;
        case 5 /* NodeTypes.COMPOUND_EXPRESSION */:
            genCompoundExpression(node, context);
            break;
    }
}
function createCodegenContext() {
    const context = {
        code: "",
        push(source) {
            context.code += source;
        },
        helper(key) {
            return helperNameMap[key];
        },
    };
    return context;
}
function genText(node, context) {
    const { push } = context;
    push(`'${node.content}'`);
}
function genInterpolation(node, context) {
    const { push, helper } = context;
    push(`_${helper(TO_DISPLAY_STRING)}(`);
    genNode(node.content, context);
    push(`)`);
}
function genExpression(node, context) {
    const { push } = context;
    push(`${node.content}`);
}
function genElement(node, context) {
    const { push, helper } = context;
    const { tag, children, props } = node;
    push(`_${helper(CREATE_ELEMENT_BLOCK)}(`);
    // push(`${tag}, null, `);
    const nodeList = transformNullVar([tag, props, children]);
    genNodeList(nodeList, context);
    push(`)`);
}
function genCompoundExpression(node, context) {
    const { push } = context;
    const { children } = node;
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (isString(child)) {
            push(child);
        }
        else {
            genNode(child, context);
        }
    }
}
function genNodeList(list, context) {
    const { push } = context;
    for (let i = 0; i < list.length; i++) {
        const listItem = list[i];
        if (isString(listItem)) {
            push(listItem);
        }
        else {
            genNode(listItem, context);
        }
        if (i < list.length - 1)
            push(", ");
    }
}
function transformNullVar(properties) {
    return properties.map((p) => (p ? p : `null`));
}

const openDelimiter = "{{";
const closeDelimiter = "}}";
function baseParser(content) {
    const context = createParserContext(content);
    return createRoot(parseChildren(context, []));
}
function createParserContext(content) {
    return {
        source: content,
    };
}
function createRoot(children) {
    return {
        children,
        type: 4 /* NodeTypes.ROOT */,
    };
}
function parseChildren(context, ancestors) {
    const nodes = [];
    while (!isEnd(context, ancestors)) {
        let node;
        const s = context.source;
        if (context.source.startsWith("{{")) {
            node = parseInterpolation(context);
        }
        else if (s.startsWith("<")) {
            if (/[a-z]/i.test(s[1])) {
                node = parseElement(context, ancestors);
            }
        }
        if (!node) {
            node = parseText(context);
        }
        nodes.push(node);
    }
    return nodes;
}
function parseText(context) {
    let endIndex = context.source.length;
    // const delimiterIndex = context.source.indexOf(openDelimiter);
    // const closeDelimiterIndex = context.source.indexOf(`</${parentTag}>`);
    // if (delimiterIndex !== -1) {
    //   endIndex = delimiterIndex;
    // }
    // if (closeDelimiterIndex !== -1 && closeDelimiterIndex < delimiterIndex) {
    //   endIndex = closeDelimiterIndex;
    // }
    const endTokens = ["<", "{{"];
    for (let i = 0; i < endTokens.length; i++) {
        const index = context.source.indexOf(endTokens[i]);
        if (index !== -1 && endIndex > index) {
            endIndex = index;
        }
    }
    const content = parseTextData(context, endIndex);
    advancedBy(context, endIndex);
    return {
        type: 3 /* NodeTypes.TEXT */,
        content: content,
    };
}
function parseElement(context, ancestors) {
    const element = parseTag(context, 0 /* TagType.START */);
    context.source;
    ancestors.push(element);
    // if (!/^<\//.test(s))
    element.children = parseChildren(context, ancestors);
    ancestors.pop();
    const tagTobeHandled = startsWithEndTagOpen(context, element.tag);
    if (element.tag === tagTobeHandled) {
        parseTag(context, 1 /* TagType.END */);
    }
    else {
        throw new Error(`${element.tag} 标签没有匹配的结束标签`);
    }
    return element;
}
function startsWithEndTagOpen(context, tag) {
    return context.source.slice(2, 2 + tag.length);
}
function parseTag(context, tagType) {
    const elementStartFlag = /^<\/?([a-z]*)/i;
    const matched = elementStartFlag.exec(context.source);
    const tag = matched[1];
    advancedBy(context, matched[0].length);
    advancedBy(context, 1);
    if (tagType === 1 /* TagType.END */)
        return;
    return {
        type: 2 /* NodeTypes.ELEMENT */,
        tag: tag,
    };
}
function parseInterpolation(context) {
    const closeIndex = context.source.indexOf(closeDelimiter);
    advancedBy(context, openDelimiter.length);
    const rawIndexLength = closeIndex - openDelimiter.length;
    const rawContent = parseTextData(context, rawIndexLength);
    const content = rawContent.trim();
    advancedBy(context, closeIndex);
    return {
        type: 0 /* NodeTypes.INTERPOLATION */,
        content: {
            type: 1 /* NodeTypes.SIMPLE_EXPRESSION */,
            content: content,
        },
    };
}
function advancedBy(context, length) {
    context.source = context.source.slice(length);
}
function parseTextData(context, length) {
    return context.source.slice(0, length);
}
function isEnd(context, ancestors) {
    // </
    // source 为空
    const s = context.source;
    if (s.startsWith("</")) {
        for (let i = 0; i < ancestors.length; i++) {
            const ancestorTag = ancestors[i].tag;
            const tag = startsWithEndTagOpen(context, ancestorTag);
            if (tag === ancestorTag)
                return true;
        }
    }
    // if (parentTag && s.startsWith(`</${parentTag}>`)) {
    //   return true;
    // }
    return !s;
}

function transform(root, options = {}) {
    const context = createTransformContext(root, options);
    traverseNode(root, context);
    createRootCodegen(root);
    root.helpers = context.helpers;
}
function createRootCodegen(ast) {
    const child = ast.children[0];
    if (child.type === 2 /* NodeTypes.ELEMENT */) {
        ast.codegen = child.codegen;
    }
    else {
        ast.codegen = ast.children[0];
    }
}
function traverseNode(node, context) {
    const { nodeTransforms } = context;
    const onExits = [];
    for (let i = 0; i < nodeTransforms.length; i++) {
        const transform = nodeTransforms[i];
        const exitFn = transform(node, context);
        if (exitFn)
            onExits.push(exitFn);
    }
    switch (node.type) {
        case 0 /* NodeTypes.INTERPOLATION */:
            context.pushHelper(TO_DISPLAY_STRING);
            break;
        case 4 /* NodeTypes.ROOT */:
        case 2 /* NodeTypes.ELEMENT */:
            traverseChildren(context, node);
            break;
    }
    let i = onExits.length;
    while (i--) {
        onExits[i]();
    }
}
function traverseChildren(context, node) {
    const children = node.children;
    for (let i = 0; i < children.length; i++) {
        const childNode = children[i];
        traverseNode(childNode, context);
    }
}
function createTransformContext(root, options) {
    const context = {
        root,
        nodeTransforms: options.nodeTransforms || [],
        helpers: [],
        pushHelper(helper) {
            context.helpers.push(helper);
        },
    };
    return context;
}

function transformElement(node, context) {
    const { pushHelper } = context;
    if (node.type === 2 /* NodeTypes.ELEMENT */) {
        return () => {
            pushHelper(CREATE_ELEMENT_BLOCK);
            const vnodeTag = `'${node.tag}'`;
            let vnodeProps;
            const vnodeChildren = node.children[0];
            const vnodeElement = {
                type: 2 /* NodeTypes.ELEMENT */,
                tag: vnodeTag,
                props: vnodeProps,
                children: vnodeChildren,
            };
            node.codegen = vnodeElement;
        };
    }
}

function transformExpression(node) {
    if (node.type === 0 /* NodeTypes.INTERPOLATION */) {
        node.content = processExpression(node.content);
    }
}
function processExpression(node) {
    node.content = "_ctx." + node.content;
    return node;
}

function isText(node) {
    return node.type === 3 /* NodeTypes.TEXT */ || node.type === 0 /* NodeTypes.INTERPOLATION */;
}
// 处理 ELEMENT, 将其子节点转换为一个夹带 " + " 的数组
// 故 INTERPOLATION 被覆盖在此节点中
function transformText(node, context) {
    if (node.type === 2 /* NodeTypes.ELEMENT */) {
        return () => {
            const children = node.children;
            let currentContainer;
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                if (isText(child)) {
                    for (let j = i + 1; j < children.length; j++) {
                        const nextChild = children[j];
                        if (isText(nextChild)) {
                            if (!currentContainer) {
                                currentContainer = children[i] = {
                                    type: 5 /* NodeTypes.COMPOUND_EXPRESSION */,
                                    children: [child],
                                };
                            }
                            currentContainer.children.push(" + ");
                            currentContainer.children.push(nextChild);
                            children.splice(j, 1);
                            j--;
                        }
                        else {
                            currentContainer = undefined;
                            break;
                        }
                    }
                }
            }
        };
    }
}

function baseCompiler(template) {
    const ast = baseParser(template);
    transform(ast, {
        nodeTransforms: [transformExpression, transformElement, transformText],
    });
    const { code } = generate(ast);
    return code;
}

function compileToFunction(template) {
    const code = baseCompiler(template);
    const render = new Function("Vue", code)(runtimeCore);
    return render;
}
registerFunctionCompiler(compileToFunction);

exports.compileToFunction = compileToFunction;
exports.createApp = createApp;
exports.createElementBlock = createVNode;
exports.createRenderer = createRenderer;
exports.createTextNode = createTextNode;
exports.getCurrentInstance = getCurrentInstance;
exports.h = h;
exports.inject = inject;
exports.provide = provide;
exports.ref = ref;
exports.registerFunctionCompiler = registerFunctionCompiler;
exports.renderSlots = renderSlots;
exports.toDisplayString = toDisplayString;
