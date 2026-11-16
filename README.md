# PageSim — Virtual Memory Page Replacement Simulator

PageSim is an MCA mini-project for Computer Organization and Architecture. It shows how the operating system decides which page stays in main memory when a new page is needed.

Open `src/coaLogic.js` to explain the algorithms. The screen in `src/App.jsx` does not contain FIFO or LRU rules. It only reads the inputs, calls `fifo()` or `lru()`, and draws the result.

## How to run

```bash
npm install
npm run dev
```

Open the local address printed by Vite. The sample is already filled in:

- Pages: `1, 2, 3, 1, 4, 2, 5`
- Frames: `3`
- FIFO: **2 hits, 5 faults**
- LRU: **1 hit, 6 faults**

Click **Run Simulation**. The frames play one page at a time. **Pause**, **Previous**, and **Next** stop on a single step.

## Five-minute viva script

Say this in order. It covers the theory, the sample, and the code.

1. **Problem.** A program is divided into pages. Main memory has only a few frames. When the CPU asks for a page that is not in a frame, that is a page fault. If every frame is full, one old page must leave. FIFO and LRU are two rules for choosing that page.
2. **Open the screen.** The reference string is `1, 2, 3, 1, 4, 2, 5` and there are 3 frames. Click Run Simulation. Point at the grid: each column is one page request, and the rows are Frame 1, Frame 2, and Frame 3. Red means fault. Green means hit.
3. **FIFO result.** Walk the seven columns. Hits are only the second request for page 1 and the second request for page 2. So FIFO has 2 hits and 5 faults. Hit ratio is `2/7`. Fault ratio is `5/7`.
4. **Switch to LRU and run again.** The same string now has 1 hit and 6 faults. Explain that after page 1 is used again, page 2 is the least recently used page, so LRU removes it. The next request is page 2, so LRU faults. FIFO still had page 2, so FIFO hits.
5. **Open `src/coaLogic.js`.** Show `fifo()` and the variable `pointer`. Then show `lru()` and the array `lastUsed`. Say that `buildResult()` calculates the ratios, and `App.jsx` only displays the object those functions return.

## Project objective

The objective is to understand page replacement by watching every reference change the frames, and to explain the complete algorithm from one short file.

## What is virtual memory?

Physical memory is limited. A program can be larger than the RAM available to it. Virtual memory lets the operating system keep the whole program’s address space, while loading only the parts that are needed right now.

The program is split into fixed-size blocks called **pages**. The matching slots in RAM are called **frames**. A page that is in RAM occupies one frame. A page that is not in RAM stays on secondary storage until a fault brings it in.

## What is page replacement?

The CPU generates a **page reference string**: the order in which pages are requested.

- If the requested page is already in some frame, the access is a **page hit**. Memory does not change.
- If the requested page is not in any frame, the access is a **page fault**. The page must be loaded.
- If a frame is empty, the new page is placed there.
- If every frame is full, one resident page is removed. The removed page is the **victim**. The rule that chooses the victim is the page replacement algorithm.

Two counts are kept:

```text
Hit ratio   = hits   / total references
Fault ratio = faults / total references
```

Hits plus faults equals the number of references. For 7 references, the two ratios add up to 1.

## How the screen works

1. The user types a reference string, chooses 2 to 5 frames, and chooses FIFO or LRU.
2. **Run Simulation** reads the text, converts it to an array of numbers, and calls either `fifo(pages, frameCount)` or `lru(pages, frameCount)`.
3. The function returns every step, the hit count, the fault count, and both ratios.
4. The screen plays those steps about once a second. The highlighted column is the current reference. The large blocks show the three frames after that reference.
5. The statistics cards print the counts and the ratios. The table lists the same steps for the examiner to check.

No page-replacement decision is made in `App.jsx`. If the screen and the file disagree, the file is the algorithm.

## How FIFO works

FIFO means First In, First Out. The page that entered memory first is the first page removed.

`fifo()` keeps the frames in an array. Empty frames are `null`. A variable called `pointer` stores the index of the frame that will be replaced next. The pointer starts at 0, which the screen labels Frame 1.

For each page:

