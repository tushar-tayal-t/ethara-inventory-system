import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ShieldAlert, Sparkles, CheckCircle2, ArrowRight, LogIn } from "lucide-react";
import { api } from "../utils/api";
import "./Login.css";

export default function Login({ onToggle, onAuthSuccess }) {
  // Form Field States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // UI Interaction States
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successData, setSuccessData] = useState(null); // stores parsed token/customer details on success

  // Live Field Focus States for Premium Borders
  const [activeField, setActiveField] = useState(null);

  // Validate form entries client-side
  const validateForm = () => {
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setErrorMsg("Please enter a valid email address.");
      return false;
    }
    if (!password) {
      setErrorMsg("Please enter your password.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const payload = {
        email,
        password
      };
      
      const result = await api.loginCustomer(payload);
      
      if (result.success) {
        if (onAuthSuccess) {
          onAuthSuccess();
        } else {
          setSuccessData(result.data);
        }
      } else {
        setErrorMsg(result.message || "Invalid email or password.");
      }
    } catch (err) {
      setErrorMsg(err.message || "A network or server error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  // Reset page state to allow logging out / logging in again
  const handleReset = () => {
    setEmail("");
    setPassword("");
    setSuccessData(null);
    setErrorMsg("");
  };

  if (successData) {
    return (
      <div className="glass-card success-card">
        <div className="success-icon-container">
          <CheckCircle2 className="success-icon" size={64} />
          <div className="success-glow"></div>
        </div>
        
        <h2 className="success-title">Welcome Back!</h2>
        <p className="success-subtitle font-sans">You have successfully authenticated via HTTP Bearer token.</p>
        
        <div className="profile-preview">
          <div className="profile-item">
            <span className="profile-label">Name</span>
            <span className="profile-value">{successData.customer.name}</span>
          </div>
          <div className="profile-item">
            <span className="profile-label">Email</span>
            <span className="profile-value">{successData.customer.email}</span>
          </div>
          {successData.customer.phone && (
            <div className="profile-item">
              <span className="profile-label">Phone</span>
              <span className="profile-value">{successData.customer.phone}</span>
            </div>
          )}
        </div>

        <div className="token-info">
          <span className="token-label">🔒 Authenticated with JWT Bearer Token</span>
          <div className="token-box" title={successData.token}>
            {successData.token.substring(0, 36)}...
          </div>
        </div>

        <button className="primary-btn continue-btn" onClick={handleReset}>
          Sign Out <ArrowRight size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="login-container">
      {/* Brand Header */}
      <div className="brand-header">
        <div className="logo-glow">
          <Sparkles className="brand-logo" size={32} />
        </div>
        <h1 className="brand-name">Analog</h1>
        <p className="brand-slogan">Inventory & Fulfillment System by Tushar Tayal</p>
      </div>

      {/* Main Glassmorphic Card */}
      <div className="glass-card">
        <h2 className="form-title">Login</h2>
        <p className="form-subtitle">Enter your credentials to access the inventory system.</p>

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="error-banner">
            <ShieldAlert size={20} className="error-icon" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          {/* Email Address Input */}
          <div className={`input-group ${activeField === "email" ? "focused" : ""}`}>
            <label className="input-label">Email Address</label>
            <div className="input-wrapper">
              <Mail size={18} className="field-icon" />
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setActiveField("email")}
                onBlur={() => setActiveField(null)}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Secure Password Input */}
          <div className={`input-group ${activeField === "password" ? "focused" : ""}`}>
            <label className="input-label">Password</label>
            <div className="input-wrapper">
              <Lock size={18} className="field-icon" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setActiveField("password")}
                onBlur={() => setActiveField(null)}
                required
                disabled={isLoading}
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button type="submit" className="primary-btn submit-btn" disabled={isLoading}>
            {isLoading ? (
              <div className="spinner"></div>
            ) : (
              <>
                Sign In <LogIn size={18} />
              </>
            )}
          </button>
        </form>

        {/* Footer Toggle Link */}
        <div className="card-footer">
          Don't have an account?{" "}
          <Link to="/signup" className="link-text font-bold">
            Create one here
          </Link>
        </div>
      </div>
    </div>
  );
}
