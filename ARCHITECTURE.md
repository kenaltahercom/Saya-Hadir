# Saya Hadir — Architecture Baseline

Versi 1.0 · Status: pilihan arsitektur awal; detail teknis akan disesuaikan dengan repository saat coding dimulai.

## Stack

- Frontend: React + Vite + TypeScript.
- Styling: Tailwind CSS; accessible primitives seperti shadcn/ui/Radix bila cocok dengan kebutuhan dan repository.
- Icons: satu keluarga konsisten, misalnya Lucide.
- Auth/data: Supabase Auth + PostgreSQL.
- Authorization: Row Level Security (RLS), grants, dan server-side validation.
- Files: Supabase Storage private buckets jika file perlu disimpan.
- Sensitive workflows: Database Functions atau Supabase Edge Functions sesuai operasi.
- Source control/deploy: GitHub + Vercel.

## Trust boundaries

1. Browser/client tidak dipercaya untuk menetapkan `company_id`, role, timestamp resmi, jarak geofence, dan hasil absensi sah.
2. Server/database memverifikasi user yang sedang login, membership aktif, role/permission, aturan jadwal, geofence, GPS accuracy, uniqueness, dan timestamp.
3. RLS melindungi tabel terekspos di database; frontend route guard hanya membantu UX, bukan security boundary.
4. Service role key dan secret hanya berada di environment tepercaya/server. Jangan gunakan `VITE_*` untuk secret.
5. Storage private objects memakai policies sesuai tenant/owner.

## Main data relationships

- `auth.users` → `profiles` (one-to-one).
- `profiles` → `company_memberships` (one-to-many).
- `companies` → `company_memberships` (one-to-many).
- `companies` → `work_schedules` → `work_schedule_days`.
- `company_memberships` → `attendance_records` (per work date).
- `attendance_records` → `attendance_events`.
- `companies` → `company_invitations`, `audit_logs`, `import_jobs`.

Every tenant-owned record must have a defensible relationship to its company. Add constraints or server-side checks to prevent accidental cross-tenant relationships.

## GPS flow

1. User clicks Check-in/Check-out.
2. Browser requests location permission and obtains coordinates plus accuracy.
3. Client submits intent/coordinates with authenticated session; no client timestamp or boolean `is_valid` is trusted.
4. Trusted database/server code validates membership, active state, schedule, one-record rule/idempotency, distance from configured office, accuracy threshold, and permitted state transition.
5. Server/database writes official timestamp and result.
6. UI displays success only after the operation confirms persistence; failures show actionable reason.

Default trial values: radius 150 m, maximum accuracy 100 m. They are configurable assumptions requiring field validation. GPS browser coordinates are not foolproof anti-spoofing evidence.

## Suggested source structure when coding starts

```text
src/
  app/                  # app shell, router, route guards
  components/ui/        # primitives
  components/layout/    # header, sidebar, mobile navigation
  features/
    auth/
    companies/
    attendance/
    employees/
    schedules/
    reports/
  lib/
    supabase.ts         # browser client using publishable key only
    validators/
  styles/
  types/
supabase/
  migrations/
  functions/
  tests/                # RLS and DB tests
```

This is a proposed structure, not created code. Check existing conventions before finalizing.

## Multi-tenant data rules

- Unique membership `(company_id, user_id)`.
- Unique employee code per company.
- Unique daily record `(membership_id, work_date)` for MVP.
- Validate attendance membership and company consistency on every write.
- Index columns used by RLS predicates and report filters.
- Don't trust mutable `user_metadata` for authorization decisions.
- Create explicit policies for each operation and test allowed and denied behavior.

## Environments and releases

- `.env.example` has variable names and placeholder values, never secrets.
- local/dev/preview/prod projects and URLs are distinguished clearly.
- Store schema changes as versioned migrations.
- Before Vercel production deploy: build, lint, tests, RLS allow/deny tests, environment variables, route refresh, Auth redirect URLs, storage policies, and mobile QA must pass.
