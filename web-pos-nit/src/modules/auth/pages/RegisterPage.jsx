import React, { useState } from "react";
import { message } from "antd";
import { request } from "@/shared/utils/helper";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useLanguage, translations } from "@/app/store/language.store";

const CoffeeIllustration = ({ size = 180 }) => (
  <svg viewBox="0 0 280 320" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: size, height: "auto" }}>
    <path d="M95 60 Q90 45 95 30 Q100 15 95 5" stroke="#2a2a2a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    <path d="M115 65 Q108 48 113 32 Q118 16 113 4" stroke="#2a2a2a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    <path d="M135 60 Q130 44 135 28 Q140 14 135 3" stroke="#2a2a2a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    <path d="M68 105 L78 215 Q80 225 90 225 L178 225 Q188 225 190 215 L200 105 Z" fill="#2a2a2a" rx="4" />
    <rect x="62" y="93" width="144" height="18" rx="9" fill="#1a1a1a" />
    <ellipse cx="134" cy="165" rx="22" ry="28" fill="#3a2a1a" opacity="0.9" />
    <path d="M200 120 Q228 120 228 148 Q228 176 200 176" stroke="#2a2a2a" strokeWidth="9" strokeLinecap="round" fill="none" />
  </svg>
);

const WaveDivider = () => (
  <svg viewBox="0 0 120 700" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" className="wave-divider" style={{ position: "absolute", left: "calc(42% - 60px)", top: 0, bottom: 0, height: "100%", width: 120, zIndex: 2, filter: "drop-shadow(4px 0 12px rgba(0,0,0,0.18))" }}>
    <path d="M60 0 C80 70, 30 140, 60 210 C90 280, 25 350, 55 420 C85 490, 30 560, 60 630 C90 700, 60 700, 60 700 L120 700 L120 0 Z" fill="#1a1a1a" />
  </svg>
);

