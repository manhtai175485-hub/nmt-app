"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NotificationBell({ items }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative", marginBottom: 14 }}>
      <button onClick={() => setOpen((o) => !o)} style={{ display: "flex", alignItems: "center", gap: 6, width: "100%", background: "#F2F4F1", border: "none", borderRadius: 8, padding: "8px 10px", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#1F2421" }}>
        🔔 Thông báo
        {items.length > 0 && (
          <span style={{ marginLeft: "auto", background: "#A9201F", color: "#fff", borderRadius: 999, fontSize: 11, fontWeight: 700, padding: "1px 7px" }}>{items.length}</span>
        )}
      </button>
      {open && (
        <div style={{ position: "absolute", top: "110%", left: 0, width: 280, background: "#fff", border: "1px solid #E2E5DF", borderRadius: 10, boxShadow: "0 8px 24px rgba(31,36,33,0.12)", zIndex: 20, maxHeight: 320, overflowY: "auto" }}>
          {items.length === 0 ? (
            <div style={{ padding: 16, fontSize: 12, color: "#6B7269", textAlign: "center" }}>Không có thông báo mới.</div>
          ) : (
            items.map((it, i) => (
              <div key={i} onClick={() => { setOpen(false); router.push(`/hkd/${it.id}`); }}
                style={{ padding: "10px 14px", fontSize: 12, cursor: "pointer", borderTop: i > 0 ? "1px solid #EEF0EC" : "none" }}>
                <div style={{ fontWeight: 600, color: "#1F2421" }}>{it.code} — {it.name}</div>
                <div style={{ color: "#6B7269", marginTop: 2 }}>{it.message}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
