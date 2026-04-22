

## Plan: Verify the auto-sync pipeline is working

### What I found
- ✅ `pg_cron` job `sync-loads-every-15-min` is active and last ran successfully at 02:45 UTC
- ✅ `sync-loads` edge function booted on schedule
- ❌ **0 rows in `lane_watches`** — the cron has nothing to do
- ❌ **0 jobs with `source <> 'manual'`** — nothing has ever been auto-imported
- ❌ No "From load board" indicator on the driver dashboard, so even if jobs arrived they'd be invisible as "imported"

So the system is **working but starved**. To prove it end-to-end and make it observable, three changes:

### 1. Seed a lane watch + run it manually
Add a "Run all my watches now" button to the Lane Watches panel that invokes `sync-loads` immediately (no 15-min wait), then refreshes the count. After clicking:
- `lane_watches.last_run_at` updates
- `lane_watches.last_run_imported` shows how many came in
- New rows appear in `jobs` with `source = 'trulos'`

### 2. Add a sync status strip to the Lane Watches panel
Top-of-panel summary card showing:
- Last cron run time (from most recent `last_run_at` across all watches)
- Total jobs imported in last 24h (count of `jobs` where `source <> 'manual'` and `imported_at > now() - 24h`)
- Active watch count
- Color dot: green if last run < 30 min ago, amber 30-60 min, red > 60 min

### 3. Make imported jobs visible on the driver side
On `AvailableJobCard`, when `job.source !== 'manual'`, show a small badge like **"Load board · Trulos"** next to the title so the driver (and you) can see at a glance that a card came from auto-sync vs a manual shipper post.

### Files to change
- `src/components/shipper/LaneWatchesPanel.tsx` — add status strip + "Run all now" button
- `src/hooks/useLaneWatches.ts` — add `useSyncStatus()` query and `useRunAllWatches()` mutation calling the `sync-loads` function
- `src/components/driver/AvailableJobCard.tsx` — render source badge when not manual

### How to test after this ships
1. Go to Shipper Dashboard → Lane Watches → create a watch (e.g. Atlanta → Dallas, source: Trulos)
2. Click "Run all now" — see toast with imported count
3. Status strip turns green, shows "1 imported just now" (or 0 if Trulos returned nothing — see honesty note)
4. Switch to Driver Dashboard — any imported jobs show with the "Load board · Trulos" badge

### Honesty note
Trulos scraping returns near-zero results in practice (we hit this earlier). Even with the pipeline proven working, you'll likely see **0 jobs imported** until a paid board (DAT/123LB) is wired in Phase 2. The status strip will at least make that obvious — "Last run succeeded, 0 imported" is very different from "broken."

