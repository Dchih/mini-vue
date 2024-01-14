import { componentStatefulHandler } from "./componentStatefulHandler"

export function createComponentInstance(vnode) {
  const component =  {
    vnode,
    type: vnode.type
  }
  return component
}

export function setupComponent(instance) {
  // initProps
  // initSlots

  setupStatefulComponent(instance)
}

function setupStatefulComponent(instance) {
  const Component = instance.type

  instance.proxy = new Proxy({_:instance}, componentStatefulHandler)

  const setup = Component.setup
  if(setup) {
    const setupResult = setup()
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

