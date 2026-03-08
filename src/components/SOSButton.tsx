import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function SOSButton({ onTrigger }: { onTrigger: (reason: string) => void }) {
  const [stage, setStage] = useState<'initial' | 'confirm' | 'triggered'>('initial');
  const [countdown, setCountdown] = useState(3);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleInitialPress = () => {
    if (stage !== 'initial') return;
    setStage('confirm');
    setCountdown(3);
  };

  useEffect(() => {
    if (stage === 'confirm') {
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setStage('initial');
            return 3;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stage]);

  const handleConfirm = () => {
    if (stage !== 'confirm') return;
    if (timerRef.current) clearInterval(timerRef.current);
    
    setStage('triggered');
    onTrigger('Manual Button Press');
    
    setTimeout(() => {
      setStage('initial');
    }, 5000);
  };

  const handleCancel = () => {
    if (stage !== 'confirm') return;
    if (timerRef.current) clearInterval(timerRef.current);
    setStage('initial');
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-3xl shadow-lg border-2 border-red-100 relative overflow-hidden">
      <div className="absolute inset-0 bg-red-50 opacity-50 pointer-events-none"></div>
      
      <h2 className="text-2xl font-bold text-red-600 mb-2 z-10">EMERGENCY</h2>
      <p className="text-gray-500 text-sm mb-8 z-10 text-center max-w-[200px]">
        {stage === 'initial' ? 'Tap to initiate an SOS alert.' : 
         stage === 'confirm' ? `Confirm within ${countdown}s to send alert.` :
         'Emergency alert sent.'}
      </p>

      {stage === 'initial' && (
        <button
          onClick={handleInitialPress}
          className="relative w-48 h-48 rounded-full flex items-center justify-center text-white font-bold text-3xl shadow-2xl transition-all duration-300 z-10 bg-red-600 hover:bg-red-500 hover:scale-105 active:scale-95"
          style={{ boxShadow: '0 20px 40px rgba(220, 38, 38, 0.4)' }}
        >
          <div className="flex flex-col items-center gap-2">
            <AlertTriangle className="w-12 h-12" />
            <span>SOS</span>
          </div>
        </button>
      )}

      {stage === 'confirm' && (
        <div className="flex flex-col items-center gap-4 z-10">
          <button
            onClick={handleConfirm}
            className="relative w-48 h-48 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-2xl transition-all duration-300 bg-orange-500 hover:bg-orange-400 hover:scale-105 active:scale-95 animate-pulse"
            style={{ boxShadow: '0 20px 40px rgba(249, 115, 22, 0.4)' }}
          >
            <div className="flex flex-col items-center gap-2">
              <CheckCircle className="w-10 h-10" />
              <span className="text-center leading-tight">CONFIRM<br/>SOS ({countdown}s)</span>
            </div>
          </button>
          <button 
            onClick={handleCancel}
            className="flex items-center gap-2 px-6 py-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors font-medium"
          >
            <XCircle className="w-4 h-4" /> Cancel
          </button>
        </div>
      )}

      {stage === 'triggered' && (
        <div
          className="relative w-48 h-48 rounded-full flex items-center justify-center text-white font-bold text-3xl shadow-2xl transition-all duration-300 z-10 bg-red-700 scale-95"
          style={{ boxShadow: '0 0 40px rgba(220, 38, 38, 0.8)' }}
        >
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-10 h-10 animate-spin" />
            <span className="text-lg">ALERT SENT</span>
          </div>
          <div className="absolute inset-0 rounded-full border-4 border-red-500 animate-ping opacity-75"></div>
        </div>
      )}
      
      <div className="mt-8 text-xs text-gray-400 z-10 flex items-center gap-1">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        GPS Active
      </div>
    </div>
  );
}
