"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import { STATUS, NEXT_STATUS } from "@/lib/constants";

export default function StatusActions({ dossierId, currentStatus, appointmentUploaded, licenseUploaded }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const next = NEXT_STATUS[currentStatus];

  async function advance(toStatus) {
    setLoading(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    const { data: employee } = await supabase.from("employees").select("id").eq("auth_user_id", user.id).single();

    const patch = { status: toStatus };
    if (toStatus === "approved") patch.approved_date = new Date().toISOString();
    if (toStatus === "sent") patch.completed_at = new Date().toISOString();

    const { error: updateError } = await supabase.from("dossiers").update(patch).eq("id", dossierId);
    if (updateError) {
      setError("Không cập nhật được: " + updateError.message);
      setLoading(false);
      return;
    }

    await supabase.from("dossier_history").insert({ dossier_id: dossierId, status: toStatus, changed_by: employee.id });

    setLoading(false);
    router.refresh();
  }

  if (currentStatus === "sent") {
    return (
      <div style={{ fontSize: 13, color: "#2E7D32", background: "#E7F4E8", padding: "10px 14px", borderRadius: 8 }}>
        ✓ Hồ sơ đã hoàn thành nghiệp vụ.
      </div>
    );
  }

  if (currentStatus === "supplement") {
    return (
      <div style={{ background: "#fff", border: "1px solid #E2E5DF", borderRadius: 12, padding: 20 }}>
        <div style={{ fontSize: 13, color: "#B0392F", marginBottom: 12 }}>Hồ sơ đang cần bổ sung.</div>
        {error && <div style={{ color: "#C23616", fontSize: 12, marginBottom: 10 }}>{error}</div>}
        <button onClick={() => advance("received")} disabled={loading} style={btnStyle}>
          Đã bổ sung xong — tiếp nhận lại
        </button>
      </div>
    );
  }

  const gateMessage =
    currentStatus === "pending" && !appointmentUploaded ? "Cần tải lên Giấy hẹn trước khi chuyển trạng thái." :
    currentStatus === "approved" && !licenseUploaded ? "Cần tải lên Giấy chứng nhận (GCN) trước khi gửi." :
    null;
  const blocked = !!gateMessage;

  return (
    <div style={{ background: "#fff", border: "1px solid #E2E5DF", borderRadius: 12, padding: 20 }}>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Thao tác</div>
      {error && <div style={{ color: "#C23616", fontSize: 12, marginBottom: 10 }}>{error}</div>}
      {gateMessage && <div style={{ color: "#8A6D00", fontSize: 12, marginBottom: 10 }}>⚠ {gateMessage}</div>}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {next && (
          <button onClick={() => advance(next)} disabled={loading || blocked} style={{ ...btnStyle, opacity: blocked ? 0.5 : 1, cursor: blocked ? "not-allowed" : "pointer" }}>
            {loading ? "Đang xử lý..." : `Chuyển sang: ${STATUS[next]?.label || next}`}
          </button>
        )}
        {(currentStatus === "received" || currentStatus === "submitted") && (
          <button onClick={() => advance("supplement")} disabled={loading} style={btnSecondary}>
            Đánh dấu cần bổ sung
          </button>
        )}
      </div>
    </div>
  );
}

const btnStyle = { background: "#A9201F", color: "#fff", border: "none", borderRadius: 8, padding: "9px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer" };
const btnSecondary = { background: "#fff", color: "#B0392F", border: "1px solid #E2C7C6", borderRadius: 8, padding: "9px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer" };
