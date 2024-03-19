import { isProxy, isReadonly, readonly } from "../src/reactive";

describe("readonly", () => {
  it("happy path", () => {
    const origin = { foo: 1, bar: { a: 1 } };
    const read = readonly(origin);
    expect(origin).not.toBe(read);
    expect(read.foo).toBe(1);
    expect(isReadonly(read)).toBe(true);
    expect(isReadonly(origin)).toBe(false);
    expect(isProxy(read)).toBe(true);
  });
  it("cannot be setted", () => {
    console.warn = vi.fn();
    const object = readonly({ foo: 1 });
    object.foo = 1;
    expect(console.warn).toBeCalled();
  });
});
