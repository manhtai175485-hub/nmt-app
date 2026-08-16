"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError("Sai email hoặc mật khẩu.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <form onSubmit={handleSubmit} style={{ width: 380, background: "#fff", borderRadius: 14, padding: 28, boxShadow: "0 8px 24px rgba(31,36,33,0.08)" }}>
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "#A9201F", margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700 }}>NMT</div>
          <div style={{ fontWeight: 700, fontSize: 19 }}>Tư Vấn NMT</div>
          <div style={{ fontSize: 12, color: "#6B7269", marginTop: 2 }}>Đăng ký kinh doanh · Thuế</div>
        </div>

        <label style={{ fontSize: 12, fontWeight: 600, color: "#6B7269" }}>Email</label>
        <input
          type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #E2E5DF", marginTop: 4, marginBottom: 14, boxSizing: "border-box" }}
        />

        <label style={{ fontSize: 12, fontWeight: 600, color: "#6B7269" }}>Mật khẩu</label>
        <input
          type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #E2E5DF", marginTop: 4, marginBottom: 14, boxSizing: "border-box" }}
        />

        {error && <div style={{ fontSize: 12, color: "#C23616", marginBottom: 10 }}>{error}</div>}

        <button type="submit" disabled={loading} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "none", background: "#A9201F", color: "#fff", fontWeight: 600, cursor: "pointer" }}>
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
        <div style={{ fontSize: 12, color: "#6B7269", marginTop: 14, textAlign: "center" }}>
          Chưa có tài khoản? Liên hệ Quản lý để được cấp email/mật khẩu.
        </div>
      </form>
    </div>
  );
}
