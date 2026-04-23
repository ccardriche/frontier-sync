import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import DashboardRedirect from "./components/DashboardRedirect";
import RoleSelection from "./pages/RoleSelection";
import ShipperDashboard from "./pages/ShipperDashboard";
import DriverDashboard from "./pages/DriverDashboard";
import LandownerDashboard from "./pages/LandownerDashboard";
import DriverProfile from "./pages/DriverProfile";
import AdminDashboard from "./pages/AdminDashboard";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import ShipperBidsPortal from "./pages/ShipperBidsPortal";
import DriverBidsPortal from "./pages/DriverBidsPortal";
import AdminLoadSources from "./pages/AdminLoadSources";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/roles" element={<RoleSelection />} />
          <Route path="/dashboard" element={<DashboardRedirect />} />
          <Route path="/dashboard/shipper" element={<ShipperDashboard />} />
          <Route path="/dashboard/driver" element={<DriverDashboard />} />
          <Route path="/dashboard/driver/profile" element={<DriverProfile />} />
          <Route path="/dashboard/landowner" element={<LandownerDashboard />} />
          <Route path="/dashboard/admin" element={<AdminDashboard />} />
          <Route path="/dashboard/shipper/bids" element={<ShipperBidsPortal />} />
          <Route path="/dashboard/driver/bids" element={<DriverBidsPortal />} />
          <Route path="/dashboard/admin/load-sources" element={<AdminLoadSources />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
