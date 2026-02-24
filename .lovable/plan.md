

## Add Sign In / Sign Up Buttons to Homepage Header

Add a sticky navigation header to the homepage (`src/pages/Index.tsx`) with the ANCHOR logo on the left and Sign In / Sign Up buttons on the right.

### Changes

**File: `src/pages/Index.tsx`**

1. Create a `Navbar` component inside the file that renders a fixed/sticky top bar with:
   - "ANCHOR" logo/text on the left (clicking it scrolls to top or stays on `/`)
   - Two buttons on the right:
     - "Sign In" -- navigates to `/auth?tab=login` (outline/ghost style)
     - "Sign Up" -- navigates to `/auth?tab=signup` (primary/hero style)
   - Glass/transparent background with backdrop blur to match the dark theme

2. Render `<Navbar navigate={navigate} />` as the first child inside the main `<div>` in the `Index` component.

3. Add a small top padding to the Hero section so content doesn't hide behind the fixed navbar.

No other files need changes -- the `/auth` route already exists and supports `?tab=login` and `?tab=signup` query parameters.

