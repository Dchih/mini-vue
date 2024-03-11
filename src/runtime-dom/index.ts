import { createRenderer } from "../runtime-core/renderer";

function createElement(type) {
  return document.createElement(type);
}

function patchProp(el, key, prevVal, nextVal) {
  const isOn = (key) => /^on[A-Z]/.test(key);
  const getEventName = (key) => key.slice(2).toLowerCase();
  if (isOn(key)) {
    el.addEventListener(getEventName(key), nextVal);
  } else {
    if (nextVal === undefined || nextVal === null) {
      el.removeAttribute(key);
    } else {
      el.setAttribute(key, nextVal);
    }
  }
}

function insert(el, container, anchor) {
  // container.append(el);
  // insertBefore 当 el = null 时， 相当于append
  container.insertBefore(el, anchor);
}

function remove(child) {
  const parent = child.parentNode;
  if (parent) {
    parent.removeChild(child);
  }
}

function setElementText(el, text) {
  el.textContent = text;
}

const renderer: any = createRenderer({
  createElement,
  patchProp,
  insert,
  remove,
  setElementText,
});

export function createApp(...args) {
  return renderer.createApp(...args);
}
