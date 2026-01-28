import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, X } from "lucide-react";

interface QRScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (hubId: string) => void;
}

const QRScannerDialog = ({ open, onOpenChange, onScan }: QRScannerDialogProps) => {
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && containerRef.current) {
      startScanner();
    }

    return () => {
      stopScanner();
    };
  }, [open]);

  const startScanner = async () => {
    if (scannerRef.current || !containerRef.current) return;

    try {
      setError(null);
      setIsScanning(true);

      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // Parse the QR code - expecting format: "hub:UUID"
          if (decodedText.startsWith("hub:")) {
            const hubId = decodedText.replace("hub:", "");
            stopScanner();
            onScan(hubId);
            onOpenChange(false);
          } else {
            setError("Invalid QR code. Please scan a valid hub QR code.");
          }
        },
        () => {
          // Ignore scan failures (no QR found in frame)
        }
      );
    } catch (err) {
      console.error("Scanner error:", err);
      setError("Unable to access camera. Please grant camera permissions.");
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleClose = () => {
    stopScanner();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Scan Hub QR Code
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div
            id="qr-reader"
            ref={containerRef}
            className="w-full aspect-square bg-muted rounded-lg overflow-hidden"
          />

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          <p className="text-sm text-muted-foreground text-center">
            Point your camera at the hub's QR code to check in automatically
          </p>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={handleClose}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            {!isScanning && (
              <Button className="flex-1" onClick={startScanner}>
                <Camera className="w-4 h-4 mr-2" />
                Retry
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRScannerDialog;
