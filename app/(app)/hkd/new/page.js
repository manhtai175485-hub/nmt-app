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

const PROCEDURES = ["Thành lập HKD", "Thay đổi HKD", "Cấp lại HKD", "Chấm dứt HKD"];
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
