import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { message } from "antd";
import { request } from "@/shared/utils/helper";
import { CAMBODIA_GEO } from "@/shared/utils/cambodia_geo";
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
const STR_LABELS = ["","Weak","Fair","Good","Strong"];
const STR_COLORS = ["","#ef4444","#f97316","#eab308","#0A5C36"];

const EyeIcon = ({ open }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    {open
      ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
      : <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><line x1="1" y1="1" x2="23" y2="23"/></>}
  </svg>
);

const CHECK = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0A5C36" strokeWidth="2.5">
    <polyline points="20,6 9,17 4,12"/>
  </svg>
);

const UserIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const BuildingIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
    <line x1="9" y1="22" x2="9" y2="16" />
    <line x1="15" y1="22" x2="15" y2="16" />
    <line x1="9" y1="16" x2="15" y2="16" />
    <path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M8 10h.01" /><path d="M16 10h.01" />
  </svg>
);

const MapPinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const FileTextIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const POSIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const BoxIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

const HRMIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const ChartIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const SecurityIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const RocketIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 2L11 13" />
    <path d="M22 2l-7 20-4-9-9-4z" />
  </svg>
);

const STEPS = ["Account","Company","Location","Agreement"];

const STEP_INFO = [
  { icon:<UserIcon />, title:"Account Info",    sub:"Set up your personal credentials" },
  { icon:<BuildingIcon />, title:"Company Info",    sub:"Tell us about your business" },
  { icon:<MapPinIcon />, title:"Location",        sub:"Where is your business based?" },
  { icon:<FileTextIcon />, title:"Agreement",       sub:"Accept terms and policies to finish" },
];

const LEFT_FEATURES = [
  { icon:<POSIcon />, label:"Multi-branch POS" },
  { icon:<BoxIcon />, label:"Smart Inventory" },
  { icon:<HRMIcon />, label:"Team & HR Tools" },
  { icon:<ChartIcon />, label:"Live Analytics" },
  { icon:<SecurityIcon />, label:"Enterprise Security" },
  { icon:<RocketIcon />, label:"Scalable Platform" },
];

const BIZ_TYPES  = ["Retail","Restaurant","Wholesale","Pharmacy","Hotel","Education","Manufacturing","Healthcare","Service Company"];
const COUNTRIES  = ["Cambodia","Thailand","Vietnam","Singapore","Malaysia"];
const CURRENCIES = ["USD","KHR","THB","VND","SGD"];
const LANGUAGES  = ["English","Khmer","Thai","Vietnamese"];
const TIMEZONES  = ["Asia/Phnom_Penh (UTC+7)","Asia/Bangkok (UTC+7)","Asia/Ho_Chi_Minh (UTC+7)","Asia/Singapore (UTC+8)","Asia/Kuala_Lumpur (UTC+8)"];

const PLANS = [
  { id: 1, name:"Free Plan",  price:0,   cycle:"monthly",  feats:["1 Branch","2 Users","Basic POS","Email Support"] },
  { id: 2, name:"Pro Plan",   price:30,  cycle:"monthly",  feats:["5 Branches","10 Users","Advanced Modules","Priority Support"], popular:true },
  { id: 3, name:"Enterprise", price:800, cycle:"lifetime", feats:["Unlimited Branches","Unlimited Users","White Label","API Access","Dedicated Manager"] },
];

const F = ({ label, children, style }) => (
  <div className="ap-field" style={style}>{label && <label className="ap-label">{label}</label>}{children}</div>
);

const Inp = (props) => <input className="ap-input" {...props} />;
const Sel = ({ children, ...props }) => <select className="ap-input" {...props}>{children}</select>;