1. Search the frames. If the page is found, count a hit. Do not move the pointer.
2. If the page is missing, count a fault.
3. If `frames[pointer]` already holds a page, that page is the victim.
4. Store the new page at `frames[pointer]`.
5. Add 1 to `pointer`. If the pointer moves past the last frame, set it back to 0.

The pointer moves only on a fault. A hit does not protect a page under FIFO, because FIFO cares about arrival time, not about recent use.

### FIFO sample

Pages `1, 2, 3, 1, 4, 2, 5`. Frames `3`.

| Step | Page | Frame 1 | Frame 2 | Frame 3 | Pointer after this step | Result | Replaced |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 1 | 1 | – | – | 1 | Fault | – |
| 2 | 2 | 1 | 2 | – | 2 | Fault | – |
| 3 | 3 | 1 | 2 | 3 | 0 | Fault | – |
| 4 | 1 | 1 | 2 | 3 | 0 | Hit | – |
| 5 | 4 | 4 | 2 | 3 | 1 | Fault | 1 |
| 6 | 2 | 4 | 2 | 3 | 1 | Hit | – |
| 7 | 5 | 4 | 5 | 3 | 2 | Fault | 2 |

At step 5 the pointer is 0, so Frame 1 is the oldest arrival. Page 1 leaves and page 4 enters. The pointer then moves to Frame 2. At step 7, page 2 leaves and page 5 enters.

Hits = 2. Faults = 5. Hit ratio = `2/7` = 28.57%. Fault ratio = `5/7` = 71.43%.

## How LRU works

LRU means Least Recently Used. The page that was used longest ago is the page removed.

`lru()` keeps two arrays:

- `frames[j]` is the page in that frame, or `null` if the frame is empty.
- `lastUsed[j]` is the step index when that frame was last used. A smaller number is an older use. `-1` means the frame has never been used.

For each page, with the current loop index stored in `i`:

1. Search the frames. If the page is found, count a hit and set `lastUsed` for that frame to `i`. A hit is also a recent use.
2. If the page is missing, count a fault. First look for a `null` frame and use it.
3. If there is no empty frame, scan `lastUsed` and choose the smallest value. That frame holds the least recently used page. Record it as the replaced page.
4. Store the new page in the chosen frame and set its `lastUsed` time to `i`.

### LRU sample

The same pages and 3 frames. The time below is the value stored in `lastUsed` after the step. The loop index starts at 0, so step 1 has time 0.

| Step | Page | Frames | lastUsed after the step | Result | Replaced | Reason |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 1 | 1, –, – | 0, –1, –1 | Fault | – | empty frame |
| 2 | 2 | 1, 2, – | 0, 1, –1 | Fault | – | empty frame |
| 3 | 3 | 1, 2, 3 | 0, 1, 2 | Fault | – | empty frame |
| 4 | 1 | 1, 2, 3 | 3, 1, 2 | Hit | – | page 1 is used again, so its time becomes 3 |
| 5 | 4 | 1, 4, 3 | 3, 4, 2 | Fault | 2 | time 1 is the oldest, so page 2 leaves |
| 6 | 2 | 1, 4, 2 | 3, 4, 5 | Fault | 3 | time 2 is now the oldest, so page 3 leaves |
| 7 | 5 | 5, 4, 2 | 6, 4, 5 | Fault | 1 | time 3 is the oldest, so page 1 leaves |

Hits = 1. Faults = 6. Hit ratio = `1/7` = 14.29%. Fault ratio = `6/7` = 85.71%.

## Difference between FIFO and LRU

| Question | FIFO | LRU |
| --- | --- | --- |
| What does it remember? | The order in which pages entered | The time each page was last used |
| What is removed? | The oldest arrival | The page used longest ago |
| Does a hit change the future victim? | No. The pointer stays still | Yes. That page becomes the newest use |
| Data used in this project | One array and one pointer | One frame array and one `lastUsed` array |
| Sample result, 3 frames | 2 hits, 5 faults | 1 hit, 6 faults |

LRU is often better because it keeps pages that the program is still using. It is not better on every string. On this sample, using page 1 again makes page 2 look old to LRU. LRU removes page 2, and the very next reference is page 2, so that access faults. FIFO removes page 1 instead and still has page 2, so that access hits. This is a good viva point: the better algorithm depends on the reference string.

## Functions in `src/coaLogic.js`

Explain these from top to bottom. The file is about 120 lines and uses only loops, `if` statements, arrays, and variables.

