"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";
import StatusActions from "@/components/StatusActions";
import FileUploadField from "@/components/FileUploadField";

import { getDeadlineStatus, DEADLINE_LABELS } from "@/lib/deadline";
const C = {
  brand: "#A9201F",
  brandSoft: "#F7E7E4",
  ink: "#1F2421",
  inkSoft: "#687269",
  line: "#E9EDE8",
  card: "#fff",
  bg: "#FAFBF9",
  supplement: "#C98A2B",
  supplementSoft: "#FBF1E1",
  overdue: "#E14434",
  overdueSoft: "#FCE7E4",
  ok: "#2F6844",
  okSoft: "#E3F1E8",
};

const FLOW = [
  { key: "pending", label: "Chờ xử lý" },
  { key: "received", label: "Đã tiếp nhận" },
  { key: "submitted", label: "Trình lãnh đạo" },
  { key: "approved", label: "Được chấp thuận" },
  { key: "sent", label: "Đã gửi giấy phép" },
];

const FILTERS = [
  { key: "all", label: "Tất cả" },
  { key: "pending", label: "Chờ xử lý" },
  { key: "received", label: "Đã tiếp nhận" },
  { key: "submitted", label: "Trình lãnh đạo" },
  { key: "supplement", label: "Cần bổ sung" },
  { key: "approved", label: "Được chấp thuận" },
];

function fmtDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function deadlineInfo(dossier) {
  const key = getDeadlineStatus(dossier);
  if (!key) return null;
  const styles = {
    overdue: { color: C.overdue, bg: C.overdueSoft },
    soon: { color: C.supplement, bg: C.supplementSoft },
    ontime: { color: C.ok, bg: C.okSoft },
  };
  return { label: DEADLINE_LABELS[key], ...styles[key] };
}


