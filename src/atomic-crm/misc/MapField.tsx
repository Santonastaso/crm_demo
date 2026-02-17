import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon (leaflet's default icon paths break with bundlers)
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const FitBounds = ({ bounds }: { bounds: L.LatLngBoundsExpression | null }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
    }
  }, [map, bounds]);
  return null;
};

export type MapMarker = {
  lat: number;
  lng: number;
  label: string;
  popup?: string;
};

type MapFieldProps = {
  center: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  radiusMeters?: number;
  height?: string;
  className?: string;
};

export const MapField = ({
  center,
  zoom = 13,
  markers = [],
  radiusMeters,
  height = "300px",
  className = "",
}: MapFieldProps) => {
  const allPoints: [number, number][] = [
    center,
    ...markers.map((m) => [m.lat, m.lng] as [number, number]),
  ];
  const bounds =
    allPoints.length > 1 ? L.latLngBounds(allPoints.map(([lat, lng]) => [lat, lng])) : null;

  return (
    <div className={`rounded-lg overflow-hidden border ${className}`} style={{ height }}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={center}>
          <Popup>Project Location</Popup>
        </Marker>
        {radiusMeters && (
          <Circle
            center={center}
            radius={radiusMeters}
            pathOptions={{
              color: "#3b82f6",
              fillColor: "#3b82f6",
              fillOpacity: 0.1,
              weight: 2,
            }}
          />
        )}
        {markers.map((marker, i) => (
          <Marker key={i} position={[marker.lat, marker.lng]}>
            {marker.popup && <Popup>{marker.popup}</Popup>}
          </Marker>
        ))}
        {bounds && <FitBounds bounds={bounds} />}
      </MapContainer>
    </div>
  );
};
