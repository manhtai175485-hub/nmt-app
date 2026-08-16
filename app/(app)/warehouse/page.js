import { createClient } from "@/lib/supabaseServer";
import AddWarehouseEntryForm from "@/components/AddWarehouseEntryForm";

const SEVERITY_META = {
  block: { icon: "🔴", label: "Chặn", color: "#B0392F", bg: "#FBE7E5" },
  warning: { icon: "🟠", label: "Cảnh báo", color: "#B0740B", bg: "#FCF0DA" },
  tip: { icon: "🔵", label: "Lưu ý", color: "#1E5FAD", bg: "#E5F0FC" },
};

export default async function WarehousePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: me } = await supabase.from("employees").select("role").eq("auth_user_id", user.id).single();

  const { data: entries } = await supabase
    .from("warehouse_entries")
    .select("id, group, procedure, severity, title, content, suggested_fix, hidden, wards:ward_id(name)")
    .eq("hidden", false)
    .order("created_at", { ascending: false });

  const { data: wards } = await supabase.from("wards").select("id, name").order("name");

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Kho nghiệp vụ</h1>
      <p style={{ fontSize: 13, color: "#6B7269", marginBottom: 20 }}>Lưu ý/kinh nghiệm theo thủ tục + phường/xã. Dữ liệu thật từ Supabase.</p>

      {me.role === "Quản lý" && <AddWarehouseEntryForm wards={wards || []} />}

      <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
        {(!entries || entries.length === 0) ? (
          <div style={{ background: "#F2F4F1", borderRadius: 12, padding: 24, textAlign: "center", color: "#6B7269", fontSize: 13 }}>
            Chưa có mục nào trong kho nghiệp vụ.
          </div>
        ) : (
          entries.map((e) => {
            const sm = SEVERITY_META[e.severity] || SEVERITY_META.tip;
            return (
              <div key={e.id} style={{ background: "#fff", border: "1px solid #E2E5DF", borderRadius: 12, padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, color: sm.color, background: sm.bg }}>{sm.icon} {sm.label}</span>
                  <span style={{ fontSize: 12, color: "#6B7269" }}>{e.group} · {e.procedure} · {e.wards?.name || "Mọi phường/xã"}</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{e.title}</div>
                <div style={{ fontSize: 13, color: "#1F2421", marginBottom: e.suggested_fix ? 6 : 0 }}>{e.content}</div>
                {e.suggested_fix && <div style={{ fontSize: 12, color: "#6B7269" }}><b>Cách xử lý:</b> {e.suggested_fix}</div>}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
