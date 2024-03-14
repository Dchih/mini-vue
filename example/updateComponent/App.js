import { h, ref } from "../../lib/guide-mini-vue.esm.js";
import { Child } from "./Child.js";
export const App = {
  setup() {
    const msg = ref("123");
    const count = ref(0);
    const changeMsg = () => {
      msg.value = "456";
    };

    const changeCount = () => {
      count++;
    };
    return {
      msg,
      count,
      changeCount,
      changeMsg,
    };
  },
  render() {
    return h("div", {}, [
      h("div", {}, "你好"),
      h(
        "button",
        {
          onClick: this.changeMsg,
        },
        "change child prop"
      ),
      h(Child, { msg: this.msg }),
      h(
        "button",
        {
          onClick: this.changeCount,
        },
        "change count"
      ),
      h("div", {}, "count: " + this.count),
    ]);
  },
};
