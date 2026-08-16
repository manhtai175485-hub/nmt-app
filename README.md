# Tư Vấn NMT — Bản chính thức (giai đoạn 1: nền tảng)

Ngăn xếp: **Next.js (App Router)** + **Supabase** (Postgres/Auth/Storage, có Row Level Security) + **Vercel**.

## Đã có trong giai đoạn 1
- Schema Supabase đầy đủ cho toàn hệ thống (`supabase/schema.sql`): nhân viên (master entity), hồ sơ, lịch sử trạng thái, tài chính, kho nghiệp vụ — kèm RLS đúng phân quyền Nhân viên/Quản lý.
- Đăng nhập thật bằng Supabase Auth (email/mật khẩu).
- Layout + Sidebar thật, bảo vệ route bằng middleware (chưa đăng nhập → về `/login`).
- Trang Tổng quan đọc số liệu thật từ Supabase.

## Chưa có (sẽ làm ở các lượt tiếp theo)
Các trang nghiệp vụ đầy đủ: Hộ kinh doanh (tạo/duyệt hồ sơ, tải file), Tài chính, Kho nghiệp vụ, Nhân viên (dashboard), sinh file Word giấy hẹn/GCN.

## Các bước triển khai

### 1. Supabase
1. Vào project Supabase bạn đã tạo → **SQL Editor** → dán toàn bộ nội dung `supabase/schema.sql` → Run.
2. Vào **Authentication → Users** → tạo tài khoản đầu tiên (email + mật khẩu) cho Quản lý.
3. Vào **Table Editor → employees** → thêm 1 dòng: `name`, `phone`, `role = 'Quản lý'`, `auth_user_id` = copy UUID của user vừa tạo ở bước 2 (xem trong Authentication → Users).
4. Vào **Project Settings → API** → copy `Project URL` và `anon public key`.

### 2. GitHub
```bash
cd nmt-app
git init
git add .
git commit -m "Khởi tạo nền tảng: Next.js + Supabase"
git branch -M main
git remote add origin <URL repo GitHub bạn đã tạo>
git push -u origin main
```

### 3. Vercel
1. Vercel → **Add New Project** → chọn repo GitHub vừa đẩy lên.
2. Framework Preset: Next.js (tự nhận diện).
3. Mục **Environment Variables**, thêm:
   - `NEXT_PUBLIC_SUPABASE_URL` = giá trị đã copy ở bước Supabase.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = giá trị đã copy ở bước Supabase.
4. Deploy.

Sau khi deploy xong, đăng nhập bằng email/mật khẩu tài khoản Quản lý đã tạo ở bước Supabase 2-3.

### Chạy thử ở máy local (tuỳ chọn)
```bash
npm install
cp .env.example .env.local   # rồi điền 2 giá trị Supabase vào
npm run dev
```
