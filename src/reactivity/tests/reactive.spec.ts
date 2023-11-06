import { isProxy, isReactive, reactive } from "../reactive"
// import {  } from "../baseHandlers"
describe('reactive', () => {
  it('happy path', () => {
    const origin = { bar: 2}
    const object = reactive(origin)
    expect(origin).not.toBe(object)
    expect(object.bar).toBe(2)
    expect(isReactive(object)).toBe(true)
    expect(isReactive(origin)).toBe(false)
    expect(isProxy(object)).toBe(true)
  })
  it("nested reactive", () => {
    const origin = {
      bar: 1,
      foo: {
        a: 2
      },
      baz: [{foz: 'a'}]
    }
    const object = reactive(origin)
    expect(isReactive(origin.foo)).toBe(false)
    expect(isReactive(object.foo)).toBe(true)
    expect(isReactive(object.baz[0])).toBe(true)
  })
})