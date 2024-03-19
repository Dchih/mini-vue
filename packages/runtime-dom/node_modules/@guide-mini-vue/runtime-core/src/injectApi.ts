import { getCurrentInstance } from "./component";

export function provide(key, value) {
  const currentInstance:any = getCurrentInstance()
  if(currentInstance) {
    let { provide } = currentInstance
    const parnetProvide = currentInstance.parent.provide
    if(provide === parnetProvide) {
      provide = currentInstance.provide = Object.create(parnetProvide)
    }
    provide[key] = value
  }
}

export function inject(key, defaultValue) {
  const currentInstance:any = getCurrentInstance()
  if(currentInstance) {
    const { provide } = currentInstance.parent
    if(provide[key]) {
      return provide[key]
    } else if(defaultValue) {
      if(typeof defaultValue === 'function') {
        return defaultValue()
      }
      return defaultValue
    }
  }
}