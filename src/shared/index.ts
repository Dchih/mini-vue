export const extend = Object.assign

export const isObject = (value: any) => {
  return typeof value === 'object' && value !== null
}