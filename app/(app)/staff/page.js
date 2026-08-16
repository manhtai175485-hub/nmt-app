import Link from "next/link";
import { createClient } from "@/lib/supabaseServer";
import AddEmployeeForm from "@/components/AddEmployeeForm";

export default async function StaffListPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: me } = await supabase.from("employees").select("*").eq("auth_user_id", user.id).single();

  if (me.role !== "Quản lý") {
    return <div style={{ fontSize: 13, color: "#6B7269" }}>Chỉ Quản lý mới xem được mục này.</div>;
  }

  const { data: employees } = await supabase
    .from("employees")
    .select("*")
    .eq("role", "Nhân viên")
    .order("created_at");

  const stats = await Promise.all(
    (employees || []).map(async (e) => {
      const { count: processing } = await supabase
        .from("dossiers")
        .select("*", { count: "exact", head: true })
        .eq("assigned_employee_id", e.id)
        .not("status", "in", "(sent,supplement)");
      const { count: total } = await supabase
        .from("dossiers")
        .select("*", { count: "exact", head: true })
        .eq("assigned_employee_id", e.id);
      return { id: e.id, processing: processing || 0, total: total || 0 };
    })
  );
  const statMap = Object.fromEntries(stats.map((s) => [s.id, s]));

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Nhân viên</h1>
      </div>
      <p style={{ fontSize: 13, color: "#6B7269", marginBottom: 16 }}>{(employees || []).length} nhân viên — dữ liệu thật từ Supabase.</p>

      <AddEmployeeForm />

      {(!employees || employees.length === 0) ? (
        <div style={{ background: "#F2F4F1", borderRadius: 12, padding: 32, textAlign: "center", color: "#6B7269", fontSize: 13, marginTop: 16 }}>
          Chưa có nhân viên nào.
        </div>
      ) : (
        <div style={{ border: "1px solid #E2E5DF", borderRadius: 12, overflow: "hidden", marginTop: 16 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#FAFBF9" }}>
                <th style={th}>Họ tên</th>
                <th style={th}>SĐT</th>
                <th style={th}>Tổng hồ sơ</th>
                <th style={th}>Đang xử lý</th>
                <th style={th}>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => {
                const s = statMap[e.id] || { processing: 0, total: 0 };
                return (
                  <tr key={e.id} style={{ borderTop: "1px solid #E2E5DF" }}>
                    <td style={td}>
                      <Link href={`/staff/${e.id}`} style={{ color: "#A9201F", fontWeight: 600, textDecoration: "none" }}>{e.name}</Link>
                    </td>
                    <td style={td}>{e.phone}</td>
                    <td style={td}>{s.total}</td>
                    <td style={td}>{s.processing}</td>
                    <td style={td}>
                      <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, color: e.status === "Đang hoạt động" ? "#1E8E5A" : "#6B7269", background: e.status === "Đang hoạt động" ? "#E4F6ED" : "#EEF0EC" }}>
                        {e.status}
                      </span>
                    </td>
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
