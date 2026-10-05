export function ComingSoon({ title, phase, children }: { title: string; phase: number; children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-16 text-center">
      <h1 className="text-lg font-medium tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-muted">{children}</p>
      <p className="mt-6 text-xs uppercase tracking-wider text-muted">Coming in Phase {phase}</p>
    </div>
  );
}
