import { App } from "./App.js";
import { createApp } from "../../lib/guide-mini-vue.esm.js";

let root = document.querySelector("#app");
if (root === null) {
  const app = document.createElement("div");
  app.setAttribute("id", "app");
  document.body.append(app);
  root = document.querySelector("#app");
}
createApp(App).mount(root);
