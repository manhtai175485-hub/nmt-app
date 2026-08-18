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
