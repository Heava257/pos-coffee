import React, { useState } from "react";
import { message } from "antd";
import { request } from "../../util/helper";
import { useNavigate, Link } from "react-router-dom";
import { useLanguage, translations } from "../../store/language.store";

/* ══════════════════════════════════════════
   COFFEE CUP SVG ILLUSTRATION
══════════════════════════════════════════ */
const CoffeeIllustration = () => (
  <svg viewBox="0 0 280 320" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", maxWidth: 240 }}>
    <path d="M95 60 Q90 45 95 30 Q100 15 95 5" stroke="#2a2a2a" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <path d="M115 65 Q108 48 113 32 Q118 16 113 4" stroke="#2a2a2a" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <path d="M135 60 Q130 44 135 28 Q140 14 135 3" stroke="#2a2a2a" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <rect x="148" y="48" width="52" height="36" rx="12" stroke="#2a2a2a" strokeWidth="2" fill="none"/>
    <path d="M158 72 L152 82 L165 72" fill="#2a2a2a"/>
    <path d="M168 60 C168 57 165 55 162 57 C159 55 156 57 156 60 C156 63 162 68 162 68 C162 68 168 63 168 60Z" fill="#2a2a2a"/>
    <path d="M68 105 L78 215 Q80 225 90 225 L178 225 Q188 225 190 215 L200 105 Z" fill="#2a2a2a" rx="4"/>
    <rect x="62" y="93" width="144" height="18" rx="9" fill="#1a1a1a"/>
    <rect x="80" y="93" width="18" height="18" rx="2" fill="rgba(255,255,255,0.08)"/>
    <ellipse cx="134" cy="165" rx="22" ry="28" fill="#3a2a1a" opacity="0.9"/>
    <path d="M200 120 Q228 120 228 148 Q228 176 200 176" stroke="#2a2a2a" strokeWidth="9" strokeLinecap="round" fill="none"/>
  </svg>
);

