import React, { useState, useEffect } from "react";
import { Activity, Wifi, WifiOff, AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { api } from "../utils/api";
import "./ServerStatusBanner.css";

export default function ServerStatusBanner() {
  const [status, setStatus] = useState("checking");
  const [errorMsg, setErrorMsg] = useState("");

  const checkConnection = async () => {
    setStatus("checking");
    setErrorMsg("");

    const warningTimer = setTimeout(() => {
      setStatus("warning");
    }, 1500);

    try {
      await api.checkServerHealth();
      clearTimeout(warningTimer);

      setStatus((currentStatus) => {
        if (currentStatus === "warning") {
          setTimeout(() => {
            setStatus("hidden");
          }, 3000);
          return "ready";
        }
        return "hidden";
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
