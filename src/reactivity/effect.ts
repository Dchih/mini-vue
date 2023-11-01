class ReactiveEffect {
  private _fn: any
  constructor(fn:any) {
    this._fn = fn
  }
  run() {
    activeEffect = this
    const result = this._fn()
  console.log(result)
    return result
  }
}

export function effect(fn:any) {
  const _effect = new ReactiveEffect(fn)
  _effect.run()
  return _effect.run.bind(_effect)
}

const targetMap = new Map()
let activeEffect:any = null
export function track(target:any, key:any) {
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

  dep.add(activeEffect)
}

export function trigger(target:any, key:any) {
  const deps = targetMap.get(target)
  const dep = deps.get(key)
  for(const effect of dep) {
    effect.run()
  }
}