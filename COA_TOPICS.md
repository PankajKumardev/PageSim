# COA topics used in PageSim

- **Virtual memory and demand paging** — PageSim models a page being loaded into a memory frame when it is requested and missing. [Load a missing page](src/coaLogic.js#L102-L115)
- **Pages and frames** — The input numbers are virtual page IDs. The slots in the `frames` array represent physical memory frames. A slot containing `null` is empty. [Initialize the frames](src/coaLogic.js#L47-L52)
- **Page reference string** — The input is the order in which pages are requested, such as `1, 2, 3, 1, 4, 2, 5`. The simulator processes one request at a time. [Read the sequence](src/App.jsx#L34-L51), [process each request](src/coaLogic.js#L56-L64)
- **Page hit and page fault** — A hit means the requested page is already in a frame. A fault means it must be loaded, even when an empty frame is available. [Check the frames](src/coaLogic.js#L5-L12), [count hits and faults](src/coaLogic.js#L92-L104)
- **Page replacement** — When a fault occurs and every frame is full, the simulator selects a page to remove and loads the requested page into that frame. [Choose and replace a page](src/coaLogic.js#L103-L114)
- **FIFO replacement** — First In, First Out removes the page that entered memory first. A circular pointer moves after each fault and stays in place on a hit. [FIFO implementation](src/coaLogic.js#L47-L79)
- **LRU replacement** — Least Recently Used removes the page whose last access was earliest. The `lastUsed` array records the latest access to each frame, including hits. [LRU implementation](src/coaLogic.js#L82-L119)
- **Hit and fault ratios** — Each count is divided by the number of page requests. The results screen displays both ratios as percentages. [Calculate ratios](src/coaLogic.js#L14-L24), [display percentages](src/App.jsx#L726-L735)

With three frames and the sample sequence above, FIFO gives **2 hits and 5 faults**. LRU gives **1 hit and 6 faults**. The [worked example](README.md#difference-between-fifo-and-lru) explains why.
