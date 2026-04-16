import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download, Printer } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { HubUnit } from "@/hooks/useHubUnits";

interface Props {
  unit: HubUnit;
  onClose: () => void;
}

export const UnitQRDialog = ({ unit, onClose }: Props) => {
  const [dataUrl, setDataUrl] = useState<string>("");
  const payload = `unit:${unit.id}`;

  useEffect(() => {
    QRCode.toDataURL(payload, { width: 400, margin: 2, errorCorrectionLevel: "H" })
      .then(setDataUrl)
      .catch(console.error);
  }, [payload]);

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `unit-${unit.unit_number}-qr.png`;
    a.click();
  };

  const handlePrint = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`
      <html><head><title>Unit ${unit.unit_number}</title></head>
      <body style="text-align:center;font-family:sans-serif;padding:40px;">
        <h2>Unit ${unit.unit_number}</h2>
        <p>${unit.in_gate_doc || ""}</p>
        <img src="${dataUrl}" style="width:300px;" />
        <p style="font-family:monospace;font-size:12px;">${payload}</p>
      </body></html>
    `);
    w.document.close();
    setTimeout(() => w.print(), 250);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Unit QR Code</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="text-center">
            <p className="font-semibold text-lg">{unit.unit_number}</p>
            {unit.in_gate_doc && (
              <p className="text-sm text-muted-foreground font-mono">{unit.in_gate_doc}</p>
            )}
          </div>
          {dataUrl ? (
            <img src={dataUrl} alt="Unit QR" className="rounded-lg border bg-white p-2" />
          ) : (
            <div className="w-[400px] h-[400px] bg-muted animate-pulse rounded-lg" />
          )}
          <p className="text-xs text-muted-foreground font-mono break-all text-center">{payload}</p>
        </div>
        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" /> Print
          </Button>
          <Button type="button" variant="hero" onClick={handleDownload} disabled={!dataUrl}>
            <Download className="w-4 h-4 mr-2" /> Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
