import { h, ref } from "../../lib/guide-mini-vue.esm.js";
export const App = {
  setup() {
    const count = ref(0);
    const props = ref({
      foo: "foo",
      bar: "bar",
    });
    const onClick = () => {
      count.value++;
    };
    const onChangePropsDemo1 = () => {
      console.log("修改为new-foo");
      props.value.foo = "new-foo";
    };

    const onChangePropsDemo2 = () => {
      console.log("删除undefined");
      props.value.foo = undefined;
    };

    const onChangePropsDemo3 = () => {
      console.log("删除bar");
      props.value = {
        foo: "foo",
      };
    };

    return {
      onChangePropsDemo1,
      onChangePropsDemo2,
      onChangePropsDemo3,
      count,
      onClick,
      props,
    };
  },
  render() {
    return h("div", { id: "root", ...this.props }, [
      h("div", {}, "count:" + this.count),
      h(
        "button",
        {
          onClick: this.onClick,
        },
        "click"
      ),
      h(
        "button",
        {
          onClick: this.onChangePropsDemo1,
        },
        "onChangePropsDemo1-修改"
      ),
      h(
        "button",
        {
          onClick: this.onChangePropsDemo2,
        },
        "onChangePropsDemo2-删除"
      ),
      h(
        "button",
        {
          onClick: this.onChangePropsDemo3,
        },
        "onChangePropsDemo3-bar不在新props中-删除"
      ),
    ]);
  },
};
