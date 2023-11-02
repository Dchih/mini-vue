import { extend } from "../shared"
let activeEffect:any
let shouldTrack:boolean = true
class ReactiveEffect {
  private _fn: any
  public _scheduler:any
  public deps:any = []
  private active:any = false
  private onStop?: () => void
  constructor(fn:any, scheduler:any) {
    this._fn = fn
    this._scheduler = scheduler
  }
  run() {
    if(this.active) {
      this._fn()
      return
    }
    activeEffect = this
    shouldTrack = false
    const result = this._fn()
    shouldTrack = true
    return result
  }
  stop() {
    if(!this.active) {
      clearEffect(this)
      if(this.onStop) {
        this.onStop()
      }
      this.active = true
    }
  }
}

function clearEffect(effect:any) {
  effect.deps.forEach((dep:any) => {
    dep.delete(effect)
  });
}

export function effect(fn:any, options:any={}) {
  const _effect = new ReactiveEffect(fn, options.scheduler)
  extend(_effect, options)
  _effect.run()
  const runner:any = _effect.run.bind(_effect)
  runner._effect = _effect
  return runner
}

export function stop(runner: any) {
  runner._effect.stop()
}

const targetMap = new Map()
export function track(target:any, key:any) {
  if(!isTracking()) return 
  let depsMap = targetMap.get(target)
  if(!depsMap) {
    depsMap = new Map()
    targetMap.set(target, depsMap)
  }
  let dep = depsMap.get(key)
  if(!dep) {
    dep = new Set()
    depsMap.set(key, dep)
  }
  if(dep.has(activeEffect)) return
  dep.add(activeEffect)
  activeEffect.deps.push(dep)
}

function isTracking() {
  return shouldTrack && activeEffect !== undefined
}

export function trigger(target:any, key:any) {
  const deps = targetMap.get(target)
  const dep = deps.get(key)
  for(const effect of dep) {
    if(effect._scheduler) {
      effect._scheduler()
    } else {
      effect.run()
    }
  }
}