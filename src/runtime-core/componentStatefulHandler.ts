export const optionsKeyMap = {
  $el: instance => instance.vnode.el
}

export const componentStatefulHandler = {
  get({_:instance}, key) {
    const { setupState } = instance
      if(key in setupState) {
        return setupState[key]
      }
      if(key in optionsKeyMap) {
        return optionsKeyMap[key](instance)
      }
  }
}