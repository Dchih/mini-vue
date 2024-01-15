// 组件的render

import { h } from "../../lib/guide-mini-vue.esm.js"
import { Foo } from "./Foo.js"

window.self = null
export const App = {
  render() {
    window.self = this
    return h('div', {
        id: 'root',
        onClick: (e) => {
          console.log(e.target)
        }
      },
      // 'hi, ' + this.msg,
      // [h('p', { class: 'red' }, 'hi'), h('p', { class: 'blue' }, 'mini-vue')]
      // 此处留坑
      [h('div', {id: 'upFoo'}, [h(Foo, {name: 'John'}, [h('p', {}, 'hello'), h('span', {}, 'u too')])])]
    )
  },
  setup() {
    return {
      msg: 'mini-vue'
    }
  }
}