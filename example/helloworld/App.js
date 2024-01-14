// 组件的render

import { h } from "../../lib/guide-mini-vue.esm.js"

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
      'hi, ' + this.msg,
      [h('p', { class: 'red' }, 'hi'), h('p', { class: 'blue' }, 'mini-vue')]
    )
  },
  setup() {
    return {
      msg: 'mini-vue'
    }
  }
}