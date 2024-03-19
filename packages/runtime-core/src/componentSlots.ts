import { ShapeFlag } from "@guide-mini-vue/shared";

export function initSlots(instance, children) {
  const { vnode } = instance;
  // 检测是否需要处理slot
  if (ShapeFlag.SLOT_CHILDREN & vnode.shapeFlag) {
    normilizeObjectSlots(children, instance.slots);
  }
}

function normilizeObjectSlots(children, slots) {
  for (const key in children) {
    const value = children[key];
    slots[key] = (props) => normilizeSlotArray(value(props));
  }
}

function normilizeSlotArray(slots) {
  return Array.isArray(slots) ? slots : [slots];
}
