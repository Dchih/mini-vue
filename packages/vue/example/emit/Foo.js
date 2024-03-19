import { h, getCurrentInstance, renderSlots } from "../../lib/guide-mini-vue.esm.js";
export const Foo = {
  name: 'foo',
  setup() {
    console.log('Foo:', getCurrentInstance())
  },
  render() {
    const foo = h('p', {}, 'foo')
    return h('div', {id: 'foo'}, [renderSlots(this.$slots, 'footer', { age: 18 }), foo, renderSlots(this.$slots, 'header')])
  }
}