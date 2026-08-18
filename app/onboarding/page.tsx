"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function onFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => setAvatarUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/onboarding", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName, avatarUrl: avatarUrl || undefined, bio }),
    });
    setBusy(false);
    if (!res.ok) { setError((await res.json()).error || "שגיאה"); return; }
    router.push("/profile");
    router.refresh();
  }

  return (
    <div style={{ maxWidth: 420, margin: "40px auto" }}>
      <h2 style={{ marginBottom: 6 }}>נעים להכיר!</h2>
      <p style={{ color: "var(--ink-dim)", marginBottom: 20 }}>בוא נגדיר את הפרופיל שלך בפורומים.</p>

      <form onSubmit={submit} className="card" style={{ padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <label style={{ cursor: "pointer", textAlign: "center" }}>
            <div style={{
              width: 84, height: 84, borderRadius: "50%", overflow: "hidden",
              background: avatarUrl ? "transparent" : "var(--navy-800)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#f3e6c8", fontSize: 28, border: "1px solid var(--line)",
            }}>
              {avatarUrl ? <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "+"}
            </div>
            <input type="file" accept="image/*" style={{ display: "none" }}
              onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
            <div style={{ fontSize: 12, color: "var(--ink-dim)", marginTop: 6 }}>
              {avatarUrl ? "החלף תמונה" : "הוספת תמונת פרופיל (רשות)"}
            </div>
          </label>
        </div>
        {!avatarUrl && (
          <p style={{ fontSize: 12, color: "var(--ink-dim)", textAlign: "center", marginBottom: 16 }}>
            אם לא תבחר תמונה, ניצור לך עיגול צבעוני אוטומטית - בדיוק כמו בגוגל.
          </p>
        )}

        <label style={{ fontSize: 13 }}>שם תצוגה (חובה, ייחודי במערכת)</label>
        <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} style={{ width: "100%", marginTop: 4, marginBottom: 14 }} />

        <label style={{ fontSize: 13 }}>כמה מילים עליך (רשות, עד 40 תווים)</label>
        <input value={bio} maxLength={40} onChange={(e) => setBio(e.target.value)} style={{ width: "100%", marginTop: 4 }} />
        <div style={{ fontSize: 11, color: "var(--ink-dim)", textAlign: "left", marginTop: 4, marginBottom: 16 }}>{bio.length}/40</div>

        {error && <div style={{ color: "var(--danger)", fontSize: 13, marginBottom: 10 }}>{error}</div>}

        <button type="submit" className="btn-primary" style={{ width: "100%" }} disabled={busy}>
          {busy ? "שומר..." : "המשך לפורומים"}
        </button>
      </form>
    </div>
  );
}
