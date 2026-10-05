import type { ISODate } from "./time";

export interface TimedBlock {
  id: number;
  date: ISODate;
  startMin: number;
  endMin: number;
  tags: string[];
}

// Buffers are intentionally empty time, so putting something on top of one isn't a clash.
const countsForOverlap = (b: TimedBlock) => !b.tags.includes("buffer");

const intersects = (a: TimedBlock, b: TimedBlock) =>
  a.date === b.date && a.startMin < b.endMin && b.startMin < a.endMin;

/** IDs of every block that is double-booked with another block. */
export function findOverlaps(blocks: TimedBlock[]): Set<number> {
  const result = new Set<number>();
  const candidates = blocks.filter(countsForOverlap);
  for (let i = 0; i < candidates.length; i++) {
    for (let j = i + 1; j < candidates.length; j++) {
      if (intersects(candidates[i], candidates[j])) {
        result.add(candidates[i].id);
        result.add(candidates[j].id);
      }
    }
  }
  return result;
}

/**
 * Side-by-side columns for overlapping blocks within one day, so a clash
 * is visible instead of one block hiding the other.
 */
export function layoutColumns(dayBlocks: TimedBlock[]): Map<number, { col: number; cols: number }> {
  const sorted = [...dayBlocks].sort((a, b) => a.startMin - b.startMin || b.endMin - a.endMin);
  const layout = new Map<number, { col: number; cols: number }>();

  let cluster: TimedBlock[] = [];
  let colEnds: number[] = [];
  let clusterEnd = -1;

  const flush = () => {
    for (const b of cluster) layout.get(b.id)!.cols = colEnds.length;
    cluster = [];
    colEnds = [];
  };

  for (const block of sorted) {
    if (block.startMin >= clusterEnd) flush();
    let col = colEnds.findIndex((end) => end <= block.startMin);
    if (col === -1) {
      col = colEnds.length;
      colEnds.push(block.endMin);
    } else {
      colEnds[col] = block.endMin;
    }
    layout.set(block.id, { col, cols: 1 });
    cluster.push(block);
    clusterEnd = Math.max(clusterEnd, block.endMin);
  }
  flush();
  return layout;
}
