import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface MapPickerProps {
  initialLocation?: { lat: number; lng: number };
  onLocationSelect: (location: { lat: number; lng: number }) => void;
  height?: string;
}

const MapPicker = ({ initialLocation, onLocationSelect, height = "300px" }: MapPickerProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation || { lat: 24.9340, lng: 67.1113 });

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    mapInstance.current = L.map(mapRef.current, {
      center: [selectedLocation.lat, selectedLocation.lng],
      zoom: 15,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(mapInstance.current);

    // Create custom draggable marker
    const customIcon = L.divIcon({
      html: `
        <div style="
          background: linear-gradient(135deg, #10b981, #059669);
          width: 30px;
          height: 30px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          position: relative;
        ">
          <div style="
            width: 10px;
            height: 10px;
            background: white;
            border-radius: 50%;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
          "></div>
        </div>
      `,
      className: 'custom-marker',
      iconSize: [30, 30],
      iconAnchor: [15, 30],
      popupAnchor: [0, -30],
    });

    markerRef.current = L.marker([selectedLocation.lat, selectedLocation.lng], {
      icon: customIcon,
      draggable: true,
    }).addTo(mapInstance.current);

    markerRef.current.on('dragend', (e: any) => {
      const marker = e.target;
      const position = marker.getLatLng();
      const newLocation = { lat: position.lat, lng: position.lng };
      setSelectedLocation(newLocation);
      onLocationSelect(newLocation);
    });

    return () => {
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, []);

  useEffect(() => {
    if (mapInstance.current && markerRef.current) {
      markerRef.current.setLatLng([selectedLocation.lat, selectedLocation.lng]);
      mapInstance.current.setView([selectedLocation.lat, selectedLocation.lng], 15);
    }
  }, [selectedLocation]);

  const handleMapClick = (e: any) => {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;
    const newLocation = { lat, lng };
    setSelectedLocation(newLocation);
    onLocationSelect(newLocation);
    
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    }
  };

  useEffect(() => {
    if (mapInstance.current) {
      mapInstance.current.on('click', handleMapClick);
      return () => {
        mapInstance.current?.off('click', handleMapClick);
      };
    }
  }, [onLocationSelect]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">Select Exact Location</p>
        <p className="text-xs text-muted-foreground">
          Drag pin or click on map
        </p>
      </div>
      <div
        ref={mapRef}
        style={{ height, width: "100%" }}
        className="rounded-xl overflow-hidden border-2 border-border"
      />
      <div className="text-xs text-muted-foreground text-center">
        Selected: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
      </div>
    </div>
  );
};

export default MapPicker;
