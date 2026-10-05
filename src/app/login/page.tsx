import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-xs">
        <h1 className="mb-6 text-center text-lg font-medium tracking-tight">Weekly Calendar</h1>
        <LoginForm />
      </div>
    </main>
  );
}
