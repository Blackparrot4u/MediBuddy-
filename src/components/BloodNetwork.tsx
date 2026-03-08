import React, { useState, useEffect } from 'react';
import { Droplet, Phone, MapPin } from 'lucide-react';

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

export default function BloodNetwork({ donors, userLocation }: { donors: any[], userLocation: [number, number] | null }) {
  
  // Sort blood banks by distance if userLocation is available
  const sortedBloodBanks = [...donors].sort((a, b) => {
    if (!userLocation) return 0;
    const distA = getDistance(userLocation[0], userLocation[1], a.location.lat, a.location.lng);
    const distB = getDistance(userLocation[0], userLocation[1], b.location.lat, b.location.lng);
    return distA - distB;
  });

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col gap-4 max-h-[600px] overflow-y-auto">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4 sticky top-0 bg-white z-10">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Droplet className="w-5 h-5 text-red-500" fill="currentColor" />
          Crowd Blood Network
        </h2>
        <span className="text-xs font-medium bg-red-100 text-red-800 px-2 py-1 rounded-full">
          {donors.length} Blood Banks
        </span>
      </div>
      
      <div className="flex flex-col gap-3">
        {sortedBloodBanks.map((bank) => {
          const distance = userLocation ? getDistance(userLocation[0], userLocation[1], bank.location.lat, bank.location.lng).toFixed(1) : '?';
          
          return (
            <div key={bank.id} className="p-4 rounded-xl border border-gray-100 hover:border-red-200 transition-colors bg-gray-50 flex items-center justify-between">
              <div className="flex flex-col gap-1 w-full">
                <div className="flex justify-between items-start">
                  <span className="font-semibold text-gray-800">{bank.name}</span>
                  <a href={`tel:${bank.contact}`} className="p-2 bg-white rounded-full border border-gray-200 hover:bg-gray-50 text-indigo-600 shadow-sm transition-all flex-shrink-0 ml-2" title={`Call ${bank.contact}`}>
                    <Phone className="w-4 h-4" />
                  </a>
                </div>
                
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {bank.address} • {distance} km away
                </span>
                
                <div className="mt-2 flex flex-wrap gap-1">
                  {bank.availableGroups.map((group: string) => (
                    <span key={group} className="text-xs font-bold bg-red-100 text-red-700 px-2 py-1 rounded-md border border-red-200">
                      {group}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
        {donors.length === 0 && (
          <div className="text-center text-gray-500 text-sm py-4">Finding nearby blood banks...</div>
        )}
      </div>
    </div>
  );
}
