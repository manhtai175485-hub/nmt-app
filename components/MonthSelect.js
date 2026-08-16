"use client";
import { useRouter, useSearchParams } from "next/navigation";

export default function MonthSelect({ options }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("month") || options[0];

  function onChange(e) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", e.target.value);
    router.push(`/report?${params.toString()}`);
  }

  return (
    <select value={current} onChange={onChange} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #E2E5DF", fontSize: 13 }}>
      {options.map((m) => <option key={m} value={m}>Tháng {m}</option>)}
    </select>
  );
}
