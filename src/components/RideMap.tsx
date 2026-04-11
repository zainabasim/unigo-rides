import { useEffect, useRef } from "react";
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

const NED_COORDS: [number, number] = [24.9340, 67.1113];

interface RideMarker {
  id: string;
  lat: number;
  lng: number;
  label: string;
}

interface RideMapProps {
  markers?: RideMarker[];
  searchLocation?: { lat: number; lng: number } | null;
  height?: string;
}

const greenIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const RideMap = ({ markers = [], searchLocation, height = "200px" }: RideMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersLayer = useRef<L.LayerGroup>(L.layerGroup());

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    // Always show map by default
    mapInstance.current = L.map(mapRef.current, {
      center: searchLocation ? [searchLocation.lat, searchLocation.lng] : NED_COORDS,
      zoom: searchLocation ? 15 : 13,
      layers: [markersLayer.current]
    });

    markersLayer.current.clearLayers();

    // Always add default NED marker
    const nedMarker = L.marker(NED_COORDS, {
      icon: greenIcon,
      title: "NED University"
    });
    markersLayer.current.addLayer(L.layerGroup([nedMarker]));

    // Add search location marker if provided
    if (searchLocation) {
      const searchMarker = L.marker([searchLocation.lat, searchLocation.lng], {
        icon: L.divIcon({
          className: "text-primary",
          html: `<div style="background: white; border: 2px solid #10b981; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;"><div style="color: #10b981; font-weight: bold; font-size: 12px;">📍</div></div>`,
          iconSize: [30, 30]
        })
      });
      markersLayer.current.addLayer(L.layerGroup([searchMarker]));
    }

    // Add ride markers
    markers.forEach((marker) => {
      const rideMarker = L.marker([marker.lat, marker.lng], {
        icon: L.divIcon({
          className: "text-primary",
          html: `<div style="background: white; border: 2px solid #10b981; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;"><div style="color: #10b981; font-weight: bold; font-size: 12px;">📍</div></div>`,
          iconSize: [25, 41]
        })
      });
      markersLayer.current.addLayer(L.layerGroup([rideMarker]));
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(mapInstance.current);

    return () => {
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, [markers, searchLocation]);

  return (
    <div
      ref={mapRef}
      style={{ height, width: "100%" }}
      className="rounded-xl overflow-hidden border border-border"
    />
  );
};

export default RideMap;
