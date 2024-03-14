import { h, ref } from "../../lib/guide-mini-vue.esm.js";
export const App = {
  setup() {
    const count = ref(0);

    const changeCount = () => {
      for (let i = 0; i < 100; i++) {
        count.value++;
      }
    };
    return {
      count,
      changeCount,
    };
  },
  render() {
    return h("div", {}, [
      h(
        "button",
        {
          onClick: this.changeCount,
        },
        "click"
      ),
      h("div", {}, "change count:" + this.count),
    ]);
  },
};
