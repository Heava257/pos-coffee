import React, { useState } from "react";
import { message } from "antd";
import { request } from "../../util/helper";
import { setAcccessToken, setPermission } from "../../store/profile.store";
import { useProfileStore } from "../../store/profileStore";
import { useNavigate, Link } from "react-router-dom";
import { useGoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { useLanguage, translations } from "../../store/language.store";

const GOOGLE_CLIENT_ID =
  "222467462843-3mc4kb1636gcpugur0cgmb4mbdgfpbfl.apps.googleusercontent.com";

/* ══════════════════════════════════════════
   COFFEE CUP SVG ILLUSTRATION
══════════════════════════════════════════ */
const CoffeeIllustration = () => (
  <svg viewBox="0 0 280 320" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", maxWidth: 240 }}>
    {/* Steam lines */}
    <path d="M95 60 Q90 45 95 30 Q100 15 95 5" stroke="#2a2a2a" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <path d="M115 65 Q108 48 113 32 Q118 16 113 4" stroke="#2a2a2a" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <path d="M135 60 Q130 44 135 28 Q140 14 135 3" stroke="#2a2a2a" strokeWidth="2.5" strokeLinecap="round" fill="none"/>

    {/* Chat bubble */}
    <rect x="148" y="48" width="52" height="36" rx="12" stroke="#2a2a2a" strokeWidth="2" fill="none"/>
    <path d="M158 72 L152 82 L165 72" fill="#2a2a2a"/>
    {/* Heart in bubble */}
    <path d="M168 60 C168 57 165 55 162 57 C159 55 156 57 156 60 C156 63 162 68 162 68 C162 68 168 63 168 60Z" fill="#2a2a2a"/>

    {/* Cup body */}
    <path d="M68 105 L78 215 Q80 225 90 225 L178 225 Q188 225 190 215 L200 105 Z" fill="#2a2a2a" rx="4"/>
    {/* Cup lid */}
    <rect x="62" y="93" width="144" height="18" rx="9" fill="#1a1a1a"/>
    {/* Cup highlight stripe */}
    <rect x="80" y="93" width="18" height="18" rx="2" fill="rgba(255,255,255,0.08)"/>
    {/* Coffee bean logo on cup */}
    <ellipse cx="134" cy="165" rx="22" ry="28" fill="#3a2a1a" opacity="0.9"/>
    <path d="M134 137 Q148 152 134 165 Q120 152 134 137Z" fill="#5a3a2a" opacity="0.8"/>
    <path d="M134 165 Q148 178 134 193 Q120 178 134 165Z" fill="#5a3a2a" opacity="0.8"/>

    {/* Handle */}
    <path d="M200 120 Q228 120 228 148 Q228 176 200 176" stroke="#2a2a2a" strokeWidth="9" strokeLinecap="round" fill="none"/>

    {/* Sparkles */}
    <path d="M52 130 L55 120 L58 130 L68 133 L58 136 L55 146 L52 136 L42 133 Z" fill="#2a2a2a" opacity="0.5"/>
    <path d="M194 80 L196 74 L198 80 L204 82 L198 84 L196 90 L194 84 L188 82 Z" fill="#2a2a2a" opacity="0.4"/>
    <path d="M60 88 L62 83 L64 88 L69 90 L64 92 L62 97 L60 92 L55 90 Z" fill="#2a2a2a" opacity="0.35"/>

    {/* Coffee beans scattered */}
    {/* Bean 1 */}
    <ellipse cx="55" cy="242" rx="14" ry="9" rx2="14" ry2="9" fill="#3a2010" transform="rotate(-25 55 242)"/>
    <path d="M46 238 Q55 242 64 246" stroke="#5a3020" strokeWidth="1.5" fill="none"/>
    {/* Bean 2 */}
    <ellipse cx="205" cy="245" rx="12" ry="8" fill="#3a2010" transform="rotate(15 205 245)"/>
    <path d="M197 242 Q205 246 213 249" stroke="#5a3020" strokeWidth="1.5" fill="none"/>
    {/* Bean 3 */}
    <ellipse cx="75" cy="265" rx="10" ry="7" fill="#3a2010" transform="rotate(-10 75 265)"/>
    <path d="M68 263 Q75 266 82 268" stroke="#5a3020" strokeWidth="1.5" fill="none"/>
    {/* Bean 4 */}
    <ellipse cx="185" cy="268" rx="11" ry="7" fill="#3a2010" transform="rotate(20 185 268)"/>
    <path d="M177 265 Q185 269 193 272" stroke="#5a3020" strokeWidth="1.5" fill="none"/>
    {/* Bean 5 */}
    <ellipse cx="130" cy="280" rx="13" ry="8" fill="#3a2010" transform="rotate(5 130 280)"/>
    <path d="M121 278 Q130 282 139 285" stroke="#5a3020" strokeWidth="1.5" fill="none"/>

    {/* Small dots */}
    <circle cx="170" cy="258" r="3" fill="#2a2a2a" opacity="0.3"/>
    <circle cx="95" cy="255" r="2.5" fill="#2a2a2a" opacity="0.3"/>
    <circle cx="158" cy="274" r="2" fill="#2a2a2a" opacity="0.25"/>
  </svg>
);

/* ══════════════════════════════════════════
   ORGANIC WAVE DIVIDER (SVG)
══════════════════════════════════════════ */
const WaveDivider = () => (
  <svg
    viewBox="0 0 120 700"
    preserveAspectRatio="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{
      position: "absolute",
      left: "calc(42% - 60px)",
      top: 0,
      bottom: 0,
      height: "100%",
      width: 120,
      zIndex: 2,
      filter: "drop-shadow(4px 0 12px rgba(0,0,0,0.18))",
    }}
  >
    <path
      d="M60 0 C80 70, 30 140, 60 210 C90 280, 25 350, 55 420 C85 490, 30 560, 60 630 C90 700, 60 700, 60 700 L120 700 L120 0 Z"
      fill="#1a1a1a"
    />
    {/* subtle lighter edge */}
    <path
      d="M60 0 C80 70, 30 140, 60 210 C90 280, 25 350, 55 420 C85 490, 30 560, 60 630 C90 700, 60 700, 60 700"
      stroke="rgba(255,255,255,0.06)"
      strokeWidth="1.5"
      fill="none"
    />
  </svg>
);

