"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import NotificationBell from "@/components/NotificationBell";

const NAV = [
  { href: "/dashboard", label: "Tổng quan" },
  { href: "/hkd", label: "Hộ kinh doanh" },
  { href: "/finance", label: "Tài chính", managerOnly: true },
  { href: "/warehouse", label: "Kho nghiệp vụ", managerOnly: true },
  { href: "/staff", label: "Nhân viên", managerOnly: true },
  { href: "/report", label: "Báo cáo" },
];

export default function Sidebar({ employee, notifications = [] }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const isManager = employee?.role === "Quản lý";

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div style={{ width: 220, flexShrink: 0, background: "#fff", borderRight: "1px solid #E2E5DF", padding: 16, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20, color: "#A9201F" }}>Tư Vấn NMT</div>
      <NotificationBell items={notifications} />
      <div style={{ flex: 1 }}>
        {NAV.filter((n) => !n.managerOnly || isManager).map((n) => (
          <Link key={n.href} href={n.href}
            style={{
              display: "block", padding: "9px 12px", borderRadius: 8, marginBottom: 4, fontSize: 13, fontWeight: 600, textDecoration: "none",
              color: pathname.startsWith(n.href) ? "#A9201F" : "#1F2421",
              background: pathname.startsWith(n.href) ? "#FCEAEA" : "transparent",
            }}>
            {n.label}
          </Link>
        ))}
      </div>
      <div style={{ borderTop: "1px solid #E2E5DF", paddingTop: 12, fontSize: 12, color: "#6B7269" }}>
        <div style={{ fontWeight: 600, color: "#1F2421", marginBottom: 6 }}>{employee?.name}</div>
        <div style={{ marginBottom: 10 }}>{employee?.role}</div>
        <button onClick={handleLogout} style={{ background: "none", border: "none", color: "#A9201F", cursor: "pointer", fontSize: 12, padding: 0 }}>Đăng xuất</button>
      </div>
    </div>
  );
}
