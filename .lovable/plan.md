

## Add Logo Image to Navbar

Copy the uploaded anchor logo image into the project and display it to the left of the "ANCHOR" text in the sticky navbar.

### Changes

1. **Copy the image**: Copy `user-uploads://PNG_image.png` to `src/assets/anchor-logo.png`

2. **Update `src/pages/Index.tsx`**:
   - Add an import: `import anchorLogo from "@/assets/anchor-logo.png";`
   - In the `Navbar` component, add an `<img>` tag before the "ANCHOR" text span:
     ```
     <img src={anchorLogo} alt="Anchor Logo" className="w-8 h-8 rounded" />
     ```
   - Wrap the logo image and text in a flex container with `gap-2` and `items-center` so they sit side by side

