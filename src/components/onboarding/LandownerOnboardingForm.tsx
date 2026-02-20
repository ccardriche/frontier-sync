import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Loader2, Upload, Check, X, Shield, Camera, QrCode, Building2 } from "lucide-react";

interface LandownerOnboardingFormProps {
  userId: string;
  onComplete: () => void;
  isLoading: boolean;
}

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
    facilityDescription: "",
    hasSecurityCameras: false,
    hasQrGateScanner: false,
    termsAccepted: false,
  });

  const [uploads, setUploads] = useState({
    insurance: null as File | null,
    facilityPhotos: [] as File[],
  });

  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const insuranceRef = useRef<HTMLInputElement>(null);
  const facilityPhotosRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (field: "insurance", file: File | null) => {
    setUploads((prev) => ({ ...prev, [field]: file }));
  };

  const handleFacilityPhotos = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files).slice(0, 5); // Max 5 photos
    setUploads((prev) => ({ ...prev, facilityPhotos: [...prev.facilityPhotos, ...newFiles].slice(0, 5) }));
  };

  const removeFacilityPhoto = (index: number) => {
    setUploads((prev) => ({
      ...prev,
      facilityPhotos: prev.facilityPhotos.filter((_, i) => i !== index),
    }));
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
    if (!uploads.insurance) {
      toast({ title: "Insurance Required", description: "Please upload your facility insurance document.", variant: "destructive" });
      return;
    }
    if (uploads.facilityPhotos.length === 0) {
      toast({ title: "Facility Photos Required", description: "Please upload at least one photo of your facility.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    setUploading(true);

    try {
      const insuranceUrl = await uploadFile(uploads.insurance, userId);

      const facilityPhotoUrls: string[] = [];
      for (const photo of uploads.facilityPhotos) {
        const url = await uploadFile(photo, userId);
        if (url) facilityPhotoUrls.push(url);
      }

      setUploading(false);

      const { error } = await supabase.from("landowner_profiles" as any).insert({
        user_id: userId,
        owner_name: formData.ownerName.trim(),
        business_name: formData.businessName.trim() || null,
        phone: formData.phone.trim(),
        email: formData.email.trim() || null,
        insurance_document_url: insuranceUrl,
        has_security_cameras: formData.hasSecurityCameras,
        has_qr_gate_scanner: formData.hasQrGateScanner,
        facility_photo_urls: facilityPhotoUrls,
        facility_description: formData.facilityDescription.trim() || null,
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
      {/* Contact Info */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="ownerName">Owner / Contact Name *</Label>
          <Input id="ownerName" value={formData.ownerName} onChange={(e) => handleChange("ownerName", e.target.value)} required placeholder="John Doe" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="businessName">Business Name (if applicable)</Label>
          <Input id="businessName" value={formData.businessName} onChange={(e) => handleChange("businessName", e.target.value)} placeholder="Optional" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone (WhatsApp-enabled) *</Label>
          <Input id="phone" type="tel" value={formData.phone} onChange={(e) => handleChange("phone", e.target.value)} required placeholder="+1 234 567 8900" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} placeholder="you@example.com" />
        </div>
      </div>

      {/* Insurance */}
      <div className="p-4 rounded-lg bg-muted/50 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Insurance Documentation
        </h3>
        <p className="text-sm text-muted-foreground">Upload your facility liability insurance or property insurance certificate.</p>
        <FileUploadButton label="Insurance Certificate" file={uploads.insurance} inputRef={insuranceRef} onFileSelect={(file) => handleFileSelect("insurance", file)} required />
      </div>

      {/* Security & Access */}
      <div className="p-4 rounded-lg bg-muted/50 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Camera className="w-5 h-5 text-primary" />
          Security & Access Features
        </h3>
        <p className="text-sm text-muted-foreground">Select the security features available at your facility.</p>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Checkbox
              id="securityCameras"
              checked={formData.hasSecurityCameras}
              onCheckedChange={(checked) => handleChange("hasSecurityCameras", checked as boolean)}
            />
            <label htmlFor="securityCameras" className="text-sm leading-relaxed cursor-pointer">
              <span className="font-medium flex items-center gap-1"><Camera className="w-4 h-4 inline" /> Security Cameras</span>
              <br />
              <span className="text-muted-foreground">Facility has CCTV or security camera surveillance</span>
            </label>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="qrGateScanner"
              checked={formData.hasQrGateScanner}
              onCheckedChange={(checked) => handleChange("hasQrGateScanner", checked as boolean)}
            />
            <label htmlFor="qrGateScanner" className="text-sm leading-relaxed cursor-pointer">
              <span className="font-medium flex items-center gap-1"><QrCode className="w-4 h-4 inline" /> Gates with QR Code Scanner</span>
              <br />
              <span className="text-muted-foreground">Entry/exit gates equipped with QR code scanner for access control</span>
            </label>
          </div>
        </div>
      </div>

      {/* Facility Photos */}
      <div className="p-4 rounded-lg bg-muted/50 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          Facility Photos *
        </h3>
        <p className="text-sm text-muted-foreground">Upload photos of your facility (up to 5). Show entry gates, parking area, storage areas, and security features.</p>

        <input
          type="file"
          ref={facilityPhotosRef}
          className="hidden"
          accept="image/*"
          multiple
          onChange={(e) => handleFacilityPhotos(e.target.files)}
        />

        {uploads.facilityPhotos.length > 0 && (
          <div className="space-y-2">
            {uploads.facilityPhotos.map((photo, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg border bg-background">
                <Check className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm truncate flex-1">{photo.name}</span>
                <button type="button" onClick={() => removeFacilityPhoto(i)} className="p-1 hover:bg-muted rounded">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {uploads.facilityPhotos.length < 5 && (
          <Button type="button" variant="outline" onClick={() => facilityPhotosRef.current?.click()} className="w-full">
            <Upload className="w-4 h-4 mr-2" />
            Add Facility Photos ({uploads.facilityPhotos.length}/5)
          </Button>
        )}
      </div>

      {/* Facility Description */}
      <div className="space-y-2">
        <Label htmlFor="facilityDescription">Facility Description</Label>
        <Textarea
          id="facilityDescription"
          value={formData.facilityDescription}
          onChange={(e) => handleChange("facilityDescription", e.target.value)}
          placeholder="Describe your facility: size, location, access hours, special features..."
          rows={3}
        />
      </div>

      {/* Terms */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
        <Checkbox id="terms" checked={formData.termsAccepted} onCheckedChange={(checked) => handleChange("termsAccepted", checked as boolean)} />
        <label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
          I agree to the{" "}
          <a href="#" className="text-primary hover:underline">Terms of Service</a>{" "}and{" "}
          <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
          I understand that my hub listings will be reviewed before going live.
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

export default LandownerOnboardingForm;
