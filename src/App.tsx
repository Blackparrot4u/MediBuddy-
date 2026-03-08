import React, { useState, useEffect } from 'react';
import { HandHeart, WifiOff, MapPin, BellRing } from 'lucide-react';
import SOSButton from './components/SOSButton';
import HospitalDashboard from './components/HospitalDashboard';
import BloodNetwork from './components/BloodNetwork';
import AIAssistant from './components/AIAssistant';
import Map from './components/Map';
import FamilyContacts from './components/FamilyContacts';

export default function App() {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [donors, setDonors] = useState<any[]>([]);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [isSOSActive, setIsSOSActive] = useState(false);
  
  // Hardcoded user ID for demo purposes
  const DEMO_USER_ID = 'demo-user-123';

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Get initial location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.error("Error getting location:", error);
          // Fallback to Mohali
          setUserLocation([30.7046, 76.7179]);
        }
      );
    }

    // Fetch initial data
    fetchData();

    // Poll for live updates
    const interval = setInterval(() => {
      fetchData();
    }, 3000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const fetchData = async () => {
    try {
      const hRes = await fetch('/api/hospitalStatus');
      const hData = await hRes.json();
      setHospitals(hData);

      const dRes = await fetch('/api/donors');
      const dData = await dRes.json();
      setDonors(dData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const triggerSOS = async (reason: string) => {
    setIsSOSActive(true);
    const newAlert = `SOS Triggered: ${reason} at ${new Date().toLocaleTimeString()}`;
    setAlerts(prev => [newAlert, ...prev].slice(0, 5));

    if (isOffline) {
      // Offline SMS Mode
      try {
        const res = await fetch('/api/offline-sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: userLocation,
            message: `SOS Alert: Location ${userLocation?.join(',')}, Emergency: ${reason}`
          })
        });
        if (!res.ok) throw new Error('Network response was not ok');
        const data = await res.json();
        setAlerts(prev => [`Offline SMS Sent: ${data.message}`, ...prev].slice(0, 5));
      } catch (e) {
        console.error("Offline SMS failed", e);
        setAlerts(prev => [`Offline SMS failed. Please try calling emergency services directly.`, ...prev].slice(0, 5));
      }
    } else {
      // Online API Call
      try {
        const res = await fetch('/api/sos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ location: userLocation, type: reason })
        });
        if (!res.ok) throw new Error('Network response was not ok');
        const data = await res.json();
        setAlerts(prev => [`Server Response: ${data.message}`, ...prev].slice(0, 5));
        
        // Trigger Family Alert
        try {
          const familyRes = await fetch('/api/sos/family-alert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: DEMO_USER_ID, location: userLocation })
          });
          const familyData = await familyRes.json();
          if (familyData.success) {
            setAlerts(prev => [`Family Alert: ${familyData.message}`, ...prev].slice(0, 5));
          }
        } catch (err) {
          console.error("Family alert failed", err);
        }

        // Refresh data to show updated capacities/donors if any
        fetchData();
      } catch (e) {
        console.error("SOS API failed", e);
        setAlerts(prev => [`SOS API failed. Please try calling emergency services directly.`, ...prev].slice(0, 5));
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20 md:pb-0">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <HandHeart className="w-6 h-6 text-red-600" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-indigo-600">
              MediBuddy
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {isOffline && (
              <div className="flex items-center gap-1 text-xs font-medium bg-orange-100 text-orange-800 px-3 py-1.5 rounded-full">
                <WifiOff className="w-4 h-4" /> Offline SMS Mode
              </div>
            )}
            <div className="hidden sm:flex items-center gap-1 text-xs font-medium bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full">
              <MapPin className="w-4 h-4" /> {userLocation ? `${userLocation[0].toFixed(2)}, ${userLocation[1].toFixed(2)}` : 'Locating...'}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: SOS & AI */}
          <div className="lg:col-span-5 flex flex-col gap-8">
            <SOSButton onTrigger={triggerSOS} />
            <AIAssistant onTriggerSOS={triggerSOS} userLocation={userLocation} />
            
            {/* Alert History */}
            {alerts.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <BellRing className="w-4 h-4 text-orange-500" /> Recent Activity
                </h3>
                <div className="flex flex-col gap-2">
                  {alerts.map((alert, i) => (
                    <div key={i} className="text-xs bg-gray-50 p-2 rounded border border-gray-100 text-gray-600">
                      {alert}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <FamilyContacts userId={DEMO_USER_ID} />
          </div>

          {/* Right Column: Map, Hospitals, Donors */}
          <div className="lg:col-span-7 flex flex-col gap-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-indigo-500" />
                Live Emergency Map
              </h2>
              <Map userLocation={userLocation} hospitals={hospitals} isSOSActive={isSOSActive} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <HospitalDashboard hospitals={hospitals} />
              <BloodNetwork donors={donors} userLocation={userLocation} />
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
