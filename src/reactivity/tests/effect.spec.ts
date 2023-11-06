import { reactive } from "../reactive"
import { effect, stop } from "../effect"


describe("effect", () => {
  it('happy path', () => {
    const object = reactive({ foo: 1 })

    let age = 0
    let dummy
    effect(() => {
      age ++
      dummy = object.foo
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

  it("scheduler", () => {
    let run:any, dummy = 0
    let dommy = reactive({ num: 1 })
    let demmy = reactive({ num: 10 })
    const scheduler = jest.fn(() => {
      run = runner
    })
    const runner = effect(() => {
      dummy = dommy.num
    },
    {
      scheduler
    })
    expect(scheduler).toHaveBeenCalledTimes(0)
    // demmy.num ++
    dommy.num ++
    expect(scheduler).toHaveBeenCalledTimes(1)
    run()
    expect(dummy).toBe(2)
  })
  it("stop", () => {
    let object = reactive({ num: 1})
    let dim = 0
    const runner = effect(() => {
      dim = object.num
    })
    object.num = object.num + 1
    stop(runner)
    expect(dim).toBe(2)
    object.num = 3
    expect(dim).toBe(2)
    runner()
    expect(dim).toBe(3)
    // Q: 为什么object.num++不行呢
    // A: 因为stop的实现是删除activeEffect.deps中的effect, 而object.num++中包含track操作，再一次收集了effect
    // Q: 如何破解？
    // A: shouldTrack
    object.num++
    expect(dim).toBe(3)
  })
  it("onStop", () => {
    let object = reactive({ num: 1})
    let dim = 0
    let onStopFn = jest.fn(() => {
      console.log("执行onStopFn")
    })
    const runner = effect(() => {
      dim = object.num
    },
    {
      onStop: onStopFn
    })
    object.num = object.num + 1
    stop(runner)
    expect(onStopFn).toBeCalledTimes(1)
  })
})