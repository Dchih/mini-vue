import { componentStatefulHandler } from "./componentStatefulHandler"
import { initProps } from "./componentProps"
import { shallowReadonly } from "../reactivity/reactive"

export function createComponentInstance(vnode) {
  const component =  {
    vnode,
    type: vnode.type,
    setupState: {},
    props: {}
  }
  return component
}

export function setupComponent(instance) {
  initProps(instance, instance.vnode.props)
  // initSlots

  setupStatefulComponent(instance)
}

function setupStatefulComponent(instance) {
  const Component = instance.type

  instance.proxy = new Proxy({_:instance}, componentStatefulHandler)

  const setup = Component.setup
  if(setup) {
    const setupResult = setup(shallowReadonly(instance.props))
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

