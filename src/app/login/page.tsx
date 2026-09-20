"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!passcode) {
      setError("Enter your passcode");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      if (!res.ok) {
        setError("Incorrect passcode");
        setLoading(false);
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <div
        className="card"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          padding: "32px 20px",
          marginTop: 40,
        }}
      >
        <p style={{ fontWeight: 500, fontSize: 16, margin: 0 }}>
          Daily medicine tracker
        </p>
        <p className="muted" style={{ margin: 0 }}>
          Enter your passcode
        </p>
        <form
          onSubmit={handleSubmit}
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            marginTop: 8,
          }}
        >
          {error && <p className="error-text">{error}</p>}
          <input
            type="password"
            placeholder="Passcode"
            value={passcode}
            onChange={(e) => {
              setPasscode(e.target.value);
              setError("");
            }}
            autoFocus
          />
          <button type="submit" className="primary" disabled={loading}>
            {loading ? "Checking…" : "Unlock"}
          </button>
        </form>
      </div>
    </main>
  );
}
