"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";

function suggestCode() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const rand = String(Math.floor(Math.random() * 900) + 100);
  return `HKD-${yy}${mm}${dd}${rand}`;
}

const inputStyle = {
  border: "1px solid #ddd",
  borderRadius: 8,
  padding: "8px 10px",
  fontSize: 14,
  outline: "none",
};

function Field({ label, children }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "#333" }}>
      {label}
      {children}
    </label>
  );
}

export default function NewDossierPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [me, setMe] = useState(null);
  const [wards, setWards] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [form, setForm] = useState({
    code: "",
    name: "",
    procedure: "",
    ward_id: "",
    assigned_employee_id: "",
    speed: "normal",
  });

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: meRow } = await supabase
        .from("employees")
        .select("id, role")
        .eq("auth_user_id", user.id)
        .single();

      const { data: wardList } = await supabase
        .from("wards")
        .select("id, name")
        .order("name");

      let employeeList = [];
      if (meRow?.role === "Quản lý") {
        const { data } = await supabase
          .from("employees")
          .select("id, name")
          .eq("status", "Đang hoạt động")
          .order("name");
        employeeList = data || [];
      }

      setMe(meRow || null);
      setWards(wardList || []);
      setEmployees(employeeList);
      setForm((f) => ({
        ...f,
        assigned_employee_id: meRow?.id || "",
        code: suggestCode(),
      }));
      setLoading(false);
    })();
  }, [router, supabase]);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.code.trim() || !form.name.trim()) {
      setError("Vui lòng nhập đầy đủ Mã hồ sơ và Tên hộ kinh doanh.");
      return;
    }

    setSaving(true);

    const payload = {
      code: form.code.trim(),
      name: form.name.trim(),
      group: "Hộ kinh doanh",
      procedure: form.procedure.trim() || null,
      ward_id: form.ward_id || null,
      assigned_employee_id: form.assigned_employee_id || null,
      speed: form.speed,
    };

    const { data, error: insertError } = await supabase
      .from("dossiers")
      .insert(payload)
      .select("id")
      .single();

    setSaving(false);

    if (insertError) {
      setError(
        insertError.code === "23505"
          ? "Mã hồ sơ này đã tồn tại, vui lòng đổi mã khác."
          : "Có lỗi khi lưu hồ sơ: " + insertError.message
      );
      return;
    }

    router.push(`/hkd/${data.id}`);
  }

  if (loading) {
    return <div style={{ padding: 24 }}>Đang tải...</div>;
  }

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "12px 4px" }}>
      <Link href="/hkd" style={{ fontSize: 13, color: "#687269", textDecoration: "none" }}>
        ← Quay lại danh sách
      </Link>

      <h1 style={{ fontSize: 20, fontWeight: 700, margin: "12px 0 20px" }}>
        Tạo hồ sơ Hộ kinh doanh mới
      </h1>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Field label="Mã hồ sơ *">
          <input value={form.code} onChange={(e) => update("code", e.target.value)} style={inputStyle} />
        </Field>

        <Field label="Tên hộ kinh doanh *">
          <input
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="VD: HỘ KINH DOANH NGUYỄN VĂN A"
            style={inputStyle}
          />
        </Field>

        <Field label="Thủ tục">
          <input
            value={form.procedure}
            onChange={(e) => update("procedure", e.target.value)}
            placeholder="VD: Thành lập HKD"
            style={inputStyle}
          />
        </Field>

        <Field label="Phường/Xã">
          <select value={form.ward_id} onChange={(e) => update("ward_id", e.target.value)} style={inputStyle}>
            <option value="">— Chọn phường/xã —</option>
            {wards.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </Field>

        {me?.role === "Quản lý" && (
          <Field label="Nhân viên phụ trách">
            <select
              value={form.assigned_employee_id}
              onChange={(e) => update("assigned_employee_id", e.target.value)}
              style={inputStyle}
            >
              <option value="">— Chọn nhân viên —</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </Field>
        )}

        <Field label="Tốc độ xử lý">
          <select value={form.speed} onChange={(e) => update("speed", e.target.value)} style={inputStyle}>
            <option value="normal">Bình thường</option>
            <option value="fast">Nhanh</option>
          </select>
        </Field>

        {error && <div style={{ color: "#A9201F", fontSize: 13 }}>{error}</div>}

        <button
          type="submit"
          disabled={saving}
          style={{
            background: "#A9201F",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "10px 16px",
            fontSize: 14,
            fontWeight: 600,
            cursor: saving ? "default" : "pointer",
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Đang lưu..." : "Tạo hồ sơ"}
        </button>
      </form>
    </div>
  );
}
