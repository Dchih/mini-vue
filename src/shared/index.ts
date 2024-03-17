export * from "./toDisplayString";

export const extend = Object.assign;

export const isObject = (value: any) => {
  return typeof value === "object" && value !== null;
};

export const isString = (value: any) => typeof value === "string";

export const hasChanged = (a: any, b: any) => !Object.is(a, b);

export const EMPTY_OBJ = {};
