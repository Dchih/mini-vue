import { h, ref } from "../../lib/guide-mini-vue.esm.js";

// 左到右
// a b c
// a b d e
// const prevArray = [
//   h("div", { key: "A" }, "A"),
//   h("div", { key: "B" }, "B"),
//   h("div", { key: "C" }, "C"),
//   h("div", { key: "D" }, "D"),
// ];
// const nextArray = [
//   h("div", { key: "A" }, "A"),
//   h("div", { key: "B" }, "B"),
//   h("div", { key: "E" }, "E"),
// ];

// 右到左
//   c a b
// d e a b
// const prevArray = [
//   h("div", { key: "C" }, "C"),
//   h("div", { key: "A" }, "A"),
//   h("div", { key: "B" }, "B"),
// ];
// const nextArray = [
//   h("div", { key: "D" }, "D"),
//   h("div", { key: "E" }, "E"),
//   h("div", { key: "A" }, "A"),
//   h("div", { key: "B" }, "B"),
// ];

// 新比老多-add 左到右
// a b
// a b c
// const prevArray = [h("div", { key: "A" }, "A"), h("div", { key: "B" }, "B")];
// const nextArray = [
//   h("div", { key: "A" }, "A"),
//   h("div", { key: "B" }, "B"),
//   h("div", { key: "C" }, "C"),
// ];

// 新比老多-add 右到左
//   a b
// c a b
// const prevArray = [h("div", { key: "A" }, "A"), h("div", { key: "B" }, "B")];
// const nextArray = [
//   h("div", { key: "C" }, "C"),
//   h("div", { key: "D" }, "D"),
//   h("div", { key: "A" }, "A"),
//   h("div", { key: "B" }, "B"),
// ];

// 老比新多-del 左到右
// a b c
// a b
// const prevArray = [
//   h("div", { key: "A" }, "A"),
//   h("div", { key: "B" }, "B"),
//   h("div", { key: "C" }, "C"),
// ];
// const nextArray = [h("div", { key: "A" }, "A"), h("div", { key: "B" }, "B")];

// 老比新多-del 右到左
// const prevArray = [
//   h("div", { key: "C" }, "C"),
//   h("div", { key: "A" }, "A"),
//   h("div", { key: "B" }, "B"),
// ];
// const nextArray = [h("div", { key: "A" }, "A"), h("div", { key: "B" }, "B")];

// const prevArray = [
//   h("div", { key: "A" }, "A"),
//   h("div", { key: "B", id: "bprev" }, "B"),
//   h("div", { key: "C" }, "C"),
//   h("div", { key: "D" }, "D"),
//   h("div", { key: "E" }, "E"),
//   h("div", { key: "F" }, "F"),
//   h("div", { key: "H" }, "H"),
// ];
// const nextArray = [
//   h("div", { key: "A" }, "A"),
//   h("div", { key: "B", id: "bnext" }, "B"),
//   h("div", { key: "E" }, "E"),
//   h("div", { key: "D" }, "D"),
//   h("div", { key: "F" }, "F"),
//   h("div", { key: "H" }, "H"),
// ];

// 综合
const prevArray = [
  h("div", { key: "A" }, "A"),
  h("div", { key: "B", id: "bprev" }, "B"),
  h("div", { key: "C" }, "C"),
  h("div", { key: "D" }, "D"),
  h("div", { key: "E" }, "E"),
  h("div", { key: "Z" }, "Z"),
  h("div", { key: "F" }, "F"),
  h("div", { key: "G" }, "G"),
  h("div", { key: "H" }, "H"),
];
const nextArray = [
  h("div", { key: "A" }, "A"),
  h("div", { key: "B", id: "bnext" }, "B"),
  h("div", { key: "D" }, "D"),
  h("div", { key: "C" }, "C"),
  h("div", { key: "Y" }, "Y"),
  h("div", { key: "E" }, "E"),
  h("div", { key: "F" }, "F"),
  h("div", { key: "G" }, "G"),
  h("div", { key: "H" }, "H"),
];

export const arrayToArray = {
  setup() {
    const isChanged = ref(false);
    window.isChanged = isChanged;
    return {
      isChanged,
    };
  },
  render() {
    return this.isChanged ? h("div", {}, nextArray) : h("div", {}, prevArray);
  },
};
