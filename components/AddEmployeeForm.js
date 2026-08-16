"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

export default function AddEmployeeForm() {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const valid = name.trim() && /^\d{9,11}$/.test(phone);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!valid) return;
    setLoading(true);
    setError("");
    const initials = name.trim().split(/\s+/).slice(-2).map((w) => w[0]).join("").toUpperCase();
    const { error: insertError } = await supabase.from("employees").insert({
      name: name.trim(),
      phone,
      role: "Nhân viên",
      initials,
      status: "Đang hoạt động",
    });
    setLoading(false);
    if (insertError) {
      setError("Không thêm được: " + insertError.message);
      return;
    }
    setName(""); setPhone(""); setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={{ background: "#A9201F", color: "#fff", border: "none", borderRadius: 8, padding: "9px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
        + Thêm nhân viên
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ background: "#fff", border: "1px solid #E2E5DF", borderRadius: 12, padding: 16, display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
      <div>
        <label style={label}>Họ tên</label>
        <input value={name} onChange={(e) => setName(e.target.value)} style={input} placeholder="NGUYỄN VĂN A" />
      </div>
      <div>
        <label style={label}>Số điện thoại</label>
        <input value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))} style={input} placeholder="09xxxxxxxx" />
      </div>
      {error && <div style={{ color: "#C23616", fontSize: 12 }}>{error}</div>}
      <button type="submit" disabled={!valid || loading} style={{ background: "#A9201F", color: "#fff", border: "none", borderRadius: 8, padding: "9px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer", opacity: !valid || loading ? 0.6 : 1 }}>
        {loading ? "Đang lưu..." : "Lưu"}
      </button>
      <button type="button" onClick={() => setOpen(false)} style={{ background: "#fff", color: "#6B7269", border: "1px solid #E2E5DF", borderRadius: 8, padding: "9px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
        Hủy
      </button>
    </form>
  );
}

const label = { fontSize: 12, fontWeight: 600, color: "#6B7269", display: "block", marginBottom: 4 };
const input = { padding: "8px 12px", borderRadius: 8, border: "1px solid #E2E5DF", fontSize: 13 };
