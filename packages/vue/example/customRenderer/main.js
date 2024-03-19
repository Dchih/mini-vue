import { createRenderer } from "../../lib/guide-mini-vue.esm.js";
import { App } from "./App.js";
const game = new PIXI.Application({
  width: 500,
  height: 500,
});

document.body.append(game.view);

function createElement(type) {
  if (type === "rect") {
    const rect = new PIXI.Graphics();
    rect.beginFill(0xff0000);
    rect.drawRect(0, 0, 100, 100);
    rect.endFill();
    return rect;
  }
}

function patchProp(el, key, val) {
  el[key] = val;
}

function insert(el, parent) {
  parent.addChild(el);
}

const renderer = createRenderer({
  createElement,
  patchProp,
  insert,
});
renderer.createApp(App).mount(game.stage);
