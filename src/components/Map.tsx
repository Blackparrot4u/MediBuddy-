import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const ambulanceIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/883/883407.png',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

// Custom Red Plus Icon for all hospitals
const hospitalIcon = L.divIcon({
  className: 'custom-hospital-icon bg-transparent border-none',
  html: `<div class="bg-white rounded-full shadow-md border-2 border-red-500 flex items-center justify-center w-8 h-8">
          <div class="text-red-500 font-bold text-xl leading-none mb-0.5">+</div>
         </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

// Highlighted Red Plus Icon for nearest hospital
const nearestHospitalIcon = L.divIcon({
  className: 'custom-nearest-hospital-icon bg-transparent border-none',
  html: `<div class="bg-red-500 rounded-full shadow-[0_0_20px_rgba(239,68,68,0.8)] border-2 border-white flex items-center justify-center w-10 h-10 animate-bounce">
          <div class="text-white font-bold text-2xl leading-none mb-0.5">+</div>
         </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c; // Distance in km
}

const LocationMarker = ({ position, isSOSActive }: { position: [number, number] | null, isSOSActive: boolean }) => {
  const map = useMap();
  useEffect(() => {
    if (position && !isSOSActive) {
      map.flyTo(position, 14);
    }
  }, [position, map, isSOSActive]);

  return position === null ? null : (
    <Marker position={position}>
      <Popup>You are here</Popup>
    </Marker>
  );
};

export default function Map({ userLocation, hospitals, isSOSActive }: { userLocation: [number, number] | null, hospitals: any[], isSOSActive: boolean }) {
  const defaultCenter: [number, number] = [30.7046, 76.7179]; // Mohali
  
  const [targetHospital, setTargetHospital] = useState<any>(null);
  const [nearestHospital, setNearestHospital] = useState<any>(null);
  const [ambulancePos, setAmbulancePos] = useState<[number, number] | null>(null);
  const [eta, setEta] = useState<number | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (userLocation && hospitals.length > 0) {
      // Find nearest valid hospital
      const validHospitals = hospitals.filter(h => h.bedsAvailable > 0 && h.icuAvailable > 0 && h.doctorsAvailable > 0);
      if (validHospitals.length === 0) {
        setNearestHospital(null);
        return;
      }

      let nearest = validHospitals[0];
      let minDistance = getDistance(userLocation[0], userLocation[1], nearest.location.lat, nearest.location.lng);

      for (let i = 1; i < validHospitals.length; i++) {
        const d = getDistance(userLocation[0], userLocation[1], validHospitals[i].location.lat, validHospitals[i].location.lng);
        if (d < minDistance) {
          minDistance = d;
          nearest = validHospitals[i];
        }
      }

      setNearestHospital(nearest);
    }
  }, [userLocation, hospitals]);

  useEffect(() => {
    if (isSOSActive && userLocation && nearestHospital) {
      setTargetHospital(nearestHospital);
      
      const minDistance = getDistance(userLocation[0], userLocation[1], nearestHospital.location.lat, nearestHospital.location.lng);
      
      // Speed: 30 km/h = 0.5 km/min
      const timeMins = Math.ceil(minDistance * 2); 
      setEta(timeMins);

      // Animation
      const startPos: [number, number] = [nearestHospital.location.lat, nearestHospital.location.lng];
      const endPos = userLocation;
      setAmbulancePos(startPos);

      let progress = 0;
      const duration = 10000; // 10 seconds for demo animation
      const startTime = performance.now();

      const animate = (time: number) => {
        progress = (time - startTime) / duration;
        if (progress > 1) progress = 1;

        const currentLat = startPos[0] + (endPos[0] - startPos[0]) * progress;
        const currentLng = startPos[1] + (endPos[1] - startPos[1]) * progress;
        setAmbulancePos([currentLat, currentLng]);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        }
      };
      animationRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isSOSActive, userLocation, nearestHospital]);

  return (
    <div className="flex flex-col gap-2">
      {isSOSActive && targetHospital && eta !== null && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-xl text-sm flex items-center justify-between">
          <div>
            <span className="font-semibold">Ambulance Dispatched</span> from {targetHospital.name}
          </div>
          <div className="font-bold text-blue-600">
            ETA: {eta} min
          </div>
        </div>
      )}
      <div className="h-64 w-full rounded-xl overflow-hidden shadow-md border border-gray-200 relative z-0">
        <MapContainer center={defaultCenter} zoom={13} scrollWheelZoom={false} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={userLocation} isSOSActive={isSOSActive} />
          
          {hospitals.map(h => {
            const isNearest = nearestHospital && nearestHospital.id === h.id;
            return (
              <Marker 
                key={h.id} 
                position={[h.location.lat, h.location.lng]}
                icon={isNearest ? nearestHospitalIcon : hospitalIcon}
              >
                <Popup>
                  <div className="font-semibold">{h.name}</div>
                  <div className="text-xs text-gray-500 mb-2">{h.address}</div>
                  <div className="text-sm">Beds: {h.bedsAvailable}</div>
                  <div className="text-sm">ICU: {h.icuAvailable}</div>
                  <div className="text-sm">Doctors: {h.doctorsAvailable}</div>
                </Popup>
              </Marker>
            );
          })}

          {isSOSActive && targetHospital && userLocation && (
            <Polyline 
              positions={[[targetHospital.location.lat, targetHospital.location.lng], userLocation]} 
              color="#ef4444" 
              weight={5} 
              dashArray="10, 10" 
            />
          )}

          {isSOSActive && ambulancePos && (
            <Marker position={ambulancePos} icon={ambulanceIcon}>
              <Popup>Ambulance En Route</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </div>
  );
}
