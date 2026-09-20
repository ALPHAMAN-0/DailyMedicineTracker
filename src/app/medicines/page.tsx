import Link from "next/link";
import { getMedicines } from "@/lib/sheets";
import MedicineList from "@/components/MedicineList";

export const dynamic = "force-dynamic";

export default async function MedicinesPage() {
  const medicines = await getMedicines(true);

  return (
    <main className="page">
      <div className="row">
        <p style={{ fontWeight: 500, fontSize: 16, margin: 0 }}>Medicines</p>
        <Link href="/">Back to today</Link>
      </div>
      <MedicineList initialMedicines={medicines} />
    </main>
  );
}
