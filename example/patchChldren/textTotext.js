import { h, ref } from "../../lib/guide-mini-vue.esm.js";

const nextChildren = "newChildren";
const prevChildren = "prevChildren";

export const textToText = {
  setup() {
    const isChanged = ref(false);
    window.isChanged = isChanged;
    return {
      isChanged,
    };
  },
  render() {
    const self = this;
    return self.isChanged
      ? h("div", {}, nextChildren)
      : h("div", {}, prevChildren);
  },
};
