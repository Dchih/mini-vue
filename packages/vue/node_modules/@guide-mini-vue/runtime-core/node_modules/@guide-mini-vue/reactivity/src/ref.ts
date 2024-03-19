import { isTracking, trackEffects, triggerEffects } from "./effect";
import { hasChanged, isObject } from "@guide-mini-vue/shared";
import { reactive } from "./reactive";
class RefImpl {
  private _value: any;
  private dep: any;
  private raw: any;
  private __IS_REF__: boolean = true;
  constructor(value?: any) {
    this.raw = value;
    this._value = convert(value);
    this.dep = new Set();
  }
  get value() {
    trackRefImpl(this.dep);
    return this._value;
  }
  set value(newVal) {
    if (hasChanged(this.raw, newVal)) {
      this.raw = newVal;
      this._value = convert(newVal);
      triggerEffects(this.dep);
    }
  }
}

export function convert(value: any) {
  return isObject(value) ? reactive(value) : value;
}

export function trackRefImpl(dep: any) {
  if (isTracking()) {
    trackEffects(dep);
  }
}

export function ref(value?: any) {
  return new RefImpl(value);
}

export function isRef(value: any) {
  return !!value.__IS_REF__;
}

export function unRef(ref: any) {
  return isRef(ref) ? ref.value : ref;
}

export function proxyRef(target: any) {
  return new Proxy(target, {
    get(target, key) {
      return unRef(Reflect.get(target, key));
    },
    set(target, key, value) {
      if (isRef(target[key]) && !isRef(value)) {
        return (target[key].value = value);
      } else {
        return Reflect.set(target, key, value);
      }
    },
  });
}
