import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { message } from "antd";
import { request } from "@/shared/utils/helper";
import { setProfile } from "@/app/store/profile.store";
import "./AuthPremium.css";

const EyeIcon = ({ open }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    {open
      ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
      : <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>
    }
  </svg>
);

const SocialBtn = ({ icon, label, full }) => (
  <button className={`ap-social-btn${full ? " ap-social-btn-full" : ""}`}>
    <span style={{ fontSize: 16 }}>{icon}</span> {label}
  </button>
);

const FEATURES = [
  { icon: "🏪", bg: "rgba(34,197,94,0.1)", title: "POS & Inventory", desc: "Real-time multi-branch stock control" },
  { icon: "👥", bg: "rgba(99,102,241,0.1)", title: "HRM & Payroll", desc: "Full employee lifecycle management" },
  { icon: "📊", bg: "rgba(234,179,8,0.1)",  title: "Analytics & Reports", desc: "AI-powered business intelligence" },
  { icon: "🔒", bg: "rgba(239,68,68,0.1)",  title: "Enterprise Security", desc: "SOC 2 compliant, end-to-end encrypted" },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail]   = useState("");
  const [pass, setPass]     = useState("");
  const [show, setShow]     = useState(false);
  const [remember, setRem]  = useState(false);
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    if (!email || !pass) { message.warning("Please fill in all fields"); return; }
    setLoading(true);
    try {
      const res = await request("auth/login", "post", { email, password: pass });
      if (res?.success) {
        setProfile(res.data);
        const r = res.data;
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
        <div className="ap-logo-row">
          <div className="ap-logo-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="#020c05" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="ap-logo-name">SaaS<span>Platform</span></div>
        </div>

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
            <div className="ap-test-avatar" style={{ background: "linear-gradient(135deg,#22C55E,#16a34a)" }}>SR</div>
            <div>
              <div className="ap-test-name">Sophea Rith</div>
              <div className="ap-test-role">COO, Mega Retail Group · Phnom Penh</div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display:"flex", gap:24, paddingTop:8, borderTop:"1px solid rgba(255,255,255,0.06)" }}>
          {[["10K+","Companies"],["99.9%","Uptime"],["50+","Modules"]].map(([v,l]) => (
            <div key={l}>
              <div style={{ fontSize:18, fontWeight:900, color:"#fff" }}>{v}</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>{l}</div>
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
            <SocialBtn icon="🇬" label="Google" />
            <SocialBtn icon="Ⓜ" label="Microsoft" />
            <SocialBtn icon="🐙" label="GitHub" />
            <SocialBtn icon="📘" label="Facebook" />
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
              <Link to="/forgot-password">Forgot password?</Link>
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

          <div style={{ textAlign:"center", marginTop:14, fontSize:13, color:"rgba(255,255,255,0.45)" }}>
            Don't have an account?{" "}
            <Link to="/register" style={{ color:"#22C55E", fontWeight:600, textDecoration:"none" }}>Create workspace</Link>
          </div>

          <div className="ap-security-row">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Secured with 256-bit SSL encryption · SOC 2 Compliant
          </div>

          <div style={{ marginTop:10, padding:"10px 12px", background:"rgba(255,255,255,0.02)", borderRadius:10, border:"1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:".5px", marginBottom:4 }}>Last login</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.55)", display:"flex", justifyContent:"space-between" }}>
              <span>Chrome · Windows · Phnom Penh</span>
              <span style={{ color:"rgba(255,255,255,0.3)" }}>2h ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
