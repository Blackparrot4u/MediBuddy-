import React, { useState, useEffect } from 'react';
import { Building2, Bed, Activity, Users, Phone, MapPin } from 'lucide-react';

export default function HospitalDashboard({ hospitals }: { hospitals: any[] }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col gap-4 max-h-[600px] overflow-y-auto">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4 sticky top-0 bg-white z-10">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-indigo-500" />
          Live Hospital Capacity
        </h2>
        <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded-full animate-pulse flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div> Live
        </span>
      </div>
      
      <div className="flex flex-col gap-3">
        {hospitals.map((hospital) => (
          <div key={hospital.id} className="p-4 rounded-xl border border-gray-100 hover:border-indigo-200 transition-colors bg-gray-50 flex flex-col gap-3">
            <div>
              <div className="font-semibold text-gray-800">{hospital.name}</div>
              <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {hospital.address}
              </div>
              <div className="text-xs text-indigo-600 mt-1 flex items-center gap-1 font-medium">
                <Phone className="w-3 h-3" /> {hospital.phone}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-1">
              <div className="flex flex-col items-center justify-center p-2 bg-white rounded-lg border border-gray-100 shadow-sm">
                <Bed className="w-4 h-4 text-blue-500 mb-1" />
                <span className="text-xs text-gray-500">Beds</span>
                <span className="font-bold text-gray-800">{hospital.bedsAvailable}</span>
              </div>
              <div className="flex flex-col items-center justify-center p-2 bg-white rounded-lg border border-gray-100 shadow-sm">
                <Activity className="w-4 h-4 text-red-500 mb-1" />
                <span className="text-xs text-gray-500">ICU</span>
                <span className="font-bold text-gray-800">{hospital.icuAvailable}</span>
              </div>
              <div className="flex flex-col items-center justify-center p-2 bg-white rounded-lg border border-gray-100 shadow-sm">
                <Users className="w-4 h-4 text-green-500 mb-1" />
                <span className="text-xs text-gray-500">Doctors</span>
                <span className="font-bold text-gray-800">{hospital.doctorsAvailable}</span>
              </div>
            </div>
          </div>
        ))}
        {hospitals.length === 0 && (
          <div className="text-center text-gray-500 text-sm py-4">Loading hospital data...</div>
        )}
      </div>
    </div>
  );
}
