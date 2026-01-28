import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Camera, Upload, X, Loader2, CheckCircle, User, Phone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SignatureCanvas from "./SignatureCanvas";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ProofOfDeliveryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  onComplete: () => void;
}

const ProofOfDeliveryDialog = ({
  open,
  onOpenChange,
  jobId,
  onComplete,
}: ProofOfDeliveryDialogProps) => {
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadFile = async (
    file: File | Blob,
    path: string
  ): Promise<string | null> => {
    const { data, error } = await supabase.storage
      .from("pod-files")
      .upload(path, file, { upsert: true });

    if (error) {
      console.error("Upload error:", error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from("pod-files")
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  };

  const dataURLtoBlob = (dataURL: string): Blob => {
    const arr = dataURL.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  const handleSubmit = async () => {
    if (!photo || !signature) {
      toast({
        title: "Missing Information",
        description: "Please capture a photo and get the recipient's signature.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");

      const userId = user.user.id;
      const timestamp = Date.now();

      // Upload photo
      const photoPath = `${userId}/${jobId}/photo-${timestamp}.jpg`;
      const photoUrl = await uploadFile(photo, photoPath);

      if (!photoUrl) throw new Error("Failed to upload photo");

      // Upload signature
      const signatureBlob = dataURLtoBlob(signature);
      const signaturePath = `${userId}/${jobId}/signature-${timestamp}.png`;
      const signatureUrl = await uploadFile(signatureBlob, signaturePath);

      if (!signatureUrl) throw new Error("Failed to upload signature");

      // Create PoD record
      const { error: podError } = await supabase.from("pod").insert({
        job_id: jobId,
        delivered_by: userId,
        photo_url: photoUrl,
        signature_url: signatureUrl,
        recipient_name: recipientName || null,
        recipient_phone: recipientPhone || null,
      });

      if (podError) throw podError;

      toast({
        title: "Proof of Delivery Saved",
        description: "Delivery documentation has been recorded successfully.",
      });

      onComplete();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving PoD:", error);
      toast({
        title: "Error",
        description: "Failed to save proof of delivery. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = photo && signature;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Proof of Delivery</DialogTitle>
          <DialogDescription>
            Capture photo evidence and recipient signature to complete delivery
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Photo Capture */}
          <div className="space-y-2">
            <Label>Delivery Photo *</Label>
            {photoPreview ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative rounded-lg overflow-hidden"
              >
                <img
                  src={photoPreview}
                  alt="Delivery"
                  className="w-full h-48 object-cover"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={removePhoto}
                >
                  <X className="w-4 h-4" />
                </Button>
              </motion.div>
            ) : (
              <div
                className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  Take a photo of the delivered package
                </p>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" size="sm" type="button">
                    <Camera className="w-4 h-4 mr-1" />
                    Camera
                  </Button>
                  <Button variant="outline" size="sm" type="button">
                    <Upload className="w-4 h-4 mr-1" />
                    Upload
                  </Button>
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>

          {/* Signature Canvas */}
          <SignatureCanvas onSignatureChange={setSignature} />

          {/* Recipient Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recipientName" className="flex items-center gap-1">
                <User className="w-3 h-3" />
                Recipient Name (optional)
              </Label>
              <Input
                id="recipientName"
                placeholder="Enter recipient's name"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipientPhone" className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                Recipient Phone (optional)
              </Label>
              <Input
                id="recipientPhone"
                type="tel"
                placeholder="Enter recipient's phone"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            variant="hero"
            className="w-full"
            size="lg"
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Complete Delivery
              </>
            )}
          </Button>

          {!isValid && (
            <p className="text-xs text-muted-foreground text-center">
              Photo and signature are required to complete delivery
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProofOfDeliveryDialog;
