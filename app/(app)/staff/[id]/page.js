import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabaseServer";
import { STATUS, fmtDate } from "@/lib/constants";
import ToggleEmployeeStatus from "@/components/ToggleEmployeeStatus";

export default async function StaffDetailPage({ params }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: me } = await supabase.from("employees").select("role").eq("auth_user_id", user.id).single();

  if (me.role !== "Quản lý") {
    return <div style={{ fontSize: 13, color: "#6B7269" }}>Chỉ Quản lý mới xem được mục này.</div>;
  }

  const { data: employee } = await supabase.from("employees").select("*").eq("id", params.id).single();
  if (!employee) notFound();

  const { data: dossiers } = await supabase
    .from("dossiers")
    .select("id, code, name, status, speed, due_at, created_at")
    .eq("assigned_employee_id", employee.id)
    .order("created_at", { ascending: false });

  const list = dossiers || [];
  const processing = list.filter((d) => d.status !== "sent" && d.status !== "supplement").length;
  const completed = list.filter((d) => d.status === "sent").length;
  const supplement = list.filter((d) => d.status === "supplement").length;
  const overdue = list.filter((d) => d.status !== "sent" && d.due_at && new Date(d.due_at) < new Date()).length;
  const onTimeRate = list.length ? Math.round(((list.length - overdue) / list.length) * 100) : 100;

  const metrics = [
    { label: "Tổng hồ sơ", value: list.length },
    { label: "Đang xử lý", value: processing },
    { label: "Hoàn thành", value: completed, color: "#1E8E5A" },
    { label: "Cần bổ sung", value: supplement, color: "#B0392F" },
    { label: "Quá hạn", value: overdue, color: overdue ? "#C23616" : "#1F2421" },
    { label: "Tỷ lệ đúng hạn", value: `${onTimeRate}%`, color: onTimeRate >= 90 ? "#1E8E5A" : "#8A6D00" },
  ];

  return (
    <div>
      <Link href="/staff" style={{ fontSize: 13, color: "#6B7269", textDecoration: "none" }}>← Quay lại danh sách nhân viên</Link>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, margin: "12px 0 4px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#FCEAEA", color: "#A9201F", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{employee.initials}</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{employee.name}</div>
            <div style={{ fontSize: 12, color: "#6B7269" }}>{employee.phone} · {employee.role}</div>
          </div>
          <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, color: employee.status === "Đang hoạt động" ? "#1E8E5A" : "#6B7269", background: employee.status === "Đang hoạt động" ? "#E4F6ED" : "#EEF0EC" }}>
            {employee.status}
          </span>
        </div>
        <ToggleEmployeeStatus employeeId={employee.id} currentStatus={employee.status} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, margin: "20px 0" }}>
        {metrics.map((m) => (
          <div key={m.label} style={{ background: "#F2F4F1", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: 12, color: "#6B7269", marginBottom: 6 }}>{m.label}</div>
            <div style={{ fontSize: 19, fontWeight: 700, color: m.color || "#1F2421" }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Hồ sơ phụ trách</div>
      {list.length === 0 ? (
        <div style={{ background: "#F2F4F1", borderRadius: 12, padding: 24, textAlign: "center", color: "#6B7269", fontSize: 13 }}>
          Chưa phụ trách hồ sơ nào.
        </div>
      ) : (
        <div style={{ border: "1px solid #E2E5DF", borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#FAFBF9" }}>
                <th style={th}>Mã hồ sơ</th><th style={th}>Tên</th><th style={th}>Hạn xử lý</th><th style={th}>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {list.map((d) => {
                const st = STATUS[d.status] || { label: d.status, color: "#333", bg: "#eee" };
                return (
                  <tr key={d.id} style={{ borderTop: "1px solid #E2E5DF" }}>
                    <td style={td}><Link href={`/hkd/${d.id}`} style={{ color: "#A9201F", fontWeight: 600, textDecoration: "none" }}>{d.code}</Link></td>
                    <td style={td}>{d.name}</td>
                    <td style={td}>{fmtDate(d.due_at)}</td>
                    <td style={td}><span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, color: st.color, background: st.bg }}>{st.label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const th = { textAlign: "left", padding: "10px 14px", fontSize: 12, color: "#6B7269", fontWeight: 600 };
const td = { padding: "10px 14px" };
