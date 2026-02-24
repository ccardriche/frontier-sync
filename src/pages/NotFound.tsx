import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import anchorLogo from "@/assets/anchor-logo.png";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-6">
          <img src={anchorLogo} alt="Anchor Logo" className="w-10 h-10 rounded" />
          <span className="font-display text-2xl font-bold text-primary">ANCHOR</span>
        </Link>
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <Link to="/" className="text-primary underline hover:text-primary/90">
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
