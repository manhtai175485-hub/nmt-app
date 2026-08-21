import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabaseServer";
import Sidebar from "@/components/Sidebar";
import { isOverdue } from "@/lib/deadline";

export default async function AppLayout({ children }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: employee } = await supabase
    .from("employees")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  if (!employee) {
    // Tài khoản đăng nhập được nhưng chưa được Quản lý liên kết vào bảng employees.
    return (
      <div style={{ padding: 40 }}>
        Tài khoản của bạn chưa được liên kết với hồ sơ nhân viên. Vui lòng liên hệ Quản lý.
      </div>
    );
  }

  const notifications = [];
  if (employee.role === "Quản lý") {
    const { data: submitted } = await supabase
      .from("dossiers")
      .select("id, code, name, employees:assigned_employee_id(name)")
      .eq("status", "submitted");
    (submitted || []).forEach((d) => notifications.push({ id: d.id, code: d.code, name: d.name, message: `${d.employees?.name || "Nhân viên"} trình duyệt` }));
  }
  const { data: mine } = await supabase
    .from("dossiers")
    .select("id, code, name, status, due_at")
    .eq("assigned_employee_id", employee.id)
    .neq("status", "sent");
  (mine || []).forEach((d) => {
    if (d.status === "supplement") notifications.push({ id: d.id, code: d.code, name: d.name, message: "Cần bổ sung hồ sơ" });
    else if (isOverdue(d)) notifications.push({ id: d.id, code: d.code, name: d.name, message: "Đã quá hạn xử lý" });
  });

  return (
    <div style={{ display: "flex" }}>
      <Sidebar employee={employee} notifications={notifications} />
      <div style={{ flex: 1, padding: 28 }}>{children}</div>
    </div>
  );
}
