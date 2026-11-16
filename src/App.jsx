import { useEffect, useRef, useState } from "react";
import { BookOpen, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { fifo, lru } from "./coaLogic";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const SAMPLE_TEXT = "1, 2, 3, 1, 4, 2, 5";
const SAMPLE_PAGES = [1, 2, 3, 1, 4, 2, 5];

function readPages(text) {
  const trimmed = text.trim();
  if (trimmed === "") {
    return { error: "Enter at least one page number." };
  }

  const parts = trimmed.split(/[\s,]+/);
  const pages = [];
  for (let i = 0; i < parts.length; i++) {
    if (!/^\d+$/.test(parts[i])) {
      return {
        error: "Use whole page numbers separated by commas, such as 1, 2, 3, 1.",
      };
    }
    pages.push(Number(parts[i]));
  }
  return { pages: pages };
}

function algorithmName(algorithm) {
  if (algorithm === "lru") {
    return "LRU";
  }
  return "FIFO";
}

function percent(ratio) {
  return (ratio * 100).toFixed(2) + "%";
}

function describeStep(step, algorithm) {
  const frameNumber = step.frameIndex + 1;
  if (step.status === "Hit") {
    return `Page ${step.page} is already in frame ${frameNumber}. Memory stays the same, so this reference is a hit.`;
  }
  if (step.replaced === null) {
    return `Page ${step.page} is not in memory. Frame ${frameNumber} is empty, so the page is loaded there. This reference is a fault.`;
  }
  if (algorithm === "lru") {
    return `Page ${step.page} is not in memory. LRU replaces page ${step.replaced} in frame ${frameNumber}, because that page was used least recently. This reference is a fault.`;
  }
  return `Page ${step.page} is not in memory. FIFO replaces page ${step.replaced} in frame ${frameNumber}, because that page has been in memory the longest. This reference is a fault.`;
}

function FrameSlot({ value, index, active, status }) {
  let tone = "border-slate-200 bg-white text-slate-900";
  if (value === null) {
    tone = "border-dashed border-slate-300 bg-white/70 text-slate-300";
  }
  if (active && status === "Hit") {
    tone = "border-emerald-600 bg-white text-emerald-800 shadow-[0_0_0_4px_rgba(16,185,129,0.18)]";
  }
  if (active && status === "Fault") {
    tone = "border-rose-600 bg-white text-rose-800 shadow-[0_0_0_4px_rgba(225,29,72,0.16)]";
  }

  return (
    <div className="flex w-16 flex-col items-center gap-2 sm:w-24">
      <div
        className={`flex h-20 w-full items-center justify-center rounded-2xl border-2 text-3xl font-semibold tabular-nums sm:h-28 sm:text-4xl ${tone}`}
      >
        {value === null ? "–" : value}
      </div>
      <span className="text-[11px] font-medium tracking-[0.14em] text-slate-500 uppercase">
        Frame {index + 1}
      </span>
    </div>
  );
}

function FrameMap({ result, stepIndex, onPick }) {
  const frameCount = result.steps[0].frames.length;
  const frameRows = [];
  for (let frame = 0; frame < frameCount; frame++) {
    frameRows.push(frame);
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-1 text-center text-sm">
        <thead>
          <tr>
            <th className="px-2 py-1 text-left text-xs font-medium tracking-wide text-slate-500 uppercase">
              Frame
            </th>
            {result.steps.map((step, index) => (
              <th key={step.step} className="px-1 py-1">
                <button
                  type="button"
                  onClick={() => onPick(index)}
                  className={`h-8 min-w-8 rounded-md px-2 font-semibold tabular-nums ${
                    index === stepIndex
                      ? "bg-blue-600 text-white"
                      : step.status === "Hit"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {step.page}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {frameRows.map((frame) => (
            <tr key={frame}>
              <th className="px-2 py-1 text-left text-xs font-semibold whitespace-nowrap text-slate-600">
                Frame {frame + 1}
              </th>
              {result.steps.map((step, index) => {
                const value = step.frames[frame];
                const current = index === stepIndex;
                const changed = current && frame === step.frameIndex;
                let cell = "bg-white text-slate-800 ring-1 ring-slate-200";
                if (step.status === "Hit") {
                  cell = "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200";
                }
                if (step.status === "Fault") {
                  cell = "bg-rose-50 text-rose-900 ring-1 ring-rose-200";
                }
                if (changed && step.status === "Hit") {
                  cell = "bg-emerald-600 text-white ring-2 ring-emerald-700";
                }
                if (changed && step.status === "Fault") {
                  cell = "bg-rose-600 text-white ring-2 ring-rose-700";
                }
                if (current && !changed) {
                  cell = cell + " ring-2 ring-blue-500";
                }
                return (
                  <td key={step.step} className="px-1 py-1">
                    <button
                      type="button"
                      onClick={() => onPick(index)}
                      className={`flex h-10 w-full min-w-10 items-center justify-center rounded-md font-semibold tabular-nums ${cell}`}
                    >
                      {value === null ? "–" : value}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
          <tr>
            <th className="px-2 py-1 text-left text-xs font-medium text-slate-500 uppercase">
              Result
            </th>
            {result.steps.map((step, index) => (
              <td
                key={step.step}
                className={`py-1 text-xs font-semibold ${
                  index === stepIndex ? "text-blue-700" : "text-slate-500"
                }`}
              >
                {step.status === "Hit" ? "Hit" : "Fault"}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function SetupCard({
  sequence,
  setSequence,
  frameCount,
  setFrameCount,
  algorithm,
  setAlgorithm,
  error,
  notice,
  onRun,
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Simulation setup</CardTitle>
        <CardDescription>
          Enter a reference string, choose the frame count, then run FIFO or LRU.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            onRun();
          }}
        >
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="pages">Page reference string</Label>
              <Button
                type="button"
                variant="link"
                className="h-auto px-0"
                onClick={() => setSequence(SAMPLE_TEXT)}
              >
                Use sample
              </Button>
            </div>
            <Input
              id="pages"
              value={sequence}
              onChange={(event) => setSequence(event.target.value)}
              placeholder="1, 2, 3, 1, 4, 2, 5"
              className="h-10 font-mono"
              spellCheck={false}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label>Memory frames</Label>
              <Select value={frameCount} onValueChange={setFrameCount}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" align="start">
                  <SelectItem value="2">2 frames</SelectItem>
                  <SelectItem value="3">3 frames</SelectItem>
                  <SelectItem value="4">4 frames</SelectItem>
                  <SelectItem value="5">5 frames</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Algorithm</Label>
              <Select value={algorithm} onValueChange={setAlgorithm}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" align="start">
                  <SelectItem value="fifo">FIFO</SelectItem>
                  <SelectItem value="lru">LRU</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error ? (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
          ) : null}

          <Button type="button" className="h-10 w-full" onClick={onRun}>
            <Play />
            Run Simulation
          </Button>
          {notice ? (
            <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800">{notice}</p>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}

function MemoryCard({ result, algorithm, stepIndex, setStepIndex, playing, onPlay, onPause }) {
  const step = result.steps[stepIndex];
  const tray =
    step.status === "Hit"
      ? "bg-emerald-50 ring-emerald-200"
      : "bg-rose-50 ring-rose-200";

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Memory frames</CardTitle>
            <CardDescription>
              {playing
                ? "Watching the frames change, one page at a time"
                : algorithmName(algorithm) + " memory after each page"}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{algorithmName(algorithm)}</Badge>
            <Badge
              variant="outline"
              className={
                step.status === "Hit"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-rose-200 bg-rose-50 text-rose-800"
              }
            >
              {step.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div>
          <p className="mb-2 text-xs font-medium tracking-[0.14em] text-slate-500 uppercase">
            Frame 1 to Frame {step.frames.length} for every page
          </p>
          <FrameMap result={result} stepIndex={stepIndex} onPick={setStepIndex} />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium tracking-[0.14em] text-slate-500 uppercase">
              Requested page
            </p>
            <p className="text-3xl font-semibold tabular-nums">{step.page}</p>
          </div>
          <p className="text-sm text-slate-600">
            {step.replaced === null ? "No page replaced" : `Replaced page ${step.replaced}`}
          </p>
        </div>

        <div className={`rounded-2xl p-4 ring-1 sm:p-6 ${tray}`}>
          <div className="flex flex-wrap justify-center gap-3 sm:gap-5">
            {step.frames.map((value, index) => (
              <FrameSlot
                key={index}
                value={value}
                index={index}
                active={index === step.frameIndex}
                status={step.status}
              />
            ))}
          </div>
        </div>

        <p className="text-sm leading-6 text-slate-700" aria-live="polite">
          {describeStep(step, algorithm)}
        </p>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStepIndex(stepIndex - 1)}
            disabled={stepIndex === 0}
          >
            <ChevronLeft />
            Previous
          </Button>
          {playing ? (
            <Button type="button" variant="outline" onClick={onPause}>
              <Pause />
              Pause
            </Button>
          ) : (
            <Button type="button" variant="outline" onClick={onPlay}>
              <Play />
              Play
            </Button>
          )}
          <p className="text-sm font-medium tabular-nums text-slate-600">
            Step {step.step} of {result.steps.length}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => setStepIndex(stepIndex + 1)}
            disabled={stepIndex === result.steps.length - 1}
          >
            Next
            <ChevronRight />
          </Button>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3 text-xs text-slate-500">
            <span>Reference string</span>
            <span>
              <span className="text-emerald-700">Green hit</span>
              <span className="px-1">·</span>
              <span className="text-rose-700">Red fault</span>
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {result.steps.map((item, index) => {
              let chip = "bg-rose-100 text-rose-800";
              if (item.status === "Hit") {
                chip = "bg-emerald-100 text-emerald-800";
              }
              if (index === stepIndex) {
                chip = chip + " ring-2 ring-blue-600 ring-offset-2";
              }
              return (
                <button
                  key={item.step}
                  type="button"
                  onClick={() => setStepIndex(index)}
                  className={`h-8 min-w-8 rounded-lg px-2 text-sm font-semibold tabular-nums ${chip}`}
                  aria-label={`Step ${item.step}, page ${item.page}, ${item.status}`}
                  aria-current={index === stepIndex ? "step" : undefined}
                >
                  {item.page}
                </button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatCard({ label, value, detail }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl font-semibold tabular-nums tracking-tight">
          {value}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-slate-500">{detail}</p>
      </CardContent>
    </Card>
  );
}

function ResultTable({ result, stepIndex, setStepIndex }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Simulation table</CardTitle>
        <CardDescription>Select a row to inspect that memory state.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Step</TableHead>
              <TableHead>Requested page</TableHead>
              <TableHead>Memory frames</TableHead>
              <TableHead>Result</TableHead>
              <TableHead>Replaced</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.steps.map((step, index) => (
              <TableRow
                key={step.step}
                tabIndex={0}
                aria-label={`Show step ${step.step}`}
                onClick={() => setStepIndex(index)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setStepIndex(index);
                  }
                }}
                className={
                  index === stepIndex
                    ? "cursor-pointer bg-blue-100 hover:bg-blue-100"
                    : "cursor-pointer"
                }
              >
                <TableCell className="font-medium tabular-nums">{step.step}</TableCell>
                <TableCell className="font-semibold tabular-nums">{step.page}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {step.frames.map((value, frameIndex) => (
                      <span
                        key={frameIndex}
                        className="inline-flex h-7 w-8 items-center justify-center rounded-md border bg-white text-xs font-semibold tabular-nums"
                      >
                        {value === null ? "–" : value}
                      </span>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      step.status === "Hit"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-rose-200 bg-rose-50 text-rose-800"
                    }
                  >
                    {step.status}
                  </Badge>
                </TableCell>
                <TableCell className="tabular-nums">
                  {step.replaced === null ? "–" : step.replaced}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function AlgorithmNotes() {
  return (
    <section className="grid gap-5 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="size-4 text-blue-700" />
            FIFO
          </CardTitle>
          <CardDescription>First In, First Out</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm leading-6 text-slate-700">
          <p>
            FIFO removes the page that entered memory first. A pointer starts at frame 1.
            On a hit, memory does not change and the pointer stays still. On a fault, the
            page at the pointer is removed, the new page takes its place, and the pointer
            moves to the next frame.
          </p>
          <p>
            Sample 1, 2, 3, 1, 4, 2, 5 with 3 frames: 2 hits and 5 faults.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="size-4 text-blue-700" />
            LRU
          </CardTitle>
          <CardDescription>Least Recently Used</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm leading-6 text-slate-700">
          <p>
            LRU removes the page that was used longest ago. Every hit or load updates that
            page’s last-used time. On a fault, an empty frame is used first. When memory is
            full, the page with the oldest last-used time is replaced.
          </p>
          <p>
            The same sample with 3 frames: 1 hit and 6 faults. LRU is often better than
            FIFO, but this string is a case where FIFO keeps the page that is needed next.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}

export default function App() {
  const [sequence, setSequence] = useState(SAMPLE_TEXT);
  const [frameCount, setFrameCount] = useState("3");
  const [algorithm, setAlgorithm] = useState("fifo");
  const [usedAlgorithm, setUsedAlgorithm] = useState("fifo");
  const [result, setResult] = useState(() => fifo(SAMPLE_PAGES, 3));
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const memoryRef = useRef(null);

  useEffect(() => {
    if (!playing) {
      return undefined;
    }
    if (stepIndex >= result.steps.length - 1) {
      setPlaying(false);
      return undefined;
    }
    const timer = window.setTimeout(() => {
      setStepIndex((current) => current + 1);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [playing, stepIndex, result]);

  function chooseStep(index) {
    setPlaying(false);
    setStepIndex(index);
  }

  function playSteps() {
    if (stepIndex >= result.steps.length - 1) {
      setStepIndex(0);
    }
    setPlaying(true);
  }

  function changeSequence(value) {
    setSequence(value);
    setError("");
  }

  function runSimulation() {
    const parsed = readPages(sequence);
    if (parsed.error) {
      setError(parsed.error);
      return;
    }

    const count = Number(frameCount);
    let nextResult = fifo(parsed.pages, count);
    if (algorithm === "lru") {
      nextResult = lru(parsed.pages, count);
    }

    setError("");
    setUsedAlgorithm(algorithm);
    setResult(nextResult);
    setStepIndex(0);
    setPlaying(true);
    const hitLabel = nextResult.hits === 1 ? "hit" : "hits";
    const faultLabel = nextResult.faults === 1 ? "fault" : "faults";
    setNotice(
      algorithmName(algorithm) +
        " finished: " +
        nextResult.hits +
        " " +
        hitLabel +
        ", " +
        nextResult.faults +
        " " +
        faultLabel +
        "."
    );
    window.requestAnimationFrame(() => {
      memoryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  const total = result.hits + result.faults;

  return (
    <div className="relative min-h-svh bg-background text-foreground">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.16),transparent_68%)]"
      />

      <header className="relative border-b border-slate-200/80 bg-white/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 items-end gap-1" aria-hidden="true">
              <span className="h-6 w-2.5 rounded-sm bg-blue-200" />
              <span className="h-8 w-2.5 rounded-sm bg-blue-500" />
              <span className="h-10 w-2.5 rounded-sm bg-blue-700" />
            </div>
            <div>
              <p className="text-[11px] font-semibold tracking-[0.18em] text-blue-700 uppercase">
                Computer Organization
              </p>
              <h1 className="text-2xl font-semibold tracking-tight">PageSim</h1>
            </div>
          </div>
          <p className="hidden text-sm text-slate-500 sm:block">
            Virtual memory page replacement
          </p>
        </div>
      </header>

      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid items-start gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="lg:sticky lg:top-6">
            <SetupCard
              sequence={sequence}
              setSequence={changeSequence}
              frameCount={frameCount}
              setFrameCount={setFrameCount}
              algorithm={algorithm}
              setAlgorithm={setAlgorithm}
              error={error}
              notice={notice}
              onRun={runSimulation}
            />
          </div>
          <div ref={memoryRef} className="scroll-mt-6">
            <MemoryCard
              result={result}
              algorithm={usedAlgorithm}
              stepIndex={stepIndex}
              setStepIndex={chooseStep}
              playing={playing}
              onPlay={playSteps}
              onPause={() => setPlaying(false)}
            />
          </div>
        </div>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total page hits"
            value={result.hits}
            detail="References found in memory"
          />
          <StatCard
            label="Total page faults"
            value={result.faults}
            detail="References that had to be loaded"
          />
          <StatCard
            label="Hit ratio"
            value={percent(result.hitRatio)}
            detail={`${result.hits} / ${total} = hits / references`}
          />
          <StatCard
            label="Fault ratio"
            value={percent(result.faultRatio)}
            detail={`${result.faults} / ${total} = faults / references`}
          />
        </section>

        <ResultTable result={result} stepIndex={stepIndex} setStepIndex={chooseStep} />
        <AlgorithmNotes />

        <p className="pb-4 text-center text-xs text-slate-500">
          The FIFO and LRU rules are in src/coaLogic.js. This screen only calls them and draws the result.
        </p>
      </main>
    </div>
  );
}
