import { createApp } from "../../dist/guide-mini-vue.esm.js";

import { App } from "./App.js";

let rootContainer = document.querySelector("#app");

if (rootContainer === null) {
  const app = document.createElement("div");
  app.setAttribute("id", "app");
  document.body.append(app);
  rootContainer = document.querySelector("#app");
}

createApp(App).mount(rootContainer);
