"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const googleError = searchParams.get("error");
  const next = searchParams.get("next") || "/profile";
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const url = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const res = await fetch(url, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    setBusy(false);
    if (!res.ok) { setError((await res.json()).error || "שגיאה"); return; }
    const data = await res.json();
    router.push(data.onboarded ? next : "/onboarding");
    router.refresh();
  }

  return (
    <div style={{ maxWidth: 380, margin: "40px auto" }}>
      <div style={{ display: "flex", marginBottom: 20 }}>
        <button className={mode === "login" ? "btn-primary" : "btn"} style={{ flex: 1 }} onClick={() => setMode("login")}>התחברות</button>
        <button className={mode === "register" ? "btn-primary" : "btn"} style={{ flex: 1 }} onClick={() => setMode("register")}>הרשמה</button>
      </div>

      <form onSubmit={submit} className="card" style={{ padding: 22 }}>
        {mode === "register" && (
          <>
            <label style={{ fontSize: 13 }}>שם מלא</label>
            <input value={name} onChange={(e) => setName(e.target.value)} style={{ width: "100%", marginTop: 4, marginBottom: 12 }} />
          </>
        )}
        <label style={{ fontSize: 13 }}>כתובת אימייל</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%", marginTop: 4, marginBottom: 12 }} />

        <label style={{ fontSize: 13 }}>סיסמה</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: "100%", marginTop: 4, marginBottom: 16 }} />

        {error && <div style={{ color: "var(--danger)", fontSize: 13, marginBottom: 10 }}>{error}</div>}
        {googleError && <div style={{ color: "var(--danger)", fontSize: 13, marginBottom: 10 }}>{googleError}</div>}

        <button type="submit" className="btn-primary" style={{ width: "100%" }} disabled={busy}>
          {busy ? "רגע..." : mode === "login" ? "התחברות" : "הרשמה"}
        </button>

        <div style={{ textAlign: "center", margin: "14px 0", color: "var(--ink-dim)", fontSize: 13 }}>או</div>

        <a href={`/api/auth/google?next=${encodeURIComponent(next)}`} className="btn" style={{ width: "100%", display: "block", textAlign: "center" }}>
          התחברות עם Google
        </a>
      </form>
    </div>
  );
}
