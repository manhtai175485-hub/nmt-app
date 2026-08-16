import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabaseServer";
import { STATUS, fmtDate } from "@/lib/constants";
import StatusActions from "@/components/StatusActions";

export default async function DossierDetailPage({ params }) {
  const supabase = createClient();

  const { data: dossier } = await supabase
    .from("dossiers")
    .select("*, employees:assigned_employee_id(name), wards:ward_id(name)")
    .eq("id", params.id)
    .single();

  if (!dossier) notFound();

  const { data: history } = await supabase
    .from("dossier_history")
    .select("status, at, employees:changed_by(name)")
    .eq("dossier_id", dossier.id)
    .order("at", { ascending: false });

  const st = STATUS[dossier.status] || { label: dossier.status, color: "#333", bg: "#eee" };

  return (
    <div style={{ maxWidth: 640 }}>
      <Link href="/hkd" style={{ fontSize: 13, color: "#6B7269", textDecoration: "none" }}>← Quay lại danh sách</Link>

      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "12px 0 4px" }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{dossier.code}</h1>
        <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, color: st.color, background: st.bg }}>{st.label}</span>
      </div>
      <div style={{ fontSize: 14, color: "#1F2421", marginBottom: 20 }}>{dossier.name}</div>

      <div style={{ background: "#fff", border: "1px solid #E2E5DF", borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Thông tin hồ sơ</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13 }}>
          <Info label="Loại thủ tục" value={dossier.procedure} />
          <Info label="Phường/Xã" value={dossier.wards?.name} />
          <Info label="Người phụ trách" value={dossier.employees?.name} />
          <Info label="Loại hồ sơ" value={dossier.speed === "fast" ? "⚡ Nhanh" : "Thường"} />
          <Info label="Hạn xử lý" value={fmtDate(dossier.due_at)} />
          <Info label="Ngày tạo" value={fmtDate(dossier.created_at)} />
        </div>
      </div>

      <StatusActions dossierId={dossier.id} currentStatus={dossier.status} />

      {history && history.length > 0 && (
        <div style={{ background: "#fff", border: "1px solid #E2E5DF", borderRadius: 12, padding: 20, marginTop: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Lịch sử thao tác</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {history.map((h, i) => {
              const hs = STATUS[h.status] || { label: h.status, color: "#333" };
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: hs.color, flexShrink: 0 }} />
                  <span style={{ fontWeight: 600 }}>{hs.label}</span>
                  <span style={{ color: "#6B7269" }}>bởi {h.employees?.name || "—"}</span>
                  <span style={{ marginLeft: "auto", color: "#6B7269", fontSize: 12 }}>{fmtDate(h.at)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <div style={{ color: "#6B7269", marginBottom: 2 }}>{label}</div>
      <div style={{ fontWeight: 600 }}>{value || "—"}</div>
    </div>
  );
}
