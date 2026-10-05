"use client";

import { useEffect, useState } from "react";
import type { BlockInput } from "@/app/actions";
import type { Project } from "@/db/schema";
import { DAY_END, DAY_START, formatDayLabel, formatTimeAmPm, SLOT, WEEKDAYS, type ISODate } from "@/lib/time";
import { PercentInput } from "./PercentInput";

const TIMES = Array.from({ length: (DAY_END - DAY_START) / SLOT + 1 }, (_, i) => DAY_START + i * SLOT);

export function BlockEditor({
  initial,
  isNew,
  percent,
  projects,
  dates,
  onSave,
  onDelete,
  onPercent,
  onClose,
}: {
  initial: BlockInput;
  isNew: boolean;
  percent: number | null;
  projects: Project[];
  dates: ISODate[];
  onSave: (values: BlockInput) => void;
  onDelete?: () => void;
  onPercent?: (percent: number | null) => void;
  onClose: () => void;
}) {
  const [values, setValues] = useState(initial);
  const set = <K extends keyof BlockInput>(key: K, value: BlockInput[K]) => setValues((v) => ({ ...v, [key]: value }));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(values);
  };

  const field = "w-full rounded-lg border border-line px-2.5 py-2 text-sm outline-none focus:border-line-strong";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/25 p-4 sm:items-center" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl border border-line bg-surface p-5 shadow-xl"
      >
        <input
          autoFocus={isNew}
          value={values.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Title"
          aria-label="Title"
          className="w-full bg-transparent text-base font-medium outline-none"
        />

        <div className="mt-4 grid grid-cols-2 gap-2">
          <select
            value={values.projectId ?? ""}
            onChange={(e) => set("projectId", e.target.value ? Number(e.target.value) : null)}
            aria-label="Project"
            className={`${field} col-span-2`}
          >
            <option value="">No project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.parentId ? "  " : ""}
                {p.name}
              </option>
            ))}
          </select>
          <select value={values.date} onChange={(e) => set("date", e.target.value)} aria-label="Day" className={`${field} col-span-2`}>
            {dates.map((d, i) => (
              <option key={d} value={d}>
                {WEEKDAYS[i]} {formatDayLabel(d)}
              </option>
            ))}
          </select>
          <select
            value={values.startMin}
            onChange={(e) => {
              const start = Number(e.target.value);
              const duration = values.endMin - values.startMin;
              setValues((v) => ({ ...v, startMin: start, endMin: Math.min(start + duration, DAY_END) }));
            }}
            aria-label="Start"
            className={field}
          >
            {TIMES.slice(0, -1).map((t) => (
              <option key={t} value={t}>
                {formatTimeAmPm(t)}
              </option>
            ))}
          </select>
          <select value={values.endMin} onChange={(e) => set("endMin", Number(e.target.value))} aria-label="End" className={field}>
            {TIMES.filter((t) => t > values.startMin).map((t) => (
              <option key={t} value={t}>
                {formatTimeAmPm(t)}
              </option>
            ))}
          </select>
        </div>

        {!isNew && onPercent && (
          <div className="mt-4 flex items-center gap-2 text-sm">
            <span className="text-muted">Done</span>
            <PercentInput value={percent} onCommit={onPercent} />
            <button type="button" onClick={() => onPercent(percent === 100 ? null : 100)} className="rounded-md border border-line px-2 py-1">
              {percent === 100 ? "Unmark" : "Complete"}
            </button>
          </div>
        )}

        <div className="mt-5 flex items-center gap-2">
          {onDelete && (
            <button type="button" onClick={onDelete} className="text-sm text-danger">
              Delete
            </button>
          )}
          <div className="flex-1" />
          <button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-sm text-muted">
            Cancel
          </button>
          <button className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-text">{isNew ? "Add" : "Save"}</button>
        </div>
      </form>
    </div>
  );
}
