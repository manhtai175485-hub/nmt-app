"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

export default function ConfirmPaymentForm({ dossierId }) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Tiền mặt");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleConfirm(e) {
    e.preventDefault();
    const value = parseInt(amount.replace(/\D/g, ""), 10);
    if (!value) { setError("Nhập số tiền hợp lệ."); return; }
    setLoading(true);
    setError("");
    const { error: updateError } = await supabase.from("dossiers").update({
      payment_status: "Đã thu",
      amount_paid: value,
      amount_due: value,
      paid_at: new Date().toISOString(),
      payment_method: method,
    }).eq("id", dossierId);
    setLoading(false);
    if (updateError) { setError("Lỗi: " + updateError.message); return; }
    router.refresh();
  }

  if (!open) {
    return <button onClick={() => setOpen(true)} style={btn}>Xác nhận đã thu</button>;
  }

  return (
    <form onSubmit={handleConfirm} style={{ display: "flex", gap: 6, alignItems: "center" }}>
      <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Số tiền" style={{ width: 100, padding: "6px 8px", borderRadius: 6, border: "1px solid #E2E5DF", fontSize: 12 }} />
      <select value={method} onChange={(e) => setMethod(e.target.value)} style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #E2E5DF", fontSize: 12 }}>
        <option>Tiền mặt</option>
        <option>Chuyển khoản</option>
      </select>
      <button type="submit" disabled={loading} style={btn}>{loading ? "..." : "Lưu"}</button>
      {error && <span style={{ color: "#C23616", fontSize: 11 }}>{error}</span>}
    </form>
  );
}

const btn = { background: "#A9201F", color: "#fff", border: "none", borderRadius: 6, padding: "6px 12px", fontWeight: 600, fontSize: 12, cursor: "pointer" };