function Timeline({ status }) {
  const idx = FLOW.findIndex((f) => f.key === status);
  const effectiveIdx = status === "supplement" ? 2 : idx;
  return (
    <div style={{ display: "flex", alignItems: "flex-start", margin: "16px 0 4px" }}>
      {FLOW.map((f, i) => {
        const done = i < effectiveIdx || (status === "sent" && i <= idx);
        const current = i === effectiveIdx && status !== "sent";
        return (
          <div key={f.key} style={{ display: "flex", alignItems: "center", flex: i < FLOW.length - 1 ? 1 : "0 0 auto" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, minWidth: 60 }}>
              <div
                style={{
                  width: 22, height: 22, borderRadius: "50%",
                  background: done ? C.brand : current ? "#fff" : "#EEF0EC",
                  border: current ? `2px solid ${C.brand}` : "none",
                  color: done ? "#fff" : current ? C.brand : C.inkSoft,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 700, flexShrink: 0,
                }}
              >
                {done ? "✓" : i + 1}
              </div>
              <div style={{ fontSize: 10, textAlign: "center", color: done || current ? C.ink : C.inkSoft, fontWeight: done || current ? 600 : 400, maxWidth: 68 }}>
                {f.label}
              </div>
            </div>
            {i < FLOW.length - 1 && (
              <div style={{ flex: 1, height: 2, background: i < effectiveIdx ? C.brand : "#EEF0EC", marginBottom: 18, minWidth: 20 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function FieldRow({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: C.inkSoft, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{value || "—"}</div>
    </div>
  );
}

function DossierCard({ d, onRefresh }) {
  const dl = deadlineInfo(d);
  const speedLabel = d.speed === "fast" ? "⚡ Nhanh" : "Thường";

  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "16px 20px", marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <Link href={`/hkd/${d.id}`} style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700, color: C.brand, textDecoration: "none" }}>{d.code}</Link>
            <span style={{ fontSize: 13, color: C.ink }}>· {d.procedure}</span>
          </div>
          <Link href={`/hkd/${d.id}`} style={{ fontSize: 15, fontWeight: 700, color: C.ink, textDecoration: "none" }}>{d.name}</Link>
          <div style={{ fontSize: 12, color: C.inkSoft, marginTop: 2 }}>{d.wards?.name || "—"}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999,
            color: d.status === "supplement" ? C.supplement : C.brand,
            background: d.status === "supplement" ? C.supplementSoft : C.brandSoft,
          }}>
            {d.status === "supplement" ? "Cần bổ sung" : FLOW.find((f) => f.key === d.status)?.label}
          </span>
          <div style={{ fontSize: 11, color: C.inkSoft }}>Phụ trách: <strong style={{ color: C.ink }}>{d.employees?.name || "—"}</strong></div>
        </div>
      </div>

      <Timeline status={d.status} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.line}` }}>
        <FieldRow label="Loại hồ sơ" value={speedLabel} />
        <FieldRow label="Ngày tạo" value={fmtDate(d.created_at)} />
        <FieldRow label="Hạn xử lý" value={fmtDate(d.due_at)} />
        <div>
          <div style={{ fontSize: 11, color: C.inkSoft, marginBottom: 2 }}>Tình trạng</div>
          {dl ? (
            <span style={{ fontSize: 12, fontWeight: 700, color: dl.color, background: dl.bg, padding: "2px 8px", borderRadius: 999 }}>{dl.label}</span>
          ) : (
            <span style={{ fontSize: 13, color: C.inkSoft }}>—</span>
          )}
        </div>
      </div>

      {d.status === "supplement" && d.supplement_reason && (
        <div style={{ marginTop: 12, padding: 12, background: C.supplementSoft, borderRadius: 9, fontSize: 13, color: C.supplement }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Hồ sơ cần bổ sung</div>
          <div style={{ color: C.ink, marginBottom: 2 }}><strong>Lý do:</strong> {d.supplement_reason}</div>
          <div style={{ color: C.ink }}><strong>Nguyên nhân:</strong> {d.supplement_cause}</div>
        </div>
      )}

      {d.status === "pending" && (
        <div style={{ marginTop: 12 }}>
          <FileUploadField dossierId={d.id} kind="appointment" label="Giấy hẹn" currentPath={d.appointment_file_path} />
        </div>
      )}
      {d.status === "approved" && (
        <div style={{ marginTop: 12 }}>
          <FileUploadField dossierId={d.id} kind="license" label="Giấy chứng nhận (GCN)" currentPath={d.license_file_path} />
        </div>
      )}

      <div style={{ marginTop: 12 }}>
        <StatusActions
          dossierId={d.id}
          currentStatus={d.status}
          speed={d.speed}
          wardName={d.wards?.name}
          appointmentUploaded={d.appointment_uploaded}
          licenseUploaded={d.license_uploaded}
          onDone={onRefresh}
        />
      </div>
    </div>
  );
}

export default function HkdStatusBoard() {
  const [supabase] = useState(() => createClient());
  const [loading, setLoading] = useState(true);
  const [dossiers, setDossiers] = useState([]);
  const [filter, setFilter] = useState("all");

  async function load() {
    const { data } = await supabase
      .from("dossiers")
      .select("id, code, name, procedure, status, speed, due_at, created_at, appointment_uploaded, license_uploaded, appointment_file_path, license_file_path, supplement_reason, supplement_cause, employees:assigned_employee_id(name), wards:ward_id(name)")
      .eq("group", "Hộ kinh doanh")
      .order("created_at", { ascending: false });
    setDossiers(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [supabase]);

  const visible = useMemo(() => {
    return dossiers
      .filter((d) => d.status !== "sent")
      .filter((d) => (filter === "all" ? true : d.status === filter));
  }, [dossiers, filter]);

  if (loading) return <div style={{ padding: 24 }}>Đang tải...</div>;

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "12px 4px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Trạng thái</h1>
        <Link href="/hkd/new" style={{ background: C.brand, color: "#fff", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>+ Tạo hồ sơ</Link>
      </div>
      <div style={{ fontSize: 13, color: C.inkSoft, marginBottom: 16 }}>
        Điều hành tất cả hồ sơ Hộ kinh doanh đang xử lý — hồ sơ đã gửi giấy phép được ẩn khỏi bảng này, xem lại trong Hồ sơ của tôi / Báo cáo.
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {FILTERS.map((f) => (
          <div
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              fontSize: 12, fontWeight: 600, padding: "6px 14px", borderRadius: 999, cursor: "pointer",
              border: `1px solid ${filter === f.key ? C.brand : C.line}`,
              color: filter === f.key ? C.brand : C.inkSoft,
              background: filter === f.key ? C.brandSoft : "#fff",
            }}
          >
            {f.label}
          </div>
        ))}
      </div>

      {visible.length === 0 ? (
        <div style={{ background: C.card, border: `1px dashed ${C.line}`, borderRadius: 14, padding: 40, textAlign: "center", color: C.inkSoft, fontSize: 13 }}>
          Không có hồ sơ nào ở trạng thái này.
        </div>
      ) : (
        visible.map((d) => <DossierCard key={d.id} d={d} onRefresh={load} />)
      )}
    </div>
  );
}
