import { componentStatefulHandler } from "./componentStatefulHandler"
import { initProps } from "./componentProps"
import { shallowReadonly } from "../reactivity/reactive"
import { emit } from "./componentEmit"
import { initSlots } from "./componentSlots"

export function createComponentInstance(vnode, parent) {
  const component =  {
    vnode,
    type: vnode.type,
    setupState: {},
    props: {},
    slots: {},
    provide: parent ? parent.provide : {},
    parent,
    emit: () => {}
  }
  component.emit = emit.bind(null, component) as any
  return component
}

export function setupComponent(instance) {
  initProps(instance, instance.vnode.props)
  initSlots(instance, instance.vnode.children)

  setupStatefulComponent(instance)
}

function setupStatefulComponent(instance) {
  const Component = instance.type

  instance.proxy = new Proxy({_:instance}, componentStatefulHandler)

  const setup = Component.setup
  if(setup) {
    setCurrentInstance(instance)
    const setupResult = setup(shallowReadonly(instance.props), {
      emit: instance.emit
    })
    setCurrentInstance(null)
    handleSetupResult(instance, setupResult)
  }
}

function handleSetupResult(instance, setupResult: any) {
  // TODO: function
  if(typeof setupResult === 'object') {
    instance.setupState = setupResult
  }
  finishComponentResult(instance) 
}

function finishComponentResult(instance: any) {
  const Component = instance.type

  if(Component.render) {
    instance.render = Component.render
  }
}

let currentInstance = null
export function getCurrentInstance() {
  return currentInstance
}

function setCurrentInstance(instance) {
  currentInstance = instance
}

