import { isReadonly, shallowReadonly } from "../src/reactive";

describe("shallowReadonly", () => {
  it("happy path", () => {
    console.warn = vi.fn();
    let origin = {
      foo: 1,
      bar: {
        baz: 2,
      },
    };
    let object = shallowReadonly(origin);
    expect(isReadonly(object)).toBe(true);
    expect(isReadonly(object.bar)).toBe(false);
    object.foo++;
    expect(console.warn).toBeCalled();
    expect(console.warn).toBeCalledTimes(1);
    object.bar.baz++;
    expect(object.bar.baz).toBe(3);
    expect(console.warn).toBeCalledTimes(1);
    object.bar = {};
    expect(console.warn).toBeCalledTimes(2);
  });
});
