import { Header } from "@/components/Header";
import { requireUser } from "@/lib/auth";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  await requireUser();
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col">{children}</main>
    </>
  );
}
