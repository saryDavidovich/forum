"use client";
import { useEffect, useState } from "react";

type Ad = { id: string; type: string; url: string; linkUrl?: string };

export default function ClassifiedsSidebar() {
  const [ads, setAds] = useState<Ad[] | null>(null);

  useEffect(() => {
    fetch("/api/ads/approved").then((r) => r.json()).then(setAds).catch(() => setAds([]));
  }, []);

  if (!ads || ads.length === 0) return null;

  return (
    <aside style={{ width: 200, flexShrink: 0 }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: "var(--ink-dim)" }}>לוח מודעות</div>
      <div style={{ display: "grid", gap: 10 }}>
        {ads.map((ad) => {
          const inner =
            ad.type === "IMAGE" ? <img src={ad.url} alt="" style={{ width: "100%", display: "block" }} /> :
            ad.type === "VIDEO" ? <video src={ad.url} controls style={{ width: "100%", display: "block" }} /> :
            <div style={{ padding: 12, fontSize: 13 }}>{ad.url}</div>;
          return ad.linkUrl ? (
            <a key={ad.id} href={ad.linkUrl} target="_blank" rel="noopener noreferrer" className="card" style={{ overflow: "hidden" }}>{inner}</a>
          ) : (
            <div key={ad.id} className="card" style={{ overflow: "hidden" }}>{inner}</div>
          );
        })}
      </div>
    </aside>
  );
}
