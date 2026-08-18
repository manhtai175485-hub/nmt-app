import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: overdueDossiers, error: fetchError } = await supabase
    .from("dossiers")
    .select("id, assigned_employee_id, due_at")
    .lt("due_at", new Date().toISOString())
    .is("overdue_penalty_applied_at", null)
    .not("status", "eq", "sent")
    .not("assigned_employee_id", "is", null);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  const list = overdueDossiers || [];
  let penalized = 0;

  for (const d of list) {
    const now = new Date().toISOString();
    const monthKey = now.slice(0, 7);

    const { error: adjError } = await supabase.from("employee_adjustments").insert({
      employee_id: d.assigned_employee_id,
      dossier_id: d.id,
      kind: "Phạt",
      amount: 50000,
      reason: "Chậm chuyển trạng thái sau khi có thông báo quá hạn",
      month_key: monthKey,
    });

    if (!adjError) {
      await supabase
        .from("dossiers")
        .update({ overdue_penalty_applied_at: now })
        .eq("id", d.id);
      penalized++;
    }
  }

  return NextResponse.json({ checked: list.length, penalized });
}
