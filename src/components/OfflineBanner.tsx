import React, { useState, useEffect } from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import { ConnectionStatus } from "@capacitor/network";

interface OfflineBannerProps {
  networkStatus?: ConnectionStatus | null;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ networkStatus }) => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (networkStatus !== undefined && networkStatus !== null) {
      setIsOffline(!networkStatus.connected);
      return;
    }

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    if (typeof window !== "undefined") {
      setIsOffline(!navigator.onLine);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      }
    };
  }, [networkStatus]);

  if (!isOffline) return null;

  return (
    <div className="bg-amber-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-between shadow-md sticky top-0 z-50 animate-in slide-in-from-top duration-300">
      <div className="flex items-center gap-2">
        <WifiOff className="h-4 w-4 animate-pulse shrink-0" />
        <span>You are currently offline. Some features may be unavailable.</span>
      </div>
      <button
        onClick={() => window.location.reload()}
        className="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider transition-colors shrink-0"
      >
        <RefreshCw className="h-3 w-3" /> Retry
      </button>
    </div>
  );
};

export default OfflineBanner;
