import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Loader2, Upload, Check, X, FileText, TruckIcon, Route } from "lucide-react";

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

const shipmentTypes = [
  { value: "ftl", label: "Full Truckload (FTL)" },
  { value: "ltl", label: "Less Than Truckload (LTL)" },
  { value: "partial", label: "Partial Load" },
  { value: "expedited", label: "Expedited" },
  { value: "refrigerated", label: "Refrigerated" },
  { value: "flatbed", label: "Flatbed" },
  { value: "intermodal", label: "Intermodal" },
  { value: "drayage", label: "Drayage" },
  { value: "last_mile", label: "Last Mile Delivery" },
  { value: "hazmat", label: "Hazmat" },
  { value: "oversized", label: "Oversized/Heavy Haul" },
];

const FileUploadButton = ({
  label,
  file,
  inputRef,
  onFileSelect,
  required = false,
}: {
  label: string;
  file: File | null;
  inputRef: React.RefObject<HTMLInputElement>;
  onFileSelect: (file: File | null) => void;
  required?: boolean;
}) => (
  <div className="space-y-2">
    <Label>{label} {required && "*"}</Label>
    <input type="file" ref={inputRef} className="hidden" accept="image/*,.pdf" onChange={(e) => onFileSelect(e.target.files?.[0] || null)} />
    <div
      onClick={() => inputRef.current?.click()}
      className={`flex items-center gap-3 p-3 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${file ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
    >
      {file ? (
        <>
          <Check className="w-5 h-5 text-primary shrink-0" />
          <span className="text-sm truncate flex-1">{file.name}</span>
          <button type="button" onClick={(e) => { e.stopPropagation(); onFileSelect(null); }} className="p-1 hover:bg-muted rounded">
            <X className="w-4 h-4" />
          </button>
        </>
      ) : (
        <>
          <Upload className="w-5 h-5 text-muted-foreground shrink-0" />
          <span className="text-sm text-muted-foreground">Click to upload</span>
        </>
      )}
    </div>
  </div>
);

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
    mcNumber: "",
    dotNumber: "",
    einNumber: "",
    typicalLoads: "",
    preferredLanes: "",
    ratePreferences: "",
    additionalNeeds: "",
    termsAccepted: false,
  });

  const [selectedShipmentTypes, setSelectedShipmentTypes] = useState<string[]>([]);

  const [uploads, setUploads] = useState({
    insurance: null as File | null,
    bond: null as File | null,
  });

  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const insuranceRef = useRef<HTMLInputElement>(null);
  const bondRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleShipmentType = (type: string) => {
    setSelectedShipmentTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const uploadFile = async (file: File, path: string): Promise<string | null> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${path}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from("verification-docs")
      .upload(fileName, file);
    if (uploadError) {
      console.error("Upload error:", uploadError);
      return null;
    }
    const { data: { publicUrl } } = supabase.storage
      .from("verification-docs")
      .getPublicUrl(fileName);
    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.termsAccepted) {
      toast({ title: "Terms Required", description: "Please accept the terms and conditions.", variant: "destructive" });
      return;
    }
    if (!formData.mcNumber.trim()) {
      toast({ title: "MC Number Required", description: "Please enter your Motor Carrier (MC) number.", variant: "destructive" });
      return;
    }
    if (!formData.dotNumber.trim()) {
      toast({ title: "DOT Number Required", description: "Please enter your DOT number.", variant: "destructive" });
      return;
    }
    if (!formData.einNumber.trim()) {
      toast({ title: "EIN Required", description: "Please enter your Employer Identification Number (EIN).", variant: "destructive" });
      return;
    }
    if (!uploads.insurance) {
      toast({ title: "Insurance Required", description: "Please upload your insurance/bond certificate.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    setUploading(true);

    try {
      const insuranceUrl = await uploadFile(uploads.insurance, userId);
      const bondUrl = uploads.bond ? await uploadFile(uploads.bond, userId) : null;

      setUploading(false);

      const { error } = await supabase.from("shipper_profiles" as any).insert({
        user_id: userId,
        business_name: formData.businessName.trim(),
        business_type: formData.businessType,
        registration_number: formData.registrationNumber.trim() || null,
        contact_person_name: formData.contactPersonName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        mc_number: formData.mcNumber.trim(),
        dot_number: formData.dotNumber.trim(),
        ein_number: formData.einNumber.trim(),
        insurance_document_url: insuranceUrl,
        bond_document_url: bondUrl,
        shipment_types: selectedShipmentTypes,
        typical_loads: formData.typicalLoads.trim() || null,
        preferred_lanes: formData.preferredLanes.trim() || null,
        rate_preferences: formData.ratePreferences.trim() || null,
        additional_needs: formData.additionalNeeds.trim() || null,
        products_shipped: [],
        terms_accepted: true,
        terms_accepted_at: new Date().toISOString(),
      } as any);

      if (error) throw error;
      onComplete();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to save profile", variant: "destructive" });
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Business Info */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="businessName">Business Name *</Label>
          <Input id="businessName" value={formData.businessName} onChange={(e) => handleChange("businessName", e.target.value)} required placeholder="Your Company Name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="businessType">Business Type *</Label>
          <Select value={formData.businessType} onValueChange={(value) => handleChange("businessType", value)} required>
            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
            <SelectContent>
              {businessTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contactPersonName">Contact Person Name *</Label>
          <Input id="contactPersonName" value={formData.contactPersonName} onChange={(e) => handleChange("contactPersonName", e.target.value)} required placeholder="John Doe" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone (WhatsApp-enabled) *</Label>
          <Input id="phone" type="tel" value={formData.phone} onChange={(e) => handleChange("phone", e.target.value)} required placeholder="+1 234 567 8900" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input id="email" type="email" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} required placeholder="you@company.com" />
      </div>

      {/* Regulatory Numbers */}
      <div className="p-4 rounded-lg bg-muted/50 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Regulatory & Tax Information
        </h3>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="mcNumber">MC Number *</Label>
            <Input id="mcNumber" value={formData.mcNumber} onChange={(e) => handleChange("mcNumber", e.target.value)} required placeholder="MC-123456" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dotNumber">DOT Number *</Label>
            <Input id="dotNumber" value={formData.dotNumber} onChange={(e) => handleChange("dotNumber", e.target.value)} required placeholder="DOT-789012" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="einNumber">EIN *</Label>
            <Input id="einNumber" value={formData.einNumber} onChange={(e) => handleChange("einNumber", e.target.value)} required placeholder="12-3456789" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="registrationNumber">Business Registration Number</Label>
          <Input id="registrationNumber" value={formData.registrationNumber} onChange={(e) => handleChange("registrationNumber", e.target.value)} placeholder="Optional" />
        </div>
      </div>

      {/* Insurance & Bond */}
      <div className="p-4 rounded-lg bg-muted/50 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Insurance & Bond
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <FileUploadButton label="Insurance Certificate" file={uploads.insurance} inputRef={insuranceRef} onFileSelect={(file) => setUploads((prev) => ({ ...prev, insurance: file }))} required />
          <FileUploadButton label="Surety Bond (optional)" file={uploads.bond} inputRef={bondRef} onFileSelect={(file) => setUploads((prev) => ({ ...prev, bond: file }))} />
        </div>
      </div>

      {/* Shipment Types */}
      <div className="p-4 rounded-lg bg-muted/50 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <TruckIcon className="w-5 h-5 text-primary" />
          Types of Shipment
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {shipmentTypes.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => toggleShipmentType(type.value)}
              className={`px-3 py-2 text-sm rounded-lg border transition-colors text-left ${
                selectedShipmentTypes.includes(type.value)
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/50"
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loads, Lanes, Rates */}
      <div className="p-4 rounded-lg bg-muted/50 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Route className="w-5 h-5 text-primary" />
          Loads, Lanes & Rates
        </h3>

        <div className="space-y-2">
          <Label htmlFor="typicalLoads">Typical Loads</Label>
          <Textarea id="typicalLoads" value={formData.typicalLoads} onChange={(e) => handleChange("typicalLoads", e.target.value)} placeholder="Describe your typical load types, sizes, and frequency (e.g., 20 FTL/week, avg 40,000 lbs)" rows={2} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="preferredLanes">Preferred Lanes</Label>
          <Textarea id="preferredLanes" value={formData.preferredLanes} onChange={(e) => handleChange("preferredLanes", e.target.value)} placeholder="List your primary shipping lanes (e.g., Chicago → Dallas, LA → Seattle)" rows={2} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ratePreferences">Rate Preferences</Label>
          <Textarea id="ratePreferences" value={formData.ratePreferences} onChange={(e) => handleChange("ratePreferences", e.target.value)} placeholder="How do you prefer to negotiate rates? (e.g., per mile, flat rate, contract rates)" rows={2} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="additionalNeeds">Additional Needs</Label>
          <Textarea id="additionalNeeds" value={formData.additionalNeeds} onChange={(e) => handleChange("additionalNeeds", e.target.value)} placeholder="Any special requirements? (e.g., liftgate, team drivers, white glove service, dock delivery)" rows={2} />
        </div>
      </div>

      {/* Terms */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
        <Checkbox id="terms" checked={formData.termsAccepted} onCheckedChange={(checked) => handleChange("termsAccepted", checked as boolean)} />
        <label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
          I agree to the{" "}
          <a href="#" className="text-primary hover:underline">Terms of Service</a>{" "}and{" "}
          <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
          I understand that my information will be verified before I can post jobs.
        </label>
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={submitting || isLoading}>
        {uploading ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading documents...</>
        ) : submitting ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating Profile...</>
        ) : (
          "Complete Registration"
        )}
      </Button>
    </form>
  );
};

export default ShipperOnboardingForm;
