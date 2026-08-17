import { NextResponse } from "next/server";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import fs from "fs";
import path from "path";
import { createClient } from "@/lib/supabaseServer";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function splitDate(dateStr) {
  if (!dateStr) return { day: "", month: "", year: "" };
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return { day: "", month: "", year: "" };
  return { day: pad2(d.getDate()), month: pad2(d.getMonth() + 1), year: String(d.getFullYear()) };
}

function formatDate(dateStr) {
  const { day, month, year } = splitDate(dateStr);
  if (!day) return "";
  return `${day}/${month}/${year}`;
}

function formatNumber(n) {
  if (n === null || n === undefined) return "";
  return Number(n).toLocaleString("vi-VN");
}

export async function GET(request, { params }) {
  const { id } = params;
  const supabase = createClient();

  const { data: dossier, error: dossierError } = await supabase
    .from("dossiers")
    .select("*, wards:ward_id(name), employee:authorized_employee_id(id, name, dob, gender, cccd, phone, address_detail)")
    .eq("id", id)
    .single();

  if (dossierError || !dossier) {
    return NextResponse.json({ error: "Không tìm thấy hồ sơ" }, { status: 404 });
  }

  const { data: industries } = await supabase
    .from("dossier_industries")
    .select("code, name, is_main, detail")
    .eq("dossier_id", id)
    .order("is_main", { ascending: false });

  const ind = industries || [];
  const nganh = ind.map((i, idx) => ({
    stt: idx + 1,
    ten: i.name + (i.detail ? ` (Chi tiết: ${i.detail})` : ""),
    ma: i.code,
    x: idx === 0 ? "X" : "",
  }));

  const lap = splitDate(new Date().toISOString());
  const sinh = splitDate(dossier.dob);
  const tenPhuong = dossier.wards?.name || "";
  const emp = dossier.employee || {};

  const templateData = {
    ngay_lap: lap.day,
    thang_lap: lap.month,
    nam_lap: lap.year,
    noi_cap: dossier.issuing_office || "",
    ten_phuong: tenPhuong,
    ho_ten: dossier.owner_name || "",
    ngay_sinh: sinh.day,
    thang_sinh: sinh.month,
    nam_sinh: sinh.year,
    gioi_tinh: dossier.gender || "",
    cccd: dossier.cccd || "",
    dien_thoai: dossier.phone || "",
    ten_ho_kd: dossier.business_name || dossier.name || "",
    dia_chi_tru_so: dossier.address_detail || "",
    nganh,
    von: formatNumber(dossier.capital),
    von_bang_chu: dossier.capital_words || "",
    lien_lac_so_nha: dossier.contact_address || "",
    lien_lac_phuong: "",
    lien_lac_tinh: "",
    ben_b_ho_ten: emp.name || "",
    ben_b_gioi_tinh: (emp.gender || "").toLowerCase(),
    ben_b_ngay_sinh: formatDate(emp.dob),
    ben_b_cccd: emp.cccd || "",
    ben_b_dia_chi: emp.address_detail || "",
    ben_b_dien_thoai: emp.phone || "",
  };

  const templatePath = path.join(process.cwd(), "templates", "mau-don-hkd-v3.docx");
  const content = fs.readFileSync(templatePath, "binary");
  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

  doc.render(templateData);

  const buf = doc.getZip().generate({ type: "nodebuffer" });
  const filename = `GiayDeNghi-${dossier.code || id}.docx`;

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
    },
  });
}
