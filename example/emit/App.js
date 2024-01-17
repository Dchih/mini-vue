import { h, createTextNode, getCurrentInstance } from "../../lib/guide-mini-vue.esm.js"
import { Foo } from "./Foo.js"

export const App = {
  name: 'app',
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
    console.log('App: ', getCurrentInstance())
    return {
    }
  }
}