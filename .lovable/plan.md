

## Plan: Drop-off Time, Distance Calculation, and Fixed Rate vs Bidding

### Overview
This plan adds three major features to the shipper job creation flow:
1. **Required drop-off date/time** on the job form
2. **Automatic distance calculation** displayed across all dashboards (shipper, driver, admin)
3. **Pricing mode choice**: shipper can set a "Fixed Rate" or choose "Open for Bidding" with a max and min price range

---

### 1. Database Migration

Add new columns to the `jobs` table:

| Column | Type | Purpose |
|--------|------|---------|
| `scheduled_dropoff` | `timestamptz` | Required drop-off deadline |
| `distance_km` | `numeric` | Calculated distance between pickup and drop-off |
| `pricing_type` | `text` (default `'bid'`) | Either `'fixed'` or `'bid'` |
| `max_budget_cents` | `bigint` | For bidding mode: highest price willing to pay |
| `min_budget_cents` | `bigint` | For bidding mode: lowest price willing to accept |

The existing `budget_cents` column will be used for "fixed rate" amounts.

---

### 2. Job Form Updates (`src/components/shipper/JobForm.tsx`)

- Add a **required "Drop-off Date/Time"** field (datetime-local input) below the pickup date
- Add a **"Pricing Mode" toggle/radio**: "Fixed Rate" vs "Open for Bidding"
  - **Fixed Rate**: shows a single budget input field; job posts with status `assigned` flow (no bidding)
  - **Open for Bidding**: shows two fields -- "Maximum Price" and "Minimum Price"; job posts with status `posted` (goes to bidding marketplace)
- **Auto-calculate distance** using the existing `calculateDistance()` from `src/lib/eta.ts` when both pickup and drop-off locations are set; display it on the form as a read-only info line
- Store `distance_km`, `pricing_type`, `scheduled_dropoff`, `max_budget_cents`, `min_budget_cents` in the job record on submit
- Validate that drop-off date is provided and is after pickup date

---

### 3. Distance Display Across Dashboards

**Shipper side** (`JobCard.tsx`):
- Show distance (e.g., "245 km") alongside the route label

**Driver side** (`AvailableJobCard.tsx`, `DriverBidsPortal.tsx`):
- Show distance on each job card
- For bidding jobs, display the shipper's min-max price range instead of a single budget

**Admin side** (`JobsOversightTable.tsx`):
- Add a "Distance" column showing the `distance_km` value

---

### 4. Bidding Flow Changes

- When `pricing_type = 'bid'`, the driver sees the shipper's acceptable range (min - max) and submits a bid within that range
- When `pricing_type = 'fixed'`, the job card shows "Fixed Rate: $X" and the driver can accept it directly (no bidding needed) -- this could be handled as a single-click accept that auto-creates a bid at the fixed price
- The `AvailableJobCard` bid form will validate that the bid amount falls within the min/max range for bidding jobs

---

### 5. Seed/Demo Data Updates (`src/lib/seedData.ts`)

- Add `distance_km`, `pricing_type`, `scheduled_dropoff`, `max_budget_cents`, `min_budget_cents` to `mockJobs` entries so demo mode displays correctly

---

### Technical Details

**Files to modify:**
- `src/components/shipper/JobForm.tsx` -- add drop-off date, pricing mode toggle, distance preview, new fields
- `src/hooks/useJobs.ts` -- pass new fields in `useCreateJob`, update types
- `src/components/shipper/JobCard.tsx` -- display distance and pricing type badge
- `src/components/driver/AvailableJobCard.tsx` -- show distance, price range, validate bid range
- `src/pages/DriverBidsPortal.tsx` -- show distance and price range on job listings
- `src/components/shipper/StatsGrid.tsx` -- no changes needed
- `src/components/driver/DriverStatsGrid.tsx` -- no changes needed  
- `src/components/admin/JobsOversightTable.tsx` -- add distance column
- `src/pages/ShipperBidsPortal.tsx` -- show pricing type info on bid cards
- `src/components/shipper/BidsSheet.tsx` -- show price range context for bid jobs
- `src/lib/seedData.ts` -- update mock data with new fields
- `src/components/shipper/RecurringRouteForm.tsx` -- add pricing mode to recurring templates (optional, can be deferred)

**Database migration SQL:**
```sql
ALTER TABLE public.jobs 
  ADD COLUMN scheduled_dropoff timestamptz,
  ADD COLUMN distance_km numeric,
  ADD COLUMN pricing_type text NOT NULL DEFAULT 'bid',
  ADD COLUMN max_budget_cents bigint,
  ADD COLUMN min_budget_cents bigint;
```

**Distance calculation** uses the existing `calculateDistance()` function from `src/lib/eta.ts` (Haversine formula). It will be computed client-side when both locations are selected and stored in the database for display on other dashboards.

