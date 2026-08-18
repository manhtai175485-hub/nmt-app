"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";

const PROVINCES = [
  "Thành phố Hà Nội",
  "Thành phố Huế",
  "Tỉnh Quảng Ninh",
  "Tỉnh Cao Bằng",
  "Tỉnh Lạng Sơn",
  "Tỉnh Lai Châu",
  "Tỉnh Điện Biên",
  "Tỉnh Sơn La",
  "Tỉnh Thanh Hóa",
  "Tỉnh Nghệ An",
  "Tỉnh Hà Tĩnh",
  "Tỉnh Tuyên Quang",
  "Tỉnh Lào Cai",
  "Tỉnh Thái Nguyên",
  "Tỉnh Phú Thọ",
  "Tỉnh Bắc Ninh",
  "Tỉnh Hưng Yên",
  "Thành phố Hải Phòng",
  "Tỉnh Ninh Bình",
  "Tỉnh Quảng Trị",
  "Thành phố Đà Nẵng",
  "Tỉnh Quảng Ngãi",
  "Tỉnh Gia Lai",
  "Tỉnh Khánh Hòa",
  "Tỉnh Lâm Đồng",
  "Tỉnh Đắk Lắk",
  "Thành phố Hồ Chí Minh",
  "Tỉnh Đồng Nai",
  "Tỉnh Tây Ninh",
  "Thành phố Cần Thơ",
  "Tỉnh Vĩnh Long",
  "Tỉnh Đồng Tháp",
  "Tỉnh Cà Mau",
  "Tỉnh An Giang",
];

const PROCEDURES = ["Thành lập HKD", "Thay đổi HKD", "Chấm dứt HKD"];
const ISSUING_OFFICES = ["Phòng Kinh tế, Hạ tầng và Đô thị", "Phòng Kinh tế"];
const GENDERS = ["Nam", "Nữ", "Khác"];
const ADDRESS_TYPE_RE = /phố|đường|ngõ|ngách|thôn|xóm|tổ dân phố/i;

const SEVERITY_META = {
  block: { icon: "🔴", label: "Lỗi bắt buộc xử lý", color: "#E14434", bg: "#FCE7E4" },
  warning: { icon: "🟠", label: "Lưu ý nghiệp vụ", color: "#C98A2B", bg: "#FBF1E1" },
  tip: { icon: "🔵", label: "Kinh nghiệm xử lý", color: "#3454A6", bg: "#E8ECF6" },
};

const inputStyle = {
  border: "1px solid #ddd",
  borderRadius: 8,
  padding: "8px 10px",
  fontSize: 14,
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

const cardStyle = {
  border: "1px solid #E9EDE8",
  borderRadius: 12,
  padding: 16,
  background: "#fff",
};

const CAPITAL_PRESETS = [30000000, 50000000, 100000000, 200000000];

const DIGIT_WORDS = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];

function threeDigitToWords(n, isFirstGroup) {
  const tram = Math.floor(n / 100);
  const chuc = Math.floor((n % 100) / 10);
  const donvi = n % 10;
  let parts = [];

  if (tram > 0 || !isFirstGroup) {
    parts.push(DIGIT_WORDS[tram] + " trăm");
  }
  if (chuc === 0) {
    if (donvi > 0 && (tram > 0 || !isFirstGroup)) parts.push("lẻ");
  } else if (chuc === 1) {
    parts.push("mười");
  } else {
    parts.push(DIGIT_WORDS[chuc] + " mươi");
  }
  if (donvi > 0) {
    if (donvi === 1 && chuc >= 2) parts.push("mốt");
    else if (donvi === 5 && chuc >= 1) parts.push("lăm");
    else parts.push(DIGIT_WORDS[donvi]);
  }
  return parts.join(" ");
}

