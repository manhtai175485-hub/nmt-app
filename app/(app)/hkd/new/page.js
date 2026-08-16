import { createClient } from "@/lib/supabaseServer";
import NewDossierForm from "@/components/NewDossierForm";

export default async function NewHkdPage() {
  const supabase = createClient();
  const { data: wards } = await supabase.from("wards").select("id, name").order("name");

  return (
    <div style={{ maxWidth: 560 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Tạo hồ sơ Hộ kinh doanh</h1>
      <NewDossierForm wards={wards || []} />
    </div>
  );
}
