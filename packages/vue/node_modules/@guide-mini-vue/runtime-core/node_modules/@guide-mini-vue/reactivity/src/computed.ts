import { ReactiveEffect } from "./effect";

class ComputedRefImpl {
  private _effect: any;
  private _dirty: any = true;
  private _value: any;
  constructor(getter:any) {
    this._effect = new ReactiveEffect(getter, () => {
        if(!this._dirty) {
          this._dirty = true
        }
      }
    )
  }
  get value() {
    if(this._dirty) {
      this._dirty = false
      this._value = this._effect.run()
    }
    return this._value
  }
}

export function computed(getter: Function) {
  return new ComputedRefImpl(getter)
}