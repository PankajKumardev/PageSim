// PageSim — all COA logic. The screen only calls fifo() and lru(). No React in this file.
// Sample, 3 frames: 1, 2, 3, 1, 4, 2, 5. FIFO: 2 hits, 5 faults. LRU: 1 hit, 6 faults.

// Return the frame holding this page, or -1. null means an empty frame.
function findFrame(frames, page) {
  for (let i = 0; i < frames.length; i++) {
    if (frames[i] === page) {
      return i;
    }
  }
  return -1;
}

// Hit ratio = hits / total references. Fault ratio = faults / total references.
function buildResult(steps, hits, faults) {
  const total = hits + faults;
  let hitRatio = 0;
  let faultRatio = 0;
  if (total !== 0) {
    hitRatio = hits / total;
    faultRatio = faults / total;
  }
  return { steps: steps, hits: hits, faults: faults, hitRatio: hitRatio, faultRatio: faultRatio };
}

// Copy the frames and save this step, so a later change cannot rewrite it.
function addStep(steps, number, page, frames, isHit, replaced, frameIndex) {
  const copy = [];
  for (let i = 0; i < frames.length; i++) {
    copy.push(frames[i]);
  }
  let status = "Fault";
  if (isHit) {
    status = "Hit";
  }
  steps.push({
    step: number,
    page: page,
    frames: copy,
    status: status,
    replaced: replaced,
    frameIndex: frameIndex,
  });
}

// First In, First Out. Remove the page that entered memory first.
export function fifo(pages, frameCount) {
  const frames = [];
  for (let i = 0; i < frameCount; i++) {
    frames.push(null);
  }
  let pointer = 0; // the frame that will be replaced next
  let hits = 0;
  let faults = 0;
  const steps = [];
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    let frameIndex = findFrame(frames, page);
    let replaced = null;
    let isHit = false;
    if (frameIndex !== -1) {
      isHit = true;
      hits = hits + 1;
    } else {
      faults = faults + 1;
      if (frames[pointer] !== null) {
        replaced = frames[pointer]; // the oldest page leaves memory
      }
      frames[pointer] = page;
      frameIndex = pointer;
      pointer = pointer + 1; // move to the next frame, then wrap
      if (pointer === frameCount) {
        pointer = 0;
      }
    }
    addStep(steps, i + 1, page, frames, isHit, replaced, frameIndex);
  }
  return buildResult(steps, hits, faults);
}

// Least Recently Used. Remove the page that was used longest ago.
export function lru(pages, frameCount) {
  const frames = [];
  const lastUsed = []; // the step when each frame was last used
  for (let i = 0; i < frameCount; i++) {
    frames.push(null);
    lastUsed.push(-1);
  }
  let hits = 0;
  let faults = 0;
  const steps = [];
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    let frameIndex = findFrame(frames, page);
    let replaced = null;
    let isHit = false;
    if (frameIndex !== -1) {
      isHit = true;
      hits = hits + 1;
      lastUsed[frameIndex] = i; // a hit also counts as a recent use
    } else {
      faults = faults + 1;
      frameIndex = findFrame(frames, null);
      if (frameIndex === -1) {
        frameIndex = 0; // memory is full
        for (let j = 1; j < frames.length; j++) {
          if (lastUsed[j] < lastUsed[frameIndex]) {
            frameIndex = j; // this page was used longer ago
          }
        }
        replaced = frames[frameIndex];
      }
      frames[frameIndex] = page;
      lastUsed[frameIndex] = i;
    }
    addStep(steps, i + 1, page, frames, isHit, replaced, frameIndex);
  }
  return buildResult(steps, hits, faults);
}
