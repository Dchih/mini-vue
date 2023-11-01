import { reactive } from "../reactive"
import { effect } from "../effect"


describe("effect", () => {
  it('happy path', () => {
    const object = reactive({ foo: 1 })

    let age = 0
    effect(() => {
      age ++
    })

    expect(age).toBe(1)

    object.foo++
    expect(age).toBe(2)
  })

  it("runner", () => {
    let age = 10
    const runner = effect(() => {
      age ++
      return 'foo'
    })
    expect(age).toBe(11)
    const r = runner()
    expect(age).toBe(12)
    expect(r).toBe('foo')
  })
})