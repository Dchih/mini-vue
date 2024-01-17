import { h } from "../../lib/guide-mini-vue.esm.js"
import { Foo } from "./Foo.js"
import { createTextNode } from "../../lib/guide-mini-vue.esm.js"

export const App = {
  render() {
    const app = h('div', {}, 'app')
    const foo = h(Foo, {}, {
      header: () => h('p', {}, 'header'),
      footer: ({ age }) => [
        h('p', {}, 'footer' + age), 
        createTextNode('你好阿')
      ]
    })
    return h('div', {}, [app, foo])
  },
  setup() {
    return {
    }
  }
}