import React, { useState, useEffect } from "react";
import { Activity, Wifi, WifiOff, AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { api } from "../utils/api";
import "./ServerStatusBanner.css";

export default function ServerStatusBanner() {
  const [status, setStatus] = useState("checking"); // checking, warning, ready, error, hidden
  const [errorMsg, setErrorMsg] = useState("");

  const checkConnection = async () => {
    setStatus("checking");
    setErrorMsg("");

    // Start a timer to show the "warning/waking up" state if it takes > 1.5s
    const warningTimer = setTimeout(() => {
      setStatus("warning");
    }, 1500);

    try {
      await api.checkServerHealth();
      clearTimeout(warningTimer);
      
      // If it took longer than 1.5s (status became warning), show a "ready" state for a moment
      setStatus((currentStatus) => {
        if (currentStatus === "warning") {
          // Keep the banner visible for a short time to confirm it woke up
          setTimeout(() => {
            setStatus("hidden");
          }, 3000);
          return "ready";
        }
        return "hidden"; // Hide immediately if it was quick
      });
    } catch (err) {
      clearTimeout(warningTimer);
      setStatus("error");
      setErrorMsg("Could not connect to the inventory server. It might be offline or starting up.");
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  if (status === "hidden") return null;

  return (
    <div className={`server-status-banner status-${status}`}>
      <div className="banner-content">
        {status === "checking" && (
          <>
            <Activity className="banner-icon animate-pulse text-accent" size={18} />
            <span>Connecting to inventory database...</span>
          </>
        )}

        {status === "warning" && (
          <>
            <AlertTriangle className="banner-icon animate-bounce text-warning" size={18} />
            <div className="banner-text-wrapper">
              <span className="banner-title">Server is waking up</span>
              <span className="banner-description">
                The database is hosted on a free tier and is booting up. This can take up to 60 seconds. Thank you for your patience!
              </span>
            </div>
            <div className="banner-spinner"></div>
          </>
        )}

        {status === "ready" && (
          <>
            <CheckCircle2 className="banner-icon text-success" size={18} />
            <span>Success! Server is connected and ready.</span>
          </>
        )}

        {status === "error" && (
          <>
            <WifiOff className="banner-icon text-danger" size={18} />
            <div className="banner-text-wrapper">
              <span className="banner-title">Connection Failed</span>
              <span className="banner-description">{errorMsg}</span>
            </div>
            <button className="retry-btn" onClick={checkConnection}>
              <RefreshCw size={14} /> Retry
            </button>
          </>
        )}
      </div>
    </div>
  );
}
