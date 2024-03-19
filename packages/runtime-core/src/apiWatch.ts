import { ReactiveEffect } from "../../reactivity/src/effect";
import { queuePreFlush } from "./scheduler";

export function watchEffect(source) {
  function job() {
    effect.run();
  }

  let cleanup;

  function onCleanup(cleanupFn) {
    cleanup = cleanupFn;
    effect.onStop = () => {
      cleanup();
    };
  }
  function getter() {
    if (cleanup) {
      cleanup();
    }
    source(onCleanup);
  }

  const effect: any = new ReactiveEffect(getter, () => {
    queuePreFlush(job);
  });

  effect.run();
  return () => effect.stop();
}
