import { h, ref } from "../../lib/guide-mini-vue.esm.js";
import { arrayToText } from "./arrayToText.js";
import { textToArray } from "./textToArray.js";
import { arrayToArray } from "./arrayToArray.js";
export const App = {
  setup() {},
  render() {
    return h("div", { id: "root" }, [
      h("div", {}, "主页"),
      // h(arrayToText),
      h(arrayToArray),
      // h(textToText)
      // h(textToArray),
    ]);
  },
};
