import { computed } from "../src/computed";
import { reactive } from "../src/reactive";

describe("computed", () => {
  it("happy path", () => {
    const rec = reactive({
      foo: 1,
    });
    const fn = vi.fn(() => {
      return rec.foo;
    });
    let comp = computed(fn);
    expect(fn).not.toBeCalled();
    expect(comp.value).toBe(1);
    expect(fn).toBeCalledTimes(1);

    // should not computed again
    comp.value;
    expect(fn).toBeCalledTimes(1);
    // lazy
    rec.foo = 1;
    expect(fn).toBeCalledTimes(1);
    rec.foo = 2;
    expect(fn).toBeCalledTimes(1);
    expect(comp.value).toBe(2);
    expect(fn).toBeCalledTimes(2);
  });
});
