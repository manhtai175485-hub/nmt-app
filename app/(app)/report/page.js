import { createClient } from "@/lib/supabaseServer";
import { currentMonthKey, monthOptions, isInMonth } from "@/lib/month";
import MonthSelect from "@/components/MonthSelect";
import { isOverdue } from "@/lib/deadline";

export default async function ReportPage({ searchParams }) {
  const supabase = createClient();
  const month = searchParams?.month || currentMonthKey();
  const options = monthOptions(6);

  const { data: { user } } = await supabase.auth.getUser();
  const { data: me } = await supabase.from("employees").select("*").eq("auth_user_id", user.id).single();
  const isManager = me.role === "Quản lý";

  const { data: wageRatesRaw } = await supabase.from("wage_rates").select("group, amount");
  const wageRates = Object.fromEntries((wageRatesRaw || []).map((w) => [w.group, w.amount]));

  const targets = isManager
    ? (await supabase.from("employees").select("*").eq("role", "Nhân viên").order("created_at")).data || []
    : [me];

  const rows = await Promise.all(
    targets.map(async (emp) => {
      const { data: dossiers } = await supabase
        .from("dossiers")
        .select("id, status, due_at, payment_status, paid_at, group")
        .eq("assigned_employee_id", emp.id);

      const list = dossiers || [];
      const paidThisMonth = list.filter((d) => d.status === "sent" && d.payment_status === "Đã thu" && isInMonth(d.paid_at, month));
      const wage = paidThisMonth.reduce((s, d) => s + (wageRates[d.group] || 0), 0);

      const overdue = list.filter((d) => isOverdue(d)).length;
      const onTimeRate = list.length ? Math.round(((list.length - overdue) / list.length) * 100) : null;
      const suggestedBonus = onTimeRate !== null && onTimeRate >= 90 ? 1000000 : 0;

      const { data: adjustments } = await supabase
        .from("employee_adjustments")
        .select("kind, amount")
        .eq("employee_id", emp.id)
        .eq("month_key", month);

      const bonus = (adjustments || []).filter((a) => a.kind === "Thưởng").reduce((s, a) => s + a.amount, 0);
      const penalty = (adjustments || []).filter((a) => a.kind === "Phạt").reduce((s, a) => s + a.amount, 0);
      const net = wage + bonus - penalty;

      return { employee: emp, completed: paidThisMonth.length, wage, onTimeRate, suggestedBonus, bonus, penalty, net };
    })
  );

  const totalWage = rows.reduce((s, r) => s + r.wage, 0);
  const totalNet = rows.reduce((s, r) => s + r.net, 0);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 4 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Báo cáo</h1>
        <MonthSelect options={options} />
      </div>
      <p style={{ fontSize: 13, color: "#6B7269", marginBottom: 20 }}>
        Tiền công tính tự động từ hồ sơ đã "Đã thu" trong tháng · Dữ liệu thật từ Supabase.
      </p>

      {isManager && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 20 }}>
          <Stat label="Tổng tiền công tháng" value={`${totalWage.toLocaleString("vi-VN")}đ`} color="#1F2421" />
          <Stat label="Tổng thực nhận (công + thưởng - phạt)" value={`${totalNet.toLocaleString("vi-VN")}đ`} color="#A9201F" />
        </div>
      )}

      <div style={{ border: "1px solid #E2E5DF", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#FAFBF9" }}>
              <th style={th}>Nhân viên</th>
              <th style={th}>Hồ sơ hoàn thành</th>
              <th style={th}>Tỷ lệ đúng hạn</th>
              <th style={th}>Tiền công</th>
              <th style={th}>Thưởng</th>
              <th style={th}>Phạt</th>
              <th style={th}>Thực nhận</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.employee.id} style={{ borderTop: "1px solid #E2E5DF" }}>
                <td style={{ ...td, fontWeight: 600 }}>{r.employee.name}</td>
                <td style={td}>{r.completed}</td>
                <td style={td}>
                  <span style={{ color: r.onTimeRate === null ? "#6B7269" : r.onTimeRate >= 90 ? "#1E8E5A" : "#8A6D00", fontWeight: 600 }}>
                    {r.onTimeRate === null ? "—" : `${r.onTimeRate}%`}
                  </span>
                  {r.suggestedBonus > 0 && r.bonus === 0 && (
                    <div style={{ fontSize: 11, color: "#6B7269" }}>Đề xuất thưởng 1.000.000đ</div>
                  )}
                </td>
                <td style={{ ...td, fontWeight: 600 }}>{r.wage.toLocaleString("vi-VN")}đ</td>
                <td style={{ ...td, color: r.bonus ? "#1E8E5A" : "#6B7269" }}>{r.bonus.toLocaleString("vi-VN")}đ</td>
                <td style={{ ...td, color: r.penalty ? "#C23616" : "#6B7269" }}>{r.penalty.toLocaleString("vi-VN")}đ</td>
                <td style={{ ...td, fontWeight: 700, color: "#A9201F" }}>{r.net.toLocaleString("vi-VN")}đ</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{ background: "#F2F4F1", borderRadius: 12, padding: "14px 16px" }}>
      <div style={{ fontSize: 12, color: "#6B7269", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 19, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

const th = { textAlign: "left", padding: "10px 14px", fontSize: 12, color: "#6B7269", fontWeight: 600 };
const td = { padding: "10px 14px" };
