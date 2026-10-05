"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { createBlock, deleteBlock, setCompletion, updateBlock, type BlockInput } from "@/app/actions";
import type { Project, WeekBlock } from "@/db/schema";
import { findOverlaps, layoutColumns } from "@/lib/overlap";
import { score } from "@/lib/scoring";
import {
  addDays,
  DAY_END,
  DAY_START,
  formatDayLabel,
  formatTime,
  localNow,
  SLOT,
  snap,
  weekDates,
  WEEKDAYS,
  type ISODate,
  type LocalNow,
} from "@/lib/time";
import { BlockEditor } from "./BlockEditor";
import { PercentInput } from "./PercentInput";

const PX_PER_MIN = 64 / 60; // 64px per hour, 16px per 15-minute slot
const GRID_HEIGHT = (DAY_END - DAY_START) * PX_PER_MIN;
const HOURS = Array.from({ length: (DAY_END - DAY_START) / 60 + 1 }, (_, i) => DAY_START / 60 + i);

type Editing = { id: number } | { draft: BlockInput } | null;

interface Drag {
  id: number;
  mode: "move" | "resize";
  x0: number;
  y0: number;
  orig: WeekBlock;
  moved: boolean;
  preview: { date: ISODate; startMin: number; endMin: number } | null;
}

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);
const isBuffer = (b: WeekBlock) => b.tags.includes("buffer");

