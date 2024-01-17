import { h } from "../../lib/guide-mini-vue.esm.js";
import { renderSlots } from "../../lib/guide-mini-vue.esm.js";

export const Foo = {
  setup() {},
  render() {
    const foo = h('p', {}, 'foo')
    return h('div', {id: 'foo'}, [renderSlots(this.$slots, 'footer', { age: 18 }), foo, renderSlots(this.$slots, 'header')])
  }
}