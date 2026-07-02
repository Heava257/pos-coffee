import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { message } from "antd";
import { request } from "@/shared/utils/helper";
import { useProfileStore } from "@/app/store/profileStore";
import { setAcccessToken, setRememberMe } from "@/app/store/profile.store";
import { useGoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import "./AuthPremium.css";

const EyeIcon = ({ open }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    {open
      ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
      : <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>
    }
  </svg>
);

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

const SocialBtn = ({ icon, label, full, onClick, disabled }) => (
  <button className={`ap-social-btn${full ? " ap-social-btn-full" : ""}`} onClick={onClick} disabled={disabled}>
    <span style={{ display: "inline-flex", alignItems: "center" }}>{icon}</span> {label}
  </button>
);

const GoogleLoginButton = ({ onLoginSuccess, loading }) => {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "222467462843-3mc4kb1636gcpugur0cgmb4mbdgfpbfl.apps.googleusercontent.com";
  
  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      onLoginSuccess(tokenResponse.access_token);
    },
    onError: () => {
      message.error("Google Login Failed");
    }
  });

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <SocialBtn 
        icon={<GoogleIcon />} 
        label={loading ? "Connecting..." : "Google"} 
        full 
        onClick={() => !loading && login()} 
        disabled={loading}
      />
    </GoogleOAuthProvider>
  );
};

const POSIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const HRMIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const ChartIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const SecurityIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const FEATURES = [
  { icon: <POSIcon />, bg: "rgba(255,255,255,0.08)", title: "POS & Inventory", desc: "Real-time multi-branch stock control" },
  { icon: <HRMIcon />, bg: "rgba(255,255,255,0.08)", title: "HRM & Payroll", desc: "Full employee lifecycle management" },
  { icon: <ChartIcon />, bg: "rgba(255,255,255,0.08)", title: "Analytics & Reports", desc: "AI-powered business intelligence" },
  { icon: <SecurityIcon />, bg: "rgba(255,255,255,0.08)", title: "Enterprise Security", desc: "SOC 2 compliant, end-to-end encrypted" },
];

const getBrowserAndOS = () => {
  const ua = navigator.userAgent;
  let browser = "Browser";
  let os = "OS";

  // OS
  if (ua.indexOf("Win") !== -1) os = "Windows";
  else if (ua.indexOf("Mac") !== -1) os = "macOS";
  else if (ua.indexOf("Linux") !== -1) os = "Linux";
  else if (ua.indexOf("Android") !== -1) os = "Android";
  else if (ua.indexOf("like Mac") !== -1) os = "iOS";

  // Browser
  if (ua.indexOf("Firefox") !== -1) browser = "Firefox";
  else if (ua.indexOf("SamsungBrowser") !== -1) browser = "Samsung Browser";
  else if (ua.indexOf("Opera") !== -1 || ua.indexOf("OPR") !== -1) browser = "Opera";
  else if (ua.indexOf("Edge") !== -1 || ua.indexOf("Edg") !== -1) browser = "Edge";
  else if (ua.indexOf("Chrome") !== -1) browser = "Chrome";
  else if (ua.indexOf("Safari") !== -1) browser = "Safari";

  // Location/City (via Timezone)
  let city = "Local";
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && tz.includes("/")) {
      city = tz.split("/")[1].replace(/_/g, " ");
    }
  } catch (e) {}

  return { browser, os, city };
};

