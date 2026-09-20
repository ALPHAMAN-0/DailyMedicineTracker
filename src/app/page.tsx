import Link from "next/link";
import { getTodayChecklist } from "@/lib/sheets";
import { todayDisplay } from "@/lib/date";
import ChecklistForm from "@/components/ChecklistForm";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { medicines, checks } = await getTodayChecklist();

  return (
    <main className="page">
      <div className="row">
        <p style={{ fontWeight: 500, fontSize: 16, margin: 0 }}>
          {todayDisplay()}
        </p>
        <Link href="/medicines">Manage medicines</Link>
      </div>
      <ChecklistForm medicines={medicines} initialChecks={checks} />
    </main>
  );
}
