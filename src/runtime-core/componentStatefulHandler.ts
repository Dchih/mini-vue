export const optionsKeyMap = {
  $el: instance => instance.vnode.el
}

export const componentStatefulHandler = {
  get({_:instance}, key) {
    const { setupState, props } = instance
    const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key)
    if(hasOwn(setupState, key)) {
      return setupState[key]
    } else if(hasOwn(props, key)) {
      return props[key]
    }
    if(key in optionsKeyMap) {
      return optionsKeyMap[key](instance)
    }
  }
}