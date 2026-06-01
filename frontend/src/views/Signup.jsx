import React, { useState } from "react";
import { Link } from "react-router-dom";
import { User, Mail, Phone, Lock, Eye, EyeOff, ShieldAlert, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import { api } from "../utils/api";
import "./Signup.css";

export default function Signup({ onToggle, onAuthSuccess }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successData, setSuccessData] = useState(null);

  const [activeField, setActiveField] = useState(null);

  const validateForm = () => {
    if (!name.trim()) {
      setErrorMsg("Please enter your name.");
      return false;
    }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setErrorMsg("Please enter a valid email address.");
      return false;
    }
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
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
        name,
        email,
        phone: phone.trim() ? phone : undefined,
        password
      };

      const result = await api.registerCustomer(payload);

      if (result.success) {
        setSuccessData(result.data);
      } else {
        setErrorMsg(result.message || "Failed to register. Please try again.");
      }
    } catch (err) {
      setErrorMsg(err.message || "A network or server error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setName("");
    setEmail("");
    setPhone("");
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

        <h2 className="success-title">Welcome Aboard!</h2>
        <p className="success-subtitle">Your customer account has been registered successfully.</p>

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

        <button
          className="primary-btn continue-btn"
          onClick={onAuthSuccess ? onAuthSuccess : handleReset}
        >
          {onAuthSuccess ? "Go to Dashboard" : "Create Another Account"} <ArrowRight size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="signup-container">
      <div className="brand-header">
        <div className="logo-glow">
          <Sparkles className="brand-logo" size={32} />
        </div>
        <h1 className="brand-name">Analog</h1>
        <p className="brand-slogan">Inventory & Fulfillment System by Tushar Tayal</p>
      </div>

      <div className="glass-card">
        <h2 className="form-title">Create Account</h2>
        <p className="form-subtitle">Register to manage stock levels and create orders.</p>

        {errorMsg && (
          <div className="error-banner">
            <ShieldAlert size={20} className="error-icon" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="signup-form">

          <div className={`input-group ${activeField === "name" ? "focused" : ""}`}>
            <label className="input-label">Full Name</label>
            <div className="input-wrapper">
              <User size={18} className="field-icon" />
              <input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={() => setActiveField("name")}
                onBlur={() => setActiveField(null)}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className={`input-group ${activeField === "email" ? "focused" : ""}`}>
            <label className="input-label">Email Address</label>
            <div className="input-wrapper">
              <Mail size={18} className="field-icon" />
              <input
                type="email"
                placeholder="john.doe@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setActiveField("email")}
                onBlur={() => setActiveField(null)}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className={`input-group ${activeField === "phone" ? "focused" : ""}`}>
            <label className="input-label">Phone Number <span className="label-optional">(Optional)</span></label>
            <div className="input-wrapper">
              <Phone size={18} className="field-icon" />
              <input
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onFocus={() => setActiveField("phone")}
                onBlur={() => setActiveField(null)}
                disabled={isLoading}
              />
            </div>
          </div>

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

          <button type="submit" className="primary-btn submit-btn" disabled={isLoading}>
            {isLoading ? (
              <div className="spinner"></div>
            ) : (
              <>
                Register Account <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="card-footer">
          Already registered?{" "}
          <Link to="/login" className="link-text font-bold">
            Login here
          </Link>
        </div>
      </div>
    </div>
  );
}
