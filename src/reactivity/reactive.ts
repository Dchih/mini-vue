import { mutableHandler, readonlyHandler, shallowReadonlyHandller } from "./baseHandlers"

const enum ReactiveFlag {
  IS_REACTIVE = '__REACTIVE__',
  IS_READONLY = '__READONLY__'
}

export function reactive(target: any) {
  return createActiveObject(target, mutableHandler)
}

export function readonly(target:any) {
  return createActiveObject(target, readonlyHandler)
}

export function shallowReadonly(target:any) {
  return createActiveObject(target, shallowReadonlyHandller)
}

export function isReactive(value:any) {
  return !!value[ReactiveFlag.IS_REACTIVE]
}

export function isReadonly(value:any) {
  return !!value[ReactiveFlag.IS_READONLY]
}

export function createActiveObject(target:any, baseHandler:any) {
  return new Proxy(target, baseHandler)
}