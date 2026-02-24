import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, User, Truck, Shield, Save, Loader2, CheckCircle, Clock, XCircle, Building2, ExternalLink, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";

const licenseTypes = [
  { value: "standard", label: "Standard Driver's License" },
  { value: "cdl", label: "Commercial Driver's License (CDL)" },
];

const vehicleTypes = [
  { value: "car", label: "Gig Worker (Car)" },
  { value: "pickup_truck", label: "Gig Worker (Pickup Truck)" },
  { value: "van", label: "Van Driver" },
  { value: "box_truck", label: "Box Truck Driver" },
  { value: "flatbed", label: "Flatbed Driver" },
  { value: "semi_truck", label: "Semi-Truck Driver" },
  { value: "heavy_equipment", label: "Heavy Equipment Operator" },
  { value: "specialized_carrier", label: "Specialized Carrier" },
];

const VerificationBadge = ({ status }: { status: string | null }) => {
  if (status === "approved") return <Badge variant="default" className="bg-success text-success-foreground"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
  if (status === "rejected") return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
  return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
};

const DriverProfile = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeStatus, setStripeStatus] = useState<{
    status: string;
    details_submitted?: boolean;
    payouts_enabled?: boolean;
    external_accounts?: number;
  } | null>(null);

  const [profile, setProfile] = useState({
    fullName: "",
    phone: "",
    licenseType: "standard",
    licenseNumber: "",
    licenseExpiry: "",
    verificationStatus: null as string | null,
  });

  const [vehicle, setVehicle] = useState({
    id: "",
    vehicleType: "",
    vehicleYear: "",
    maxWeightKg: "",
    licensePlate: "",
    hasRefrigeration: false,
  });

  const [accountEmail, setAccountEmail] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      setUserId(session.user.id);
      setAccountEmail(session.user.email || "");

      // Load driver profile
      const { data: driverProfile } = await supabase
        .from("driver_profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (driverProfile) {
        const dp = driverProfile as any;
        setProfile({
          fullName: dp.full_name || "",
          phone: dp.phone || "",
          licenseType: dp.license_type || "standard",
          licenseNumber: dp.license_number || "",
          licenseExpiry: dp.license_expiry || "",
          verificationStatus: dp.verification_status,
        });

        // Load vehicle
        const { data: vehicleData } = await supabase
          .from("driver_vehicles")
          .select("*")
          .eq("driver_profile_id", dp.id)
          .eq("is_primary", true)
          .maybeSingle();

        if (vehicleData) {
          const v = vehicleData as any;
          setVehicle({
            id: v.id,
            vehicleType: v.vehicle_type || "",
            vehicleYear: v.vehicle_year?.toString() || "",
            maxWeightKg: v.max_weight_kg?.toString() || "",
            licensePlate: v.license_plate || "",
            hasRefrigeration: v.has_refrigeration || false,
          });
        }
      }

      setIsLoading(false);

      // Check Stripe status
      checkStripeStatus();
    };

    const checkStripeStatus = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("stripe-connect", {
          body: { action: "check_status" },
        });
        if (!error && data) {
          setStripeStatus(data);
        }
      } catch (e) {
        console.error("Failed to check Stripe status:", e);
      }
    };

    loadProfile();

    // Check if returning from Stripe onboarding
    if (searchParams.get("stripe_onboarding") === "complete") {
      checkStripeStatus();
      toast({ title: "Bank account setup", description: "Checking your account status..." });
    }
  }, [navigate, searchParams]);

  const handleSave = async () => {
    if (!userId) return;
    setIsSaving(true);

    try {
      const { error: profileError } = await supabase
        .from("driver_profiles")
        .update({
          full_name: profile.fullName.trim(),
          phone: profile.phone.trim(),
          license_number: profile.licenseNumber.trim() || null,
          license_expiry: profile.licenseExpiry || null,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("user_id", userId);

      if (profileError) throw profileError;

      if (vehicle.id) {
        const { error: vehicleError } = await supabase
          .from("driver_vehicles")
          .update({
            vehicle_type: vehicle.vehicleType,
            vehicle_year: parseInt(vehicle.vehicleYear) || null,
            max_weight_kg: parseFloat(vehicle.maxWeightKg) || 0,
            license_plate: vehicle.licensePlate.trim(),
            has_refrigeration: vehicle.hasRefrigeration,
            updated_at: new Date().toISOString(),
          } as any)
          .eq("id", vehicle.id);

        if (vehicleError) throw vehicleError;
      }

      toast({ title: "Profile updated", description: "Your changes have been saved." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to save changes", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleStripeConnect = async () => {
    setStripeLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-connect", {
        body: { action: "create_account" },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to start bank setup", variant: "destructive" });
      setStripeLoading(false);
    }
  };

  const handleStripeDashboard = async () => {
    setStripeLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-connect", {
        body: { action: "create_dashboard_link" },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to open dashboard", variant: "destructive" });
    } finally {
      setStripeLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border glass sticky top-0 z-50">
          <div className="container px-4 py-3 flex items-center gap-3">
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-6 w-32" />
          </div>
        </header>
        <main className="container px-4 py-8 space-y-6">
          {[1, 2, 3].map(i => (
            <Card key={i} variant="glass"><CardContent className="p-6"><Skeleton className="h-32 w-full" /></CardContent></Card>
          ))}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border glass sticky top-0 z-50">
        <div className="container px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/driver")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-display font-bold">My Profile</h1>
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </header>

      <main className="container px-4 py-8 space-y-6 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Account Info */}
          <Card variant="glass" className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-5 h-5 text-primary" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={accountEmail} disabled className="opacity-70" />
                <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Verification Status</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Your driver verification status</p>
                </div>
                <VerificationBadge status={profile.verificationStatus} />
              </div>
            </CardContent>
          </Card>

          {/* Bank Account / Direct Deposit */}
          <Card variant="glass" className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="w-5 h-5 text-primary" />
                Bank Account & Direct Deposit
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {stripeStatus?.status === "connected" && stripeStatus.details_submitted ? (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-success" />
                      <div>
                        <p className="font-medium text-sm">Bank account connected</p>
                        <p className="text-xs text-muted-foreground">
                          {stripeStatus.payouts_enabled ? "Payouts enabled — ready for direct deposit" : "Account under review — payouts will be enabled soon"}
                        </p>
                      </div>
                    </div>
                    <Badge variant={stripeStatus.payouts_enabled ? "default" : "secondary"} className={stripeStatus.payouts_enabled ? "bg-success text-success-foreground" : ""}>
                      {stripeStatus.payouts_enabled ? "Active" : "Pending"}
                    </Badge>
                  </div>
                  <Separator />
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleStripeDashboard} disabled={stripeLoading}>
                      {stripeLoading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <ExternalLink className="w-4 h-4 mr-1" />}
                      Manage Account
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleStripeConnect} disabled={stripeLoading}>
                      <CreditCard className="w-4 h-4 mr-1" />
                      Update Details
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Link your bank account to receive direct deposit payouts for completed jobs. Setup takes just a few minutes.
                  </p>
                  <Button onClick={handleStripeConnect} disabled={stripeLoading}>
                    {stripeLoading ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Setting up...</>
                    ) : (
                      <><Building2 className="w-4 h-4 mr-2" />Link Bank Account</>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card variant="glass" className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="w-5 h-5 text-primary" />
                Personal & License Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={profile.fullName}
                    onChange={(e) => setProfile(p => ({ ...p, fullName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile(p => ({ ...p, phone: e.target.value }))}
                  />
                </div>
              </div>
              <Separator />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>License Type</Label>
                  <Select value={profile.licenseType} disabled>
                    <SelectTrigger className="opacity-70">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {licenseTypes.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Contact support to change license type.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="licenseNumber">License Number</Label>
                  <Input
                    id="licenseNumber"
                    value={profile.licenseNumber}
                    onChange={(e) => setProfile(p => ({ ...p, licenseNumber: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="licenseExpiry">License Expiry</Label>
                <Input
                  id="licenseExpiry"
                  type="date"
                  value={profile.licenseExpiry}
                  onChange={(e) => setProfile(p => ({ ...p, licenseExpiry: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Info */}
          <Card variant="glass" className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Truck className="w-5 h-5 text-primary" />
                Vehicle Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Vehicle Type</Label>
                  <Select
                    value={vehicle.vehicleType}
                    onValueChange={(v) => setVehicle(prev => ({ ...prev, vehicleType: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicleTypes.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicleYear">Vehicle Year</Label>
                  <Input
                    id="vehicleYear"
                    type="number"
                    value={vehicle.vehicleYear}
                    onChange={(e) => setVehicle(prev => ({ ...prev, vehicleYear: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="maxWeightKg">Max Weight (kg)</Label>
                  <Input
                    id="maxWeightKg"
                    type="number"
                    value={vehicle.maxWeightKg}
                    onChange={(e) => setVehicle(prev => ({ ...prev, maxWeightKg: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="licensePlate">License Plate</Label>
                  <Input
                    id="licensePlate"
                    value={vehicle.licensePlate}
                    onChange={(e) => setVehicle(prev => ({ ...prev, licensePlate: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="hasRefrigeration"
                  checked={vehicle.hasRefrigeration}
                  onCheckedChange={(checked) => setVehicle(prev => ({ ...prev, hasRefrigeration: checked as boolean }))}
                />
                <label htmlFor="hasRefrigeration" className="text-sm cursor-pointer">
                  Vehicle has refrigeration capability
                </label>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default DriverProfile;
