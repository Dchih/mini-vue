import { track, trigger } from "./effect"

export function reactive(target: any) {
  return new Proxy(target, {
    get(target, key) {
      const result = Reflect.get(target, key)

      track(target, key)
      return result
    },
    set(target, key, value) {
      const result = Reflect.set(target, key, value)
      
      trigger(target, key)
      return result
    }
  })
}