function numberToVietnameseWords(num) {
  const n = Math.floor(Number(num) || 0);
  if (n === 0) return "";
  const units = ["", " nghìn", " triệu", " tỷ"];
  let groups = [];
  let rem = n;
  while (rem > 0) {
    groups.push(rem % 1000);
    rem = Math.floor(rem / 1000);
  }
  let words = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    if (groups[i] === 0) continue;
    const isFirstGroup = i === groups.length - 1;
    words.push(threeDigitToWords(groups[i], isFirstGroup) + units[i]);
  }
  const result = words.join(" ").replace(/\s+/g, " ").trim();
  return result.charAt(0).toUpperCase() + result.slice(1);
}

function suggestCode() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const rand = String(Math.floor(Math.random() * 900) + 100);
  return `HKD-${yy}${mm}${dd}${rand}`;
}

function Field({ label, children, hint, error }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "#333" }}>
      {label}
      {children}
      {hint && !error && <span style={{ fontSize: 11, color: "#888" }}>{hint}</span>}
      {error && <span style={{ fontSize: 11, color: "#C23616" }}>{error}</span>}
    </label>
  );
}

function SectionHeader({ n, title, subtitle }) {
  return (
    <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
      <div
        style={{
          width: 26, height: 26, borderRadius: 7, background: "#1F2421", color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11,
          fontWeight: 700, flexShrink: 0,
        }}
      >
        {n}
      </div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 14, color: "#1F2421" }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: "#5B6660", marginTop: 2 }}>{subtitle}</div>}
      </div>
    </div>
  );
}

const emptyForm = {
  procedure: PROCEDURES[0],
  speed: "normal",
  issuingOffice: "",
  ward_id: "",
  ownerName: "",
  gender: "",
  dob: "",
  cccd: "",
  phone: "",
  email: "",
  businessName: "",
  addressDetail: "",
  province: PROVINCES[0],
  contactAddress: "",
  capital: "",
  capitalWords: "",
  authorizedEmployeeId: "",
};

