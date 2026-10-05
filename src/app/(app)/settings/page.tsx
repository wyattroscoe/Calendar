import { requireUser } from "@/lib/auth";
import { loadProjects } from "@/lib/weeks";
import { ProjectSettings } from "./ProjectSettings";

export default async function SettingsPage() {
  const userId = await requireUser();
  const projects = await loadProjects(userId);
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-8">
      <h1 className="text-lg font-medium tracking-tight">Settings</h1>
      <section className="mt-6">
        <h2 className="text-sm font-medium">Projects and colors</h2>
        <p className="mt-1 text-sm text-muted">Changes apply everywhere, including past weeks.</p>
        <ProjectSettings projects={projects} />
      </section>
      <p className="mt-10 text-xs text-muted">Weekly template, recipes and connections arrive in later phases.</p>
    </div>
  );
}
