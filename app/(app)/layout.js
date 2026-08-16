import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabaseServer";
import Sidebar from "@/components/Sidebar";

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

  return (
    <div style={{ display: "flex" }}>
      <Sidebar employee={employee} />
      <div style={{ flex: 1, padding: 28 }}>{children}</div>
    </div>
  );
}