function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planId = searchParams.get("plan_id");
  const [selectedPlan, setSelectedPlan] = useState(null);
  
  const { lang, setLang } = useLanguage();
  const t = translations[lang] || translations.en;

  const [bizName, setBizName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [bizFocus, setBizFocus] = useState(false);
  const [ownerFocus, setOwnerFocus] = useState(false);
  const [emFocus, setEmFocus] = useState(false);
  const [pwFocus, setPwFocus] = useState(false);
  const [showPw, setShowPw] = useState(false);

  React.useEffect(() => {
    if (planId) {
      fetchPlanDetails();
    }
  }, [planId]);

  const fetchPlanDetails = async () => {
    try {
      const res = await request("plans/public", "get");
      if (res && res.success && res.plans) {
        const matched = res.plans.find(p => String(p.id) === String(planId));
        if (matched) {
          setSelectedPlan(matched);
        }
      }
    } catch (err) {
      console.error("Failed to load plan details:", err);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!bizName || !ownerName || !email || !password) {
      message.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        business_name: bizName,
        name: ownerName,
        email,
        password,
        plan_id: planId
      };
      const res = await request("auth/register", "post", payload);
      if (res && res.success) {
        message.success("Business Registered Successfully! Please Login.");
        navigate("/login");
      } else {
        message.error(res.message || "Registration failed. Try again.");
      }
    } catch (err) {
      // Error handled by global request helper
    } finally {
      setLoading(false);
    }
  };

  const inputBase = (focused) => ({
    width: "100%", height: 44, borderRadius: 10, border: `1.5px solid ${focused ? "#c0a060" : "rgba(255,255,255,0.08)"}`, background: focused ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)", color: "white", fontSize: 13, padding: "0 16px", outline: "none", transition: "0.2s", boxSizing: "border-box"
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800&display=swap');
        *,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }
        body { overflow-x: hidden; background: #2a2a2a; font-family: 'DM Sans', sans-serif; }
        
        .login-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; position: relative; }

        .main-card { position: relative; z-index: 10; width: 920px; max-width: 94vw; min-height: 600px; border-radius: 28px; overflow: hidden; box-shadow: 0 40px 100px rgba(0,0,0,0.6); display: flex; background: #1a1a1a; }

        .left-panel { width: 44%; background: #F0EAD8; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; position: relative; z-index: 1; flex-shrink: 0; }
        .right-panel { flex: 1; background: #1a1a1a; display: flex; flex-direction: column; justify-content: center; padding: 44px 48px 44px 72px; position: relative; z-index: 1; }

        @media (max-width: 850px) {
          .main-card { width: 100% !important; max-width: 100% !important; min-height: 100vh !important; border-radius: 0 !important; flex-direction: column !important; margin: 0 !important; box-shadow: none !important; }
          .left-panel { width: 100% !important; padding: 15px 20px !important; min-height: 100px !important; flex-direction: row !important; justify-content: flex-start !important; gap: 15px !important; }
          .left-panel h2, .left-panel p { display: none !important; }
          .right-panel { width: 100% !important; padding: 25px 24px !important; flex: 1 !important; border-top: 1px solid rgba(255,255,255,0.05); }
          .wave-divider, .bg-blobs { display: none !important; }
        }

        .lang-switcher { position: fixed; top: 15px; right: 15px; z-index: 100; display: flex; gap: 4px; background: rgba(0,0,0,0.3); padding: 4px; border-radius: 100px; backdrop-filter: blur(10px); }
        .lang-btn { padding: 5px 10px; border-radius: 100px; border: none; font-size: 10px; font-weight: 700; cursor: pointer; transition: 0.2s; }
        
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus {
          -webkit-text-fill-color: white !important;
          -webkit-box-shadow: 0 0 0px 1000px #222 inset !important;
        }
      `}</style>

      <div className="login-container">
        <div className="bg-blobs">
          <div style={{ position: "absolute", top: "-10%", left: "-5%", width: "40vw", height: "40vw", borderRadius: "50%", background: "#222", zIndex: 0 }} />
          <div style={{ position: "absolute", bottom: "-10%", right: "-5%", width: "45vw", height: "45vw", borderRadius: "50%", background: "#1f1f1f", zIndex: 0 }} />
        </div>

        <div className="lang-switcher">
          <button className="lang-btn" onClick={() => setLang("en")} style={{ background: lang === "en" ? "#c0a060" : "transparent", color: lang === "en" ? "#000" : "#fff" }}>EN</button>
          <button className="lang-btn" onClick={() => setLang("kh")} style={{ background: lang === "kh" ? "#c0a060" : "transparent", color: lang === "kh" ? "#000" : "#fff" }}>KH</button>
        </div>

        <div className="main-card">
          <div className="left-panel">
            <div className="mobile-only-svg" style={{ display: "none" }}>
              <CoffeeIllustration size={50} />
            </div>
            <div className="desktop-only-svg">
              <CoffeeIllustration size={180} />
            </div>
            <style>{`
              @media (max-width: 850px) {
                .mobile-only-svg { display: block !important; }
                .desktop-only-svg { display: none !important; }
              }
            `}</style>
            <h2>{lang === 'kh' ? "ចុះឈ្មោះអាជីវកម្ម" : "grow business"}</h2>
            <p>{lang === 'kh' ? "បង្កើត និងគ្រប់គ្រងហាងកាហ្វេរបស់អ្នកដោយភាពងាយស្រួលបំផុត" : "establish and manage your coffee shop ecosystem seamlessly"}</p>
          </div>

          <WaveDivider />

          <div className="right-panel">
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "white", marginBottom: 15, textAlign: "center" }}>
              {lang === 'kh' ? "បង្កើតគណនីអាជីវកម្ម" : "Create Business Account"}
            </h1>

            {selectedPlan && (
              <div style={{
                background: "rgba(192, 160, 96, 0.12)",
                border: "1px solid rgba(192, 160, 96, 0.25)",
                borderRadius: "10px",
                padding: "8px 12px",
                marginBottom: "15px",
                color: "#c0a060",
                fontSize: "12px",
                fontWeight: 600,
                textAlign: "center"
              }}>
                📋 {lang === 'kh' ? "កញ្ចប់សេវាកម្ម៖" : "Selected Plan:"} <span style={{ color: "#fff", fontWeight: 700 }}>{selectedPlan.name}</span> ({selectedPlan.price === "0.00" || parseFloat(selectedPlan.price) === 0 ? "Free" : `$${selectedPlan.price}/${selectedPlan.billing_cycle === 'lifetime' ? 'lifetime' : 'mo'}`})
              </div>
            )}

            <form onSubmit={onSubmit}>
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", marginBottom: 4, display: "block" }}>
                  {lang === 'kh' ? "ឈ្មោះអាជីវកម្ម" : "Business Name"}
                </label>
                <input type="text" value={bizName} onChange={(e) => setBizName(e.target.value)} onFocus={() => setBizFocus(true)} onBlur={() => setBizFocus(false)} style={inputBase(bizFocus)} placeholder={lang === 'kh' ? "ឧ. ហ្គ្រីន ហ្គ្រោន" : "e.g. Green Grounds"} />
              </div>

              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", marginBottom: 4, display: "block" }}>
                  {lang === 'kh' ? "ឈ្មោះតំណាងម្ចាស់" : "Owner Name"}
                </label>
                <input type="text" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} onFocus={() => setOwnerFocus(true)} onBlur={() => setOwnerFocus(false)} style={inputBase(ownerFocus)} placeholder={lang === 'kh' ? "ឧ. សុខ ម៉េង" : "e.g. Sok Meng"} />
              </div>

              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", marginBottom: 4, display: "block" }}>
                  {lang === 'kh' ? "អាសយដ្ឋានអ៊ីមែល" : "Email Address"}
                </label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onFocus={() => setEmFocus(true)} onBlur={() => setEmFocus(false)} style={inputBase(emFocus)} placeholder="owner@domain.com" />
              </div>

              <div style={{ marginBottom: 15 }}>
                <label style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", marginBottom: 4, display: "block" }}>
                  {lang === 'kh' ? "លេខសម្ងាត់" : "Password"}
                </label>
                <div style={{ position: "relative" }}>
                  <input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} onFocus={() => setPwFocus(true)} onBlur={() => setPwFocus(false)} style={inputBase(pwFocus)} placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 15, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,0.2)", cursor: "pointer" }}>{showPw ? "🙈" : "👁"}</button>
                </div>
              </div>

              <button type="submit" disabled={loading} style={{ width: "100%", height: 44, borderRadius: 12, border: "none", background: loading ? "#444" : "#c0a060", color: "#1a1a1a", fontSize: 13, fontWeight: 800, cursor: "pointer", transition: "0.2s", marginBottom: 12 }}>
                {loading ? "..." : (lang === 'kh' ? "បង្កើតអាជីវកម្ម" : "Establish Business")}
              </button>
            </form>

            <p style={{ textAlign: "center", fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>
              {lang === 'kh' ? "មានគណនីរួចហើយ?" : "Already have a branch?"}{" "}
              <Link to="/login" style={{ color: "#c0a060", fontWeight: 700, textDecoration: "none" }}>
                {lang === 'kh' ? "ចូលប្រើប្រាស់" : "Sign In"}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default RegisterPage;