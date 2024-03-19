export function emit(instance, event) {
  const { props } = instance

  const camelize = (str: string) => {
    return str.replace(/-(\w)/g, (_, c) => {
      return c.toLocaleUpperCase()
    })
  }

  const capitalize = (str: string) => {
    return str.charAt(0).toLocaleUpperCase() + str.slice(1)
  }
  const toHandlerKey = (str: string) => {
    return str ? 'on' + capitalize(str) : ''
  }

  const handler = props[toHandlerKey(camelize(event))]
  handler && handler()
}