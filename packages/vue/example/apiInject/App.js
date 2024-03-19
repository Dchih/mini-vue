import { h } from "../../lib/guide-mini-vue.esm.js"
import { provide, inject } from "../../lib/guide-mini-vue.esm.js"

const Provider = {
  setup() {
    provide('foo', 'Provider')
    provide('bar', 'ProviderBar')
  },
  render() {
    return h('div', {id: 'Provider'}, [h('p', {}, 'Provider'), h(ProviderTwo)])
  }
}

const ProviderTwo = {
  setup() {
    const foo = inject('foo')
    provide('foo', 'ProviderTwo')
    return {
      foo
    }
  },
  render() {
    return h('div', {id: 'ProviderTwo'}, [h('p', {}, `ProviderTwo: foo: ${this.foo}`),h(Injecter)])
  }
}

const Injecter = {
  setup() {
    const bar = inject('bar')
    const foo = inject('foo')
    const baz = inject('baz', () => 'baz' + 1)
    return {
      bar,
      foo,
      baz
    }
  },
  render() {
    return h('div', {id: 'Injector'}, [h('div', {}, `Injector: bar: ${this.bar} - foo: ${this.foo} - baz: ${this.baz}`)])
  },
}

export const App = {
  name: 'App',
  setup() {},
  render() {
    return h('div', {}, [h('p', {}, 'apiInject'), h(Provider)])
  }
}