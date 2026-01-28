import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface ShipperOnboardingFormProps {
  userId: string;
  onComplete: () => void;
  isLoading: boolean;
}

const businessTypes = [
  { value: "sole_proprietor", label: "Sole Proprietor" },
  { value: "partnership", label: "Partnership" },
  { value: "llc", label: "LLC" },
  { value: "corporation", label: "Corporation" },
  { value: "cooperative", label: "Cooperative" },
  { value: "other", label: "Other" },
];

const cargoTypes = [
  { value: "small_parcels", label: "Small Parcels" },
  { value: "palletized_goods", label: "Palletized Goods" },
  { value: "bulk_goods", label: "Bulk Goods" },
  { value: "dry_food", label: "Dry Food" },
  { value: "perishables", label: "Perishables" },
  { value: "frozen_goods", label: "Frozen Goods" },
  { value: "produce", label: "Produce" },
  { value: "furniture", label: "Furniture" },
  { value: "appliances", label: "Appliances" },
  { value: "electronics", label: "Electronics" },
  { value: "construction", label: "Construction Materials" },
];

const ShipperOnboardingForm = ({
  userId,
  onComplete,
  isLoading,
}: ShipperOnboardingFormProps) => {
  const [formData, setFormData] = useState({
    businessName: "",
    businessType: "",
    registrationNumber: "",
    contactPersonName: "",
    phone: "",
    email: "",
    termsAccepted: false,
  });
  const [selectedCargo, setSelectedCargo] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleCargo = (cargo: string) => {
    setSelectedCargo((prev) =>
      prev.includes(cargo)
        ? prev.filter((c) => c !== cargo)
        : [...prev, cargo]
    );
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
      const { error } = await supabase.from("shipper_profiles" as any).insert({
        user_id: userId,
        business_name: formData.businessName.trim(),
        business_type: formData.businessType,
        registration_number: formData.registrationNumber.trim() || null,
        contact_person_name: formData.contactPersonName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        products_shipped: selectedCargo,
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
          <Label htmlFor="businessName">Business Name *</Label>
          <Input
            id="businessName"
            value={formData.businessName}
            onChange={(e) => handleChange("businessName", e.target.value)}
            required
            placeholder="Your Company Name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessType">Business Type *</Label>
          <Select
            value={formData.businessType}
            onValueChange={(value) => handleChange("businessType", value)}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {businessTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="registrationNumber">
          Business Registration Number (if applicable)
        </Label>
        <Input
          id="registrationNumber"
          value={formData.registrationNumber}
          onChange={(e) => handleChange("registrationNumber", e.target.value)}
          placeholder="Optional"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contactPersonName">Contact Person Name *</Label>
          <Input
            id="contactPersonName"
            value={formData.contactPersonName}
            onChange={(e) => handleChange("contactPersonName", e.target.value)}
            required
            placeholder="John Doe"
          />
        </div>

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
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => handleChange("email", e.target.value)}
          required
          placeholder="you@company.com"
        />
      </div>

      <div className="space-y-2">
        <Label>Types of Products Shipped</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
          {cargoTypes.map((cargo) => (
            <button
              key={cargo.value}
              type="button"
              onClick={() => toggleCargo(cargo.value)}
              className={`
                px-3 py-2 text-sm rounded-lg border transition-colors text-left
                ${selectedCargo.includes(cargo.value)
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/50"
                }
              `}
            >
              {cargo.label}
            </button>
          ))}
        </div>
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
          . I understand that my information will be verified before I can post jobs.
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

export default ShipperOnboardingForm;
