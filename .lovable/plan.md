
## Fix Role Page Buttons to Route Through Auth

### Problem
The `/roles` page has three "Continue as..." buttons that link directly to dashboard pages (`/dashboard/shipper`, `/dashboard/driver`, `/dashboard/landowner`), bypassing authentication entirely. Users who aren't logged in get sent to a dashboard that won't work.

### Solution
Update the RoleSelection page so each role button navigates to `/auth?tab=signup` instead of directly to dashboards. After signing up and logging in, users will naturally flow through the onboarding process.

### Changes

**`src/pages/RoleSelection.tsx`**
- Change each role's `path` from `/dashboard/shipper` (etc.) to `/auth?tab=signup`
- Update button text from "Continue as Shipper" to "Get Started as Shipper" (clearer intent)
- The existing auth flow already handles redirecting authenticated users to onboarding then to the correct dashboard

This is a single-file change — just updating the 3 role paths and button labels in the `roles` array at the top of the file.