/* ══════════════════════════════════════════
   GOOGLE BUTTON
══════════════════════════════════════════ */
const GoogleBtn = ({ onSuccess, loading, t }) => {
  const [hovered, setHovered] = useState(false);
  const login = useGoogleLogin({
    onSuccess: (t) =>
      fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${t.access_token}`)
        .then((r) => r.json())
        .then((d) => onSuccess({ profile: d, token: t.access_token }))
        .catch(() => message.error("Cannot fetch Google profile")),
    onError: () => message.error("Google sign-in failed"),
  });

  return (
    <button
      type="button"
      disabled={loading}
      onClick={() => !loading && login()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%",
        height: 48,
        borderRadius: 100,
        border: `1.5px solid ${hovered ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.15)"}`,
        background: hovered ? "rgba(255,255,255,0.06)" : "transparent",
        color: "rgba(255,255,255,0.8)",
        fontSize: 14,
        fontWeight: 600,
        fontFamily: "'DM Sans', Inter, sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        cursor: loading ? "not-allowed" : "pointer",
        transition: "all 0.2s ease",
        opacity: loading ? 0.5 : 1,
        letterSpacing: 0.2,
      }}
    >
      <img
        src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
        width={18}
        alt="G"
      />
      {loading ? "Signing in…" : t.sign_in_with_google || "Sign in with Google"}
    </button>
  );
};

/* ══════════════════════════════════════════
   ACCESS DENIED
══════════════════════════════════════════ */
const DeniedBanner = ({ t }) => (
  <div style={{
    background: "rgba(255,59,48,0.12)",
    border: "1px solid rgba(255,59,48,0.25)",
    borderRadius: 10,
    padding: "12px 16px",
    marginBottom: 16,
    fontSize: 13,
    color: "rgba(255,180,180,0.9)",
    fontFamily: "'DM Sans', Inter, sans-serif",
    lineHeight: 1.5,
  }}>
    <strong style={{ color: "#ff6b6b" }}>🚫 {t.not_registered || "Not Registered"}.</strong>{" "}
    {t.account_not_authorised || "Your Gmail has not been authorised."}{" "}
    <a href="https://t.me/pongchiva" target="_blank" rel="noreferrer"
      style={{ color: "#c0a060", fontWeight: 700, textDecoration: "none" }}>
      {t.contact_admin || "Contact Admin"} →
    </a>
  </div>
);