export function WeekView({
  weekStart,
  initialBlocks,
  projects,
  initialNow,
  timeZone,
}: {
  weekStart: ISODate;
  initialBlocks: WeekBlock[];
  projects: Project[];
  initialNow: LocalNow;
  timeZone: string;
}) {
  const [blocks, setBlocks] = useState(initialBlocks);
  const [editing, setEditing] = useState<Editing>(null);
  const [preview, setPreview] = useState<{ id: number; date: ISODate; startMin: number; endMin: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(initialNow);
  const dates = weekDates(weekStart);
  const todayIndex = dates.indexOf(now.date);
  const [mobileDay, setMobileDay] = useState(Math.max(todayIndex, 0));
  const columnsRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<Drag | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(localNow(timeZone)), 60_000);
    return () => clearInterval(id);
  }, [timeZone]);

  useEffect(() => {
    if (!error) return;
    const id = setTimeout(() => setError(null), 4000);
    return () => clearTimeout(id);
  }, [error]);

  const projectById = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);

  const shown = useMemo(
    () => (preview ? blocks.map((b) => (b.id === preview.id ? { ...b, ...preview } : b)) : blocks),
    [blocks, preview],
  );
  const overlaps = useMemo(() => findOverlaps(shown), [shown]);
  const weekScore = useMemo(() => score(blocks, now), [blocks, now]);

  // --- Saving (optimistic: update the screen first, roll back if the server says no) ---

  const replace = (row: WeekBlock) => setBlocks((bs) => bs.map((b) => (b.id === row.id ? row : b)));

  async function save(id: number, patch: Partial<WeekBlock>, action: () => Promise<WeekBlock>) {
    const before = blocks;
    setBlocks((bs) => bs.map((b) => (b.id === id ? { ...b, ...patch } : b)));
    try {
      replace(await action());
    } catch {
      setBlocks(before);
      setError("Couldn't save that change.");
    }
  }

  const mark = (b: WeekBlock, percent: number | null) =>
    save(b.id, { percent }, () => setCompletion(b.id, percent));

  const move = (b: WeekBlock, input: Partial<BlockInput>) => save(b.id, input, () => updateBlock(b.id, input));

  async function add(input: BlockInput) {
    setEditing(null);
    try {
      const row = await createBlock(input);
      setBlocks((bs) => [...bs, row]);
    } catch {
      setError("Couldn't add that block.");
    }
  }

  async function remove(b: WeekBlock) {
    setEditing(null);
    const before = blocks;
    setBlocks((bs) => bs.filter((x) => x.id !== b.id));
    try {
      await deleteBlock(b.id);
    } catch {
      setBlocks(before);
      setError("Couldn't delete that block.");
    }
  }

  // --- Drag to move, drag the bottom edge to resize ---

  function startDrag(e: React.PointerEvent, block: WeekBlock, mode: Drag["mode"], el: HTMLElement) {
    if (e.button !== 0) return;
    el.setPointerCapture(e.pointerId);
    dragRef.current = { id: block.id, mode, x0: e.clientX, y0: e.clientY, orig: block, moved: false, preview: null };
  }

  function onDragMove(e: React.PointerEvent) {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.x0;
    const dy = e.clientY - d.y0;
    if (!d.moved && Math.hypot(dx, dy) < 4) return;
    d.moved = true;

    const dMin = snap(dy / PX_PER_MIN);
    const { orig } = d;
    let next: NonNullable<Drag["preview"]>;
    if (d.mode === "resize") {
      next = { date: orig.date, startMin: orig.startMin, endMin: clamp(orig.endMin + dMin, orig.startMin + SLOT, DAY_END) };
    } else {
      const colWidth = (columnsRef.current?.clientWidth ?? 700) / 7;
      const day = clamp(dates.indexOf(orig.date) + Math.round(dx / colWidth), 0, 6);
      const duration = orig.endMin - orig.startMin;
      const startMin = clamp(orig.startMin + dMin, DAY_START, DAY_END - duration);
      next = { date: dates[day], startMin, endMin: startMin + duration };
    }
    d.preview = next;
    setPreview({ id: d.id, ...next });
  }

  function onDragEnd() {
    const d = dragRef.current;
    dragRef.current = null;
    setPreview(null);
    if (!d) return;
    if (!d.moved) {
      if (d.mode === "move") setEditing({ id: d.id });
      return;
    }
    const p = d.preview;
    if (p && (p.date !== d.orig.date || p.startMin !== d.orig.startMin || p.endMin !== d.orig.endMin)) {
      move(d.orig, p);
    }
  }

  function addAt(e: React.MouseEvent<HTMLDivElement>, date: ISODate) {
    const top = e.currentTarget.getBoundingClientRect().top;
    const startMin = clamp(Math.floor((e.clientY - top) / PX_PER_MIN / SLOT) * SLOT + DAY_START, DAY_START, DAY_END - SLOT);
    setEditing({ draft: { date, startMin, endMin: Math.min(startMin + 60, DAY_END), title: "", projectId: null } });
  }

  // --- Editor ---

  const editingBlock = editing && "id" in editing ? blocks.find((b) => b.id === editing.id) : undefined;
  const editor = editing && (
    <BlockEditor
      initial={
        editingBlock
          ? { date: editingBlock.date, startMin: editingBlock.startMin, endMin: editingBlock.endMin, title: editingBlock.title, projectId: editingBlock.projectId }
          : (editing as { draft: BlockInput }).draft
      }
      isNew={!editingBlock}
      percent={editingBlock?.percent ?? null}
      projects={projects}
      dates={dates}
      onClose={() => setEditing(null)}
      onSave={(values) => {
        if (editingBlock) {
          setEditing(null);
          move(editingBlock, values);
        } else {
          add(values);
        }
      }}
      onDelete={editingBlock ? () => remove(editingBlock) : undefined}
      onPercent={editingBlock && !isBuffer(editingBlock) ? (p) => mark(editingBlock, p) : undefined}
    />
  );

  const pct = weekScore.consistency === null ? "–" : `${Math.round(weekScore.consistency * 100)}%`;

  return (
    <div className="flex flex-1 flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 md:px-6">
        <div className="flex items-center gap-1">
          <NavLink href={`/?week=${addDays(weekStart, -7)}`} label="Previous week">‹</NavLink>
          <Link href="/" className="rounded-md px-2 py-1 text-sm text-muted hover:bg-line hover:text-text">Today</Link>
          <NavLink href={`/?week=${addDays(weekStart, 7)}`} label="Next week">›</NavLink>
        </div>
        <h1 className="text-[15px] font-medium tracking-tight">
          {formatDayLabel(weekStart)} – {formatDayLabel(addDays(weekStart, 6))}, {weekStart.slice(0, 4)}
        </h1>
        <div className="ml-auto text-sm text-muted" title="Actual ÷ planned hours for blocks that have happened">
          <span className="font-medium text-text tabular-nums">{pct}</span> consistency ·{" "}
          <span className="tabular-nums">{weekScore.actual.toFixed(1)}</span> / <span className="tabular-nums">{weekScore.planned.toFixed(1)}</span> h
        </div>
      </div>

      {/* Desktop: full week grid */}
      <div className="hidden flex-1 px-4 pb-8 md:block md:px-6">
        <div className="rounded-xl border border-line bg-surface">
          <div className="sticky top-0 z-20 grid grid-cols-[3.5rem_repeat(7,1fr)] rounded-t-xl border-b border-line bg-surface">
            <div />
            {dates.map((d, i) => (
              <div key={d} className="px-2 py-2.5 text-center">
                <span className={`text-xs uppercase tracking-wider ${i === todayIndex ? "text-text" : "text-muted"}`}>{WEEKDAYS[i]}</span>{" "}
                <span
                  className={`ml-0.5 inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-sm tabular-nums ${
                    i === todayIndex ? "bg-accent font-medium text-accent-text" : ""
                  }`}
                >
                  {Number(d.slice(8))}
                </span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-[3.5rem_1fr]">
            <div className="relative" style={{ height: GRID_HEIGHT }}>
              {HOURS.slice(0, -1).map((h) => (
                <div key={h} className="absolute right-2 -translate-y-1/2 text-[11px] text-muted tabular-nums" style={{ top: (h * 60 - DAY_START) * PX_PER_MIN }}>
                  {h === 5 ? "" : `${((h + 11) % 12) + 1}${h < 12 ? "am" : "pm"}`}
                </div>
              ))}
            </div>

            <div
              ref={columnsRef}
              className="relative grid grid-cols-7"
              style={{
                height: GRID_HEIGHT,
                backgroundImage: `repeating-linear-gradient(to bottom, var(--line) 0, var(--line) 1px, transparent 1px, transparent ${60 * PX_PER_MIN}px)`,
              }}
            >
              {dates.map((date, i) => {
                const dayBlocks = shown.filter((b) => b.date === date);
                const columns = layoutColumns(dayBlocks);
                return (
                  <div
                    key={date}
                    className="relative border-l border-line"
                    onDoubleClick={(e) => e.target === e.currentTarget && addAt(e, date)}
                    title="Double-click to add a block"
                  >
                    {i === todayIndex && now.minutes >= DAY_START && now.minutes <= DAY_END && (
                      <div className="pointer-events-none absolute inset-x-0 z-10 h-px bg-[var(--now)]" style={{ top: (now.minutes - DAY_START) * PX_PER_MIN }}>
                        <div className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-[var(--now)]" />
                      </div>
                    )}
                    {dayBlocks.map((b) => (
                      <GridBlock
                        key={b.id}
                        block={b}
                        project={b.projectId ? projectById.get(b.projectId) : undefined}
                        column={columns.get(b.id)!}
                        overlapping={overlaps.has(b.id)}
                        dragging={preview?.id === b.id}
                        onPointerDown={(e, mode, el) => startDrag(e, b, mode, el)}
                        onPointerMove={onDragMove}
                        onPointerUp={onDragEnd}
                        onOpen={() => setEditing({ id: b.id })}
                        onToggle={() => mark(b, b.percent === 100 ? null : 100)}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted">
          Drag to move · drag the bottom edge to resize · double-click empty space to add · changes apply to this week only
        </p>
      </div>

      {/* Phone: one day at a time */}
      <div className="flex-1 px-4 pb-8 md:hidden">
        <div className="grid grid-cols-7 gap-1">
          {dates.map((d, i) => (
            <button
              key={d}
              onClick={() => setMobileDay(i)}
              className={`flex flex-col items-center rounded-lg py-1.5 text-xs ${
                i === mobileDay ? "bg-accent text-accent-text" : i === todayIndex ? "text-text" : "text-muted"
              }`}
            >
              <span>{WEEKDAYS[i].slice(0, 1)}</span>
              <span className="text-sm tabular-nums">{Number(d.slice(8))}</span>
            </button>
          ))}
        </div>
        <ul className="mt-4 flex flex-col gap-1.5">
          {shown
            .filter((b) => b.date === dates[mobileDay])
            .sort((a, b) => a.startMin - b.startMin)
            .map((b) => (
              <MobileRow
                key={b.id}
                block={b}
                project={b.projectId ? projectById.get(b.projectId) : undefined}
                overlapping={overlaps.has(b.id)}
                onOpen={() => setEditing({ id: b.id })}
                onToggle={() => mark(b, b.percent === 100 ? null : 100)}
                onPercent={(p) => mark(b, p)}
              />
            ))}
        </ul>
        <button
          onClick={() =>
            setEditing({ draft: { date: dates[mobileDay], startMin: 9 * 60, endMin: 10 * 60, title: "", projectId: null } })
          }
          className="mt-3 w-full rounded-xl border border-dashed border-line-strong py-3 text-sm text-muted"
        >
          + Add block
        </button>
      </div>

      {editor}

      {error && (
        <div role="alert" className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-accent px-4 py-2 text-sm text-accent-text shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
}

function NavLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <Link href={href} aria-label={label} className="flex h-7 w-7 items-center justify-center rounded-md text-lg text-muted hover:bg-line hover:text-text">
      {children}
    </Link>
  );
}

function blockStyle(color: string | undefined, percent: number | null): React.CSSProperties {
  if (!color) return {};
  return {
    background: `color-mix(in srgb, ${color} ${percent === null ? 14 : 30}%, var(--surface))`,
    borderLeft: `3px solid ${color}`,
  };
}

function CheckButton({ block, color, onToggle, size }: { block: WeekBlock; color?: string; onToggle: () => void; size: "sm" | "lg" }) {
  const done = block.percent === 100;
  const partial = block.percent !== null && !done;
  const dim = size === "sm" ? "h-4 min-w-4 text-[9px]" : "h-10 min-w-10 text-xs";
  return (
    <button
      type="button"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      aria-label={done ? "Unmark" : "Mark complete"}
      aria-pressed={done}
      className={`flex shrink-0 items-center justify-center rounded-full border tabular-nums ${dim}`}
      style={{
        borderColor: color ?? "var(--line-strong)",
        background: done ? color : "transparent",
        color: done ? "#fff" : "var(--text)",
      }}
    >
      {done ? (
        <svg viewBox="0 0 12 12" className={size === "sm" ? "h-2.5 w-2.5" : "h-4 w-4"} aria-hidden>
          <path d="M2.5 6.2 5 8.5l4.5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : partial ? (
        <span className="px-0.5">{block.percent}</span>
      ) : null}
    </button>
  );
}

function GridBlock({
  block,
  project,
  column,
  overlapping,
  dragging,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onOpen,
  onToggle,
}: {
  block: WeekBlock;
  project?: Project;
  column: { col: number; cols: number };
  overlapping: boolean;
  dragging: boolean;
  onPointerDown: (e: React.PointerEvent, mode: "move" | "resize", el: HTMLElement) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: () => void;
  onOpen: () => void;
  onToggle: () => void;
}) {
  const height = (block.endMin - block.startMin) * PX_PER_MIN;
  const buffer = isBuffer(block);
  const roomy = height >= 34;
  const onCall = block.tags.includes("on-call");

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${block.title}, ${formatTime(block.startMin)} to ${formatTime(block.endMin)}`}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
      onPointerDown={(e) => onPointerDown(e, "move", e.currentTarget)}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className={`group absolute touch-none select-none overflow-hidden rounded-md px-1.5 text-[11px] leading-tight ${
        dragging ? "z-30 cursor-grabbing opacity-90 shadow-lg" : "z-0 cursor-grab"
      } ${buffer ? "border border-dashed border-line-strong text-muted" : ""} ${overlapping ? "outline-2 outline-danger" : ""}`}
      style={{
        top: (block.startMin - DAY_START) * PX_PER_MIN + 1,
        height: height - 2,
        left: `calc(${(column.col / column.cols) * 100}% + 2px)`,
        width: `calc(${100 / column.cols}% - 4px)`,
        ...blockStyle(project?.color, block.percent),
      }}
    >
      <div className={`flex gap-1 ${roomy ? "items-start pt-1" : "h-full items-center"}`}>
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium">{block.title}</div>
          {roomy && (
            <div className="truncate text-muted tabular-nums">
              {formatTime(block.startMin)}–{formatTime(block.endMin)}
              {onCall && <span className="ml-1 rounded bg-black/5 px-1 text-[9px] uppercase tracking-wide dark:bg-white/10">on call</span>}
            </div>
          )}
        </div>
        {!buffer && <CheckButton block={block} color={project?.color} onToggle={onToggle} size="sm" />}
      </div>
      <div
        onPointerDown={(e) => {
          e.stopPropagation();
          onPointerDown(e, "resize", e.currentTarget.parentElement!);
        }}
        className="absolute inset-x-0 bottom-0 h-1.5 cursor-ns-resize"
        aria-hidden
      />
    </div>
  );
}

function MobileRow({
  block,
  project,
  overlapping,
  onOpen,
  onToggle,
  onPercent,
}: {
  block: WeekBlock;
  project?: Project;
  overlapping: boolean;
  onOpen: () => void;
  onToggle: () => void;
  onPercent: (p: number | null) => void;
}) {
  if (isBuffer(block)) {
    return (
      <li onClick={onOpen} className="rounded-lg border border-dashed border-line-strong px-3 py-1.5 text-xs text-muted">
        {formatTime(block.startMin)}–{formatTime(block.endMin)} · Buffer
      </li>
    );
  }
  return (
    <li
      className={`flex items-center gap-3 rounded-lg py-2 pl-3 pr-2 ${overlapping ? "outline-2 outline-danger" : ""}`}
      style={blockStyle(project?.color, block.percent)}
    >
      <button onClick={onOpen} className="min-w-0 flex-1 text-left">
        <div className="truncate text-sm font-medium">{block.title}</div>
        <div className="text-xs text-muted tabular-nums">
          {formatTime(block.startMin)}–{formatTime(block.endMin)}
          {block.tags.includes("on-call") && " · on call"}
        </div>
      </button>
      <PercentInput value={block.percent} onCommit={onPercent} />
      <CheckButton block={block} color={project?.color} onToggle={onToggle} size="lg" />
    </li>
  );
}
