"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

export default function ToggleEmployeeStatus({ employeeId, currentStatus }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const next = currentStatus === "Đang hoạt động" ? "Ngừng hoạt động" : "Đang hoạt động";
    await supabase.from("employees").update({ status: next }).eq("id", employeeId);
    setLoading(false);
    router.refresh();
  }

  return (
    <button onClick={toggle} disabled={loading} style={{ background: "#fff", color: "#A9201F", border: "1px solid #E2C7C6", borderRadius: 8, padding: "9px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
      {loading ? "Đang cập nhật..." : currentStatus === "Đang hoạt động" ? "Chuyển ngừng hoạt động" : "Kích hoạt lại"}
    </button>
  );
}
