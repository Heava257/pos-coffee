import React, { useState, useEffect } from "react";
import { message } from "antd";
import { request } from "@/shared/utils/helper";
import { useNavigate, Link } from "react-router-dom";
import { useLanguage, translations } from "@/app/store/language.store";
import "./AuthPremium.css";

/* ══════════════════════════════════════════
   PREMIUM COFFEE CUP SVG (GREEN/GOLD ACCENTS)
   ══════════════════════════════════════════ */
const CoffeeIllustration = () => (
  <svg viewBox="0 0 280 320" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", maxWidth: 220 }}>
    {/* Steam paths */}
    <path d="M95 60 Q90 45 95 30 Q100 15 95 5" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.6"/>
    <path d="M115 65 Q108 48 113 32 Q118 16 113 4" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.8"/>
    <path d="M135 60 Q130 44 135 28 Q140 14 135 3" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.6"/>
    {/* Heart dialog bubble */}
    <rect x="148" y="48" width="52" height="36" rx="12" stroke="var(--green)" strokeWidth="2" fill="var(--green-dim)"/>
    <path d="M158 72 L152 82 L165 72" fill="var(--green)"/>
    <path d="M168 60 C168 57 165 55 162 57 C159 55 156 57 156 60 C156 63 162 68 162 68 C162 68 168 63 168 60Z" fill="var(--green)"/>
    {/* Main Cup Body */}
    <path d="M68 105 L78 215 Q80 225 90 225 L178 225 Q188 225 190 215 L200 105 Z" fill="#111827" stroke="var(--border)" strokeWidth="1"/>
    <rect x="62" y="93" width="144" height="18" rx="9" fill="var(--green)"/>
    <rect x="80" y="93" width="18" height="18" rx="2" fill="rgba(255,255,255,0.1)"/>
    {/* Coffee emblem */}
    <ellipse cx="134" cy="165" rx="22" ry="28" fill="var(--green-dim)"/>
    <ellipse cx="134" cy="165" rx="12" ry="16" fill="none" stroke="var(--green)" strokeWidth="2"/>
    {/* Cup Handle */}
    <path d="M200 120 Q228 120 228 148 Q228 176 200 176" stroke="#111827" strokeWidth="9" strokeLinecap="round" fill="none"/>
    <path d="M200 120 Q228 120 228 148 Q228 176 200 176" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
  </svg>
);

