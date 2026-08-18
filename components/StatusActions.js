"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import { STATUS, NEXT_STATUS } from "@/lib/constants";

const SERVICE_FEE = { normal: 1300000, fast: 2300000 };
const DUE_DAYS = { normal: 3, fast: 1 };

const btnStyle = { background: "#A9201F", color: "#fff", border: "none", borderRadius: 8, padding: "9px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer" };
const btnSecondary = { background: "#fff", color: "#B0392F", border: "1px solid #E2C7C6", borderRadius: 8, padding: "9px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer" };
const btnGhost = { background: "#fff", color: "#687269", border: "1px solid #E2E5DF", borderRadius: 8, padding: "9px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer" };
const inputStyle = { border: "1px solid #ddd", borderRadius: 8, padding: "8px 10px", fontSize: 13, width: "100%", boxSizing: "border-box", outline: "none" };

function addBusinessDays(date, days) {
  const d = new Date(date);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  return d;
}

export default function StatusActions({ dossierId, currentStatus, speed, wardName, appointmentUploaded, licenseUploaded, onDone }) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [supplementOpen, setSupplementOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [cause, setCause] = useState("Lỗi cá nhân nhân viên");
  const [amountInput, setAmountInput] = useState(String(SERVICE_FEE[speed === "fast" ? "fast" : "normal"]));

  const next = NEXT_STATUS[currentStatus];

  async function getCurrentEmployee() {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: employee } = await supabase.from("employees").select("id").eq("auth_user_id", user.id).single();
    return employee;
  }

  async function advance(toStatus, extraPatch = {}) {
    setLoading(true);
    setError("");
    const employee = await getCurrentEmployee();
    if (!employee) {
      setError("Không xác định được nhân viên đang đăng nhập.");
      setLoading(false);
      return;
    }

    const patch = { status: toStatus, ...extraPatch };
    const { error: updateError } = await supabase.from("dossiers").update(patch).eq("id", dossierId);
    if (updateError) {
      setError("Không cập nhật được: " + updateError.message);
      setLoading(false);
      return;
    }

    await supabase.from("dossier_history").insert({
      dossier_id: dossierId,
      status: toStatus,
      changed_by: employee.id,
      reason: extraPatch.supplement_reason || null,
      cause: extraPatch.supplement_cause || null,
    });

    setLoading(false);
    if (onDone) onDone();
    else router.refresh();
  }

  function markReceived() {
    const due = addBusinessDays(new Date(), DUE_DAYS[speed === "fast" ? "fast" : "normal"]);
    advance("received", { due_at: due.toISOString() });
  }

  function markSubmitted() {
    advance("submitted");
  }

  function approve() {
    advance("approved", { approved_date: new Date().toISOString() });
  }

  function submitSupplement() {
    if (!reason.trim()) return;
    advance("supplement", { supplement_reason: reason.trim(), supplement_cause: cause });
    setSupplementOpen(false);
    setReason("");
  }

  function resolveSupplement() {
    const due = addBusinessDays(new Date(), DUE_DAYS[speed === "fast" ? "fast" : "normal"]);
    advance("received", { due_at: due.toISOString(), supplement_reason: null, supplement_cause: null });
  }

  function confirmSent() {
    const amount = Number(amountInput) || 0;
    const collectionDue = new Date();
    collectionDue.setDate(collectionDue.getDate() + 2);
    advance("sent", {
      completed_at: new Date().toISOString(),
      payment_status: "Chưa thu",
      amount_due: amount,
      collection_due_at: collectionDue.toISOString(),
    });
  }

  if (currentStatus === "sent") {
    return (
      <div style={{ fontSize: 13, color: "#2E7D32", background: "#E7F4E8", padding: "10px 14px", borderRadius: 8 }}>
        ✓ Hồ sơ đã hoàn thành nghiệp vụ. Đã chuyển sang chờ thu tiền ở trang Tài chính.
      </div>
    );
  }

  if (currentStatus === "supplement") {
    return (
      <div style={{ background: "#fff", border: "1px solid #E2E5DF", borderRadius: 12, padding: 20 }}>
        <div style={{ fontSize: 13, color: "#B0392F", marginBottom: 12 }}>Hồ sơ đang cần bổ sung.</div>
        {error && <div style={{ color: "#C23616", fontSize: 12, marginBottom: 10 }}>{error}</div>}
        <button onClick={resolveSupplement} disabled={loading} style={btnStyle}>
          {loading ? "Đang xử lý..." : "Đã bổ sung xong — tiếp nhận lại"}
        </button>
      </div>
    );
  }

  if (currentStatus === "pending") {
    return (
      <div style={{ background: "#fff", border: "1px solid #E2E5DF", borderRadius: 12, padding: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Thao tác</div>
        {error && <div style={{ color: "#C23616", fontSize: 12, marginBottom: 10 }}>{error}</div>}
        {!appointmentUploaded && <div style={{ color: "#8A6D00", fontSize: 12, marginBottom: 10 }}>⚠ Cần tải lên Giấy hẹn trước khi chuyển trạng thái.</div>}
        <button onClick={markReceived} disabled={loading || !appointmentUploaded} style={{ ...btnStyle, opacity: !appointmentUploaded ? 0.5 : 1, cursor: !appointmentUploaded ? "not-allowed" : "pointer" }}>
          {loading ? "Đang xử lý..." : "Xác nhận đã tiếp nhận"}
        </button>
      </div>
    );
  }

  if (currentStatus === "received") {
    return (
      <div style={{ background: "#fff", border: "1px solid #E2E5DF", borderRadius: 12, padding: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Thao tác</div>
        {error && <div style={{ color: "#C23616", fontSize: 12, marginBottom: 10 }}>{error}</div>}
        <button onClick={markSubmitted} disabled={loading} style={btnStyle}>
          {loading ? "Đang xử lý..." : "Trình lãnh đạo"}
        </button>
      </div>
    );
  }

  if (currentStatus === "submitted") {
    return (
      <div style={{ background: "#fff", border: "1px solid #E2E5DF", borderRadius: 12, padding: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Thao tác</div>
        {error && <div style={{ color: "#C23616", fontSize: 12, marginBottom: 10 }}>{error}</div>}
        {!supplementOpen ? (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={approve} disabled={loading} style={btnStyle}>
              {loading ? "Đang xử lý..." : "Được chấp thuận"}
            </button>
            <button onClick={() => setSupplementOpen(true)} disabled={loading} style={btnSecondary}>
              Cần bổ sung
            </button>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 12, color: "#687269", marginBottom: 10 }}>
              Phường/xã tự lấy theo hồ sơ: <strong style={{ color: "#1F2421" }}>{wardName || "chưa xác định"}</strong>
            </div>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, color: "#687269", marginBottom: 6 }}>Lý do bổ sung</div>
              <textarea style={{ ...inputStyle, minHeight: 60 }} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Mô tả lý do cần bổ sung..." />
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: "#687269", marginBottom: 6 }}>Nguyên nhân</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {["Lỗi cá nhân nhân viên", "Yêu cầu mới của chuyên viên/cơ quan"].map((c) => (
                  <label key={c} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#1F2421", cursor: "pointer" }}>
                    <input type="radio" checked={cause === c} onChange={() => setCause(c)} /> {c}
                  </label>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setSupplementOpen(false); setReason(""); }} style={btnGhost}>Hủy</button>
              <button onClick={submitSupplement} disabled={!reason.trim() || loading} style={{ ...btnStyle, opacity: !reason.trim() ? 0.5 : 1 }}>
                {loading ? "Đang gửi..." : "Gửi yêu cầu bổ sung"}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (currentStatus === "approved") {
    return (
      <div style={{ background: "#fff", border: "1px solid #E2E5DF", borderRadius: 12, padding: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Thao tác</div>
        {error && <div style={{ color: "#C23616", fontSize: 12, marginBottom: 10 }}>{error}</div>}
        {!licenseUploaded && <div style={{ color: "#8A6D00", fontSize: 12, marginBottom: 10 }}>⚠ Cần tải lên Giấy chứng nhận (GCN) trước khi gửi.</div>}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: "#687269", marginBottom: 6 }}>Phí dịch vụ cần thu (có thể sửa)</div>
          <input style={inputStyle} value={amountInput} onChange={(e) => setAmountInput(e.target.value.replace(/[^\d]/g, ""))} />
        </div>
        <button onClick={confirmSent} disabled={loading || !licenseUploaded} style={{ ...btnStyle, opacity: !licenseUploaded ? 0.5 : 1, cursor: !licenseUploaded ? "not-allowed" : "pointer" }}>
          {loading ? "Đang xử lý..." : "Xác nhận đã gửi giấy phép"}
        </button>
      </div>
    );
  }

  return null;
}
