import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./views/Login";
import Signup from "./views/Signup";
import Navbar from "./views/Navbar";
import DashboardOverview from "./views/DashboardOverview";
import ProductsCatalog from "./views/ProductsCatalog";
import OrdersTracker from "./views/OrdersTracker";
import BulkImportPortal from "./views/BulkImportPortal";
import ServerStatusBanner from "./views/ServerStatusBanner";
import { api, clearAuthData } from "./utils/api";

export default function App() {
  const [currentCustomer, setCurrentCustomer] = useState(api.getCurrentUser());

  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");

  useEffect(() => {
    if (currentCustomer) {
      document.documentElement.classList.toggle("light-theme", theme === "light");
    } else {
      document.documentElement.classList.remove("light-theme");
    }
    localStorage.setItem("theme", theme);
  }, [theme, currentCustomer]);

  const handleThemeToggle = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const handleAuthSuccess = () => {
    setCurrentCustomer(api.getCurrentUser());
  };

  const handleLogout = () => {
    clearAuthData();
    setCurrentCustomer(null);
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            currentCustomer ? (
              <Navigate to="/overview" replace />
            ) : (
              <div className="centered-auth-layout">
                <ServerStatusBanner />
                <Login onAuthSuccess={handleAuthSuccess} />
              </div>
            )
          }
        />
        <Route
          path="/signup"
          element={
            currentCustomer ? (
              <Navigate to="/overview" replace />
            ) : (
              <div className="centered-auth-layout">
                <ServerStatusBanner />
                <Signup onAuthSuccess={handleAuthSuccess} />
              </div>
            )
          }
        />

        <Route
          path="/*"
          element={
            currentCustomer ? (
              <div className="app-workspace">
                <Navbar
                  currentCustomer={currentCustomer}
                  onLogout={handleLogout}
                  theme={theme}
                  onThemeToggle={handleThemeToggle}
                />
                <main className="workspace-content animate-fade-in">
                  <Routes>
                    <Route path="/overview" element={<DashboardOverview />} />
                    <Route path="/products" element={<ProductsCatalog />} />
                    <Route path="/orders" element={<OrdersTracker />} />
                    <Route path="/import" element={<BulkImportPortal />} />
                    <Route path="*" element={<Navigate to="/overview" replace />} />
                  </Routes>
                </main>
              </div>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
}
