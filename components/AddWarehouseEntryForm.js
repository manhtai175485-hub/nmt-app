"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

const GROUPS = ["Hộ kinh doanh", "Công ty", "Thuế"];
const SEVERITIES = [
  { value: "tip", label: "🔵 Lưu ý" },
  { value: "warning", label: "🟠 Cảnh báo" },
  { value: "block", label: "🔴 Chặn" },
];

export default function AddWarehouseEntryForm({ wards }) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ group: GROUPS[0], procedure: "", ward_id: "", severity: "tip", title: "", content: "", suggested_fix: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.procedure.trim() || !form.title.trim() || !form.content.trim()) {
      setError("Vui lòng điền đủ Thủ tục, Tiêu đề và Nội dung.");
      return;
    }
    setLoading(true);
    setError("");
    const { data: { user } } = await supabase.auth.getUser();
    const { data: employee } = await supabase.from("employees").select("id").eq("auth_user_id", user.id).single();

    const { error: insertError } = await supabase.from("warehouse_entries").insert({
      group: form.group,
      procedure: form.procedure.trim(),
      ward_id: form.ward_id || null,
      severity: form.severity,
      title: form.title.trim(),
      content: form.content.trim(),
      suggested_fix: form.suggested_fix.trim() || null,
      review_status: "approved",
      reported_by: employee.id,
    });
    setLoading(false);
    if (insertError) { setError("Lỗi: " + insertError.message); return; }
    setForm({ group: GROUPS[0], procedure: "", ward_id: "", severity: "tip", title: "", content: "", suggested_fix: "" });
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return <button onClick={() => setOpen(true)} style={{ background: "#A9201F", color: "#fff", border: "none", borderRadius: 8, padding: "9px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>+ Thêm mục mới</button>;
  }

  return (
    <form onSubmit={handleSubmit} style={{ background: "#fff", border: "1px solid #E2E5DF", borderRadius: 12, padding: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
        <div>
          <label style={label}>Nhóm</label>
          <select value={form.group} onChange={(e) => set("group", e.target.value)} style={input}>
            {GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <label style={label}>Phường/Xã (tùy chọn)</label>
          <select value={form.ward_id} onChange={(e) => set("ward_id", e.target.value)} style={input}>
            <option value="">Mọi phường/xã</option>
            {wards.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
        <div>
          <label style={label}>Mức độ</label>
          <select value={form.severity} onChange={(e) => set("severity", e.target.value)} style={input}>
            {SEVERITIES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>
      <div style={{ marginBottom: 10 }}>
        <label style={label}>Thủ tục</label>
        <input value={form.procedure} onChange={(e) => set("procedure", e.target.value)} style={input} placeholder="Thành lập HKD" />
      </div>
      <div style={{ marginBottom: 10 }}>
        <label style={label}>Tiêu đề</label>
        <input value={form.title} onChange={(e) => set("title", e.target.value)} style={input} placeholder="Thiếu bản sao CCCD công chứng" />
      </div>
      <div style={{ marginBottom: 10 }}>
        <label style={label}>Nội dung</label>
        <textarea value={form.content} onChange={(e) => set("content", e.target.value)} style={{ ...input, minHeight: 60 }} />
      </div>
      <div style={{ marginBottom: 10 }}>
        <label style={label}>Cách xử lý đề xuất (tùy chọn)</label>
        <textarea value={form.suggested_fix} onChange={(e) => set("suggested_fix", e.target.value)} style={{ ...input, minHeight: 44 }} />
      </div>
      {error && <div style={{ color: "#C23616", fontSize: 12, marginBottom: 10 }}>{error}</div>}
      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" disabled={loading} style={{ background: "#A9201F", color: "#fff", border: "none", borderRadius: 8, padding: "9px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
          {loading ? "Đang lưu..." : "Lưu"}
        </button>
        <button type="button" onClick={() => setOpen(false)} style={{ background: "#fff", color: "#6B7269", border: "1px solid #E2E5DF", borderRadius: 8, padding: "9px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
          Hủy
        </button>
      </div>
    </form>
  );
}

const label = { fontSize: 12, fontWeight: 600, color: "#6B7269", display: "block", marginBottom: 4 };
const input = { width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #E2E5DF", fontSize: 13, boxSizing: "border-box" };
