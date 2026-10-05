import { ComingSoon } from "@/components/ComingSoon";

export default function DashboardPage() {
  return (
    <ComingSoon title="Dashboard" phase={2}>
      Planned vs actual hours by project, and consistency scores for the week, month, quarter and year.
    </ComingSoon>
  );
}