const WaveDivider = () => (
  <svg viewBox="0 0 120 700" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" style={{
      position: "absolute", left: "calc(42% - 60px)", top: 0, bottom: 0, height: "100%", width: 120, zIndex: 2, filter: "drop-shadow(4px 0 12px rgba(0,0,0,0.18))",
    }}>
    <path d="M60 0 C80 70, 30 140, 60 210 C90 280, 25 350, 55 420 C85 490, 30 560, 60 630 C90 700, 60 700, 60 700 L120 700 L120 0 Z" fill="#1a1a1a" />
    <path d="M60 0 C80 70, 30 140, 60 210 C90 280, 25 350, 55 420 C85 490, 30 560, 60 630 C90 700, 60 700, 60 700" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" fill="none" />
  </svg>
);

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState("");
  const { lang, setLang } = useLanguage();
  const t = translations[lang] || translations.en;
  const navigate = useNavigate();

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const res = await request("auth/forgot-password", "post", { email });
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

  const inputStyle = (fieldName) => ({
    width: "100%", 
    height: 52, 
    borderRadius: 10, 
    border: `1.5px solid ${focusedField === fieldName ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.1)"}`,
    background: focusedField === fieldName ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)", 
    color: "white", 
    fontSize: 14, 
    padding: "0 16px", 
    outline: "none", 
    transition: "all 0.2s", 
    boxSizing: "border-box",
  });

  return (
    <div style={{ minHeight: "100vh", background: "#2a2a2a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif", position: "relative", overflow: "hidden" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800&display=swap'); input::placeholder { color: rgba(255,255,255,0.2) !important; }`}</style>
      
      {/* Lang Switcher */}
      <div style={{ position: "fixed", top: 24, right: 32, zIndex: 100, display: "flex", gap: 8, background: "rgba(255,255,255,0.05)", padding: "4px", borderRadius: 100, border: "1px solid rgba(255,255,255,0.1)" }}>
        {["en", "kh"].map((l) => (
          <button key={l} onClick={() => setLang(l)} style={{ padding: "6px 14px", borderRadius: 100, border: "none", background: lang === l ? "#c0a060" : "transparent", color: lang === l ? "#1a1a1a" : "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{l.toUpperCase()}</button>
        ))}
      </div>

      <div style={{ position: "relative", zIndex: 10, width: "min(920px, 94vw)", height: "min(560px, 90vh)", borderRadius: 28, overflow: "hidden", boxShadow: "0 40px 100px rgba(0,0,0,0.6)", display: "flex" }}>
        <div style={{ width: "44%", background: "#F0EAD8", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 32px", position: "relative", zIndex: 1 }}>
          <CoffeeIllustration />
          <h2 style={{ marginTop: 24, fontSize: 26, fontWeight: 800, color: "#1a1a1a", textAlign: "center" }}>{t.forgot_password}</h2>
          <p style={{ marginTop: 8, fontSize: 13, color: "#6b5e4e", textAlign: "center", lineHeight: 1.5 }}>
            {step === 1 ? t.enter_email_reset : step === 2 ? t.enter_otp_code : t.enter_new_password}
          </p>
        </div>

        <WaveDivider />

        <div style={{ flex: 1, background: "#1a1a1a", display: "flex", flexDirection: "column", justifyContent: "center", padding: "44px 48px 44px 72px", position: "relative", zIndex: 1, overflowY: "auto" }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "white", marginBottom: 32 }}>{step === 1 ? t.forgot_password : step === 2 ? t.otp_code : t.reset_password}</h1>

          {step === 1 && (
            <form onSubmit={handleSendOTP}>
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.35)", letterSpacing: 0.8, textTransform: "uppercase", display: "block", marginBottom: 8 }}>{t.email_address}</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onFocus={() => setFocusedField("email")} onBlur={() => setFocusedField("")} placeholder="you@company.com" style={inputStyle("email")} required />
              </div>
              <button type="submit" disabled={loading} style={{ width: "100%", height: 50, borderRadius: 100, border: "none", background: loading ? "rgba(255,255,255,0.4)" : "white", color: "#1a1a1a", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", transition: "all 0.2s", marginBottom: 24 }}>
                {loading ? t.sending || "Sending..." : t.send_reset_link}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyOTP}>
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.35)", letterSpacing: 0.8, textTransform: "uppercase", display: "block", marginBottom: 8 }}>{t.otp_code}</label>
                <input type="text" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)} onFocus={() => setFocusedField("otp")} onBlur={() => setFocusedField("")} placeholder={t.enter_6_digit} style={{ ...inputStyle("otp"), textAlign: "center", fontSize: 24, letterSpacing: 10, fontWeight: 800 }} required />
              </div>
              <button type="submit" disabled={loading} style={{ width: "100%", height: 50, borderRadius: 100, border: "none", background: loading ? "rgba(255,255,255,0.4)" : "#c0a060", color: "#1a1a1a", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", transition: "all 0.2s", marginBottom: 24 }}>
                {loading ? "Verifying..." : "Verify OTP →"}
              </button>
              <button type="button" onClick={() => setStep(1)} style={{ width: "100%", background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 13, cursor: "pointer", marginBottom: 10 }}>← Back to Email</button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleResetPassword}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.35)", letterSpacing: 0.8, textTransform: "uppercase", display: "block", marginBottom: 8 }}>{t.new_password}</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onFocus={() => setFocusedField("password")} onBlur={() => setFocusedField("")} placeholder="••••••••" style={inputStyle("password")} required />
              </div>
              <div style={{ marginBottom: 32 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.35)", letterSpacing: 0.8, textTransform: "uppercase", display: "block", marginBottom: 8 }}>{t.confirm_password}</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} onFocus={() => setFocusedField("confirmPassword")} onBlur={() => setFocusedField("")} placeholder="••••••••" style={inputStyle("confirmPassword")} required />
              </div>
              <button type="submit" disabled={loading} style={{ width: "100%", height: 50, borderRadius: 100, border: "none", background: loading ? "rgba(255,255,255,0.4)" : "white", color: "#1a1a1a", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", transition: "all 0.2s", marginBottom: 16 }}>
                {loading ? t.resetting || "Resetting..." : t.reset_password}
              </button>
            </form>
          )}

          <Link to="/login" style={{ textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: 13, textDecoration: "none" }}>{t.back_to_login}</Link>
        </div>
      </div>
    </div>
  );
}
