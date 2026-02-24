

## Always Allow Navigation Home

Several pages are missing a way to navigate back to the homepage. This plan adds a clickable ANCHOR logo (with the anchor-logo image) that links to `/` on every page that currently lacks one.

### Pages that already have home navigation (no changes needed)
- Index (homepage) -- has navbar with logo
- ShipperDashboard -- has `Link to="/"`
- DriverDashboard -- has `Link to="/"`
- LandownerDashboard -- has `Link to="/"`
- RoleSelection -- has `Link to="/"`

### Pages that need home navigation added

**1. Auth.tsx (~line 148-151)**
- Make the "ANCHOR" heading clickable by wrapping it in a `Link to="/"` 
- Add the anchor-logo image next to it, matching the homepage navbar style
- Import `Link` from react-router-dom and `anchorLogo` from assets

**2. Onboarding.tsx**
- Add a clickable ANCHOR logo + text at the top of the page that links to `/`
- Import `Link` from react-router-dom and `anchorLogo` from assets

**3. AdminDashboard.tsx**
- Add a clickable ANCHOR logo + text in the header area that links to `/`
- Import `Link` from react-router-dom and `anchorLogo` from assets

**4. ShipperBidsPortal.tsx**
- Add a clickable ANCHOR logo + text that links to `/`

**5. DriverBidsPortal.tsx**
- Add a clickable ANCHOR logo + text that links to `/`

**6. NotFound.tsx**
- Add a "Go Home" button or clickable logo linking to `/`

### Consistent Pattern
Each page will use the same logo pattern:
```tsx
<Link to="/" className="flex items-center gap-2">
  <img src={anchorLogo} alt="Anchor Logo" className="w-8 h-8 rounded" />
  <span className="font-display text-xl font-bold text-primary">ANCHOR</span>
</Link>
```

