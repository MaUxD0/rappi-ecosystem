import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { useState } from "react";
import L from "leaflet";

// Fix para el ícono de leaflet en Vite
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface Props {
  onSelectLocation: (lat: number, lng: number) => void;
}

function ClickHandler({ onSelectLocation }: Props) {
  useMapEvents({
    click(e) {
      onSelectLocation(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function DestinationMap({ onSelectLocation }: Props) {
  const [marker, setMarker] = useState<{ lat: number; lng: number } | null>(null);

  function handleClick(lat: number, lng: number) {
    setMarker({ lat, lng });
    onSelectLocation(lat, lng);
  }

  return (
    <div className="rounded-xl overflow-hidden border-2 border-gray-200">
      <MapContainer
        center={[3.451, -76.532]}
        zoom={15}
        style={{ height: "300px", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        <ClickHandler onSelectLocation={handleClick} />
        {marker && <Marker position={[marker.lat, marker.lng]} />}
      </MapContainer>
      {marker ? (
        <p className="text-xs text-green-600 font-bold p-2 text-center bg-green-50">
          ✓ Destino seleccionado: {marker.lat.toFixed(5)}, {marker.lng.toFixed(5)}
        </p>
      ) : (
        <p className="text-xs text-gray-400 p-2 text-center">
          Haz click en el mapa para seleccionar el punto de entrega
        </p>
      )}
    </div>
  );
}