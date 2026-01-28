import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface LandownerOnboardingFormProps {
  userId: string;
  onComplete: () => void;
  isLoading: boolean;
}

const LandownerOnboardingForm = ({
  userId,
  onComplete,
  isLoading,
}: LandownerOnboardingFormProps) => {
  const [formData, setFormData] = useState({
    ownerName: "",
    businessName: "",
    phone: "",
    email: "",
    termsAccepted: false,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.termsAccepted) {
      toast({
        title: "Terms Required",
        description: "Please accept the terms and conditions.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("landowner_profiles" as any).insert({
        user_id: userId,
        owner_name: formData.ownerName.trim(),
        business_name: formData.businessName.trim() || null,
        phone: formData.phone.trim(),
        email: formData.email.trim() || null,
        terms_accepted: true,
        terms_accepted_at: new Date().toISOString(),
      } as any);

      if (error) throw error;

      onComplete();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save profile",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="ownerName">Owner / Contact Name *</Label>
          <Input
            id="ownerName"
            value={formData.ownerName}
            onChange={(e) => handleChange("ownerName", e.target.value)}
            required
            placeholder="John Doe"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessName">Business Name (if applicable)</Label>
          <Input
            id="businessName"
            value={formData.businessName}
            onChange={(e) => handleChange("businessName", e.target.value)}
            placeholder="Optional"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone (WhatsApp-enabled) *</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            required
            placeholder="+1 234 567 8900"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="you@example.com"
          />
        </div>
      </div>

      <div className="p-4 rounded-lg bg-muted/50">
        <h4 className="font-medium mb-2">What you can do as a Hub Owner:</h4>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
          <li>List truck parking spaces</li>
          <li>Offer maintenance areas</li>
          <li>Provide storage facilities</li>
          <li>Set daily rates or per check-in fees</li>
          <li>Track occupancy and usage</li>
        </ul>
      </div>

      <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
        <Checkbox
          id="terms"
          checked={formData.termsAccepted}
          onCheckedChange={(checked) =>
            handleChange("termsAccepted", checked as boolean)
          }
        />
        <label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
          I agree to the{" "}
          <a href="#" className="text-primary hover:underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="text-primary hover:underline">
            Privacy Policy
          </a>
          . I understand that my hub listings will be reviewed before going live.
        </label>
      </div>

      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={submitting || isLoading}
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Creating Profile...
          </>
        ) : (
          "Complete Registration"
        )}
      </Button>
    </form>
  );
};

export default LandownerOnboardingForm;
