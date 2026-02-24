import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Loader2, Package, Truck, MapPin, ArrowRight, ArrowLeft, Check } from "lucide-react";
import ShipperOnboardingForm from "@/components/onboarding/ShipperOnboardingForm";
import DriverOnboardingForm from "@/components/onboarding/DriverOnboardingForm";
import LandownerOnboardingForm from "@/components/onboarding/LandownerOnboardingForm";

type Role = "shipper" | "driver" | "landowner";

const roleInfo = {
  shipper: {
    icon: Package,
    title: "Shipper",
    description: "Post freight jobs and track deliveries",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  driver: {
    icon: Truck,
    title: "Driver",
    description: "Find jobs, bid on freight, and earn",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  landowner: {
    icon: MapPin,
    title: "Hub Owner",
    description: "List parking, storage, and transit hubs",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
};

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUserId(session.user.id);

      // Check if already onboarded
      const { data: role } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (role) {
        navigate(`/dashboard/${role.role}`);
      }
    };
    checkAuth();
  }, [navigate]);

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
  };

  const handleContinue = () => {
    if (selectedRole) {
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
    setSelectedRole(null);
  };

  const handleOnboardingComplete = async () => {
    if (!userId || !selectedRole) return;

    setIsLoading(true);
    try {
      // Create user role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: userId,
          role: selectedRole,
        });

      if (roleError) throw roleError;

      toast({
        title: "Welcome to ANCHOR!",
        description: "Your account is set up and ready to go.",
      });

      navigate(`/dashboard/${selectedRole}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to complete onboarding",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}>
            {step > 1 ? <Check className="w-5 h-5" /> : "1"}
          </div>
          <div className={`h-1 w-20 ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}>
            2
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card variant="glass">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">Choose Your Role</CardTitle>
                  <CardDescription>
                    Select how you'll use ANCHOR
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    {(Object.keys(roleInfo) as Role[]).map((role) => {
                      const info = roleInfo[role];
                      const Icon = info.icon;
                      const isSelected = selectedRole === role;

                      return (
                        <motion.button
                          key={role}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleRoleSelect(role)}
                          className={`
                            p-4 rounded-lg border-2 text-left transition-colors
                            ${isSelected
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                            }
                          `}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full ${info.bgColor} flex items-center justify-center`}>
                              <Icon className={`w-6 h-6 ${info.color}`} />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold">{info.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                {info.description}
                              </p>
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              isSelected ? "border-primary bg-primary" : "border-muted"
                            }`}>
                              {isSelected && <Check className="w-4 h-4 text-primary-foreground" />}
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>

                  <Button
                    onClick={handleContinue}
                    disabled={!selectedRole}
                    className="w-full mt-6"
                    size="lg"
                  >
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 2 && selectedRole && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <Card variant="glass">
                <CardHeader>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBack}
                    className="w-fit mb-2"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <CardTitle className="flex items-center gap-3">
                    {(() => {
                      const Icon = roleInfo[selectedRole].icon;
                      return (
                        <div className={`w-10 h-10 rounded-full ${roleInfo[selectedRole].bgColor} flex items-center justify-center`}>
                          <Icon className={`w-5 h-5 ${roleInfo[selectedRole].color}`} />
                        </div>
                      );
                    })()}
                    Complete Your {roleInfo[selectedRole].title} Profile
                  </CardTitle>
                  <CardDescription>
                    Fill in your details to get verified
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedRole === "shipper" && (
                    <ShipperOnboardingForm
                      userId={userId!}
                      onComplete={handleOnboardingComplete}
                      isLoading={isLoading}
                    />
                  )}
                  {selectedRole === "driver" && (
                    <DriverOnboardingForm
                      userId={userId!}
                      onComplete={handleOnboardingComplete}
                      isLoading={isLoading}
                    />
                  )}
                  {selectedRole === "landowner" && (
                    <LandownerOnboardingForm
                      userId={userId!}
                      onComplete={handleOnboardingComplete}
                      isLoading={isLoading}
                    />
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Onboarding;
