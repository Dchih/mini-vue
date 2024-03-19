import { h, ref } from "../../lib/guide-mini-vue.esm.js";

const nextChildren = "newChildren";
const prevChildren = [h("div", {}, "A"), h("div", {}, "B")];

export const textToArray = {
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
      ? h("div", {}, prevChildren)
      : h("div", {}, nextChildren);
  },
};
