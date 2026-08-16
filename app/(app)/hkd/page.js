import Link from "next/link";
import { createClient } from "@/lib/supabaseServer";
import { STATUS, fmtDate } from "@/lib/constants";

export default async function HkdListPage() {
  const supabase = createClient();

  const { data: dossiers, error } = await supabase
    .from("dossiers")
    .select("id, code, name, status, speed, due_at, created_at, employees:assigned_employee_id(name), wards:ward_id(name)")
    .eq("group", "Hộ kinh doanh")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Hộ kinh doanh</h1>
          <p style={{ fontSize: 13, color: "#6B7269", margin: "4px 0 0" }}>Danh sách hồ sơ — dữ liệu thật từ Supabase.</p>
        </div>
        <Link href="/hkd/new" style={{ background: "#A9201F", color: "#fff", padding: "9px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
          + Tạo hồ sơ
        </Link>
      </div>

      {error && <div style={{ color: "#C23616", fontSize: 13, marginBottom: 12 }}>Lỗi tải dữ liệu: {error.message}</div>}

      {(!dossiers || dossiers.length === 0) ? (
        <div style={{ background: "#F2F4F1", borderRadius: 12, padding: 32, textAlign: "center", color: "#6B7269", fontSize: 13 }}>
          Chưa có hồ sơ nào. Bấm "+ Tạo hồ sơ" để bắt đầu.
        </div>
      ) : (
        <div style={{ border: "1px solid #E2E5DF", borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#FAFBF9" }}>
                <th style={th}>Mã hồ sơ</th>
                <th style={th}>Tên</th>
                <th style={th}>Người phụ trách</th>
                <th style={th}>Phường/Xã</th>
                <th style={th}>Hạn xử lý</th>
                <th style={th}>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {dossiers.map((d) => {
                const st = STATUS[d.status] || { label: d.status, color: "#333", bg: "#eee" };
                return (
                  <tr key={d.id} style={{ borderTop: "1px solid #E2E5DF" }}>
                    <td style={td}>
                      <Link href={`/hkd/${d.id}`} style={{ color: "#A9201F", fontWeight: 600, textDecoration: "none" }}>{d.code}</Link>
                    </td>
                    <td style={td}>{d.name}</td>
                    <td style={td}>{d.employees?.name || "—"}</td>
                    <td style={td}>{d.wards?.name || "—"}</td>
                    <td style={td}>{fmtDate(d.due_at)}</td>
                    <td style={td}>
                      <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, color: st.color, background: st.bg }}>
                        {st.label}
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
