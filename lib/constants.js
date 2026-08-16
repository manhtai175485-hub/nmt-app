export const STATUS = {
  pending: { label: "Chờ xử lý", color: "#8A6D00", bg: "#FFF4CC" },
  received: { label: "Đã nhận giấy hẹn", color: "#1E5FAD", bg: "#E5F0FC" },
  submitted: { label: "Trình lãnh đạo", color: "#7A3FB0", bg: "#F1E7FA" },
  supplement: { label: "Cần bổ sung", color: "#B0392F", bg: "#FBE7E5" },
  approved: { label: "Đã duyệt", color: "#1E8E5A", bg: "#E4F6ED" },
  sent: { label: "Đã gửi GCN", color: "#2E7D32", bg: "#E7F4E8" },
};

export const STATUS_ORDER = ["pending", "received", "submitted", "supplement", "approved", "sent"];

export const NEXT_STATUS = {
  pending: "received",
  received: "submitted",
  submitted: "approved",
  approved: "sent",
};

export function fmtDate(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("vi-VN");
}
