"use client";

import { useState } from "react";
import type { Medicine } from "@/lib/sheets";
import MedicineForm from "./MedicineForm";

interface Props {
  initialMedicines: Medicine[];
}

export default function MedicineList({ initialMedicines }: Props) {
  const [medicines, setMedicines] = useState(initialMedicines);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/medicines");
    if (res.ok) {
      const data = await res.json();
      setMedicines(data.medicines ?? []);
    }
  }

  async function handleRemove(id: string) {
    setRemovingId(id);
    try {
      await fetch(`/api/medicines/${id}`, { method: "DELETE" });
      setMedicines((prev) => prev.filter((m) => m.id !== id));
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {medicines.length === 0 && <p className="muted">No medicines yet.</p>}
        {medicines.map((med) => (
          <div className="card row" key={med.id}>
            <span style={{ fontSize: 14 }}>
              {med.name}{" "}
              <span className="muted">
                · {med.doseCount} {med.doseCount === 1 ? "dose" : "doses"}
              </span>
            </span>
            <button
              className="danger"
              onClick={() => handleRemove(med.id)}
              disabled={removingId === med.id}
              aria-label={`Remove ${med.name}`}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      <MedicineForm onAdded={refresh} />
    </>
  );
}
