"use client";

import { useState } from "react";

/** Type any percent and press Enter (or tap away) to save. Empty clears the mark. */
export function PercentInput({
  value,
  onCommit,
  className = "",
}: {
  value: number | null;
  onCommit: (percent: number | null) => void;
  className?: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);

  const commit = () => {
    if (draft === null) return;
    const trimmed = draft.trim();
    const n = trimmed === "" ? null : Math.round(Number(trimmed));
    setDraft(null);
    if (n !== null && (isNaN(n) || n < 0 || n > 100)) return;
    if (n !== value) onCommit(n);
  };

  return (
    <label className={`inline-flex items-center rounded-md border border-line px-1.5 ${className}`}>
      <input
        inputMode="numeric"
        aria-label="Percent complete"
        placeholder="–"
        value={draft ?? (value === null ? "" : String(value))}
        onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, "").slice(0, 3))}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()}
        className="w-7 bg-transparent py-1 text-right text-sm tabular-nums outline-none"
      />
      <span className="text-xs text-muted">%</span>
    </label>
  );
}