const EmailInput = ({ value, onChange, onBlur, className, placeholder, required }) => {
  const showPreview = value && !value.includes("@");

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <input
        type="email"
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        className={className}
        placeholder={placeholder}
        required={required}
        style={{ paddingRight: showPreview ? "95px" : "16px" }}
      />
      {showPreview && (
        <span
          style={{
            position: "absolute",
            right: "14px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "rgba(255, 255, 255, 0.25)",
            pointerEvents: "none",
            fontSize: "13px",
            userSelect: "none",
            fontWeight: "500",
            fontFamily: "inherit"
          }}
        >
          @gmail.com
        </span>
      )}
    </div>
  );
};

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { lang, setLang } = useLanguage();
  const t = translations[lang] || translations.en;
  const navigate = useNavigate();

  // Force dark theme as default
  useEffect(() => {
    document.documentElement.classList.add("dark");
    localStorage.setItem("landing_theme", "dark");
  }, []);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email) return;
    let resetEmail = email.trim();
    if (!resetEmail.includes("@")) {
      resetEmail = `${resetEmail}@gmail.com`;
      setEmail(resetEmail);
    }
    setLoading(true);
    try {
      const res = await request("auth/forgot-password", "post", { email: resetEmail });
      if (res?.success) {
        message.success(res.message || "OTP code sent!");
        setStep(2);
      } else {
        message.error(res?.message || "Error occurred.");
      }
    } catch (err) {
      message.error(err.message || "Cannot connect to server.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 6) return;
    setLoading(true);
    try {
      const res = await request("auth/verify-otp", "post", { email, otp });
      if (res?.success) {
        message.success(t.otp_verified || "OTP Verified!");
        setStep(3);
      } else {
        message.error(t.otp_invalid || "Invalid OTP code.");
      }
    } catch (err) {
      message.error(err.message || "Cannot connect to server.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      message.error(t.password_not_match || "Passwords do not match!");
      return;
    }
    setLoading(true);
    try {
      const res = await request("auth/reset-password", "post", { 
        email, 
        otp, 
        new_password: password 
      });
      if (res?.success) {
        message.success(t.password_reset_success || "Password reset successful!");
        setTimeout(() => navigate("/login"), 3000);
      } else {
        message.error(res?.message || "Error occurred.");
      }
    } catch (err) {
      message.error(err.message || "Cannot connect to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ap-root">
      {/* Styles for loader and illustration floating */}
      <style>{`
        @keyframes pl-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .pl-spinner {
          animation: pl-spin 0.8s linear infinite;
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid currentColor;
          border-top-color: transparent;
          border-radius: 50%;
          margin-right: 8px;
        }
        .floating-coffee {
          animation: float 4s ease-in-out infinite;
        }
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(1.5deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        .ap-back-link {
          color: var(--muted);
          font-size: 13px;
          text-decoration: none;
          transition: color 0.2s;
          font-weight: 500;
        }
        .ap-back-link:hover {
          color: var(--text);
        }
      `}</style>

      {/* Language Switcher */}
      <div style={{ position: "fixed", top: 24, right: 32, zIndex: 100, display: "flex", gap: 6, background: "var(--bg2)", padding: "4px", borderRadius: 100, border: "1px solid var(--border)" }}>
        {["en", "kh"].map((l) => (
          <button 
            key={l} 
            onClick={() => setLang(l)} 
            style={{ 
              padding: "6px 14px", 
              borderRadius: 100, 
              border: "none", 
              background: lang === l ? "var(--green)" : "transparent", 
              color: lang === l ? "#ffffff" : "var(--muted)", 
              fontSize: 12, 
              fontWeight: 700, 
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      {/* LEFT PANEL */}
      <div className="ap-left" style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
        <div className="floating-coffee">
          <CoffeeIllustration />
        </div>
        <h2 style={{ marginTop: 28, fontSize: 24, fontWeight: 800, color: "var(--text)", textAlign: "center" }}>
          {t.forgot_password}
        </h2>
        <p style={{ marginTop: 10, fontSize: 13, color: "var(--muted)", textAlign: "center", lineHeight: 1.6, maxWidth: 280 }}>
          {step === 1 ? t.enter_email_reset : step === 2 ? t.enter_otp_code : t.enter_new_password}
        </p>
      </div>

      {/* RIGHT PANEL */}
      <div className="ap-right" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="ap-card">
          <h1 className="ap-card-title">
            {step === 1 ? t.forgot_password : step === 2 ? t.otp_code : t.reset_password}
          </h1>
          <p className="ap-card-sub" style={{ marginBottom: 24 }}>
            {step === 1 ? "Provide your login email to retrieve security code." : step === 2 ? "A 6-digit code has been delivered to your email inbox." : "Establish your new security password."}
          </p>

          {/* STEP 1: Email Form */}
          {step === 1 && (
            <form onSubmit={handleSendOTP}>
              <div className="ap-field">
                <label className="ap-label">{t.email_address}</label>
                <EmailInput 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  onBlur={e => {
                    const val = e.target.value.trim();
                    if (val && !val.includes("@")) {
                      setEmail(`${val}@gmail.com`);
                    }
                  }}
                  placeholder="you@company.com" 
                  className="ap-input"
                  required 
                />
              </div>
              <button type="submit" disabled={loading} className={`ap-btn ap-btn-green${loading ? " ap-btn-disabled" : ""}`} style={{ marginTop: 24 }}>
                {loading && <span className="pl-spinner" />}
                {loading ? (lang === "kh" ? "កំពុងផ្ញើ..." : "Sending...") : t.send_reset_link}
              </button>
            </form>
          )}

          {/* STEP 2: OTP Verification Form */}
          {step === 2 && (
            <form onSubmit={handleVerifyOTP}>
              <div className="ap-field">
                <label className="ap-label">{t.otp_code}</label>
                <input 
                  type="text" 
                  maxLength={6} 
                  value={otp} 
                  onChange={(e) => setOtp(e.target.value)} 
                  placeholder={t.enter_6_digit || "Enter 6-digit code"} 
                  className="ap-input"
                  style={{ textAlign: "center", fontSize: otp ? 22 : 14, letterSpacing: otp ? 10 : "normal", fontWeight: otp ? 800 : 400 }} 
                  required 
                />
              </div>
              <button type="submit" disabled={loading} className={`ap-btn ap-btn-green${loading ? " ap-btn-disabled" : ""}`} style={{ marginTop: 24 }}>
                {loading && <span className="pl-spinner" />}
                {loading ? (lang === "kh" ? "កំពុងផ្ទៀងផ្ទាត់..." : "Verifying...") : (lang === "kh" ? "ផ្ទៀងផ្ទាត់ OTP →" : "Verify OTP →")}
              </button>
              <div style={{ textAlign: "center", marginTop: 20 }}>
                <button type="button" onClick={() => setStep(1)} className="ap-back-link" style={{ background: "none", border: "none", cursor: "pointer" }}>
                  ← Back to Email
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Password Reset Form */}
          {step === 3 && (
            <form onSubmit={handleResetPassword}>
              <div className="ap-field" style={{ marginBottom: 16 }}>
                <label className="ap-label">{t.new_password}</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••" 
                  className="ap-input" 
                  required 
                />
              </div>
              <div className="ap-field" style={{ marginBottom: 24 }}>
                <label className="ap-label">{t.confirm_password}</label>
                <input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  placeholder="••••••••" 
                  className="ap-input" 
                  required 
                />
              </div>
              <button type="submit" disabled={loading} className={`ap-btn ap-btn-green${loading ? " ap-btn-disabled" : ""}`}>
                {loading && <span className="pl-spinner" />}
                {loading ? (lang === "kh" ? "កំពុងកំណត់ឡើងវិញ..." : "Resetting...") : t.reset_password}
              </button>
            </form>
          )}

          <div style={{ textAlign: "center", marginTop: 20 }}>
            <Link to="/login" className="ap-back-link">{t.back_to_login}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
