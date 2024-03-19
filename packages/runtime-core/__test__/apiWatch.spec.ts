import { reactive } from "@guide-mini-vue/reactivity";
import { nextTick } from "../src/scheduler";
import { watchEffect } from "../src/apiWatch";

describe("api: watchEffect", () => {
  it("should invoke after components rendered", async () => {
    const obj = reactive({ num: 0 });
    let dummy = 0;
    watchEffect(() => {
      dummy = obj.num;
    });
    expect(dummy).toBe(0);
    obj.num++;
    await nextTick();
    expect(dummy).toBe(1);
  });
  it("stopHandle", async () => {
    const obj = reactive({ num: 0 });
    let dummy = 0;
    const stop: any = watchEffect(() => {
      dummy = obj.num;
    });
    expect(dummy).toBe(0);
    obj.num++;
    await nextTick();
    expect(dummy).toBe(1);
    stop();
    obj.num++;
    expect(dummy).toBe(1);
  });
  it("cleanup", async () => {
    const obj = reactive({ num: 0 });
    let dummy = 0;
    const cleanup = vi.fn();
    const stop: any = watchEffect((onCleanup) => {
      onCleanup(cleanup);
      dummy = obj.num;
    });
    expect(dummy).toBe(0);
    obj.num++;
    await nextTick();
    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(dummy).toBe(1);

    stop();
    expect(cleanup).toHaveBeenCalledTimes(2);
  });
});