### `findFrame(frames, page)`

Looks through the frame array from left to right. If `frames[i]` equals `page`, it returns `i`. If the page is not present, it returns `-1`.

An empty frame is stored as `null`. Calling `findFrame(frames, null)` therefore returns the first empty frame, or `-1` when memory is full.

### `buildResult(steps, hits, faults)`

Adds hits and faults to get the total number of references. Then:

```text
hitRatio   = hits / total
faultRatio = faults / total
```

If there are no references, both ratios are 0. The returned object is what the screen displays: `steps`, `hits`, `faults`, `hitRatio`, and `faultRatio`.

### `addStep(...)`

Copies the frame array into a new array, then pushes one step object. The copy matters. If the same array were saved every time, later replacements would overwrite the pictures of the earlier steps.

Each step contains:

| Field | Meaning |
| --- | --- |
| `step` | Step number, starting at 1 |
| `page` | The page that was requested |
| `frames` | A copy of memory after this request |
| `status` | `"Hit"` or `"Fault"` |
| `replaced` | The page that left memory, or `null` if nobody left |
| `frameIndex` | The frame that was used for this request |

### `fifo(pages, frameCount)`

Creates `frameCount` empty frames and sets `pointer` to 0. Then it runs the FIFO rule above for every page and returns `buildResult(...)`.

The important lines are the search, the hit branch that does not move `pointer`, the replacement `frames[pointer] = page`, and the lines that add 1 to `pointer` and wrap it back to 0.

### `lru(pages, frameCount)`

Creates the frame array and the `lastUsed` array. On a hit it updates `lastUsed[frameIndex]`. On a fault it prefers an empty frame. When memory is full, the inner loop keeps the frame whose `lastUsed` value is smallest, saves that page as `replaced`, and then loads the new page.

## What each project file does

| File | Role in the viva |
| --- | --- |
| `src/coaLogic.js` | All FIFO and LRU logic. Explain this file. |
| `src/App.jsx` | Inputs, the Run button, the frame grid, the step player, the statistics, and the table. |
| `src/main.jsx` | Starts the React page. |
| `src/index.css` | Light theme and blue accent. |
| `src/components/ui/` | Buttons, cards, inputs, selects, table, and badges. |
| `README.md` | This explanation. |

## Viva questions and answers

**1. What is a page fault?**

A page fault happens when the requested page is not in any frame. The operating system must load it. If memory is full, a resident page is replaced first.

**2. What is a page hit?**

A page hit happens when the requested page is already in a frame. No page is loaded and no page is replaced.

**3. What does the FIFO pointer do?**

It marks the next frame to replace. It moves forward only on a fault, and it returns to frame 0 after the last frame. A hit does not move it. In the sample, the pointer is 0 when page 4 arrives, so page 1 is replaced.

**4. How does LRU choose the victim?**

It compares `lastUsed` for every full frame and chooses the smallest value. That page was used longest ago. A hit writes the current step into `lastUsed`, so a page that was just used will not be chosen next.

**5. Why does the code copy the frames before saving a step?**

The frames array is changed again on the next fault. The copy keeps the old picture. Without the copy, every row of the table would show only the final memory.

**6. How are the ratios calculated?**

Hit ratio = hits / number of references. Fault ratio = faults / number of references. For FIFO, hit ratio is `2/7` and fault ratio is `5/7`. For LRU, hit ratio is `1/7` and fault ratio is `6/7`.

**7. Why can LRU produce more faults than FIFO?**

LRU is not better on every reference string. Here, the second use of page 1 makes page 2 the least recently used page. LRU removes page 2. The next reference is page 2, so LRU faults. FIFO removes page 1 and still contains page 2, so FIFO hits.

**8. Where is the algorithm, and where is the display?**

`fifo()` and `lru()` in `src/coaLogic.js` decide hits, faults, and replacements. `src/App.jsx` calls one of those functions and draws the returned steps. The screen does not choose the victim itself.

**9. What do the colours mean?**

Red is a page fault. Green is a page hit. The blue column is the step currently being explained. A white dash is an empty frame.

**10. What is the reference string in this project?**

It is the sequence of page numbers requested by the CPU. The default string is `1, 2, 3, 1, 4, 2, 5`.