const EmailInput = ({ value, onChange, onBlur, placeholder }) => {
  const showPreview = value && !value.includes("@");

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <input
        type="email"
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        className="ap-input"
        placeholder={placeholder}
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

export default function RegisterPage() {
  const navigate = useNavigate();
  useEffect(() => {
    const savedTheme = localStorage.getItem("landing_theme") || "light";
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);
  const [step, setStep]     = useState(1);
  const [yearly, setYearly] = useState(false);
  const [loading, setLoad]  = useState(false);
  const [showP, setShowP]   = useState(false);
  const [showC, setShowC]   = useState(false);
  const [success, setOk]    = useState(false);
  const otpRefs = [useRef(),useRef(),useRef(),useRef(),useRef(),useRef()];

  const [acc, setAcc] = useState({ firstName:"",lastName:"",username:"",email:"",phone:"",password:"",confirm:"" });
  const [biz, setBiz] = useState({ name:"",type:"",email:"",phone:"",tax:"",website:"" });
  const [loc, setLoc] = useState({ country:"Cambodia",province:"Phnom Penh",city:"Chamkar Mon",address:"",timezone:TIMEZONES[0],currency:"USD",language:"English" });
  const [plan, setPlan] = useState(1); // Free Plan by default
  const [otp, setOtp]   = useState(["","","","","",""]);
  const [agreed, setAgreed]     = useState(false);
  const [privacyOk, setPrivacy] = useState(false);

  const strength = getStrength(acc.password);
  const progress = ((step-1)/(STEPS.length-1))*100;

  const generateStrongPassword = (e) => {
    e.preventDefault();
    const length = 12;
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const symbols = "@$!%*?&";
    
    let password = "";
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    const allChars = uppercase + lowercase + numbers + symbols;
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    password = password.split('').sort(() => 0.5 - Math.random()).join('');
    
    setAcc({
      ...acc,
      password: password,
      confirm: password
    });
    
    navigator.clipboard.writeText(password);
    message.success(`Strong password generated and copied: ${password}`);
  };



  const validate = () => {
    if (step===1) {
      let regEmail = acc.email.trim();
      if (regEmail && !regEmail.includes("@")) {
        regEmail = `${regEmail}@gmail.com`;
        setAcc(prev => ({ ...prev, email: regEmail }));
      }
      if (!acc.firstName||!acc.lastName||!regEmail||!acc.password){message.warning("Fill all required fields");return false;}
      if (!/\S+@\S+\.\S+/.test(regEmail)){message.warning("Enter a valid email");return false;}
      if (acc.password.length<8){message.warning("Password needs 8+ characters");return false;}
      if (acc.password!==acc.confirm){message.warning("Passwords don't match");return false;}
    }
    if (step===2&&!biz.name){message.warning("Company name is required");return false;}
    return true;
  };

  const next = () => { if(validate()) setStep(s=>s+1); };
  const back = () => setStep(s=>s-1);

  const handleOtp = (i,v) => {
    if(!/^\d?$/.test(v)) return;
    const n=[...otp]; n[i]=v; setOtp(n);
    if(v&&i<5) otpRefs[i+1].current?.focus();
  };

  const onSubmit = async () => {
    if(!agreed||!privacyOk){message.warning("Please accept terms and privacy policy");return;}
    setLoad(true);
    try {
      const res = await request("auth/register","post",{
        business_name:biz.name,
        owner_name:`${acc.firstName} ${acc.lastName}`,
        email:acc.email, password:acc.password, phone:acc.phone,
        plan_id:plan, province:loc.province, district:loc.city, address:loc.address,
      });
      if(res?.success){ setOk(true); setTimeout(()=>navigate("/login"),4000); }
      else message.error(res?.message||"Registration failed");
    } catch{}
    finally { setLoad(false); }
  };

  /* ── STEP FORMS ── */
  const Step1 = () => (
    <>
      <div className="ap-row">
        <F label="First Name *"><Inp placeholder="John" value={acc.firstName} onChange={e=>setAcc({...acc,firstName:e.target.value})}/></F>
        <F label="Last Name *"><Inp placeholder="Doe"  value={acc.lastName}  onChange={e=>setAcc({...acc,lastName:e.target.value})}/></F>
      </div>
      <div className="ap-row">
        <F label="Username">
          <Inp placeholder="johndoe" value={acc.username} onChange={e=>setAcc({...acc,username:e.target.value})}/>
        </F>
        <F label="Phone Number">
          <Inp placeholder="+855 012 345 678" value={acc.phone} onChange={e=>setAcc({...acc,phone:e.target.value})}/>
        </F>
      </div>
      <F label="Email Address *">
        <EmailInput 
          placeholder="you@company.com" 
          value={acc.email} 
          onChange={e=>setAcc({...acc,email:e.target.value})}
          onBlur={e => {
            const val = e.target.value.trim();
            if (val && !val.includes("@")) {
              setAcc({ ...acc, email: `${val}@gmail.com` });
            }
          }}
        />
      </F>
      <div className="ap-row">
        <F label={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <span>Password *</span>
            <a onClick={generateStrongPassword} style={{ fontSize: '11px', color: '#10b981', fontWeight: '500', textDecoration: 'underline', cursor: 'pointer' }}>
              Auto Generate
            </a>
          </div>
        }>
          <div className="ap-input-wrap">
            <Inp type={showP?"text":"password"} placeholder="Min 8 characters" style={{paddingRight:40}}
              value={acc.password} onChange={e=>setAcc({...acc,password:e.target.value})}/>
            <button className="ap-input-icon" onClick={()=>setShowP(!showP)}><EyeIcon open={showP}/></button>
          </div>
          {acc.password && (
            <div style={{ marginTop: 2, height: '3px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${strength * 25}%`,
                background: STR_COLORS[strength],
                transition: 'width 0.3s ease'
              }} />
            </div>
          )}
        </F>
        <F label="Confirm Password *">
          <div className="ap-input-wrap">
            <Inp type={showC?"text":"password"} placeholder="Repeat password" style={{paddingRight:40}}
              value={acc.confirm} onChange={e=>setAcc({...acc,confirm:e.target.value})}/>
            <button className="ap-input-icon" onClick={()=>setShowC(!showC)}><EyeIcon open={showC}/></button>
          </div>
          {acc.confirm && acc.password!==acc.confirm &&
            <div style={{fontSize:11,color:"#ef4444",marginTop:3}}>Passwords don't match</div>}
          {acc.confirm && acc.password===acc.confirm && acc.confirm.length>0 &&
            <div style={{fontSize:11,color:"#22C55E",marginTop:3,display:"flex",alignItems:"center",gap:4}}><CHECK/>Passwords match</div>}
        </F>
      </div>
    </>
  );

  const Step2 = () => (
    <>
      <F label="Company Name *">
        <Inp placeholder="Acme Corporation" value={biz.name} onChange={e=>setBiz({...biz,name:e.target.value})}/>
      </F>
      <div className="ap-row">
        <F label={
          <div style={{display:"flex",justifyContent:"space-between",width:"100%",alignItems:"center"}}>
            <span>Company Email</span>
            {acc.email && (
              <a href="#" onClick={(e) => {
                e.preventDefault();
                setBiz({...biz, email: acc.email});
              }} style={{fontSize:11,textDecoration:"none",fontWeight:500}}>
                Use personal email
              </a>
            )}
          </div>
        }>
          <EmailInput 
            placeholder="info@company.com" 
            value={biz.email} 
            onChange={e=>setBiz({...biz,email:e.target.value})}
            onBlur={e => {
              const val = e.target.value.trim();
              if (val && !val.includes("@")) {
                setBiz({ ...biz, email: `${val}@gmail.com` });
              }
            }}
          />
        </F>
        <F label={
          <div style={{display:"flex",justifyContent:"space-between",width:"100%",alignItems:"center"}}>
            <span>Company Phone</span>
            {acc.phone && (
              <a href="#" onClick={(e) => {
                e.preventDefault();
                setBiz({...biz, phone: acc.phone});
              }} style={{fontSize:11,textDecoration:"none",fontWeight:500}}>
                Use personal phone
              </a>
            )}
          </div>
        }>
          <Inp placeholder="+855 023 xxx xxx" value={biz.phone} onChange={e=>setBiz({...biz,phone:e.target.value})}/>
        </F>
      </div>
      <div className="ap-row">
        <F label="Tax / VAT Number (Optional)">
          <Inp placeholder="K001-XXXX" value={biz.tax} onChange={e=>setBiz({...biz,tax:e.target.value})}/>
        </F>
        <F label="Website (Optional)">
          <Inp placeholder="https://company.com" value={biz.website} onChange={e=>setBiz({...biz,website:e.target.value})}/>
        </F>
      </div>
    </>
  );

  const Step3 = () => (
    <>
      <div className="ap-row">
        <F label="Province / State">
          <Sel value={loc.province} onChange={e=>{
            const prov = e.target.value;
            const districts = CAMBODIA_GEO[prov] || [];
            setLoc({...loc, province: prov, city: districts[0] || ""});
          }}>
            {Object.keys(CAMBODIA_GEO).map(p=><option key={p} value={p}>{p}</option>)}
          </Sel>
        </F>
        <F label="City / District">
          <Sel value={loc.city} onChange={e=>setLoc({...loc,city:e.target.value})}>
            {(CAMBODIA_GEO[loc.province] || []).map(d=><option key={d} value={d}>{d}</option>)}
          </Sel>
        </F>
      </div>
      <F label="Full Address">
        <Inp placeholder="Street, Building No, District…" value={loc.address} onChange={e=>setLoc({...loc,address:e.target.value})}/>
      </F>
    </>
  );

  const Step4 = () => (
    <>
      <div style={{marginBottom:24,textAlign:"center"}}>
        <span style={{fontSize:48}}>📄</span>
        <h3 style={{color:"var(--text)",marginTop:12,fontSize:18,fontWeight:700}}>Review and Confirm</h3>
        <p style={{color:"var(--muted)",fontSize:13,marginTop:6,lineHeight:1.5}}>
          Please read and accept our Terms of Service and Privacy Policy to finalize your workspace creation.
        </p>
      </div>
      <div style={{background:"var(--bg)",border:"1px solid var(--border)",borderRadius:12,padding:"18px 20px"}}>
        <div className="ap-check-row" style={{marginBottom:12}}>
          <input type="checkbox" id="terms" checked={agreed} onChange={e=>setAgreed(e.target.checked)}/>
          <label htmlFor="terms" style={{fontSize:13,cursor:"pointer"}}>
            I agree to the <a href="#" style={{color:"var(--green)",textDecoration:"none"}}>Terms and Conditions</a>
          </label>
        </div>
        <div className="ap-check-row" style={{marginBottom:0}}>
          <input type="checkbox" id="priv" checked={privacyOk} onChange={e=>setPrivacy(e.target.checked)}/>
          <label htmlFor="priv" style={{fontSize:13,cursor:"pointer"}}>
            I have read the <a href="#" style={{color:"var(--green)",textDecoration:"none"}}>Privacy Policy</a>
          </label>
        </div>
      </div>
    </>
  );

  /* ── SUCCESS ── */
  if (success) return (
    <div className="ap-root" style={{alignItems:"center",justifyContent:"center"}}>
      <div className="ap-card" style={{maxWidth:440,textAlign:"center"}}>
        <div className="ap-success">
          <div className="ap-success-anim">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5">
              <polyline points="20,6 9,17 4,12"/>
            </svg>
          </div>
          <div className="ap-success-title">Account Created! 🎉</div>
          <div className="ap-success-sub">Your workspace is being prepared. Check your email to verify your account before logging in.</div>
          <div style={{fontSize:12,color:"rgba(255,255,255,0.3)"}}>Redirecting to login…</div>
        </div>
      </div>
    </div>
  );

  /* ── MAIN LAYOUT ── */
  return (
    <div className="ap-root">
      {/* ── LEFT PANEL ── */}
      <div className="ap-left" style={{justifyContent:"space-between"}}>
        <Link to="/" className="ap-logo-row" style={{ textDecoration: "none" }}>
          <div className="ap-logo-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="#0A5C36" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="ap-logo-name">GrowMe<span>Platform</span></div>
        </Link>

        {/* Step Sidebar Navigation */}
        <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",gap:6,padding:"24px 0"}}>
          <div style={{fontSize:12,fontWeight:700,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:"1px",marginBottom:16}}>
            Setup Progress
          </div>
          {STEP_INFO.map((s,i)=>{
            const n=i+1;
            const isDone=n<step, isActive=n===step;
            return (
              <div key={n} style={{
                display:"flex",alignItems:"center",gap:12,padding:"10px 14px",borderRadius:12,
                background:isActive?"rgba(255,255,255,0.08)":isDone?"rgba(255,255,255,0.04)":"transparent",
                border:isActive?"1px solid rgba(255,255,255,0.15)":"1px solid transparent",
                transition:".25s",
              }}>
                <div style={{
                  width:30,height:30,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",
                  background:isDone?"#ffffff":isActive?"rgba(255,255,255,0.15)":"rgba(255,255,255,0.04)",
                  border:isDone?"none":isActive?"1px solid rgba(255,255,255,0.3)":"1px solid rgba(255,255,255,0.06)",
                  flexShrink:0,fontSize:14,
                  boxShadow:isDone?"0 0 12px rgba(255,255,255,0.2)":isActive?"0 0 8px rgba(255,255,255,0.1)":"none",
                }}>
                  {isDone
                    ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0A5C36" strokeWidth="3"><polyline points="20,6 9,17 4,12"/></svg>
                    : <span style={{fontSize:13}}>{s.icon}</span>}
                </div>
                <div>
                  <div style={{fontSize:13,fontWeight:isActive?700:500,color:isActive?"#fff":isDone?"rgba(255,255,255,0.8)":"rgba(255,255,255,0.5)",marginBottom:1}}>
                    {s.title}
                  </div>
                  <div style={{fontSize:11,color:isActive?"rgba(255,255,255,0.6)":"rgba(255,255,255,0.3)"}}>{s.sub}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Feature pills */}
        <div>
          <div style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.2)",textTransform:"uppercase",letterSpacing:"1px",marginBottom:12}}>
            What you get
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {LEFT_FEATURES.map(f=>(
              <div key={f.label} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 10px",background:"rgba(255,255,255,0.02)",borderRadius:8,border:"1px solid rgba(255,255,255,0.04)"}}>
                <span style={{fontSize:13}}>{f.icon}</span>
                <span style={{fontSize:11,color:"rgba(255,255,255,0.5)",fontWeight:500}}>{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="ap-right" style={{padding:"32px 40px",alignItems:"flex-start",overflowY:"auto"}}>
        <div style={{width:"100%",maxWidth:580,margin:"0 auto"}}>

          {/* Progress bar */}
          <div className="ap-step-bar-wrap" style={{marginBottom:24}}>
            <div className="ap-step-label">
              <span>Step <strong>{step}</strong> of {STEPS.length} — <strong style={{color:"var(--text)"}}>{STEPS[step-1]}</strong></span>
              <span style={{color:"var(--green)",fontWeight:700}}>{Math.round(progress)}% complete</span>
            </div>
            <div className="ap-step-track"><div className="ap-step-fill" style={{width:`${progress}%`}}/></div>
          </div>

          {/* Step header */}
          <div style={{marginBottom:28}}>
            <h2 style={{fontSize:26,fontWeight:800,color:"var(--text)",letterSpacing:"-.5px",marginBottom:6}}>
              {STEP_INFO[step-1].icon} {STEP_INFO[step-1].title}
            </h2>
            <p style={{fontSize:14,color:"var(--muted)"}}>{STEP_INFO[step-1].sub}</p>
          </div>

          {/* Form body */}
          <div className="ap-card" style={{ maxWidth: "none", padding: "28px 32px", marginBottom: 20 }}>
            {step===1 && Step1()}
            {step===2 && Step2()}
            {step===3 && Step3()}
            {step===4 && Step4()}
          </div>

          {/* Navigation buttons */}
          <div style={{display:"flex",gap:12}}>
            {step>1
              ? <button className="ap-btn ap-btn-ghost" style={{flex:1}} onClick={back}>← Back</button>
              : <Link to="/login" className="ap-btn ap-btn-ghost" style={{flex:1,textAlign:"center"}}>← Sign In</Link>
            }
            {step<4
              ? <button className="ap-btn ap-btn-green" style={{flex:2}} onClick={next}>Continue →</button>
              : <button className={`ap-btn ap-btn-green${loading?" ap-btn-disabled":""}`} style={{flex:2}} onClick={onSubmit}>
                  {loading?"Creating Workspace…":"🚀 Create Workspace"}
                </button>
            }
          </div>

          <div style={{textAlign:"center",marginTop:16,fontSize:12,color:"var(--dim)"}}>
            Already have an account?{" "}
            <Link to="/login" style={{color:"var(--green)",fontWeight:600,textDecoration:"none"}}>Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}