/* ══════════════════════════════════════════
   MAIN
══════════════════════════════════════════ */
function LoginPageInner() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [emFocus, setEmFocus] = useState(false);
  const [pwFocus, setPwFocus] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [denied, setDenied] = useState(false);
  const navigate = useNavigate();
  const { setProfile } = useProfileStore();
  const { lang, setLang } = useLanguage();
  const t = translations[lang] || translations.en;

  const onSuccess = (data) => {
    setAcccessToken(data.access_token);
    setProfile(data.profile || {});
    setPermission(data.permission || []);
    message.success(t.welcome_back || "Welcome back!");
    setTimeout(() => navigate("/"), 300);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setDenied(false);
    try {
      const res = await request("auth/login", "post", { email, password });
      if (res?.access_token) onSuccess(res);
      else message.error(res?.message || "Invalid credentials.");
    } catch { message.error("Cannot connect to server."); }
    finally { setLoading(false); }
  };

  const onGoogle = async (cred) => {
    setGoogleLoading(true);
    setDenied(false);
    try {
      const res = await request("auth/google-login", "post", { access_token: cred.token });
      if (res?.access_token) onSuccess(res);
      else if (res?.not_registered) setDenied(true);
      else message.error(res?.message || "Google login failed.");
    } catch { message.error("Google authentication error."); }
    finally { setGoogleLoading(false); }
  };

  const inputBase = (focused) => ({
    width: "100%",
    height: 52,
    borderRadius: 10,
    border: `1.5px solid ${focused ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.1)"}`,
    background: focused ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)",
    color: "white",
    fontSize: 14,
    fontFamily: "'DM Sans', Inter, sans-serif",
    padding: "0 16px",
    outline: "none",
    transition: "all 0.2s",
    boxSizing: "border-box",
    boxShadow: focused ? "0 0 0 3px rgba(255,255,255,0.04)" : "none",
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap');
        *,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }
        body { overflow: hidden; }
        input::placeholder { color: rgba(255,255,255,0.2) !important; font-family: 'DM Sans', Inter, sans-serif; }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0 100px #1a1a1a inset !important; -webkit-text-fill-color: white !important; }
      `}</style>

      {/* ── Full page dark bg with blobs ── */}
      <div style={{
        minHeight: "100vh",
        background: "#2a2a2a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'DM Sans', Inter, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Background blob shapes */}
        <div style={{
          position: "absolute", top: "-15%", left: "-10%", width: "45vw", height: "45vw",
          borderRadius: "50%", background: "#222222", zIndex: 0,
        }} />
        <div style={{
          position: "absolute", bottom: "-20%", right: "-8%", width: "50vw", height: "50vw",
          borderRadius: "50%", background: "#1f1f1f", zIndex: 0,
        }} />
        <div style={{
          position: "absolute", top: "20%", right: "-5%", width: "30vw", height: "30vw",
          borderRadius: "50%", background: "#252525", zIndex: 0,
        }} />

        {/* ── Language Switcher Top Right ── */}
        <div style={{
          position: "fixed",
          top: 24,
          right: 32,
          zIndex: 100,
          display: "flex",
          gap: 8,
          background: "rgba(255,255,255,0.05)",
          padding: "4px",
          borderRadius: 100,
          border: "1px solid rgba(255,255,255,0.1)",
        }}>
          <button
            onClick={() => setLang("en")}
            style={{
              padding: "6px 14px",
              borderRadius: 100,
              border: "none",
              background: lang === "en" ? "#c0a060" : "transparent",
              color: lang === "en" ? "#1a1a1a" : "rgba(255,255,255,0.4)",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            EN
          </button>
          <button
            onClick={() => setLang("kh")}
            style={{
              padding: "6px 14px",
              borderRadius: 100,
              border: "none",
              background: lang === "kh" ? "#c0a060" : "transparent",
              color: lang === "kh" ? "#1a1a1a" : "rgba(255,255,255,0.4)",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            KH
          </button>
        </div>

        {/* ── Main card ── */}
        <div style={{
          position: "relative",
          zIndex: 10,
          width: "min(920px, 94vw)",
          height: "min(560px, 90vh)",
          borderRadius: 28,
          overflow: "hidden",
          boxShadow: "0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)",
          display: "flex",
        }}>

          {/* ══ LEFT: CREAM PANEL ══ */}
          <div style={{
            width: "44%",
            background: "#F0EAD8",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 32px",
            position: "relative",
            zIndex: 1,
            flexShrink: 0,
          }}>
            <CoffeeIllustration />
            <h2 style={{
              marginTop: 24,
              fontSize: 26,
              fontWeight: 800,
              color: "#1a1a1a",
              fontFamily: "'DM Sans', sans-serif",
              letterSpacing: -0.5,
              textAlign: "center",
            }}>
              {lang === 'kh' ? "ស្វែងរកកាហ្វេ" : "find coffee"}
            </h2>
            <p style={{
              marginTop: 8,
              fontSize: 13,
              color: "#6b5e4e",
              textAlign: "center",
              fontWeight: 400,
              lineHeight: 1.5,
            }}>
              {lang === 'kh' ? "ស្វែងរករសជាតិកាហ្វេដែលល្អបំផុតសម្រាប់ថ្ងៃដ៏អស្ចារ្យរបស់អ្នក" : "find the best coffee to accompany your days"}
            </p>
          </div>

          {/* ══ WAVE DIVIDER ══ */}
          <WaveDivider />

          {/* ══ RIGHT: DARK FORM PANEL ══ */}
          <div style={{
            flex: 1,
            background: "#1a1a1a",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "44px 48px 44px 72px",
            position: "relative",
            zIndex: 1,
            overflowY: "auto",
          }}>
            {/* Logo */}
            <div style={{ marginBottom: 28, display: "flex", justifyContent: "center" }}>
              <div style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
              }}>
                <img src="/logo.png" alt="logo" style={{ width: 32, height: 32, objectFit: "contain", borderRadius: 8 }}
                  onError={(e) => { e.target.style.display = "none"; e.target.parentNode.innerText = "☕"; }} />
              </div>
            </div>

            {/* Heading */}
            <h1 style={{
              fontSize: 24,
              fontWeight: 800,
              color: "white",
              lineHeight: 1.3,
              marginBottom: 28,
              letterSpacing: -0.3,
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {lang === 'kh' ? "សូមស្វាគមន៍មកវិញ" : "Welcome Back"},{" "}
              <span style={{ fontWeight: 400, color: "rgba(255,255,255,0.65)", fontSize: "0.85em" }}>
                {lang === 'kh' ? "សូមចូលទៅកាន់គណនីរបស់អ្នក" : "Please login to your account"}
              </span>
            </h1>

            {denied && <DeniedBanner t={t} />}

            {/* Email */}
            <div style={{ marginBottom: 14 }}>
              <label style={{
                fontSize: 11,
                fontWeight: 600,
                color: "rgba(255,255,255,0.35)",
                letterSpacing: 0.8,
                textTransform: "uppercase",
                display: "block",
                marginBottom: 6,
              }}>{t.email_address || "Email Address"}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setEmFocus(true)}
                onBlur={() => setEmFocus(false)}
                placeholder="you@company.com"
                autoComplete="email"
                style={inputBase(emFocus)}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 14 }}>
              <label style={{
                fontSize: 11,
                fontWeight: 600,
                color: "rgba(255,255,255,0.35)",
                letterSpacing: 0.8,
                textTransform: "uppercase",
                display: "block",
                marginBottom: 6,
              }}>{t.password || "Password"}</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPwFocus(true)}
                  onBlur={() => setPwFocus(false)}
                  placeholder={t.password || "Password"}
                  autoComplete="current-password"
                  style={{ ...inputBase(pwFocus), paddingRight: 44 }}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{
                  position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", color: "rgba(255,255,255,0.3)",
                  cursor: "pointer", fontSize: 16, padding: 0, lineHeight: 1,
                }}>
                  {showPw ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "rgba(255,255,255,0.4)", fontFamily: "'DM Sans', sans-serif" }}>
                <input type="checkbox" style={{ width: 14, height: 14, accentColor: "#c0a060" }} />
                {lang === 'kh' ? "ចងចាំខ្ញុំ" : "Remember me"}
              </label>
              <Link to="/forgot" style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", textDecoration: "none", fontFamily: "'DM Sans', sans-serif" }}>
                {lang === 'kh' ? "ភ្លេចលេខសម្ងាត់?" : "Forgot password?"}
              </Link>
            </div>

            {/* Sign in button */}
            <button
              onClick={onSubmit}
              disabled={loading}
              style={{
                width: "100%",
                height: 50,
                borderRadius: 100,
                border: "none",
                background: loading ? "rgba(255,255,255,0.4)" : "white",
                color: "#1a1a1a",
                fontSize: 15,
                fontWeight: 700,
                fontFamily: "'DM Sans', Inter, sans-serif",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                letterSpacing: 0.2,
                marginBottom: 20,
                boxShadow: "0 4px 16px rgba(255,255,255,0.08)",
              }}
              onMouseEnter={(e) => { if (!loading) e.target.style.background = "#eeeeee"; }}
              onMouseLeave={(e) => { e.target.style.background = loading ? "rgba(255,255,255,0.4)" : "white"; }}
            >
              {loading ? (t.signing_in || "Signing in…") : (t.sign_in || "Sign in")}
            </button>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", fontWeight: 500 }}>{lang === 'kh' ? "ឬ" : "or"}</span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
            </div>

            {/* Google */}
            <GoogleBtn onSuccess={onGoogle} loading={googleLoading} t={t} />

            {/* Bottom note */}
            <p style={{ marginTop: 20, textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.25)", fontFamily: "'DM Sans', sans-serif" }}>
              {lang === 'kh' ? "ត្រូវការជំនួយ?" : "Need access?"}{" "}
              <a href="https://t.me/pongchiva" target="_blank" rel="noreferrer"
                style={{ color: "rgba(192,160,96,0.8)", fontWeight: 600, textDecoration: "none" }}>
                {lang === 'kh' ? "ទាក់ទងអ្នកគ្រប់គ្រង" : "Contact Admin"}
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <LoginPageInner />
    </GoogleOAuthProvider>
  );
}
