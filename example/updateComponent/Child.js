import { h, ref } from "../../lib/guide-mini-vue.esm.js";

export const Child = {
  setup(props, { emit }) {
    return {};
  },
  render(proxy) {
    return h("div", {}, "children component msg: " + this.$props.msg);
  },
};
