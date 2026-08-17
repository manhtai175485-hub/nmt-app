"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

export default function FileUploadField({ dossierId, kind, label, currentPath }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const uploadedFlagCol = kind === "appointment" ? "appointment_uploaded" : "license_uploaded";
  const pathCol = kind === "appointment" ? "appointment_file_path" : "license_file_path";

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError("");

    const path = `${dossierId}/${kind}-${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("dossier-files").upload(path, file);
    if (uploadError) {
      setError("Không tải lên được: " + uploadError.message);
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase.from("dossiers").update({
      [uploadedFlagCol]: true,
      [pathCol]: path,
    }).eq("id", dossierId);

    setLoading(false);
    if (updateError) { setError("Lỗi lưu: " + updateError.message); return; }
    router.refresh();
  }

  async function openFile() {
    if (!currentPath) return;
    const { data } = await supabase.storage.from("dossier-files").createSignedUrl(currentPath, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
      <span style={{ color: "#6B7269", minWidth: 140 }}>{label}</span>
      {currentPath ? (
        <>
          <span style={{ color: "#1E8E5A", fontWeight: 600 }}>✓ Đã tải lên</span>
          <button onClick={openFile} style={linkBtn}>Xem file</button>
          <label style={linkBtn}>
            Tải lại
            <input type="file" onChange={handleFile} style={{ display: "none" }} />
          </label>
        </>
      ) : (
        <label style={{ ...linkBtn, opacity: loading ? 0.6 : 1 }}>
          {loading ? "Đang tải lên..." : "Chọn file để tải lên"}
          <input type="file" onChange={handleFile} disabled={loading} style={{ display: "none" }} />
        </label>
      )}
      {error && <span style={{ color: "#C23616", fontSize: 12 }}>{error}</span>}
    </div>
  );
}

const linkBtn = { color: "#A9201F", fontWeight: 600, cursor: "pointer", background: "none", border: "none", fontSize: 13, padding: 0 };
