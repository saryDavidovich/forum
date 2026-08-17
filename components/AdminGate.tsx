"use client";
import { useEffect, useState } from "react";
import AdminPanel from "./AdminPanel";

export default function AdminGate() {
  const [showCodeBox, setShowCodeBox] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "F8") {
        e.preventDefault();
        setShowCodeBox((v) => !v);
        setError("");
      }
      if (e.key === "Escape") setShowCodeBox(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    if (data.ok) {
      setShowCodeBox(false);
      setCode("");
      setShowPanel(true);
    } else {
      setError("קוד שגוי");
    }
  }

  if (showPanel) return <AdminPanel onClose={() => setShowPanel(false)} />;
  if (!showCodeBox) return null;

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(15,27,48,0.55)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999,
      }}
      onClick={() => setShowCodeBox(false)}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submitCode}
        className="card"
        style={{ padding: 20, width: 280 }}
      >
        <input
          type="password"
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="קוד"
          style={{ width: "100%", marginBottom: 10 }}
        />
        {error && <div style={{ color: "var(--danger)", fontSize: 13, marginBottom: 8 }}>{error}</div>}
        <button type="submit" className="btn-primary" style={{ width: "100%" }}>אישור</button>
      </form>
    </div>
  );
}
