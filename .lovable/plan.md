

# Enhanced Driver Stop Detail View

## Overview
Build a new stop-by-stop detail view for drivers on active jobs, inspired by the reference screenshot. This adds a dedicated page/sheet that shows each stop with full address, location notes, contact info, a task checklist (review order details, take photos), additional notes, and a help button.

## What Changes

### 1. New Component: `StopDetailView`
Create `src/components/driver/StopDetailView.tsx` -- a full-screen sheet/page showing the current stop with:
- **Header**: "Stop X of Y" with back button
- **Address section**: Full address label from `job.pickup_label` / `job.drop_label` (or from `job_stops` if multi-stop)
- **Location Notes**: Pulled from `cargo_details.pickup_metadata.notes` or `cargo_details.drop_metadata.notes`, with warning icon for special instructions (e.g. "Hand loading/unloading required")
- **Location Contact**: Shipper name with a phone call button (fetched from `shipper_profiles` or `profiles` table)
- **Tasks Checklist**: Interactive task list the driver must complete:
  - "Review Pickup/Delivery Details" -- expandable card showing cargo type, weight, order info from `cargo_details`
  - "Take Photo of Order" -- multi-photo capture (reusing existing photo upload pattern from `ProofOfDeliveryDialog`)
- **Additional Notes**: Editable text area for driver notes
- **Request Help button**: Opens a support ticket creation flow (inserts into `support_tickets` table)

### 2. Update `ActiveJobBanner.tsx`
- Add a "View Stop Details" button that opens the `StopDetailView` sheet
- Pass current job data and stop index to the detail view

### 3. Update `useActiveAssignment` Hook
- Extend the query to also fetch `job_stops` for the active job, so multi-stop jobs show each stop in sequence
- Fetch shipper contact info (name, phone) from `shipper_profiles` via the job's `shipper_id`

### 4. Database Migration
- Add a `driver_notes` (TEXT, nullable) column to the `job_stops` table so drivers can save per-stop notes
- Add a `photos` (TEXT[], nullable, default '{}') column to the `job_stops` table for per-stop photo URLs

## Technical Details

### StopDetailView Component Structure
```
Sheet (full height)
  Header: "Stop {n} of {total}" + back arrow
  Card: Address + city/state
  Section: LOCATION NOTES (from cargo_details metadata)
  Section: LOCATION CONTACT (shipper name + phone button)
  Section: TASKS
    - Collapsible: Review Pickup/Delivery Details (cargo type, weight, special instructions)
    - Photo capture: Take Photo of Order (multi-photo, stored to job_stops.photos via Supabase Storage)
  Section: ADDITIONAL NOTES (textarea, saved to job_stops.driver_notes)
  Button: "Request help" (creates support_tickets row)
```

### Data Flow
- Stop data comes from: `job_stops` table (if multi-stop) OR derived from `jobs.pickup_*` / `jobs.drop_*` fields (single pickup/dropoff)
- Contact info from: `shipper_profiles` joined via `jobs.shipper_id`
- Photos uploaded to: `pod-files` storage bucket under `{userId}/{jobId}/stop-{stopId}/`
- Notes saved to: new `job_stops.driver_notes` column

### Files to Create
- `src/components/driver/StopDetailView.tsx` -- main stop detail component

### Files to Modify
- `src/components/driver/ActiveJobBanner.tsx` -- add "View Stop Details" button and state
- `src/hooks/useBids.ts` -- extend `useActiveAssignment` to fetch stops and shipper contact

### Migration SQL
```sql
ALTER TABLE public.job_stops 
  ADD COLUMN driver_notes TEXT,
  ADD COLUMN photos TEXT[] DEFAULT '{}';
```

