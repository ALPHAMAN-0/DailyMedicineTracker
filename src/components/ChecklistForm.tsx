"use client";

import { useState } from "react";
import type { Medicine } from "@/lib/sheets";

interface Props {
  medicines: Medicine[];
  initialChecks: Record<string, boolean[]>;
}

export default function ChecklistForm({ medicines, initialChecks }: Props) {
  const [checks, setChecks] = useState(initialChecks);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  function toggle(medicineId: string, doseIndex: number) {
    setChecks((prev) => {
      const doses = [...(prev[medicineId] ?? [])];
      doses[doseIndex] = !doses[doseIndex];
      return { ...prev, [medicineId]: doses };
    });
    setStatus("idle");
  }

  async function handleSave() {
    setSaving(true);
    setStatus("idle");
    try {
      const res = await fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checks }),
      });
      setStatus(res.ok ? "saved" : "error");
    } catch {
      setStatus("error");
    } finally {
      setSaving(false);
    }
  }

  if (medicines.length === 0) {
    return (
      <div className="card">
        <p className="muted" style={{ margin: 0 }}>
          No medicines yet. Add one from Manage medicines.
        </p>
      </div>
    );
  }

  return (
    <>
      {medicines.map((med) => (
        <div className="card" key={med.id}>
          <p style={{ fontWeight: 500, fontSize: 14, margin: 0 }}>{med.name}</p>
          <div className="dose-row">
            {Array.from({ length: med.doseCount }, (_, i) => (
              <label className="dose-pill" key={i}>
                <input
                  type="checkbox"
                  checked={Boolean(checks[med.id]?.[i])}
                  onChange={() => toggle(med.id, i)}
                />
                <span>Dose {i + 1}</span>
              </label>
            ))}
          </div>
        </div>
      ))}

      {status === "error" && (
        <p className="error-text">Couldn&apos;t save. Try again.</p>
      )}
      {status === "saved" && (
        <p className="muted" style={{ color: "var(--text-accent)" }}>
          Saved for today.
        </p>
      )}

      <button className="primary" onClick={handleSave} disabled={saving}>
        {saving ? "Saving…" : "Save today"}
      </button>
    </>
  );
}
