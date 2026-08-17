"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

export default function ReassignEmployee({ dossierId, currentEmployeeId, employees }) {
  const router = useRouter();
  const supabase = createClient();
  const [value, setValue] = useState(currentEmployeeId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleChange(newId) {
    setValue(newId);
    if (newId === currentEmployeeId) return;
    setLoading(true);
    setError("");
    const { error: updateError } = await supabase.from("dossiers").update({ assigned_employee_id: newId }).eq("id", dossierId);
    setLoading(false);
    if (updateError) { setError("Lỗi: " + updateError.message); return; }
    router.refresh();
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <select value={value} onChange={(e) => handleChange(e.target.value)} disabled={loading}
        style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #E2E5DF", fontSize: 13 }}>
        {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
      </select>
      {loading && <span style={{ fontSize: 12, color: "#6B7269" }}>Đang lưu...</span>}
      {error && <span style={{ fontSize: 12, color: "#C23616" }}>{error}</span>}
    </div>
  );
}
