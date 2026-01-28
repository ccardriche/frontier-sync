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
import { Loader2, Upload, Check, X } from "lucide-react";

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
    maxWeightKg: "",
    licensePlate: "",
    hasRefrigeration: false,
    termsAccepted: false,
  });
  
  const [uploads, setUploads] = useState({
    governmentId: null as File | null,
    license: null as File | null,
    cdl: null as File | null,
    vehiclePhoto: null as File | null,
  });
  
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const governmentIdRef = useRef<HTMLInputElement>(null);
  const licenseRef = useRef<HTMLInputElement>(null);
  const cdlRef = useRef<HTMLInputElement>(null);
  const vehiclePhotoRef = useRef<HTMLInputElement>(null);

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
      toast({
        title: "Terms Required",
        description: "Please accept the terms and conditions.",
        variant: "destructive",
      });
      return;
    }

    if (!uploads.governmentId) {
      toast({
        title: "ID Required",
        description: "Please upload your government-issued ID.",
        variant: "destructive",
      });
      return;
    }

    if (!uploads.license) {
      toast({
        title: "License Required",
        description: "Please upload your driver's license.",
        variant: "destructive",
      });
      return;
    }

    if (formData.licenseType === "cdl" && !uploads.cdl) {
      toast({
        title: "CDL Required",
        description: "Please upload your Commercial Driver's License.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    setUploading(true);

    try {
      // Upload documents
      const governmentIdUrl = await uploadFile(uploads.governmentId, userId);
      const licenseUrl = await uploadFile(uploads.license, userId);
      const cdlUrl = uploads.cdl ? await uploadFile(uploads.cdl, userId) : null;

      setUploading(false);

      // Create driver profile
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
          terms_accepted: true,
          terms_accepted_at: new Date().toISOString(),
        } as any)
        .select()
        .single();

      if (profileError) throw profileError;

      const profileData = profile as any;

      // Create vehicle if provided
      if (formData.vehicleType && formData.maxWeightKg && formData.licensePlate) {
        let vehiclePhotoUrl: string | null = null;
        if (uploads.vehiclePhoto) {
          vehiclePhotoUrl = await uploadFile(uploads.vehiclePhoto, userId);
        }

        const { error: vehicleError } = await supabase
          .from("driver_vehicles" as any)
          .insert({
            driver_profile_id: profileData.id,
            vehicle_type: formData.vehicleType,
            max_weight_kg: parseFloat(formData.maxWeightKg),
            license_plate: formData.licensePlate.trim(),
            has_refrigeration: formData.hasRefrigeration,
            photo_urls: vehiclePhotoUrl ? [vehiclePhotoUrl] : [],
            is_primary: true,
            requires_cdl: ["semi_truck", "heavy_equipment"].includes(formData.vehicleType),
          } as any);

        if (vehicleError) {
          console.error("Vehicle error:", vehicleError);
          // Don't fail the whole process for vehicle error
        }
      }

      onComplete();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save profile",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

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
      <Label>
        {label} {required && "*"}
      </Label>
      <input
        type="file"
        ref={inputRef}
        className="hidden"
        accept="image/*,.pdf"
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
            <span className="text-sm text-muted-foreground">
              Click to upload
            </span>
          </>
        )}
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name *</Label>
          <Input
            id="fullName"
            value={formData.fullName}
            onChange={(e) => handleChange("fullName", e.target.value)}
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

      {/* License Section */}
      <div className="p-4 rounded-lg bg-muted/50 space-y-4">
        <h3 className="font-semibold">License Information</h3>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="licenseType">License Type *</Label>
            <Select
              value={formData.licenseType}
              onValueChange={(value) => handleChange("licenseType", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {licenseTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="licenseNumber">License Number</Label>
            <Input
              id="licenseNumber"
              value={formData.licenseNumber}
              onChange={(e) => handleChange("licenseNumber", e.target.value)}
              placeholder="DL123456789"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="licenseExpiry">License Expiry Date</Label>
          <Input
            id="licenseExpiry"
            type="date"
            value={formData.licenseExpiry}
            onChange={(e) => handleChange("licenseExpiry", e.target.value)}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FileUploadButton
            label="Government-issued ID"
            file={uploads.governmentId}
            inputRef={governmentIdRef}
            onFileSelect={(file) => handleFileSelect("governmentId", file)}
            required
          />

          <FileUploadButton
            label="Driver's License"
            file={uploads.license}
            inputRef={licenseRef}
            onFileSelect={(file) => handleFileSelect("license", file)}
            required
          />
        </div>

        {formData.licenseType === "cdl" && (
          <FileUploadButton
            label="CDL Document"
            file={uploads.cdl}
            inputRef={cdlRef}
            onFileSelect={(file) => handleFileSelect("cdl", file)}
            required
          />
        )}
      </div>

      {/* Vehicle Section */}
      <div className="p-4 rounded-lg bg-muted/50 space-y-4">
        <h3 className="font-semibold">Vehicle Information</h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="vehicleType">Vehicle Type *</Label>
            <Select
              value={formData.vehicleType}
              onValueChange={(value) => handleChange("vehicleType", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select vehicle" />
              </SelectTrigger>
              <SelectContent>
                {vehicleTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxWeightKg">Max Weight Capacity (kg) *</Label>
            <Input
              id="maxWeightKg"
              type="number"
              value={formData.maxWeightKg}
              onChange={(e) => handleChange("maxWeightKg", e.target.value)}
              placeholder="1000"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="licensePlate">License Plate *</Label>
            <Input
              id="licensePlate"
              value={formData.licensePlate}
              onChange={(e) => handleChange("licensePlate", e.target.value)}
              placeholder="ABC-1234"
            />
          </div>

          <FileUploadButton
            label="Vehicle Photo"
            file={uploads.vehiclePhoto}
            inputRef={vehiclePhotoRef}
            onFileSelect={(file) => handleFileSelect("vehiclePhoto", file)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="hasRefrigeration"
            checked={formData.hasRefrigeration}
            onCheckedChange={(checked) =>
              handleChange("hasRefrigeration", checked as boolean)
            }
          />
          <label htmlFor="hasRefrigeration" className="text-sm cursor-pointer">
            Vehicle has refrigeration capability
          </label>
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
          . I confirm that all documents uploaded are valid and authentic.
        </label>
      </div>

      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={submitting || isLoading}
      >
        {uploading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Uploading documents...
          </>
        ) : submitting ? (
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

export default DriverOnboardingForm;
