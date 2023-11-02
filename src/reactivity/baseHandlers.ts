import { extend, isObject } from "../shared"
import { track, trigger } from "./effect"
import { reactive, readonly } from "./reactive"

const get = createGetter()
const set = createSetter()
const readonlyGet = createGetter(true)
const shallowReadonlyGet = createGetter(true, true)

function createGetter(isReadonly: boolean = false, isShallowReadonly:boolean = false): (target:any, key:any) => any {
  return function (target:any, key:any) {
    const result = Reflect.get(target, key)

    if(key === "__REACTIVE__") {
      return !isReadonly
    } else if(key === "__READONLY__") {
      return isReadonly
    }

    if(isShallowReadonly) {
      return result
    }

    if(isObject(result)) {
      return isReadonly ? readonly(result) : reactive(result)
    }

    if(!isReadonly) {
      track(target, key)
    }
    return result
  }
}

function createSetter(isShallowReadonly: boolean = false) {
  return function(target:any, key:any, value:any) {
    const result = Reflect.set(target, key, value)
    trigger(target, key)
    return result
  }
}

export const mutableHandler = {
  get,
  set
}
export const readonlyHandler = {
  get: readonlyGet,
  set(target:any, key:any) {
    console.warn(`key: ${String(key)} 为 readonly`)
    return true
  }
}

export const shallowReadonlyHandller = extend({}, readonlyHandler, {
  get: shallowReadonlyGet,
})

