import "./globals.css";

export const metadata = {
  title: "Tư Vấn NMT",
  description: "Đăng ký kinh doanh · Thuế",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
