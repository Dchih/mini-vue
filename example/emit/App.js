import { h } from "../../lib/guide-mini-vue.esm.js"
import { Foo } from "./Foo.js"

export const App = {
  render() {
    return h('div', {
        id: 'root',
      },
      [h(Foo, {
        onAdd: () => {
          console.log('onAdd')
        },
        onAddFoo: () => {
          console.log('onAddFoo')
        }
      })]
    )
  },
  setup() {
    return {
    }
  }
}