export default function NewDossierPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [me, setMe] = useState(null);
  const [wards, setWards] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [code] = useState(() => suggestCode());

  const [form, setForm] = useState(emptyForm);
  const [industries, setIndustries] = useState([]);
  const [industryQuery, setIndustryQuery] = useState("");
  const [wardQuery, setWardQuery] = useState("");
  const [industryMatches, setIndustryMatches] = useState([]);

  const [warehouse, setWarehouse] = useState([]);
  const [ackRead, setAckRead] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});
  const [checkResult, setCheckResult] = useState(null);
  const [checked, setChecked] = useState(false);

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

      const { data: wardList } = await supabase.from("wards").select("id, name").order("name");

      const { data: allActive } = await supabase
        .from("employees")
        .select("id, name, role")
        .eq("status", "Đang hoạt động")
        .order("name");

      setMe(meRow || null);
      setWards(wardList || []);
      setEmployees(allActive || []);
      setForm((f) => ({ ...f, authorizedEmployeeId: meRow?.id || "" }));
      setLoading(false);
    })();
  }, [router, supabase]);

  // Gợi ý tên hộ kinh doanh = họ tên chủ hộ + năm sinh, chỉ điền khi ô còn trống (không ghi đè nếu đã tự sửa)
  useEffect(() => {
    setForm((f) => {
      if (f.businessName) return f;
      const year = f.dob ? new Date(f.dob).getFullYear() : "";
      const suggestion = [f.ownerName.trim(), year].filter(Boolean).join(" ");
      return suggestion ? { ...f, businessName: suggestion } : f;
    });
  }, [form.ownerName, form.dob]);

  const wardName = useMemo(
    () => wards.find((w) => w.id === form.ward_id)?.name || "",
    [wards, form.ward_id]
  );

  const wardMatches = useMemo(() => {
    const q = wardQuery.trim().toLowerCase();
    if (!q) return [];
    return wards.filter((w) => w.name.toLowerCase().includes(q)).slice(0, 20);
  }, [wardQuery, wards]);

  useEffect(() => {
    if (!form.ward_id) {
      setWarehouse([]);
      setAckRead(false);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("warehouse_entries")
        .select("id, title, content, suggested_fix, severity")
        .eq("group", "Hộ kinh doanh")
        .eq("procedure", form.procedure)
        .eq("ward_id", form.ward_id)
        .eq("review_status", "approved")
        .eq("hidden", false);
      setWarehouse(data || []);
      setAckRead(false);
    })();
  }, [form.ward_id, form.procedure, supabase]);

  // Tìm ngành nghề từ bảng industry_codes thật (495 mã cấp 4, VSIC 2025)
  useEffect(() => {
    const q = industryQuery.trim();
    if (!q) {
      setIndustryMatches([]);
      return;
    }
    const handle = setTimeout(async () => {
      let query = supabase.from("industry_codes").select("code, name").limit(20);
      if (/^\d+$/.test(q)) {
        query = query.ilike("code", `${q}%`);
      } else {
        query = query.ilike("name", `%${q}%`);
      }
      const { data } = await query;
      setIndustryMatches(data || []);
    }, 250);
    return () => clearTimeout(handle);
  }, [industryQuery, supabase]);

  const whBlocking = warehouse.filter((w) => w.severity === "block");
  const needsAck = warehouse.length > 0 && !ackRead;

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function updateCapital(value) {
    const words = numberToVietnameseWords(value);
    setForm((f) => ({ ...f, capital: value, capitalWords: words ? `${words} Việt Nam đồng` : "" }));
  }

  function addIndustry(item) {
    if (!item.code || !item.name) return;
    setIndustries((prev) => (prev.some((x) => x.code === item.code) ? prev : [...prev, { ...item, detail: "" }]));
  }
  function removeIndustry(codeToRemove) {
    setIndustries((prev) => prev.filter((x) => x.code !== codeToRemove));
  }
  function updateIndustryDetail(codeToUpdate, detail) {
    setIndustries((prev) => prev.map((x) => (x.code === codeToUpdate ? { ...x, detail } : x)));
  }

  function computeFieldErrors() {
    const err = {};
    if (!form.issuingOffice) err.issuingOffice = "Chọn nơi cấp.";
    if (!form.ward_id) err.ward_id = "Chọn phường/xã.";
    if (!form.ownerName.trim()) err.ownerName = "Nhập họ tên chủ hộ.";
    if (!/^\d{12}$/.test(form.cccd)) err.cccd = "CCCD phải gồm đúng 12 chữ số.";
    if (!/^\d{10}$/.test(form.phone)) err.phone = "Số điện thoại phải gồm đúng 10 chữ số.";
    if (industries.length === 0) err.industries = "Thêm ít nhất 1 ngành nghề.";
    if (!form.authorizedEmployeeId) err.authorizedEmployeeId = "Chọn người ủy quyền.";
    return err;
  }

  function runCheck() {
    const err = computeFieldErrors();
    const errorList = Object.values(err);

    if (form.addressDetail && !ADDRESS_TYPE_RE.test(form.addressDetail)) {
      errorList.push(
        `"${form.addressDetail}" có thể thiếu loại đường (phố/đường/ngõ/ngách/thôn/xóm/tổ dân phố...).`
      );
    }
    whBlocking.forEach((w) => errorList.push(`[Kho nghiệp vụ – bắt buộc xử lý] ${w.title}: ${w.content}`));
    const notices = warehouse
      .filter((w) => w.severity !== "block")
      .map((w) => `[${SEVERITY_META[w.severity].label}] ${w.title}: ${w.content}`);

    setFieldErrors(err);
    setCheckResult({ errors: errorList, notices });
    setChecked(Object.keys(err).length === 0 && whBlocking.length === 0);
  }

  async function handleCreate() {
    if (!checked) return;
    setError("");
    setSaving(true);

    const payload = {
      code,
      name: form.businessName.trim() || form.ownerName.trim(),
      group: "Hộ kinh doanh",
      procedure: form.procedure,
      ward_id: form.ward_id,
      assigned_employee_id: form.authorizedEmployeeId || null,
      speed: form.speed,
      issuing_office: form.issuingOffice,
      owner_name: form.ownerName.trim(),
      gender: form.gender || null,
      dob: form.dob || null,
      cccd: form.cccd,
      phone: form.phone,
      email: form.email.trim() || null,
      business_name: form.businessName.trim() || null,
      address_detail: form.addressDetail.trim() || null,
      province: form.province.trim() || null,
      contact_address: form.contactAddress.trim() || null,
      capital: form.capital ? Number(form.capital) : null,
      capital_words: form.capitalWords.trim() || null,
      authorized_employee_id: form.authorizedEmployeeId || null,
    };

    const { data: dossier, error: insertError } = await supabase
      .from("dossiers")
      .insert(payload)
      .select("id")
      .single();

    if (insertError) {
      setSaving(false);
      setError(
        insertError.code === "23505"
          ? "Mã hồ sơ này đã tồn tại, vui lòng thử lại."
          : "Có lỗi khi lưu hồ sơ: " + insertError.message
      );
      return;
    }

    if (industries.length > 0) {
      const rows = industries.map((i, idx) => ({
        dossier_id: dossier.id,
        code: i.code,
        name: i.name,
        is_main: idx === 0,
        detail: i.detail?.trim() || null,
      }));
      await supabase.from("dossier_industries").insert(rows);
    }

    setSaving(false);
    router.push(`/hkd/${dossier.id}`);
  }

  if (loading) {
    return <div style={{ padding: 24 }}>Đang tải...</div>;
  }

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "12px 4px" }}>
      <Link href="/hkd" style={{ fontSize: 13, color: "#687269", textDecoration: "none" }}>
        ← Quay lại danh sách
      </Link>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "12px 0 4px" }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Tạo hồ sơ Hộ kinh doanh mới</h1>
        <div
          style={{
            fontFamily: "monospace", fontSize: 13, fontWeight: 700, color: "#A9201F",
            background: "#F7E7E4", padding: "4px 10px", borderRadius: 8,
          }}
        >
          Mã hồ sơ: {code}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 16 }}>
        <div style={cardStyle}>
          <SectionHeader n="01" title="Loại thủ tục" />
          <Field label="Loại thủ tục">
            <select style={inputStyle} value={form.procedure} onChange={(e) => update("procedure", e.target.value)}>
              {PROCEDURES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Loại hồ sơ">
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              {[{ k: "normal", l: "Thường (3 ngày làm việc)" }, { k: "fast", l: "⚡ Nhanh (1 ngày làm việc)" }].map((s) => (
                <div
                  key={s.k}
                  onClick={() => update("speed", s.k)}
                  style={{
                    flex: 1, textAlign: "center", padding: "8px 0", borderRadius: 9, cursor: "pointer",
                    fontSize: 13, fontWeight: 600,
                    border: `1px solid ${form.speed === s.k ? "#A9201F" : "#E9EDE8"}`,
                    color: form.speed === s.k ? "#A9201F" : "#5B6660",
                    background: form.speed === s.k ? "#F7E7E4" : "#fff",
                  }}
                >
                  {s.l}
                </div>
              ))}
            </div>
          </Field>
        </div>

        <div style={cardStyle}>
          <SectionHeader n="02" title="Nơi cấp và phường/xã" />
          <Field label="Nơi cấp" error={fieldErrors.issuingOffice}>
            <select style={inputStyle} value={form.issuingOffice} onChange={(e) => update("issuingOffice", e.target.value)}>
              <option value="">Chọn nơi cấp</option>
              {ISSUING_OFFICES.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Phường / xã" error={fieldErrors.ward_id}>
            {form.ward_id ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid #ddd", borderRadius: 8, padding: "8px 10px", fontSize: 14 }}>
                <span>{wardName}</span>
                <span
                  onClick={() => { update("ward_id", ""); setWardQuery(""); }}
                  style={{ color: "#5B6660", cursor: "pointer", fontSize: 13 }}
                >
                  Đổi
                </span>
              </div>
            ) : (
              <>
                <input
                  style={inputStyle}
                  placeholder="Gõ chữ cái đầu để tìm phường/xã..."
                  value={wardQuery}
                  onChange={(e) => setWardQuery(e.target.value)}
                />
                {wardMatches.length > 0 && (
                  <div style={{ border: "1px solid #E9EDE8", borderRadius: 9, marginTop: 4, overflow: "hidden", maxHeight: 220, overflowY: "auto" }}>
                    {wardMatches.map((w) => (
                      <div
                        key={w.id}
                        onClick={() => { update("ward_id", w.id); setWardQuery(""); }}
                        style={{ padding: "8px 12px", fontSize: 13, cursor: "pointer", borderBottom: "1px solid #E9EDE8", color: "#1F2421" }}
                      >
                        {w.name}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </Field>

          {form.ward_id && (
            <div style={{ background: warehouse.length ? "#FBF1E1" : "#FAFBF9", borderRadius: 9, padding: 12, fontSize: 13, marginTop: 4 }}>
              <div style={{ fontWeight: 700, color: warehouse.length ? "#C98A2B" : "#5B6660", marginBottom: 8 }}>
                {warehouse.length ? `⚠️ LƯU Ý HỒ SƠ TẠI ${wardName.toUpperCase()}` : `Kho nghiệp vụ — ${wardName}`}
              </div>
              {warehouse.length > 0 ? (
                <>
                  <div style={{ color: "#1F2421", marginBottom: 8 }}>
                    Đã ghi nhận {warehouse.length} vấn đề nghiệp vụ trước đây cho <strong>{form.procedure}</strong>:
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
                    {warehouse.map((w) => {
                      const sv = SEVERITY_META[w.severity];
                      return (
                        <div key={w.id} style={{ background: "#fff", borderRadius: 8, padding: "8px 10px", border: "1px solid #E9EDE8" }}>
                          <div style={{ fontWeight: 700, color: sv.color, marginBottom: 2 }}>{sv.icon} {w.title}</div>
                          <div style={{ color: "#1F2421", marginBottom: 2 }}>{w.content}</div>
                          {w.suggested_fix && <div style={{ color: "#5B6660", fontSize: 12 }}>Hướng xử lý: {w.suggested_fix}</div>}
                        </div>
                      );
                    })}
                  </div>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "#1F2421", cursor: "pointer" }}>
                    <input type="checkbox" checked={ackRead} onChange={(e) => setAckRead(e.target.checked)} />
                    ✓ TÔI ĐÃ ĐỌC CÁC LƯU Ý
                  </label>
                </>
              ) : (
                <div style={{ color: "#5B6660" }}>Chưa có lưu ý nào cho phường/xã này.</div>
              )}
            </div>
          )}
        </div>

        <div style={cardStyle}>
          <SectionHeader n="03" title="Thông tin chủ hộ" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <Field label="Họ tên chủ hộ" error={fieldErrors.ownerName}>
              <input style={inputStyle} placeholder="NGUYỄN VĂN A" value={form.ownerName} onChange={(e) => update("ownerName", e.target.value)} />
            </Field>
            <Field label="Giới tính chủ hộ">
              <select style={inputStyle} value={form.gender} onChange={(e) => update("gender", e.target.value)}>
                <option value="">Chọn giới tính</option>
                {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <Field label="Ngày sinh chủ hộ">
              <input type="date" style={inputStyle} value={form.dob} onChange={(e) => update("dob", e.target.value)} />
            </Field>
            <Field label="Số CCCD" error={fieldErrors.cccd} hint="12 chữ số">
              <input style={inputStyle} placeholder="Nhập đủ 12 chữ số" value={form.cccd}
                onChange={(e) => update("cccd", e.target.value.replace(/\D/g, "").slice(0, 12))} />
            </Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <Field label="Số điện thoại" error={fieldErrors.phone} hint="10 chữ số">
              <input style={inputStyle} placeholder="0xxxxxxxxx" value={form.phone}
                onChange={(e) => update("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} />
            </Field>
            <Field label="Email" hint="Không bắt buộc">
              <input style={inputStyle} placeholder="ten@email.com" value={form.email} onChange={(e) => update("email", e.target.value)} />
            </Field>
          </div>
          <Field label="Tên hộ kinh doanh" hint="Tự động gợi ý theo họ tên + năm sinh chủ hộ, có thể sửa lại">
            <input style={inputStyle} placeholder="Ví dụ: NGUYỄN VĂN A 1990" value={form.businessName} onChange={(e) => update("businessName", e.target.value)} />
          </Field>
        </div>

        <div style={cardStyle}>
          <SectionHeader n="04" title="Địa chỉ" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <Field label="Địa chỉ chi tiết trụ sở" hint="Ghi rõ loại đường: phố/đường/ngõ/ngách/thôn/xóm...">
              <input style={inputStyle} placeholder="Số nhà, ngõ, đường, tổ/thôn..." value={form.addressDetail} onChange={(e) => update("addressDetail", e.target.value)} />
            </Field>
            <Field label="Tỉnh / Thành phố">
              <select style={inputStyle} value={form.province} onChange={(e) => update("province", e.target.value)}>
                {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Địa chỉ liên lạc">
            <textarea style={{ ...inputStyle, minHeight: 56, resize: "vertical" }} placeholder="Nơi ở hiện tại" value={form.contactAddress} onChange={(e) => update("contactAddress", e.target.value)} />
          </Field>
        </div>

        <div style={cardStyle}>
          <SectionHeader n="05" title="Ngành, nghề kinh doanh" subtitle="Tìm theo mã hoặc tên trong danh mục 495 ngành cấp 4 (VSIC 2025) — có thể thêm nhiều ngành." />
          <Field label="Tìm ngành nghề" error={fieldErrors.industries}>
            <input style={inputStyle} placeholder="Nhập mã (vd: 4711) hoặc tên (vd: may mặc)..." value={industryQuery} onChange={(e) => setIndustryQuery(e.target.value)} />
            {industryMatches.length > 0 && (
              <div style={{ border: "1px solid #E9EDE8", borderRadius: 9, marginTop: 4, overflow: "hidden", maxHeight: 260, overflowY: "auto" }}>
                {industryMatches.map((i) => (
                  <div key={i.code} onClick={() => { addIndustry(i); setIndustryQuery(""); setIndustryMatches([]); }}
                    style={{ padding: "8px 12px", fontSize: 13, cursor: "pointer", borderBottom: "1px solid #E9EDE8", display: "flex", gap: 8 }}>
                    <span style={{ fontFamily: "monospace", color: "#A9201F", fontWeight: 700 }}>{i.code}</span>
                    <span style={{ color: "#1F2421" }}>{i.name}</span>
                  </div>
                ))}
              </div>
            )}
          </Field>

          <div style={{ border: "1px solid #E9EDE8", borderRadius: 9, padding: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#5B6660", marginBottom: 8 }}>DANH SÁCH NGÀNH NGHỀ ({industries.length})</div>
            {industries.length === 0 ? (
              <div style={{ fontSize: 13, color: "#5B6660" }}>Chưa có ngành nghề nào.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {industries.map((i, idx) => (
                  <div key={i.code} style={{ padding: "8px 10px", background: idx === 0 ? "#F7E7E4" : "#FAFBF9", borderRadius: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ fontFamily: "monospace", color: "#A9201F", fontWeight: 700, fontSize: 12 }}>{i.code}</span>
                        <span style={{ fontSize: 13, color: "#1F2421" }}>{i.name}</span>
                        {idx === 0 && <span style={{ fontSize: 11, fontWeight: 600, color: "#A9201F", background: "#fff", padding: "2px 6px", borderRadius: 6 }}>Ngành chính</span>}
                      </div>
                      <span onClick={() => removeIndustry(i.code)} style={{ color: "#5B6660", cursor: "pointer", fontSize: 13 }}>✕</span>
                    </div>
                    <textarea
                      placeholder="Chi tiết hoạt động của ngành này (tự nhập, không bắt buộc)..."
                      value={i.detail || ""}
                      onChange={(e) => updateIndustryDetail(i.code, e.target.value)}
                      style={{ ...inputStyle, minHeight: 40, resize: "vertical", fontSize: 12, marginTop: 6, background: "#fff" }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
            <Field label="Vốn kinh doanh">
              <input style={inputStyle} placeholder="100.000.000" value={form.capital} onChange={(e) => updateCapital(e.target.value.replace(/[^\d]/g, ""))} />
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                {CAPITAL_PRESETS.map((v) => (
                  <div
                    key={v}
                    onClick={() => updateCapital(String(v))}
                    style={{
                      fontSize: 12, padding: "4px 10px", borderRadius: 999, cursor: "pointer",
                      border: `1px solid ${String(v) === form.capital ? "#A9201F" : "#E9EDE8"}`,
                      color: String(v) === form.capital ? "#A9201F" : "#5B6660",
                      background: String(v) === form.capital ? "#F7E7E4" : "#fff",
                    }}
                  >
                    {v.toLocaleString("vi-VN")}
                  </div>
                ))}
              </div>
            </Field>
            <Field label="Tổng số (bằng chữ)" hint="Tự động điền, có thể sửa lại">
              <input style={inputStyle} placeholder="Một trăm triệu" value={form.capitalWords} onChange={(e) => update("capitalWords", e.target.value)} />
            </Field>
          </div>
        </div>

        <div style={cardStyle}>
          <SectionHeader n="06" title="Người ủy quyền" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 8 }}>
            {employees.map((s) => (
              <div key={s.id} onClick={() => update("authorizedEmployeeId", s.id)}
                style={{
                  border: `1px solid ${form.authorizedEmployeeId === s.id ? "#A9201F" : "#E9EDE8"}`,
                  background: form.authorizedEmployeeId === s.id ? "#F7E7E4" : "#fff",
                  borderRadius: 9, padding: "10px 12px", cursor: "pointer",
                }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1F2421" }}>{s.name}</div>
              </div>
            ))}
          </div>
          {fieldErrors.authorizedEmployeeId && (
            <div style={{ fontSize: 12, color: "#E14434", marginTop: 8 }}>{fieldErrors.authorizedEmployeeId}</div>
          )}
        </div>

        {checkResult && (
          <div style={{ ...cardStyle, borderColor: checkResult.errors.length ? "#E14434" : "#2F6844" }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#1F2421", marginBottom: 10 }}>Kết quả kiểm tra</div>
            {checkResult.errors.length > 0 && (
              <div style={{ marginBottom: checkResult.notices.length ? 10 : 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#E14434", marginBottom: 4 }}>🔴 LỖI DỮ LIỆU — CẦN SỬA</div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#1F2421" }}>
                  {checkResult.errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            )}
            {checkResult.notices.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#C98A2B", marginBottom: 4 }}>⚠️ LƯU Ý NGHIỆP VỤ</div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#1F2421" }}>
                  {checkResult.notices.map((n, i) => <li key={i}>{n}</li>)}
                </ul>
              </div>
            )}
            {checkResult.errors.length === 0 && checkResult.notices.length === 0 && (
              <div style={{ fontSize: 13, color: "#2F6844" }}>Hồ sơ hợp lệ, không có lỗi hay lưu ý nào.</div>
            )}
          </div>
        )}

        {error && <div style={{ color: "#A9201F", fontSize: 13 }}>{error}</div>}

        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={runCheck}
            disabled={needsAck}
            style={{
              flex: 1, border: "1px solid #A9201F", color: "#A9201F", background: "#fff",
              borderRadius: 8, padding: "10px 16px", fontSize: 14, fontWeight: 600,
              cursor: needsAck ? "default" : "pointer", opacity: needsAck ? 0.5 : 1,
            }}
          >
            Kiểm tra thông tin
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={!checked || needsAck || saving}
            style={{
              flex: 1, background: "#A9201F", color: "#fff", border: "none", borderRadius: 8,
              padding: "10px 16px", fontSize: 14, fontWeight: 600,
              cursor: (!checked || needsAck || saving) ? "default" : "pointer",
              opacity: (!checked || needsAck || saving) ? 0.5 : 1,
            }}
          >
            {saving ? "Đang lưu..." : "Tạo hồ sơ"}
          </button>
        </div>
        {needsAck && <div style={{ fontSize: 12, color: "#C98A2B" }}>Cần xác nhận đã đọc lưu ý Kho nghiệp vụ ở mục 02 trước khi kiểm tra/tạo hồ sơ.</div>}
      </div>
    </div>
  );
}
