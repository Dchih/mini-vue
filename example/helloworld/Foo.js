import { h } from "../../lib/guide-mini-vue.esm.js"

export const Foo = {
  setup(props) {
    // props should be readonly
    console.log(props)
    props.name = props.name + '1'
  },
  render() {
    return h('div', {}, 'hi, ' + this.name)
  }
}