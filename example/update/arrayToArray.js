import { h, ref } from "../../lib/guide-mini-vue.esm.js";

// 左到右
const prevArray = [
  h("div", { key: "A" }, "A"),
  h("div", { key: "B" }, "B"),
  h("div", { key: "C" }, "C"),
  h("div", { key: "D" }, "D"),
];
const nextArray = [
  h("div", { key: "A" }, "A"),
  h("div", { key: "B" }, "B"),
  h("div", { key: "E" }, "E"),
];

export const arrayToArray = {
  setup() {
    const isChanged = ref(false);
    window.isChanged = isChanged;
    return {
      isChanged,
    };
  },
  render() {
    return this.isChanged
      ? h("div", {}, [nextArray])
      : h("div", {}, [prevArray]);
  },
};
