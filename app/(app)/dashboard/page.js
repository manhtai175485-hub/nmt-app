import { createClient } from "@/lib/supabaseServer";

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: employee } = await supabase
    .from("employees")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  const { count: dossierCount } = await supabase
    .from("dossiers")
    .select("*", { count: "exact", head: true })
    .eq(employee.role === "Quản lý" ? "id" : "assigned_employee_id", employee.role === "Quản lý" ? employee.id : employee.id)
    .neq("status", "sent");

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Xin chào, {employee.name}</h1>
      <p style={{ fontSize: 13, color: "#6B7269", marginBottom: 20 }}>
        Kết nối Supabase đã hoạt động — dữ liệu đọc trực tiếp từ database thật.
      </p>
      <div style={{ background: "#F2F4F1", borderRadius: 12, padding: 20, width: 240 }}>
        <div style={{ fontSize: 12, color: "#6B7269" }}>Hồ sơ đang xử lý</div>
        <div style={{ fontSize: 26, fontWeight: 700 }}>{dossierCount ?? 0}</div>
      </div>
      <p style={{ fontSize: 12, color: "#6B7269", marginTop: 24 }}>
        Các module Hộ kinh doanh, Tài chính, Kho nghiệp vụ, Nhân viên sẽ được nối tiếp ở các lượt sau — đây là khung nền tảng (auth + layout + kết nối DB thật).
      </p>
    </div>
  );
}
