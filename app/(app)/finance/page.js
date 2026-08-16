import { createClient } from "@/lib/supabaseServer";
import { fmtDate } from "@/lib/constants";
import ConfirmPaymentForm from "@/components/ConfirmPaymentForm";

export default async function FinancePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: me } = await supabase.from("employees").select("role").eq("auth_user_id", user.id).single();

  if (me.role !== "Quản lý") {
    return <div style={{ fontSize: 13, color: "#6B7269" }}>Chỉ Quản lý mới xem được mục này.</div>;
  }

  const { data: dossiers } = await supabase
    .from("dossiers")
    .select("id, code, name, completed_at, payment_status, amount_due, amount_paid, paid_at, payment_method, employees:assigned_employee_id(name)")
    .eq("status", "sent")
    .order("completed_at", { ascending: false });

  const unpaid = (dossiers || []).filter((d) => d.payment_status === "Chưa thu");
  const paid = (dossiers || []).filter((d) => d.payment_status === "Đã thu");
  const totalRevenue = paid.reduce((s, d) => s + (d.amount_paid || 0), 0);

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Tài chính</h1>
      <p style={{ fontSize: 13, color: "#6B7269", marginBottom: 20 }}>Hồ sơ đã gửi GCN — xác nhận thu tiền. Dữ liệu thật từ Supabase.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
        <Stat label="Doanh thu đã thu" value={`${totalRevenue.toLocaleString("vi-VN")}đ`} color="#1E8E5A" />
        <Stat label="Hồ sơ chưa thu" value={unpaid.length} color="#B0392F" />
        <Stat label="Hồ sơ đã thu" value={paid.length} color="#1F2421" />
      </div>

      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Chưa thu tiền ({unpaid.length})</div>
      {unpaid.length === 0 ? (
        <Empty text="Không có hồ sơ nào đang chờ thu tiền." />
      ) : (
        <div style={{ border: "1px solid #E2E5DF", borderRadius: 12, overflow: "hidden", marginBottom: 24 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr style={{ background: "#FAFBF9" }}>
              <th style={th}>Mã hồ sơ</th><th style={th}>Tên</th><th style={th}>Người phụ trách</th><th style={th}>Ngày gửi GCN</th><th style={th}></th>
            </tr></thead>
            <tbody>
              {unpaid.map((d) => (
                <tr key={d.id} style={{ borderTop: "1px solid #E2E5DF" }}>
                  <td style={td}>{d.code}</td>
                  <td style={td}>{d.name}</td>
                  <td style={td}>{d.employees?.name || "—"}</td>
                  <td style={td}>{fmtDate(d.completed_at)}</td>
                  <td style={td}><ConfirmPaymentForm dossierId={d.id} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Đã thu tiền ({paid.length})</div>
      {paid.length === 0 ? (
        <Empty text="Chưa có hồ sơ nào được xác nhận thu tiền." />
      ) : (
        <div style={{ border: "1px solid #E2E5DF", borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr style={{ background: "#FAFBF9" }}>
              <th style={th}>Mã hồ sơ</th><th style={th}>Tên</th><th style={th}>Số tiền</th><th style={th}>Hình thức</th><th style={th}>Ngày thu</th>
            </tr></thead>
            <tbody>
              {paid.map((d) => (
                <tr key={d.id} style={{ borderTop: "1px solid #E2E5DF" }}>
                  <td style={td}>{d.code}</td>
                  <td style={td}>{d.name}</td>
                  <td style={{ ...td, fontWeight: 600 }}>{(d.amount_paid || 0).toLocaleString("vi-VN")}đ</td>
                  <td style={td}>{d.payment_method || "—"}</td>
                  <td style={td}>{fmtDate(d.paid_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{ background: "#F2F4F1", borderRadius: 12, padding: "14px 16px" }}>
      <div style={{ fontSize: 12, color: "#6B7269", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 19, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

function Empty({ text }) {
  return <div style={{ background: "#F2F4F1", borderRadius: 12, padding: 20, textAlign: "center", color: "#6B7269", fontSize: 13, marginBottom: 24 }}>{text}</div>;
}

const th = { textAlign: "left", padding: "10px 14px", fontSize: 12, color: "#6B7269", fontWeight: 600 };
const td = { padding: "10px 14px" };
