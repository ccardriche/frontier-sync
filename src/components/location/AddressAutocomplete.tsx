import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Search, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface NominatimResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    road?: string;
    city?: string;
    state?: string;
    country?: string;
  };
}

export interface AddressResult {
  label: string;
  lat: number;
  lng: number;
  verified: boolean;
}

interface AddressAutocompleteProps {
  value: AddressResult | null;
  onChange: (result: AddressResult | null) => void;
  onPinFallback: () => void;
  placeholder?: string;
  className?: string;
}

const AddressAutocomplete = ({
  value,
  onChange,
  onPinFallback,
  placeholder = "Enter address...",
  className,
}: AddressAutocompleteProps) => {
  const [query, setQuery] = useState(value?.label || "");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (value?.label) {
      setQuery(value.label);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchAddresses = async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&limit=5&addressdetails=1`,
        {
          headers: {
            "Accept-Language": "en",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch addresses");
      }

      const data: NominatimResult[] = await response.json();
      setResults(data);
      setIsOpen(data.length > 0);
    } catch (err) {
      console.error("Address search error:", err);
      setError("Failed to search addresses. Try dropping a pin instead.");
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);

    // Clear previous value when typing
    if (value) {
      onChange(null);
    }

    // Debounce the search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchAddresses(newQuery);
    }, 300);
  };

  const handleSelectResult = (result: NominatimResult) => {
    const addressResult: AddressResult = {
      label: result.display_name,
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      verified: true,
    };

    setQuery(result.display_name);
    onChange(addressResult);
    setIsOpen(false);
    setResults([]);
  };

  const handleClear = () => {
    setQuery("");
    onChange(null);
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={handleInputChange}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className={cn(
            "pl-10 pr-20",
            value?.verified && "border-green-500 focus-visible:ring-green-500"
          )}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
          {query && !isLoading && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleClear}
            >
              <X className="w-3 h-3" />
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => query.length >= 3 && searchAddresses(query)}
          >
            <Search className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Dropdown Results */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-60 overflow-auto">
          {results.map((result) => (
            <button
              key={result.place_id}
              type="button"
              className="w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors flex items-start gap-2"
              onClick={() => handleSelectResult(result)}
            >
              <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
              <span className="line-clamp-2">{result.display_name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <p className="text-xs text-destructive mt-1">{error}</p>
      )}

      {/* Pin Fallback Button */}
      {(error || (query.length >= 3 && results.length === 0 && !isLoading)) && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2 w-full"
          onClick={onPinFallback}
        >
          <MapPin className="w-4 h-4 mr-2" />
          Drop a Pin Instead
        </Button>
      )}

      {/* Verified Badge */}
      {value?.verified && (
        <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          Verified address
        </p>
      )}
    </div>
  );
};

export default AddressAutocomplete;
