import { effect } from "../effect"
import { isReactive } from "../reactive"
import { isRef, proxyRef, ref, unRef } from "../ref"

describe('ref', () => {
  it("happy path", () => {
    let refVal = ref()
    expect(refVal.value).toBe(undefined)
    refVal.value = 1
    expect(refVal.value).toBe(1)
  })

  it("ref should be a reactive", () => {
    let refval = ref(1)
    let calls = 0
    let dummy = 0
    effect(() => {
      calls++
      dummy = refval.value
    })
    expect(calls).toBe(1)
    expect(dummy).toBe(1)
    refval.value = 2
    expect(calls).toBe(2)
    // same value calls one time
    refval.value = 2
    expect(calls).toBe(2)
  })

  it("should be a nested reactive", () => {
    let origin = {
      bar: 1
    }
    let calls = 0
    let dummy = 0
    let object = ref(origin)

    effect(() => {
      calls ++
      dummy = object.value.bar
    })
    expect(calls).toBe(1)
    expect(isReactive(object.value)).toBe(true)
    object.value.bar ++
    expect(calls).toBe(2)
    expect(dummy).toBe(2)
    object.value = 2
    expect(calls).toBe(3)
  })
  it("isRef", () => {
    let origin = {
      foo: 1
    }
    let object = ref(origin)
    let refval = ref(1)
    expect(isRef(object)).toBe(true)
    expect(isRef(refval)).toBe(true)
    expect(isRef(1)).toBe(false)
  })
  it("unRef", () => {
    let origin = {
      foo: 1
    }
    let object = ref(origin)
    let baseVal = ref(3)
    let unRefVal = unRef(object)
    let unRefBaseVal = unRef(baseVal)
    expect(unRefVal.foo).toBe(1)
    expect(unRefBaseVal).toBe(3)
  })

  it("proxyRef", () => {
    // used in template
    // get value without .value
    // set value like normal
    // let origin = {
    //   foo: 1
    // }
    // let object = ref(origin)
    // let baseVal = ref(3)
    // let proxyObject = proxyRef(object)
    // let proxyBaseVal = proxyRef(baseVal)
    // console.log(proxyObject)
    // expect(proxyObject.foo).toBe(1)
    // proxyObject.foo = 2
    // expect(proxyObject.foo).toBe(2)
    // expect(proxyBaseVal).toBe(3)
    // object.value.foo = baseVal
    // expect(object.value.foo.value).toBe(3)
    let user = {
      age: ref(10),
      name: 'xiaoming'
    }
    let proxyUser = proxyRef(user)
    expect(user.age.value).toBe(10)
    expect(proxyUser.age).toBe(10)
    expect(proxyUser.name).toBe('xiaoming')

    proxyUser.age = 20
    expect(proxyUser.age).toBe(20)
    expect(user.age.value).toBe(20)
  })
})