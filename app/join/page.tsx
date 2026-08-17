"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function JoinPage() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") || "";
  const [status, setStatus] = useState<"loading" | "needsLogin" | "ready" | "joining" | "error">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) { setStatus("error"); setError("קישור לא תקין"); return; }
    // ננסה לבדוק אם המשתמש מחובר על ידי קריאה לפרופיל
    fetch("/api/forums").then(() => setStatus("ready")).catch(() => setStatus("ready"));
  }, [token]);

  async function join() {
    setStatus("joining");
    const res = await fetch("/api/invites/accept", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (res.status === 401) {
      router.push(`/login?next=${encodeURIComponent(`/join?token=${token}`)}`);
      return;
    }
    const data = await res.json();
    if (!res.ok) { setStatus("error"); setError(data.error || "שגיאה"); return; }
    router.push(`/forum/${data.forumId}`);
  }

  return (
    <div style={{ maxWidth: 420, margin: "60px auto", textAlign: "center" }}>
      <div className="card" style={{ padding: 28 }}>
        <h2 style={{ marginBottom: 10 }}>הצטרפות לפורום</h2>
        {status === "error" && <p style={{ color: "var(--danger)" }}>{error}</p>}
        {(status === "ready" || status === "loading") && (
          <>
            <p style={{ color: "var(--ink-dim)", marginBottom: 18 }}>לחץ להצטרפות לפורום שאליו הוזמנת.</p>
            <button className="btn-primary" onClick={join} disabled={status === "loading"}>הצטרפות</button>
          </>
        )}
        {status === "joining" && <p>מצטרף...</p>}
      </div>
    </div>
  );
}
