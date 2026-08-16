-- =====================================================================
-- Tư Vấn NMT — Supabase schema (Postgres)
-- Chạy toàn bộ file này trong Supabase SQL Editor (project mới, 1 lần).
-- =====================================================================

-- ---------- Tiện ích ----------
create extension if not exists "pgcrypto";

-- ---------- Enum ----------
create type user_role as enum ('Nhân viên', 'Quản lý');
create type employee_status as enum ('Đang hoạt động', 'Ngừng hoạt động');
create type dossier_group as enum ('Hộ kinh doanh', 'Công ty', 'Thuế');
create type dossier_status as enum ('pending', 'received', 'submitted', 'supplement', 'approved', 'sent');
create type dossier_speed as enum ('normal', 'fast');
create type payment_status as enum ('Chưa thu', 'Đã thu');
create type warehouse_severity as enum ('block', 'warning', 'tip');
create type warehouse_review_status as enum ('pending', 'approved', 'merged', 'rejected');

-- =====================================================================
-- NHÂN VIÊN (master entity — mọi bảng khác chỉ tham chiếu employees.id)
-- =====================================================================
create table employees (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  name text not null,
  phone text not null,
  role user_role not null default 'Nhân viên',
  initials text,
  status employee_status not null default 'Đang hoạt động',
  created_at timestamptz not null default now()
);
comment on table employees is 'Master entity nhân viên. id là khóa liên kết duy nhất — không dùng tên/SĐT để join.';

-- ---------- Danh mục dùng chung ----------
create table wards (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

-- =====================================================================
-- HỒ SƠ (dossiers)
-- =====================================================================
create table dossiers (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  "group" dossier_group not null,
  procedure text,
  ward_id uuid references wards(id),
  assigned_employee_id uuid not null references employees(id),
  status dossier_status not null default 'pending',
  speed dossier_speed not null default 'normal',
  due_at timestamptz,
  appointment_uploaded boolean not null default false,
  license_uploaded boolean not null default false,
  approved_date timestamptz,
  completed_at timestamptz,
  supplement_reason text,
  supplement_cause text,
  -- Thanh toán
  payment_status payment_status default 'Chưa thu',
  collection_due_at timestamptz,
  amount_due numeric(14,0),
  amount_paid numeric(14,0),
  paid_at timestamptz,
  payment_method text,
  payment_note text,
  created_at timestamptz not null default now()
);
create index on dossiers (assigned_employee_id);
create index on dossiers ("group", status);

-- Lịch sử thay đổi trạng thái — luôn lưu changed_by (employee_id), không lưu tên rời rạc
create table dossier_history (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references dossiers(id) on delete cascade,
  status dossier_status not null,
  changed_by uuid not null references employees(id),
  at timestamptz not null default now()
);
create index on dossier_history (dossier_id);

-- =====================================================================
-- TÀI CHÍNH — chi phí thủ công (lương tự tính từ dossiers đã "Đã thu")
-- =====================================================================
create table expenses (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  amount numeric(14,0) not null,
  note text,
  date timestamptz not null default now(),
  created_by uuid references employees(id)
);

create table wage_rates (
  "group" dossier_group primary key,
  amount numeric(14,0) not null
);

-- Thưởng/phạt — luôn gắn employee_id, và case_id nếu liên quan hồ sơ cụ thể
create table employee_adjustments (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id),
  dossier_id uuid references dossiers(id),
  kind text not null check (kind in ('Thưởng', 'Phạt')),
  amount numeric(14,0) not null,
  reason text,
  month_key text not null, -- 'YYYY-MM'
  approved_by uuid references employees(id),
  created_at timestamptz not null default now()
);

-- =====================================================================
-- KHO NGHIỆP VỤ — phân loại theo procedure_id + ward_id, KHÔNG theo tên người báo
-- =====================================================================
create table warehouse_entries (
  id uuid primary key default gen_random_uuid(),
  "group" dossier_group not null,
  procedure text not null,
  ward_id uuid references wards(id),
  severity warehouse_severity not null default 'tip',
  title text not null,
  content text not null,
  suggested_fix text,
  review_status warehouse_review_status not null default 'approved',
  reported_by uuid references employees(id),
  source_dossier_id uuid references dossiers(id),
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on warehouse_entries ("group", procedure, ward_id);

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table employees enable row level security;
alter table dossiers enable row level security;
alter table dossier_history enable row level security;
alter table expenses enable row level security;
alter table wage_rates enable row level security;
alter table employee_adjustments enable row level security;
alter table warehouse_entries enable row level security;
alter table wards enable row level security;

-- Hàm helper: lấy employee record của người đang đăng nhập
create or replace function current_employee()
returns employees as $$
  select * from employees where auth_user_id = auth.uid() limit 1;
$$ language sql stable;

create or replace function is_manager()
returns boolean as $$
  select exists (
    select 1 from employees where auth_user_id = auth.uid() and role = 'Quản lý' and status = 'Đang hoạt động'
  );
$$ language sql stable;

-- ---------- employees ----------
create policy "employees_select_all_authenticated" on employees for select using (auth.role() = 'authenticated');
create policy "employees_manager_write" on employees for insert with check (is_manager());
create policy "employees_manager_update" on employees for update using (is_manager());
-- không có policy delete => không ai xóa được qua API, kể cả quản lý (đúng nguyên tắc không xóa)

-- ---------- wards ----------
create policy "wards_read" on wards for select using (auth.role() = 'authenticated');

-- ---------- dossiers ----------
create policy "dossiers_select" on dossiers for select using (
  is_manager() or assigned_employee_id = (select id from current_employee())
);
create policy "dossiers_insert" on dossiers for insert with check (
  is_manager() or assigned_employee_id = (select id from current_employee())
);
create policy "dossiers_update" on dossiers for update using (
  is_manager() or assigned_employee_id = (select id from current_employee())
);

-- ---------- dossier_history ----------
create policy "history_select" on dossier_history for select using (
  is_manager() or dossier_id in (select id from dossiers where assigned_employee_id = (select id from current_employee()))
);
create policy "history_insert" on dossier_history for insert with check (
  changed_by = (select id from current_employee())
);

-- ---------- expenses / wage_rates / employee_adjustments (chỉ Quản lý xem/sửa tổng thể) ----------
create policy "expenses_manager_only" on expenses for all using (is_manager()) with check (is_manager());
create policy "wage_rates_read" on wage_rates for select using (auth.role() = 'authenticated');
create policy "wage_rates_manager_write" on wage_rates for all using (is_manager()) with check (is_manager());

create policy "adjustments_select" on employee_adjustments for select using (
  is_manager() or employee_id = (select id from current_employee())
);
create policy "adjustments_manager_write" on employee_adjustments for insert with check (is_manager());

-- ---------- warehouse_entries (mọi nhân viên đọc, Quản lý duyệt/sửa; nhân viên có thể tạo bản "pending") ----------
create policy "warehouse_read" on warehouse_entries for select using (auth.role() = 'authenticated');
create policy "warehouse_insert" on warehouse_entries for insert with check (auth.role() = 'authenticated');
create policy "warehouse_manager_update" on warehouse_entries for update using (is_manager());

-- =====================================================================
-- Seed dữ liệu mẫu tối thiểu (mức lương mặc định theo nhóm)
-- =====================================================================
insert into wage_rates ("group", amount) values
  ('Hộ kinh doanh', 300000),
  ('Công ty', 500000),
  ('Thuế', 200000);
