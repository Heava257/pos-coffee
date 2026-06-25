import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { message } from "antd";
import { request } from "@/shared/utils/helper";
import "./AuthPremium.css";

/* ── helpers ── */
const getStrength = p => {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return s;
};
const STRENGTH_LABELS = ["","Weak","Fair","Good","Strong"];
const STRENGTH_COLORS = ["","#ef4444","#f97316","#eab308","#22C55E"];

const EyeIcon = ({ open }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    {open
      ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
      : <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><line x1="1" y1="1" x2="23" y2="23"/></>}
  </svg>
);

const STEPS = ["Account","Company","Location","Plan","Verify"];
const PLANS = [
  { id:"starter",  name:"Starter",    price:0,   yr:0,    feats:["1 Branch","5 Users","Basic POS","Email Support"] },
  { id:"business", name:"Business",   price:49,  yr:39,   feats:["10 Branches","50 Users","Advanced Modules","Priority Support"], popular:true },
  { id:"enterprise",name:"Enterprise",price:149, yr:119,  feats:["Unlimited Branches","Unlimited Users","White Label","API Access","Dedicated Manager"] },
];
const BIZ_TYPES = ["Retail","Restaurant","Wholesale","Pharmacy","Hotel","Education","Manufacturing","Healthcare","Service Company"];
const COUNTRIES  = ["Cambodia","Thailand","Vietnam","Singapore","Malaysia"];
const CURRENCIES = ["USD","KHR","THB","VND","SGD"];
const LANGUAGES  = ["English","Khmer","Thai","Vietnamese"];
const TIMEZONES  = ["Asia/Phnom_Penh (UTC+7)","Asia/Bangkok (UTC+7)","Asia/Ho_Chi_Minh (UTC+7)","Asia/Singapore (UTC+8)","Asia/Kuala_Lumpur (UTC+8)"];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [yearly, setYearly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showPass2, setShowPass2] = useState(false);
  const [success, setSuccess] = useState(false);
  const otpRefs = [useRef(),useRef(),useRef(),useRef(),useRef(),useRef()];

  // Step 1 – Account
  const [acc, setAcc] = useState({ firstName:"", lastName:"", username:"", email:"", phone:"", password:"", confirm:"" });
  // Step 2 – Company
  const [biz, setBiz] = useState({ name:"", type:"", email:"", phone:"", tax:"", website:"", logo:null });
  // Step 3 – Location
  const [loc, setLoc] = useState({ country:"Cambodia", province:"", city:"", address:"", timezone:TIMEZONES[0], currency:"USD", language:"English" });
  // Step 4 – Plan
  const [plan, setPlan] = useState("business");
  // Step 5 – OTP
  const [otp, setOtp] = useState(["","","","","",""]);
  const [agreed, setAgreed] = useState(false);
  const [privacyOk, setPrivacyOk] = useState(false);

  const strength = getStrength(acc.password);
  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  const Field = ({ label, children, half }) => (
    <div className={`ap-field${half ? "" : ""}`}>{label && <label className="ap-label">{label}</label>}{children}</div>
  );

  const Inp = ({ val, onChange, type="text", ph, icon }) => (
    <div className="ap-input-wrap">
      <input className="ap-input" type={type} value={val} onChange={onChange} placeholder={ph} style={icon ? { paddingRight:40 } : {}} />
      {icon && <button className="ap-input-icon" onClick={icon.fn}><icon.C open={icon.open} /></button>}
    </div>
  );

  const validateStep = () => {
    if (step === 1) {
      if (!acc.firstName || !acc.lastName || !acc.email || !acc.password) { message.warning("Fill all required fields"); return false; }
      if (!/\S+@\S+\.\S+/.test(acc.email)) { message.warning("Enter a valid email"); return false; }
      if (acc.password.length < 8) { message.warning("Password must be 8+ characters"); return false; }
      if (acc.password !== acc.confirm) { message.warning("Passwords do not match"); return false; }
    }
    if (step === 2 && !biz.name) { message.warning("Company name is required"); return false; }
    return true;
  };

  const next = () => { if (validateStep()) setStep(s => s + 1); };
  const back = () => setStep(s => s - 1);

  const handleOtp = (i, v) => {
    if (!/^\d?$/.test(v)) return;
    const next2 = [...otp]; next2[i] = v; setOtp(next2);
    if (v && i < 5) otpRefs[i + 1].current?.focus();
  };

  const onSubmit = async () => {
    if (!agreed || !privacyOk) { message.warning("Please accept terms and privacy policy"); return; }
    setLoading(true);
    try {
      const payload = {
        business_name: biz.name,
        owner_name: `${acc.firstName} ${acc.lastName}`,
        email: acc.email,
        password: acc.password,
        phone: acc.phone,
        plan_type: plan,
        province: loc.province,
        district: loc.city,
      };
      const res = await request("auth/register", "post", payload);
      if (res?.success) {
        setSuccess(true);
        setTimeout(() => navigate("/login"), 4000);
      } else {
        message.error(res?.message || "Registration failed");
      }
    } catch { /* global */ }
    finally { setLoading(false); }
  };

  /* ── STEP RENDERERS ── */
  const renderStep1 = () => (
    <>
      <div className="ap-row">
        <Field label="First Name *">
          <input className="ap-input" placeholder="John" value={acc.firstName}
            onChange={e => setAcc({...acc, firstName:e.target.value})} />
        </Field>
        <Field label="Last Name *">
          <input className="ap-input" placeholder="Doe" value={acc.lastName}
            onChange={e => setAcc({...acc, lastName:e.target.value})} />
        </Field>
      </div>
      <Field label="Username">
        <input className="ap-input" placeholder="johndoe" value={acc.username}
          onChange={e => setAcc({...acc, username:e.target.value})} />
      </Field>
      <Field label="Email Address *">
        <input className="ap-input" type="email" placeholder="you@company.com" value={acc.email}
          onChange={e => setAcc({...acc, email:e.target.value})} />
      </Field>
      <Field label="Phone Number">
        <input className="ap-input" placeholder="+855 xxx xxx xxx" value={acc.phone}
          onChange={e => setAcc({...acc, phone:e.target.value})} />
      </Field>
      <Field label="Password *">
        <div className="ap-input-wrap">
          <input className="ap-input" type={showPass?"text":"password"} placeholder="Min 8 characters"
            style={{paddingRight:40}} value={acc.password}
            onChange={e => setAcc({...acc, password:e.target.value})} />
          <button className="ap-input-icon" onClick={() => setShowPass(!showPass)}><EyeIcon open={showPass}/></button>
        </div>
        {acc.password && (
          <>
            <div className="ap-strength">
              {[1,2,3,4].map(i => <div key={i} className={`ap-strength-bar${i<=strength?` s${strength}`:""}`}/>)}
            </div>
            <div className="ap-strength-label" style={{color:STRENGTH_COLORS[strength]}}>
              {STRENGTH_LABELS[strength]}
            </div>
          </>
        )}
      </Field>
      <Field label="Confirm Password *">
        <div className="ap-input-wrap">
          <input className="ap-input" type={showPass2?"text":"password"} placeholder="Repeat password"
            style={{paddingRight:40}} value={acc.confirm}
            onChange={e => setAcc({...acc, confirm:e.target.value})} />
          <button className="ap-input-icon" onClick={() => setShowPass2(!showPass2)}><EyeIcon open={showPass2}/></button>
        </div>
        {acc.confirm && acc.password !== acc.confirm && (
          <div style={{fontSize:11,color:"#ef4444",marginTop:4}}>Passwords do not match</div>
        )}
      </Field>
    </>
  );

  const renderStep2 = () => (
    <>
      <Field label="Company Name *">
        <input className="ap-input" placeholder="Acme Corporation" value={biz.name}
          onChange={e => setBiz({...biz, name:e.target.value})} />
      </Field>
      <Field label="Business Type">
        <select className="ap-input" value={biz.type} onChange={e => setBiz({...biz, type:e.target.value})}>
          <option value="">Select type…</option>
          {BIZ_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
      </Field>
      <div className="ap-row">
        <Field label="Company Email">
          <input className="ap-input" type="email" placeholder="info@company.com" value={biz.email}
            onChange={e => setBiz({...biz, email:e.target.value})} />
        </Field>
        <Field label="Company Phone">
          <input className="ap-input" placeholder="+855…" value={biz.phone}
            onChange={e => setBiz({...biz, phone:e.target.value})} />
        </Field>
      </div>
      <div className="ap-row">
        <Field label="Tax / VAT Number">
          <input className="ap-input" placeholder="K001-XXXX" value={biz.tax}
            onChange={e => setBiz({...biz, tax:e.target.value})} />
        </Field>
        <Field label="Website">
          <input className="ap-input" placeholder="https://company.com" value={biz.website}
            onChange={e => setBiz({...biz, website:e.target.value})} />
        </Field>
      </div>
      <Field label="Company Logo">
        <div className="ap-upload">
          <div className="ap-upload-icon">🖼️</div>
          <div className="ap-upload-text">Click or drag logo here · PNG, JPG, SVG · Max 2MB</div>
        </div>
      </Field>
    </>
  );

  const renderStep3 = () => (
    <>
      <div className="ap-row">
        <Field label="Country">
          <select className="ap-input" value={loc.country} onChange={e => setLoc({...loc, country:e.target.value})}>
            {COUNTRIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Province / State">
          <input className="ap-input" placeholder="Phnom Penh" value={loc.province}
            onChange={e => setLoc({...loc, province:e.target.value})} />
        </Field>
      </div>
      <div className="ap-row">
        <Field label="City">
          <input className="ap-input" placeholder="City" value={loc.city}
            onChange={e => setLoc({...loc, city:e.target.value})} />
        </Field>
        <Field label="Timezone">
          <select className="ap-input" value={loc.timezone} onChange={e => setLoc({...loc, timezone:e.target.value})}>
            {TIMEZONES.map(t => <option key={t}>{t}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Full Address">
        <input className="ap-input" placeholder="Street, Building No…" value={loc.address}
          onChange={e => setLoc({...loc, address:e.target.value})} />
      </Field>
      <div className="ap-row">
        <Field label="Currency">
          <select className="ap-input" value={loc.currency} onChange={e => setLoc({...loc, currency:e.target.value})}>
            {CURRENCIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Language">
          <select className="ap-input" value={loc.language} onChange={e => setLoc({...loc, language:e.target.value})}>
            {LANGUAGES.map(l => <option key={l}>{l}</option>)}
          </select>
        </Field>
      </div>
    </>
  );

  const renderStep4 = () => (
    <>
      <div style={{textAlign:"center", marginBottom:4}}>
        <div className="ap-plan-toggle">
          {["Monthly","Yearly"].map(v => (
            <button key={v} className={`ap-plan-toggle-btn${(v==="Yearly"?yearly:!yearly)?" active":""}`}
              onClick={() => setYearly(v==="Yearly")}>
              {v} {v==="Yearly" && <span style={{fontSize:10,marginLeft:4,opacity:.7}}>Save 20%</span>}
            </button>
          ))}
        </div>
      </div>
      <div className="ap-plan-cards">
        {PLANS.map(p => (
          <div key={p.id} className={`ap-plan-card${plan===p.id?" selected":""}`} onClick={() => setPlan(p.id)}>
            {p.popular && <div className="ap-plan-badge">⭐ Recommended</div>}
            <div className="ap-plan-name">{p.name}</div>
            <div className="ap-plan-price">
              ${yearly ? p.yr : p.price}<span>/mo</span>
            </div>
            <ul className="ap-plan-feats">
              {p.feats.map(f => <li key={f}>{f}</li>)}
            </ul>
          </div>
        ))}
      </div>
      {yearly && <div style={{textAlign:"center",fontSize:11,color:"#22C55E",marginBottom:8}}>🎉 2 months free with annual plan</div>}
    </>
  );

  const renderStep5 = () => (
    <>
      <div style={{marginBottom:20}}>
        <div style={{fontSize:13,fontWeight:600,color:"rgba(255,255,255,0.7)",marginBottom:8}}>
          📧 Email Verification Code
        </div>
        <div style={{fontSize:12,color:"rgba(255,255,255,0.4)",marginBottom:12}}>
          Sent to {acc.email || "your email"}
        </div>
        <div className="ap-otp-row">
          {otp.map((v, i) => (
            <input key={i} ref={otpRefs[i]} className="ap-otp-input"
              maxLength={1} value={v}
              onChange={e => handleOtp(i, e.target.value)}
              onKeyDown={e => e.key === "Backspace" && !v && i > 0 && otpRefs[i-1].current?.focus()} />
          ))}
        </div>
        <button style={{background:"none",border:"none",color:"#22C55E",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>
          Resend code
        </button>
      </div>
      <div style={{marginBottom:16,padding:"12px 14px",background:"rgba(255,255,255,0.02)",borderRadius:12,border:"1px solid rgba(255,255,255,0.06)"}}>
        <div style={{fontSize:12,fontWeight:600,color:"rgba(255,255,255,0.7)",marginBottom:6}}>📱 SMS Verification</div>
        <input className="ap-input" placeholder="Enter SMS code" style={{marginBottom:0}} />
      </div>
      <div className="ap-check-row" style={{marginBottom:10}}>
        <input type="checkbox" id="terms" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
        <label htmlFor="terms" style={{fontSize:12}}>
          I agree to the{" "}
          <a href="#" style={{color:"#22C55E",textDecoration:"none"}}>Terms and Conditions</a>
        </label>
      </div>
      <div className="ap-check-row">
        <input type="checkbox" id="priv" checked={privacyOk} onChange={e => setPrivacyOk(e.target.checked)} />
        <label htmlFor="priv" style={{fontSize:12}}>
          I have read the{" "}
          <a href="#" style={{color:"#22C55E",textDecoration:"none"}}>Privacy Policy</a>
        </label>
      </div>
    </>
  );

  if (success) return (
    <div className="ap-root" style={{alignItems:"center",justifyContent:"center"}}>
      <div className="ap-card" style={{textAlign:"center",maxWidth:440}}>
        <div className="ap-success">
          <div className="ap-success-anim">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5">
              <polyline points="20,6 9,17 4,12"/>
            </svg>
          </div>
          <div className="ap-success-title">Account Created! 🎉</div>
          <div className="ap-success-sub">Your workspace is being set up. Redirecting to login in a moment…</div>
          <div style={{fontSize:12,color:"rgba(255,255,255,0.3)"}}>Check your email to verify your account before logging in.</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="ap-root" style={{alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:"32px 20px"}}>
      <div className="ap-card" style={{maxWidth:520}}>
        {/* Logo */}
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:24}}>
          <div className="ap-logo-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="#020c05" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="ap-logo-name">SaaS<span style={{color:"#22C55E"}}>Platform</span></div>
        </div>

        {/* Progress */}
        <div className="ap-step-bar-wrap">
          <div className="ap-step-label">
            <span>Step <strong>{step}</strong> of {STEPS.length} — <strong style={{color:"rgba(255,255,255,0.7)"}}>{STEPS[step-1]}</strong></span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="ap-step-track"><div className="ap-step-fill" style={{width:`${progress}%`}}/></div>
          <div className="ap-step-dots">
            {STEPS.map((_,i) => (
              <div key={i} className={`ap-step-dot${i+1<step?" done":i+1===step?" active":""}`}/>
            ))}
          </div>
        </div>

        {/* Title */}
        <div style={{marginBottom:20}}>
          <div className="ap-card-title">{STEPS[step-1]}</div>
          <div style={{fontSize:13,color:"rgba(255,255,255,0.45)"}}>
            {["Fill in your account credentials","Tell us about your business","Where is your business located?","Choose the right plan for you","Verify your identity to finish"][step-1]}
          </div>
        </div>

        {/* Step content */}
        {step===1 && renderStep1()}
        {step===2 && renderStep2()}
        {step===3 && renderStep3()}
        {step===4 && renderStep4()}
        {step===5 && renderStep5()}

        {/* Navigation */}
        <div className="ap-btn-group" style={{marginTop:20}}>
          {step > 1
            ? <button className="ap-btn ap-btn-ghost" onClick={back}>← Back</button>
            : <Link to="/login" className="ap-btn ap-btn-ghost">Sign In</Link>
          }
          {step < 5
            ? <button className="ap-btn ap-btn-green" onClick={next}>Continue →</button>
            : <button className={`ap-btn ap-btn-green${loading?" ap-btn-disabled":""}`} onClick={onSubmit}>
                {loading ? "Creating Workspace…" : "🚀 Create Workspace"}
              </button>
          }
        </div>
      </div>
    </div>
  );
}