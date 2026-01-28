import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom icons
const driverIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const pickupIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const dropoffIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface Location {
  lat: number;
  lng: number;
}

interface TrackingMapProps {
  driverLocation: Location | null;
  pickupLocation?: Location | null;
  dropoffLocation?: Location | null;
  pickupLabel?: string;
  dropoffLabel?: string;
  routeHistory?: Location[];
  className?: string;
}

// Component to recenter map when driver location changes
function MapRecenter({ location }: { location: Location | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (location) {
      map.setView([location.lat, location.lng], map.getZoom(), {
        animate: true,
      });
    }
  }, [location, map]);
  
  return null;
}

const TrackingMap = ({
  driverLocation,
  pickupLocation,
  dropoffLocation,
  pickupLabel = "Pickup",
  dropoffLabel = "Drop-off",
  routeHistory = [],
  className = "",
}: TrackingMapProps) => {
  // Calculate center and bounds
  const getCenter = (): [number, number] => {
    if (driverLocation) {
      return [driverLocation.lat, driverLocation.lng];
    }
    if (pickupLocation) {
      return [pickupLocation.lat, pickupLocation.lng];
    }
    if (dropoffLocation) {
      return [dropoffLocation.lat, dropoffLocation.lng];
    }
    // Default to a central location (US center)
    return [39.8283, -98.5795];
  };

  const routePositions: [number, number][] = routeHistory.map((loc) => [loc.lat, loc.lng]);

  return (
    <div className={`rounded-lg overflow-hidden border border-border ${className}`}>
      <MapContainer
        center={getCenter()}
        zoom={14}
        style={{ height: "100%", width: "100%", minHeight: "300px" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapRecenter location={driverLocation} />

        {/* Driver marker */}
        {driverLocation && (
          <Marker position={[driverLocation.lat, driverLocation.lng]} icon={driverIcon}>
            <Popup>
              <div className="font-semibold">Driver Location</div>
              <div className="text-sm text-muted-foreground">Live tracking</div>
            </Popup>
          </Marker>
        )}

        {/* Pickup marker */}
        {pickupLocation && (
          <Marker position={[pickupLocation.lat, pickupLocation.lng]} icon={pickupIcon}>
            <Popup>
              <div className="font-semibold">{pickupLabel}</div>
              <div className="text-sm text-muted-foreground">Pickup Location</div>
            </Popup>
          </Marker>
        )}

        {/* Dropoff marker */}
        {dropoffLocation && (
          <Marker position={[dropoffLocation.lat, dropoffLocation.lng]} icon={dropoffIcon}>
            <Popup>
              <div className="font-semibold">{dropoffLabel}</div>
              <div className="text-sm text-muted-foreground">Drop-off Location</div>
            </Popup>
          </Marker>
        )}

        {/* Route history polyline */}
        {routePositions.length > 1 && (
          <Polyline
            positions={routePositions}
            color="hsl(var(--primary))"
            weight={3}
            opacity={0.7}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default TrackingMap;
