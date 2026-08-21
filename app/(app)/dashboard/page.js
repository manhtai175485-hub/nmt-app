import { createClient } from "@/lib/supabaseServer";
import { currentMonthKey, monthOptions, isInMonth } from "@/lib/month";
import MonthSelect from "@/components/MonthSelect";

const C = {
  brand: "#A9201F",
  ink: "#1F2421",
  inkSoft: "#6B7269",
  cardBg: "#F2F4F1",
  line: "#E2E5DF",
};

function Stat({ label, value }) {
  return (
    <div style={{ background: C.cardBg, borderRadius: 12, padding: "18px 20px" }}>
      <div style={{ fontSize: 12, color: C.inkSoft, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: C.ink }}>{value}</div>
    </div>
  );
}

export default async function DashboardPage({ searchParams }) {
  const supabase = createClient();
  const month = searchParams?.month || currentMonthKey();
  const options = monthOptions(6);

  const { data: { user } } = await supabase.auth.getUser();
  const { data: employee } = await supabase.from("employees").select("*").eq("auth_user_id", user.id).single();
  const isManager = employee.role === "Quản lý";

  if (isManager) {
    const { count } = await supabase
      .from("dossiers")
      .select("*", { count: "exact", head: true })
      .neq("status", "sent");

    return (
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Xin chào, {employee.name}</h1>
        <p style={{ fontSize: 13, color: C.inkSoft, marginBottom: 20 }}>
          Dashboard dành riêng cho Quản lý sẽ được xây dựng ở giai đoạn tiếp theo.
        </p>
        <div style={{ maxWidth: 240 }}>
          <Stat label="Hồ sơ toàn hệ thống đang xử lý" value={count ?? 0} />
        </div>
      </div>
    );
  }

  const { data: wageRatesRaw } = await supabase.from("wage_rates").select("group, amount");
  const wageRates = Object.fromEntries((wageRatesRaw || []).map((w) => [w.group, w.amount]));

  const { data: dossiersRaw } = await supabase
    .from("dossiers")
    .select("id, status, group, created_at")
    .eq("assigned_employee_id", employee.id);

  const list = (dossiersRaw || []).filter((d) => isInMonth(d.created_at, month));

  const total = list.length;
  const inProgress = list.filter((d) => d.status !== "sent").length;
  const completedList = list.filter((d) => d.status === "sent");
  const completed = completedList.length;
  const expectedWage = completedList.reduce((s, d) => s + (wageRates[d.group] || 0), 0);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 4 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Xin chào, {employee.name}</h1>
        <MonthSelect options={options} />
      </div>
      <p style={{ fontSize: 13, color: C.inkSoft, marginBottom: 20 }}>
        Tổng quan công việc trong tháng được chọn — dữ liệu thật từ Supabase.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        <Stat label="Tổng hồ sơ" value={total} />
        <Stat label="Đang xử lý" value={inProgress} />
        <Stat label="Hoàn thành" value={completed} />
        <Stat label="Tiền công dự kiến" value={`${expectedWage.toLocaleString("vi-VN")}đ`} />
      </div>
    </div>
  );
}
