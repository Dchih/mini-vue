import { createRenderer } from "../runtime-core/renderer";

function createElement(type) {
  console.log("createElement-----------------");
  return document.createElement(type);
}

function patchProp(el, key, val) {
  console.log("patch---------------------");
  const isOn = (key) => /^on[A-Z]/.test(key);
  const getEventName = (key) => key.slice(2).toLowerCase();
  if (isOn(key)) {
    el.addEventListener(getEventName(key), val);
  } else {
    el.setAttribute(key, val);
  }
}

function insert(el, container) {
  console.log("insert---------------------");
  container.append(el);
}

const renderer: any = createRenderer({
  createElement,
  patchProp,
  insert,
});

export function createApp(...args) {
  return renderer.createApp(...args);
}
