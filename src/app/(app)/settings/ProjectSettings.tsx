"use client";

import { useRef, useState } from "react";
import { updateProject } from "@/app/actions";
import type { Project } from "@/db/schema";

export function ProjectSettings({ projects }: { projects: Project[] }) {
  const [error, setError] = useState<string | null>(null);
  const colorTimers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const save = (id: number, input: { name?: string; color?: string }) =>
    updateProject(id, input).then(
      () => setError(null),
      () => setError("Couldn't save that change."),
    );

  // The color picker fires continuously while dragging; save once it settles.
  const saveColor = (id: number, color: string) => {
    clearTimeout(colorTimers.current.get(id));
    colorTimers.current.set(id, setTimeout(() => save(id, { color }), 400));
  };

  return (
    <>
      <ul className="mt-4 divide-y divide-line rounded-xl border border-line bg-surface">
        {projects.map((p) => (
          <li key={p.id} className={`flex items-center gap-3 px-3 py-2 ${p.parentId ? "pl-8" : ""}`}>
            <input
              type="color"
              defaultValue={p.color}
              onChange={(e) => saveColor(p.id, e.target.value)}
              aria-label={`${p.name} color`}
              className="h-7 w-7 shrink-0 cursor-pointer rounded-md border-0 bg-transparent p-0"
            />
            <input
              defaultValue={p.name}
              onBlur={(e) => e.target.value !== p.name && save(p.id, { name: e.target.value })}
              aria-label="Project name"
              className="min-w-0 flex-1 bg-transparent py-1 text-sm outline-none"
            />
          </li>
        ))}
      </ul>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </>
  );
}
