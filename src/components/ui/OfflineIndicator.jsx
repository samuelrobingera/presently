import React from 'react';
import { WifiOff, Wifi } from 'lucide-react';

const OfflineIndicator = ({ isOnline }) => {
  if (isOnline) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-lg shadow-lg animate-pulse">
      <WifiOff className="w-5 h-5" />
      <span className="text-sm font-semibold">Offline Mode</span>
    </div>
  );
};

export const ReconnectedToast = ({ show, onHide }) => {
  React.useEffect(() => {
    if (show) {
      const timer = setTimeout(onHide, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onHide]);

  if (!show) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in">
      <Wifi className="w-5 h-5" />
      <span className="text-sm font-semibold">Back online - syncing...</span>
    </div>
  );
};

export default OfflineIndicator;
