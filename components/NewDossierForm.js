"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

const PROCEDURES = ["Thành lập HKD", "Thay đổi HKD", "Chấm dứt HKD"];

export default function NewDossierForm({ wards, employees = [], isManager = false, defaultEmployeeId }) {
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState({ name: "", procedure: PROCEDURES[0], ward_id: wards[0]?.id || "", speed: "normal", assigned_employee_id: defaultEmployeeId || "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) { setError("Vui lòng nhập tên hộ kinh doanh."); return; }
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    const { data: employee } = await supabase.from("employees").select("id").eq("auth_user_id", user.id).single();

    const code = `HKD-${Date.now().toString().slice(-6)}`;
    const dueDays = form.speed === "fast" ? 1 : 3;
    const due_at = new Date(Date.now() + dueDays * 24 * 60 * 60 * 1000).toISOString();

    const { data: dossier, error: insertError } = await supabase.from("dossiers").insert({
      code,
      name: form.name.trim(),
      group: "Hộ kinh doanh",
      procedure: form.procedure,
      ward_id: form.ward_id || null,
      assigned_employee_id: form.assigned_employee_id || employee.id,
      status: "pending",
      speed: form.speed,
      due_at,
    }).select("id").single();

    if (insertError) {
      setError("Không tạo được hồ sơ: " + insertError.message);
      setLoading(false);
      return;
    }

    await supabase.from("dossier_history").insert({
      dossier_id: dossier.id,
      status: "pending",
      changed_by: employee.id,
    });

    router.push(`/hkd/${dossier.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} style={{ background: "#fff", borderRadius: 12, padding: 20, border: "1px solid #E2E5DF" }}>
      <Field label="Tên hộ kinh doanh">
        <input value={form.name} onChange={(e) => set("name", e.target.value)} style={inputStyle} placeholder="Hộ KD Minh Anh" />
      </Field>

      <Field label="Loại thủ tục">
        <select value={form.procedure} onChange={(e) => set("procedure", e.target.value)} style={inputStyle}>
          {PROCEDURES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </Field>

      <Field label="Phường/Xã">
        <select value={form.ward_id} onChange={(e) => set("ward_id", e.target.value)} style={inputStyle}>
          {wards.length === 0 && <option value="">— Chưa có dữ liệu phường/xã —</option>}
          {wards.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
      </Field>

      {isManager && employees.length > 0 && (
        <Field label="Giao cho nhân viên">
          <select value={form.assigned_employee_id} onChange={(e) => set("assigned_employee_id", e.target.value)} style={inputStyle}>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.name}{e.id === defaultEmployeeId ? " (tôi)" : ""}</option>)}
          </select>
        </Field>
      )}

      <Field label="Loại hồ sơ">
        <select value={form.speed} onChange={(e) => set("speed", e.target.value)} style={inputStyle}>
          <option value="normal">Thường (3 ngày)</option>
          <option value="fast">Nhanh (1 ngày)</option>
        </select>
      </Field>

      {error && <div style={{ color: "#C23616", fontSize: 13, marginBottom: 12 }}>{error}</div>}

      <button type="submit" disabled={loading} style={{ background: "#A9201F", color: "#fff", border: "none", borderRadius: 8, padding: "10px 18px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
        {loading ? "Đang tạo..." : "Tạo hồ sơ"}
      </button>
    </form>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: "#6B7269", display: "block", marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = { width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #E2E5DF", fontSize: 13, boxSizing: "border-box" };
