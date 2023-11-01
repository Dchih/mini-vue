import { reactive } from "../reactive"

describe('reactive', () => {
  it('happy path', () => {
    const object = reactive({ bar: 2})
    expect(object.bar).toBe(2)
  })
})