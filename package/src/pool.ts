import { makeMutable, type SharedValue } from "react-native-reanimated";
import { POOL_SIZE } from "./constants";

export interface AnimSlot {
  progress: SharedValue<number>;
  translationY: SharedValue<number>;
  stackIndex: SharedValue<number>;
  deduplication: SharedValue<number>;
}

export const animationPool: AnimSlot[] = Array.from({ length: POOL_SIZE }, () => ({
  progress: makeMutable(0),
  translationY: makeMutable(0),
  stackIndex: makeMutable(0),
  deduplication: makeMutable(0),
}));

const slotAssignments = new Map<string, number>();
const usedSlots = new Set<number>();

export const getSlotIndex = (toastId: string): number => {
  if (slotAssignments.has(toastId)) {
    return slotAssignments.get(toastId) ?? 0;
  }
  for (let i = 0; i < POOL_SIZE; i++) {
    if (!usedSlots.has(i)) {
      slotAssignments.set(toastId, i);
      usedSlots.add(i);
      return i;
    }
  }
  return 0;
};

export const releaseSlot = (toastId: string) => {
  const idx = slotAssignments.get(toastId);
  if (idx !== undefined) {
    usedSlots.delete(idx);
    slotAssignments.delete(toastId);
  }
};
