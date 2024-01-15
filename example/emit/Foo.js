import { h } from "../../lib/guide-mini-vue.esm.js";

export const Foo = {
  setup(props, { emit }) {
    function clickButton() {
      emit('add')
      emit('add-foo')
    }
    return {
      clickButton
    }
  },
  render() {
    return h('button', {
      onClick: this.clickButton
    }, 'emitButton')
  }
}