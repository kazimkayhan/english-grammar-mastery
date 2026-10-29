export interface Keyed<T> {
  index: number;
  item: T;
  key: number;
}

/**
 * Pairs each item with its character offset in the source sequence. Offsets
 * are strictly increasing, so they are unique React keys for a fixed list.
 */
export function withOffsetKeys<T>(
  items: readonly T[],
  sizeOf: (item: T) => number
): Keyed<T>[] {
  let offset = 0;
  return items.map((item, index) => {
    const key = offset;
    offset += sizeOf(item) + 1;
    return { index, item, key };
  });
}
