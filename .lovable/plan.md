
## Add Sample Data to the Admin Portal

### Current State

The admin portal is live and connected to the real database. The four tabs are:

- **Approvals tab** — 0 pending records (empty)
- **Jobs tab** — 9 jobs already exist ✅
- **Tickets tab** — 0 support tickets (empty)
- **Users tab** — 5 real users exist (sparse)

The goal is to insert realistic sample data so every section of the admin portal is populated and functional for review/testing.

---

### What Will Be Added

**1. Pending Approvals (Approvals Tab)**

Insert profile records with `verification_status = 'pending'` linked to the existing real auth users, plus create additional users using the service-role key via an Edge Function:

Since we can't create new auth users from a migration script, the cleanest approach is to insert pending profiles that reference existing user IDs, OR use the existing `seed-test-users` edge function pattern to create new ones.

The simplest safe approach: Insert pending shipper, driver, and landowner profile rows linked to **existing user IDs** (the test accounts we already have), using extra profile records with new UUIDs. The RLS policies allow admins to view all profiles so this will work.

Specifically:
- 2 pending `shipper_profiles` rows (different businesses, pending verification)
- 3 pending `driver_profiles` rows (various license types, pending)
- 1 pending `landowner_profiles` row

**2. Support Tickets (Tickets Tab)**

Insert 5 `support_tickets` rows with varied statuses (`open`, `in_progress`, `resolved`) covering common categories:
- Payment dispute
- Damaged goods complaint
- Account help request
- Driver conduct report
- Hub availability issue (resolved)

The `created_by` column references `auth.users` via the existing user IDs.

**3. Additional User Profiles (Users Tab)**

The Users tab currently shows 5 users. We'll add 4 more realistic profile rows with different roles (driver, shipper, landowner) to make the table more representative. These will be inserted into `profiles` with generated UUIDs (they don't need auth accounts since this is display-only sample data).

Wait — `profiles.id` references `auth.users.id` via a foreign key. We cannot insert orphaned profile rows. Instead we'll make the existing 5 profiles richer by updating their `phone`, `rating`, and `wallet_balance_cents`.

---

### Technical Plan

**Step 1 — Insert pending shipper profiles**

```sql
INSERT INTO shipper_profiles (id, user_id, business_name, contact_person_name, phone, email, 
  business_type, verification_status, terms_accepted, terms_accepted_at, 
  mc_number, dot_number, ein_number, shipment_types, typical_loads, preferred_lanes)
VALUES
  (gen_random_uuid(), '6a08cdab-...', 'Fresh Farms Kenya Ltd', 'Alice Wambui', ...),
  ...
```

Since profiles require a unique `user_id`, we'll use the existing 5 auth user IDs with the constraint that each table (shipper_profiles, driver_profiles, landowner_profiles) only has ONE row per user. Currently: shipper user has an `approved` shipper profile; driver user has an `approved` driver profile; landowner user has a landowner profile.

The correct approach: use the edge function to create new real auth users (like the seed function already does) for the sample applicants, then insert profiles for them.

**Revised approach — Single SQL migration with self-contained sample data**

Use the `seed-test-users` edge function pattern: invoke it or create a new one-shot data insertion edge function that:
1. Creates 3–4 new auth users (applicant1@sample.com, etc.) with the service role key
2. Inserts pending profiles for those users

This is the cleanest solution because:
- Avoids foreign key violations on `user_id`
- Creates real reviewable entries in the admin portal
- Mirrors real onboarding flow

**What gets created:**

| New User | Email | Profile Type | Status |
|---|---|---|---|
| Alice Wambui | alice@freshfarms.ke | shipper_profile | pending |
| Brian Otieno | brian@elec.ke | shipper_profile | pending |
| John Kamau | john.driver@test.ke | driver_profile | pending |
| Peter Njoroge | peter.driver@test.ke | driver_profile | pending |
| Samuel Odhiambo | samuel.driver@test.ke | driver_profile | pending |
| Mary Wanjiku | mary.land@test.ke | landowner_profile | pending |

Support tickets use existing user IDs (`shipper@test.com`, `driver@test.com`) as `created_by`.

---

### Files to Create/Edit

1. **`supabase/functions/seed-admin-data/index.ts`** (new edge function)
   - Uses `SUPABASE_SERVICE_ROLE_KEY` to create 6 new auth users
   - Inserts their `profiles` rows
   - Inserts `user_roles` rows
   - Inserts pending `shipper_profiles` (2), `driver_profiles` (3), `landowner_profiles` (1)
   - Inserts 5 `support_tickets` using existing user IDs
   - Idempotent: skips records that already exist

2. **`src/pages/AdminDashboard.tsx`** (minor edit)
   - Add a one-time "Seed Sample Data" button (visible only in dev/admin context) that calls the edge function, then auto-refreshes all admin queries

The button calls `supabase.functions.invoke('seed-admin-data')` and on success invalidates the React Query caches for `admin-stats`, `pending-approvals`, `admin-tickets`, `admin-users`.

After the data is seeded, the button can be hidden or removed.

---

### Admin Portal After Seeding

- **Stats cards**: Pending Approvals = 6, Open Tickets = 4, Active Jobs = 4+, Total Users = 11+
- **Approvals tab**: 2 shippers, 3 drivers, 1 landowner — all actionable (approve/reject)
- **Jobs tab**: Existing 9 jobs with bids
- **Tickets tab**: 5 tickets (open, in_progress, resolved) — resolve dialog functional
- **Users tab**: 11 users with roles, ratings, wallet balances
