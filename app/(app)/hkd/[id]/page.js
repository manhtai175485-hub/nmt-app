import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabaseServer";
import { STATUS, fmtDate } from "@/lib/constants";
import StatusActions from "@/components/StatusActions";
import FileUploadField from "@/components/FileUploadField";
import ReassignEmployee from "@/components/ReassignEmployee";

export default async function DossierDetailPage({ params }) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const { data: me } = await supabase.from("employees").select("id, role").eq("auth_user_id", user.id).single();

  const { data: dossier } = await supabase
    .from("dossiers")
    .select("*, employees:assigned_employee_id(name), wards:ward_id(name)")
    .eq("id", params.id)
    .single();

  if (!dossier) notFound();

  let activeEmployees = [];
  if (me.role === "Quản lý") {
    const { data } = await supabase
      .from("employees")
      .select("id, name")
      .eq("status", "Đang hoạt động")
      .order("name");
    activeEmployees = data || [];
  }

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
  <a
  href={`/api/export-dossier/${dossier.id}`}
          style={{
            display: "inline-block",
            border: "1px solid #A9201F",
            color: "#A9201F",
            background: "#fff",
            borderRadius: 8,
            padding: "6px 14px",
            fontSize: 13,
            fontWeight: 600,
            textDecoration: "none",
            marginBottom: 16,
          }}
        >
          📄 Xuất Word
        </a>
      <div style={{ fontSize: 14, color: "#1F2421", marginBottom: 20 }}>{dossier.name}</div>

      <div style={{ background: "#fff", border: "1px solid #E2E5DF", borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Thông tin hồ sơ</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13 }}>
          <Info label="Loại thủ tục" value={dossier.procedure} />
          <Info label="Phường/Xã" value={dossier.wards?.name} />
          <div>
            <div style={{ color: "#6B7269", marginBottom: 2 }}>Người phụ trách</div>
            {me.role === "Quản lý" && activeEmployees.length > 0 ? (
              <ReassignEmployee dossierId={dossier.id} currentEmployeeId={dossier.assigned_employee_id} employees={activeEmployees} />
            ) : (
              <div style={{ fontWeight: 600 }}>{dossier.employees?.name || "—"}</div>
            )}
          </div>
          <Info label="Loại hồ sơ" value={dossier.speed === "fast" ? "⚡ Nhanh" : "Thường"} />
          <Info label="Hạn xử lý" value={fmtDate(dossier.due_at)} />
          <Info label="Ngày tạo" value={fmtDate(dossier.created_at)} />
        </div>
      </div>

      <div style={{ background: "#fff", border: "1px solid #E2E5DF", borderRadius: 12, padding: 20, marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>Hồ sơ đính kèm</div>
        <FileUploadField dossierId={dossier.id} kind="appointment" label="Giấy hẹn" currentPath={dossier.appointment_file_path} />
        <FileUploadField dossierId={dossier.id} kind="license" label="Giấy chứng nhận (GCN)" currentPath={dossier.license_file_path} />
      </div>

      <StatusActions
        dossierId={dossier.id}
        currentStatus={dossier.status}
        appointmentUploaded={dossier.appointment_uploaded}
        licenseUploaded={dossier.license_uploaded}
      />

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
