import React from "react";
import { NavLink } from "react-router-dom";
import { Sparkles, Sun, Moon, LogOut, BarChart3, Box, ShoppingBag, UploadCloud, Users } from "lucide-react";
import "./Navbar.css";

export default function Navbar({ currentCustomer, onLogout, theme, onThemeToggle }) {
  const initials = currentCustomer?.name
    ? currentCustomer.name.substring(0, 2).toUpperCase()
    : "AD";

  return (
    <header className="navbar-container">
      <div className="navbar-brand">
        <Sparkles className="navbar-logo" />
        <div className="navbar-brand-meta">
          <span className="navbar-brand-txt">Analog</span>
          <span className="navbar-brand-sub">by Tushar Tayal</span>
        </div>
      </div>

      <nav className="navbar-links">
        <NavLink
          to="/overview"
          className={({ isActive }) => `navbar-tab-btn ${isActive ? "active" : ""}`}
        >
          {({ isActive }) => (
            <>
              <BarChart3 size={16} />
              <span>Overview</span>
              {isActive && <span className="active-dot-glow"></span>}
            </>
          )}
        </NavLink>

        <NavLink
          to="/products"
          className={({ isActive }) => `navbar-tab-btn ${isActive ? "active" : ""}`}
        >
          {({ isActive }) => (
            <>
              <Box size={16} />
              <span>Products Catalog</span>
              {isActive && <span className="active-dot-glow"></span>}
            </>
          )}
        </NavLink>

        <NavLink
          to="/orders"
          className={({ isActive }) => `navbar-tab-btn ${isActive ? "active" : ""}`}
        >
          {({ isActive }) => (
            <>
              <ShoppingBag size={16} />
              <span>Orders Tracker</span>
              {isActive && <span className="active-dot-glow"></span>}
            </>
          )}
        </NavLink>

        <NavLink
          to="/customers"
          className={({ isActive }) => `navbar-tab-btn ${isActive ? "active" : ""}`}
        >
          {({ isActive }) => (
            <>
              <Users size={16} />
              <span>Customers</span>
              {isActive && <span className="active-dot-glow"></span>}
            </>
          )}
        </NavLink>

        <NavLink
          to="/import"
          className={({ isActive }) => `navbar-tab-btn ${isActive ? "active" : ""}`}
        >
          {({ isActive }) => (
            <>
              <UploadCloud size={16} />
              <span>Bulk Import</span>
              {isActive && <span className="active-dot-glow"></span>}
            </>
          )}
        </NavLink>
      </nav>

      <div className="navbar-utilities">
        <button
          className="navbar-icon-btn navbar-theme-btn"
          onClick={onThemeToggle}
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="navbar-profile-chip" title={`${currentCustomer?.name} - Administrator`}>
          <div className="navbar-avatar">{initials}</div>
          <span className="navbar-username">{currentCustomer?.name}</span>
        </div>

        <button className="navbar-logout-btn" onClick={onLogout} title="Sign Out Session">
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </header>
  );
}
