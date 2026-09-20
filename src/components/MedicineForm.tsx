"use client";

import { useState, type FormEvent } from "react";

interface Props {
  onAdded: () => void;
}

export default function MedicineForm({ onAdded }: Props) {
  const [name, setName] = useState("");
  const [doseCount, setDoseCount] = useState(1);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Enter a medicine name first");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/medicines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, doseCount }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Couldn't add medicine");
        return;
      }
      setName("");
      setDoseCount(1);
      onAdded();
    } catch {
      setError("Couldn't add medicine");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="card"
      style={{ display: "flex", flexDirection: "column", gap: 10 }}
    >
      <p className="muted" style={{ margin: 0 }}>
        Add medicine
      </p>
      {error && <p className="error-text">{error}</p>}
      <input
        type="text"
        placeholder="Medicine name"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          setError("");
        }}
      />
      <div className="row">
        <span className="muted">Doses per day</span>
        <select
          value={doseCount}
          onChange={(e) => setDoseCount(Number(e.target.value))}
          style={{ width: 80 }}
        >
          <option value={1}>1</option>
          <option value={2}>2</option>
          <option value={3}>3</option>
          <option value={4}>4</option>
        </select>
      </div>
      <button type="submit" className="primary" disabled={submitting}>
        {submitting ? "Adding…" : "Add"}
      </button>
    </form>
  );
}
