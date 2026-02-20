import { useState, useRef } from "react";
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
import { Loader2, Upload, Check, X, AlertTriangle, Shield } from "lucide-react";

interface DriverOnboardingFormProps {
  userId: string;
  onComplete: () => void;
  isLoading: boolean;
}

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

const currentYear = new Date().getFullYear();
const MIN_VEHICLE_YEAR = currentYear - 15;

const FileUploadButton = ({
  label,
  file,
  inputRef,
  onFileSelect,
  required = false,
  accept = "image/*,.pdf",
}: {
  label: string;
  file: File | null;
  inputRef: React.RefObject<HTMLInputElement>;
  onFileSelect: (file: File | null) => void;
  required?: boolean;
  accept?: string;
}) => (
  <div className="space-y-2">
    <Label>
      {label} {required && "*"}
    </Label>
    <input
      type="file"
      ref={inputRef}
      className="hidden"
      accept={accept}
      onChange={(e) => onFileSelect(e.target.files?.[0] || null)}
    />
    <div
      onClick={() => inputRef.current?.click()}
      className={`
        flex items-center gap-3 p-3 rounded-lg border-2 border-dashed cursor-pointer transition-colors
        ${file ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}
      `}
    >
      {file ? (
        <>
          <Check className="w-5 h-5 text-primary shrink-0" />
          <span className="text-sm truncate flex-1">{file.name}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onFileSelect(null);
            }}
            className="p-1 hover:bg-muted rounded"
          >
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

const DriverOnboardingForm = ({
  userId,
  onComplete,
  isLoading,
}: DriverOnboardingFormProps) => {
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    licenseType: "standard",
    licenseNumber: "",
    licenseExpiry: "",
    vehicleType: "",
    vehicleYear: "",
    maxWeightKg: "",
    licensePlate: "",
    hasRefrigeration: false,
    backgroundCheckConsent: false,
    termsAccepted: false,
  });

  const [uploads, setUploads] = useState({
    governmentId: null as File | null,
    license: null as File | null,
    cdl: null as File | null,
    mdr: null as File | null,
    vehiclePhoto: null as File | null,
    licensePlatePhoto: null as File | null,
  });

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const governmentIdRef = useRef<HTMLInputElement>(null);
  const licenseRef = useRef<HTMLInputElement>(null);
  const cdlRef = useRef<HTMLInputElement>(null);
  const mdrRef = useRef<HTMLInputElement>(null);
  const vehiclePhotoRef = useRef<HTMLInputElement>(null);
  const licensePlatePhotoRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (field: keyof typeof uploads, file: File | null) => {
    setUploads((prev) => ({ ...prev, [field]: file }));
  };

  const uploadFile = async (file: File, path: string): Promise<string | null> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${path}/${Date.now()}.${fileExt}`;
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
    if (!formData.backgroundCheckConsent) {
      toast({ title: "Background Check Required", description: "You must consent to a criminal background check via Checkr.", variant: "destructive" });
      return;
    }
    if (!uploads.governmentId) {
      toast({ title: "ID Required", description: "Please upload your government-issued ID.", variant: "destructive" });
      return;
    }
    if (!uploads.license) {
      toast({ title: "License Required", description: "Please upload your driver's license.", variant: "destructive" });
      return;
    }
    if (formData.licenseType === "cdl" && !uploads.cdl) {
      toast({ title: "CDL Required", description: "Please upload your Commercial Driver's License.", variant: "destructive" });
      return;
    }
    if (!uploads.mdr) {
      toast({ title: "MDR Required", description: "Please upload your Motor Vehicle Record (MVR/MDR).", variant: "destructive" });
      return;
    }
    if (!uploads.vehiclePhoto) {
      toast({ title: "Vehicle Photo Required", description: "Please upload a photo of your vehicle.", variant: "destructive" });
      return;
    }
    if (!uploads.licensePlatePhoto) {
      toast({ title: "License Plate Photo Required", description: "Please upload a photo of your license plate.", variant: "destructive" });
      return;
    }
    if (!formData.vehicleYear || parseInt(formData.vehicleYear) < MIN_VEHICLE_YEAR) {
      toast({ title: "Vehicle Too Old", description: `Vehicles must be ${currentYear - MIN_VEHICLE_YEAR} years old or newer (${MIN_VEHICLE_YEAR} or later).`, variant: "destructive" });
      return;
    }
    if (parseInt(formData.vehicleYear) > currentYear + 1) {
      toast({ title: "Invalid Year", description: "Please enter a valid vehicle year.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    setUploading(true);

    try {
      const governmentIdUrl = await uploadFile(uploads.governmentId, userId);
      const licenseUrl = await uploadFile(uploads.license, userId);
      const cdlUrl = uploads.cdl ? await uploadFile(uploads.cdl, userId) : null;
      const mdrUrl = await uploadFile(uploads.mdr!, userId);
      
      setUploading(false);

      const { data: profile, error: profileError } = await supabase
        .from("driver_profiles" as any)
        .insert({
          user_id: userId,
          full_name: formData.fullName.trim(),
          phone: formData.phone.trim(),
          license_type: formData.licenseType,
          license_number: formData.licenseNumber.trim() || null,
          license_expiry: formData.licenseExpiry || null,
          license_document_url: licenseUrl,
          cdl_document_url: cdlUrl,
          government_id_url: governmentIdUrl,
          mdr_document_url: mdrUrl,
          background_check_consent: true,
          background_check_consent_at: new Date().toISOString(),
          terms_accepted: true,
          terms_accepted_at: new Date().toISOString(),
        } as any)
        .select()
        .single();

      if (profileError) throw profileError;
      const profileData = profile as any;

      // Vehicle is required
      let vehiclePhotoUrl: string | null = null;
      let licensePlatePhotoUrl: string | null = null;
      if (uploads.vehiclePhoto) {
        vehiclePhotoUrl = await uploadFile(uploads.vehiclePhoto, userId);
      }
      if (uploads.licensePlatePhoto) {
        licensePlatePhotoUrl = await uploadFile(uploads.licensePlatePhoto, userId);
      }

      const photoUrls = [vehiclePhotoUrl, licensePlatePhotoUrl].filter(Boolean) as string[];

      const { error: vehicleError } = await supabase
        .from("driver_vehicles" as any)
        .insert({
          driver_profile_id: profileData.id,
          vehicle_type: formData.vehicleType,
          vehicle_year: parseInt(formData.vehicleYear),
          max_weight_kg: parseFloat(formData.maxWeightKg) || 0,
          license_plate: formData.licensePlate.trim(),
          has_refrigeration: formData.hasRefrigeration,
          photo_urls: photoUrls,
          is_primary: true,
          requires_cdl: ["semi_truck", "heavy_equipment"].includes(formData.vehicleType),
        } as any);

      if (vehicleError) {
        console.error("Vehicle error:", vehicleError);
      }

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
      {/* Personal Info */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name *</Label>
          <Input id="fullName" value={formData.fullName} onChange={(e) => handleChange("fullName", e.target.value)} required placeholder="John Doe" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone (WhatsApp-enabled) *</Label>
          <Input id="phone" type="tel" value={formData.phone} onChange={(e) => handleChange("phone", e.target.value)} required placeholder="+1 234 567 8900" />
        </div>
      </div>

      {/* License & Documents Section */}
      <div className="p-4 rounded-lg bg-muted/50 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          License & Documents
        </h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="licenseType">License Type *</Label>
            <Select value={formData.licenseType} onValueChange={(value) => handleChange("licenseType", value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {licenseTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="licenseNumber">License Number *</Label>
            <Input id="licenseNumber" value={formData.licenseNumber} onChange={(e) => handleChange("licenseNumber", e.target.value)} required placeholder="DL123456789" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="licenseExpiry">License Expiry Date *</Label>
          <Input id="licenseExpiry" type="date" value={formData.licenseExpiry} onChange={(e) => handleChange("licenseExpiry", e.target.value)} required />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FileUploadButton label="Government-issued ID" file={uploads.governmentId} inputRef={governmentIdRef} onFileSelect={(file) => handleFileSelect("governmentId", file)} required />
          <FileUploadButton label="Driver's License" file={uploads.license} inputRef={licenseRef} onFileSelect={(file) => handleFileSelect("license", file)} required />
        </div>

        {formData.licenseType === "cdl" && (
          <FileUploadButton label="CDL Document" file={uploads.cdl} inputRef={cdlRef} onFileSelect={(file) => handleFileSelect("cdl", file)} required />
        )}

        <FileUploadButton label="Motor Vehicle Record (MVR/MDR)" file={uploads.mdr} inputRef={mdrRef} onFileSelect={(file) => handleFileSelect("mdr", file)} required />
      </div>

      {/* Background Check Section */}
      <div className="p-4 rounded-lg bg-muted/50 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          Criminal Background Check (via Checkr)
        </h3>
        <p className="text-sm text-muted-foreground">
          All drivers must pass a criminal background check conducted through Checkr. By consenting below, you authorize Pioneer Nexus to initiate this screening.
        </p>
        <div className="flex items-start gap-3">
          <Checkbox
            id="backgroundCheck"
            checked={formData.backgroundCheckConsent}
            onCheckedChange={(checked) => handleChange("backgroundCheckConsent", checked as boolean)}
          />
          <label htmlFor="backgroundCheck" className="text-sm leading-relaxed cursor-pointer">
            I consent to a criminal background check through Checkr. I understand that a clear background check is required to be activated as a driver. *
          </label>
        </div>
      </div>

      {/* Vehicle Section */}
      <div className="p-4 rounded-lg bg-muted/50 space-y-4">
        <h3 className="font-semibold">Vehicle Information</h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="vehicleType">Vehicle Type *</Label>
            <Select value={formData.vehicleType} onValueChange={(value) => handleChange("vehicleType", value)}>
              <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
              <SelectContent>
                {vehicleTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="vehicleYear">Vehicle Year *</Label>
            <Input
              id="vehicleYear"
              type="number"
              value={formData.vehicleYear}
              onChange={(e) => handleChange("vehicleYear", e.target.value)}
              required
              placeholder={`${MIN_VEHICLE_YEAR} or newer`}
              min={MIN_VEHICLE_YEAR}
              max={currentYear + 1}
            />
            <p className="text-xs text-muted-foreground">
              Vehicles must be {currentYear - MIN_VEHICLE_YEAR} years old or newer ({MIN_VEHICLE_YEAR}+)
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="maxWeightKg">Max Weight Capacity (kg) *</Label>
            <Input id="maxWeightKg" type="number" value={formData.maxWeightKg} onChange={(e) => handleChange("maxWeightKg", e.target.value)} required placeholder="1000" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="licensePlate">License Plate *</Label>
            <Input id="licensePlate" value={formData.licensePlate} onChange={(e) => handleChange("licensePlate", e.target.value)} required placeholder="ABC-1234" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FileUploadButton label="Vehicle Photo" file={uploads.vehiclePhoto} inputRef={vehiclePhotoRef} onFileSelect={(file) => handleFileSelect("vehiclePhoto", file)} required accept="image/*" />
          <FileUploadButton label="License Plate Photo" file={uploads.licensePlatePhoto} inputRef={licensePlatePhotoRef} onFileSelect={(file) => handleFileSelect("licensePlatePhoto", file)} required accept="image/*" />
        </div>

        <div className="flex items-center gap-2">
          <Checkbox id="hasRefrigeration" checked={formData.hasRefrigeration} onCheckedChange={(checked) => handleChange("hasRefrigeration", checked as boolean)} />
          <label htmlFor="hasRefrigeration" className="text-sm cursor-pointer">Vehicle has refrigeration capability</label>
        </div>
      </div>

      {/* Terms */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
        <Checkbox id="terms" checked={formData.termsAccepted} onCheckedChange={(checked) => handleChange("termsAccepted", checked as boolean)} />
        <label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
          I agree to the{" "}
          <a href="#" className="text-primary hover:underline">Terms of Service</a>{" "}and{" "}
          <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
          I confirm that all documents uploaded are valid and authentic, and my vehicle meets the age requirements.
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

export default DriverOnboardingForm;