const getRelativeTime = (timestamp) => {
  if (!timestamp) return "";
  const now = new Date().getTime();
  const diff = now - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail]   = useState("");
  const [pass, setPass]     = useState("");
  const [show, setShow]     = useState(false);
  const [remember, setRem]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastLogin, setLastLogin] = useState(() => {
    try {
      const saved = localStorage.getItem("last_login_meta");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const savedTheme = localStorage.getItem("landing_theme") || "light";
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const handleGoogleLogin = async (accessToken) => {
    setLoading(true);
    try {
      const res = await request("auth/google-login", "post", { access_token: accessToken });
      if (res?.success) {
        setRememberMe(remember);
        setAcccessToken(res.access_token);
        
        // Save login metadata
        try {
          const meta = getBrowserAndOS();
          localStorage.setItem("last_login_meta", JSON.stringify({
            ...meta,
            timestamp: new Date().getTime()
          }));
        } catch (e) {
          console.error("Failed to save login metadata:", e);
        }

        // Update the profile store
        const store = useProfileStore.getState();
        store.setProfile(res.profile);
        store.setPermissions(res.permission);

        const r = res.profile;
        const isAdmin = r.is_super_admin === 1 || ["Owner","Executive","Admin"].includes(r.role_name);
        navigate(isAdmin ? "/dashboard" : "/invoices");
        message.success("Logged in successfully with Google");
      } else if (res?.not_registered) {
        message.warning(res.message || "This Gmail is not registered in our system.");
      } else {
        message.error(res?.message || "Google Login failed");
      }
    } catch (error) {
      console.error(error);
      message.error("Google authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const onLogin = async () => {
    if (!email || !pass) { message.warning("Please fill in all fields"); return; }
    setLoading(true);
    try {
      const res = await request("auth/login", "post", { email, password: pass, remember });
      if (res?.success) {
        setRememberMe(remember);
        setAcccessToken(res.access_token);
        
        // Save login metadata for dynamic "Last login" display
        try {
          const meta = getBrowserAndOS();
          localStorage.setItem("last_login_meta", JSON.stringify({
            ...meta,
            timestamp: new Date().getTime()
          }));
        } catch (e) {
          console.error("Failed to save login metadata:", e);
        }
        
        // Update the reactive Zustand store
        const store = useProfileStore.getState();
        store.setProfile(res.profile);
        store.setPermissions(res.permission);

        const r = res.profile;
        const isAdmin = r.is_super_admin === 1 || ["Owner","Executive","Admin"].includes(r.role_name);
        navigate(isAdmin ? "/dashboard" : "/invoices");
      } else {
        message.error(res?.message || "Login failed");
      }
    } catch { /* handled globally */ }
    finally { setLoading(false); }
  };

  return (
    <div className="ap-root">
      {/* LEFT PANEL */}
      <div className="ap-left">
        <Link to="/" className="ap-logo-row" style={{ textDecoration: "none" }}>
          <div className="ap-logo-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="#0A5C36" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="ap-logo-name">GrowMe<span>Platform</span></div>
        </Link>

        <div>
          <h2 className="ap-welcome-title">Welcome back to<br /><span className="green">the future</span><br />of business</h2>
          <p className="ap-welcome-sub">One platform. Every tool your growing enterprise needs to scale faster.</p>
        </div>

        <div className="ap-feat-list">
          {FEATURES.map(f => (
            <div key={f.title} className="ap-feat-item">
              <div className="ap-feat-icon" style={{ background: f.bg }}>{f.icon}</div>
              <div className="ap-feat-text">
                <strong>{f.title}</strong>
                <span>{f.desc}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="ap-testimonial">
          <p className="ap-test-quote">"This platform transformed how we run our 40-branch retail chain. Revenue reporting is now real-time."</p>
          <div className="ap-test-author">
            <div className="ap-test-avatar">SR</div>
            <div>
              <div className="ap-test-name">Sophea Rith</div>
              <div className="ap-test-role">COO, Mega Retail Group · Phnom Penh</div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display:"flex", gap:24, paddingTop:8, borderTop:"1px solid rgba(255,255,255,0.08)" }}>
          {[["10K+","Companies"],["99.9%","Uptime"],["50+","Modules"]].map(([v,l]) => (
            <div key={l}>
              <div style={{ fontSize:18, fontWeight:900, color:"#fff" }}>{v}</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.6)" }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="ap-right">
        <div className="ap-card">
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
            <div>
              <div className="ap-card-title">Sign in</div>
              <div className="ap-card-sub" style={{ marginBottom:0 }}>Access your workspace</div>
            </div>
            <span className="ap-badge ap-badge-green">🔐 MFA Ready</span>
          </div>

          {/* Social logins */}
          <div className="ap-social-grid">
            <GoogleLoginButton onLoginSuccess={handleGoogleLogin} loading={loading} />
          </div>

          <div className="ap-divider"><span>or sign in with email</span></div>

          {/* Email field */}
          <div className="ap-field">
            <label className="ap-label">Email address</label>
            <input className="ap-input" type="email" placeholder="you@company.com"
              value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && onLogin()} />
          </div>

          {/* Password field */}
          <div className="ap-field">
            <label className="ap-label">
              Password
              <Link to="/forgot">Forgot password?</Link>
            </label>
            <div className="ap-input-wrap">
              <input className="ap-input" type={show ? "text" : "password"} placeholder="••••••••"
                style={{ paddingRight: 40 }}
                value={pass} onChange={e => setPass(e.target.value)}
                onKeyDown={e => e.key === "Enter" && onLogin()} />
              <button className="ap-input-icon" onClick={() => setShow(!show)}><EyeIcon open={show} /></button>
            </div>
          </div>

          <div className="ap-check-row">
            <input type="checkbox" id="rem" checked={remember} onChange={e => setRem(e.target.checked)} />
            <label htmlFor="rem">Keep me signed in for 30 days</label>
          </div>

          <button className={`ap-btn ap-btn-green${loading ? " ap-btn-disabled" : ""}`} onClick={onLogin}>
            {loading ? "Signing in…" : "Sign In →"}
          </button>

          <div style={{ textAlign:"center", marginTop:14, fontSize:13, color:"var(--muted)" }}>
            Don't have an account?{" "}
            <Link to="/register" style={{ color:"var(--green)", fontWeight:600, textDecoration:"none" }}>Create workspace</Link>
          </div>

          <div className="ap-security-row">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Secured with 256-bit SSL encryption · SOC 2 Compliant
          </div>

          {lastLogin && (
            <div style={{ marginTop:10, padding:"10px 12px", background:"var(--bg)", borderRadius:10, border:"1px solid var(--border)" }}>
              <div style={{ fontSize:10, color:"var(--dim)", textTransform:"uppercase", letterSpacing:".5px", marginBottom:4 }}>Last login</div>
              <div style={{ fontSize:12, color:"var(--muted)", display:"flex", justifyContent:"space-between" }}>
                <span>{lastLogin.browser} · {lastLogin.os} · {lastLogin.city}</span>
                <span style={{ color:"var(--dim)" }}>{getRelativeTime(lastLogin.timestamp)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
