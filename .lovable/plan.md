

## Fix /dashboard Route Auto-Redirect

### Problem
The `/dashboard` route always shows the Role Selection page, even for logged-in users who already have an assigned role. Users must re-select their role every time.

### Solution
Create a `DashboardRedirect` component that:
1. Checks if the user is logged in
2. If logged in, queries `user_roles` for their role
3. Redirects to `/dashboard/{role}` if a role exists
4. Redirects to `/onboarding` if no role is assigned
5. Redirects to `/auth` if not logged in
6. Shows a loading spinner while checking

Then replace `RoleSelection` with this component on the `/dashboard` route.

### Technical Details

**New file: `src/components/DashboardRedirect.tsx`**
- Uses `supabase.auth.getSession()` to check authentication
- Queries `user_roles` table filtered by `user_id`
- Uses `useNavigate()` from react-router-dom for redirects
- Renders a centered loading spinner during the check

**Modified file: `src/App.tsx`**
- Import `DashboardRedirect` instead of `RoleSelection` for the `/dashboard` route
- Keep `/roles` route pointing to `RoleSelection` so it remains accessible if needed

```text
Route mapping (after change):
  /dashboard  -->  DashboardRedirect (checks auth + role, redirects)
  /roles      -->  RoleSelection (manual role selection page)
```

