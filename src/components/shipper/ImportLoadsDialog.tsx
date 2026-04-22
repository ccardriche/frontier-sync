import { useState, useRef } from "react";
import { Loader2, Search, FileText, Upload, Globe, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useLoadImportSearch, type ImportSource } from "@/hooks/useLoadImport";
import ImportReviewTable from "./ImportReviewTable";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ImportLoadsDialog = ({ open, onOpenChange }: Props) => {
  const { loads, setLoads, search, isSearching, lastReason, setLastReason } = useLoadImportSearch();
  const [activeSource, setActiveSource] = useState<ImportSource>("trulos");
  const [activeTab, setActiveTab] = useState<"board" | "csv" | "text">("board");

  // Load Board tab state
  const [boardSource, setBoardSource] = useState<"trulos" | "ffs">("trulos");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");

  // Text tab state
  const [rawText, setRawText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setLoads([]);
    setLastReason(null);
    setRawText("");
    setOrigin("");
    setDestination("");
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const switchToPasteText = () => {
    const lane = origin || destination ? `${origin || "?"} → ${destination || "?"}, ` : "";
    setRawText(
      (prev) =>
        prev ||
        `${lane}45,000 lbs dry van, $2,400, pickup tomorrow, contact Mike 555-1234`,
    );
    setLastReason(null);
    setActiveTab("text");
  };

  const handleBoardSearch = () => {
    if (!origin && !destination) {
      toast({ title: "Enter origin or destination", variant: "destructive" });
      return;
    }
    setActiveSource(boardSource);
    search({ source: boardSource, params: { origin, destination } });
  };

  const handleTextParse = () => {
    if (rawText.trim().length < 20) {
      toast({ title: "Paste at least one load", description: "Need more text to parse." });
      return;
    }
    setActiveSource("text");
    search({ source: "text", params: { text: rawText } });
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setActiveSource("csv");
    search({ source: "csv", params: { text } });
    e.target.value = "";
  };

  const showReview = loads.length > 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Loads from External Sources</DialogTitle>
          <DialogDescription>
            Pull freight from public load boards, broker emails, or CSV exports. Review before posting.
          </DialogDescription>
        </DialogHeader>

        {showReview ? (
          <ImportReviewTable
            loads={loads}
            source={activeSource}
            onDone={() => {
              reset();
              onOpenChange(false);
            }}
          />
        ) : (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="board">
                <Globe className="w-4 h-4 mr-2" />
                Load Board
              </TabsTrigger>
              <TabsTrigger value="csv">
                <Upload className="w-4 h-4 mr-2" />
                CSV
              </TabsTrigger>
              <TabsTrigger value="text">
                <FileText className="w-4 h-4 mr-2" />
                Paste Text
              </TabsTrigger>
            </TabsList>

            <TabsContent value="board" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Source</Label>
                <Select value={boardSource} onValueChange={(v) => setBoardSource(v as "trulos" | "ffs")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trulos">Trulos (free public listings)</SelectItem>
                    <SelectItem value="ffs">FreeFreightSearch (limited)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Origin</Label>
                  <Input
                    placeholder="Atlanta, GA"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Destination</Label>
                  <Input
                    placeholder="Dallas, TX"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={handleBoardSearch} disabled={isSearching} className="w-full">
                {isSearching ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Search className="w-4 h-4 mr-2" />
                )}
                Search Loads
              </Button>
              <p className="text-xs text-muted-foreground">
                Public scraping is best-effort and selectors can break. If no results, try the Paste
                Text tab with a copy-paste of the listings.
              </p>

              {!isSearching && lastReason === "source_unavailable" && (
                <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        No public listings matched{" "}
                        {origin || "anywhere"} → {destination || "anywhere"}.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Free load boards rarely expose live data without an account. Paste a broker
                        email or upload a CSV export — those paths use AI and work reliably.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="default" onClick={switchToPasteText}>
                      <FileText className="w-4 h-4 mr-2" />
                      Try Paste Text instead
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setLastReason(null);
                        setActiveTab("csv");
                      }}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload CSV
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="csv" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Upload CSV / TSV / TXT export</Label>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.tsv,.txt"
                  onChange={handleCsvUpload}
                  disabled={isSearching}
                />
                <p className="text-xs text-muted-foreground">
                  AI will parse the columns automatically. Works with most load board exports.
                </p>
              </div>
              {isSearching && (
                <div className="flex items-center justify-center py-6 text-muted-foreground">
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Parsing CSV…
                </div>
              )}
            </TabsContent>

            <TabsContent value="text" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Paste broker email, listings, or any load text</Label>
                <Textarea
                  rows={10}
                  placeholder="Paste loads here. Example:&#10;ATL, GA → DAL, TX | Dry Van | 42,000 lbs | $2,400 | Pickup 4/24"
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                />
              </div>
              <Button onClick={handleTextParse} disabled={isSearching} className="w-full">
                {isSearching ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4 mr-2" />
                )}
                Extract Loads
              </Button>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ImportLoadsDialog;
