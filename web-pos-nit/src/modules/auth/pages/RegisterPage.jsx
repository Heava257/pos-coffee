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
const STR_COLORS = ["","#ef4444","#f97316","#eab308","#22C55E"];

const EyeIcon = ({ open }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    {open
      ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
      : <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><line x1="1" y1="1" x2="23" y2="23"/></>}
  </svg>
);

const CHECK = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5">
    <polyline points="20,6 9,17 4,12"/>
  </svg>
);

const STEPS = ["Account","Company","Location","Plan","Verify"];

const STEP_INFO = [
  { icon:"👤", title:"Account Info",    sub:"Set up your personal credentials" },
  { icon:"🏢", title:"Company Info",    sub:"Tell us about your business" },
  { icon:"📍", title:"Location",        sub:"Where is your business based?" },
  { icon:"💳", title:"Subscription",    sub:"Choose the right plan" },
  { icon:"✅", title:"Verification",    sub:"Confirm your identity" },
];

const LEFT_FEATURES = [
  { icon:"🏪", label:"Multi-branch POS" },
  { icon:"📦", label:"Smart Inventory" },
  { icon:"👥", label:"Team & HR Tools" },
  { icon:"📊", label:"Live Analytics" },
  { icon:"🔒", label:"Enterprise Security" },
  { icon:"🚀", label:"Scalable Platform" },
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

export default function RegisterPage() {
  const navigate = useNavigate();
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
  const [plan, setPlan] = useState(2); // Pro Plan by default
  const [dbPlans, setDbPlans] = useState([]);
  const [otp, setOtp]   = useState(["","","","","",""]);
  const [agreed, setAgreed]     = useState(false);
  const [privacyOk, setPrivacy] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await request("plans/public", "get");
        if (res && res.success && res.plans) {
          const mapped = res.plans.map(p => {
            let feats = [];
            if (p.id === 1) feats = [`${p.max_branches} Branch`, `${p.max_staff} Users`, `Max ${p.max_products} Products`, "Basic POS"];
            else if (p.id === 2) feats = [`${p.max_branches} Branches`, `${p.max_staff} Users`, `Max ${p.max_products} Products`, "Priority Support"];
            else feats = ["Unlimited Branches", "Unlimited Users", "White Label & API", "Dedicated Manager"];
            
            return {
              id: p.id,
              name: p.name,
              price: parseFloat(p.price) || 0,
              cycle: p.billing_cycle || "monthly",
              feats: feats,
              popular: p.id === 2
            };
          });
          setDbPlans(mapped);
          const hasPro = mapped.find(p => p.id === 2);
          if (hasPro) setPlan(2);
          else if (mapped.length > 0) setPlan(mapped[0].id);
        }
      } catch (e) {
        console.error("Error fetching plans:", e);
      }
    };
    fetchPlans();
  }, []);

  const strength = getStrength(acc.password);
  const progress = ((step-1)/(STEPS.length-1))*100;

  const F = ({ label, children, style }) => (
    <div className="ap-field" style={style}>{label && <label className="ap-label">{label}</label>}{children}</div>
  );

  const Inp = (props) => <input className="ap-input" {...props} />;
  const Sel = ({ children, ...props }) => <select className="ap-input" {...props}>{children}</select>;

  const validate = () => {
    if (step===1) {
      if (!acc.firstName||!acc.lastName||!acc.email||!acc.password){message.warning("Fill all required fields");return false;}
      if (!/\S+@\S+\.\S+/.test(acc.email)){message.warning("Enter a valid email");return false;}
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
        plan_id:plan, province:loc.province, district:loc.city,
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
        <Inp type="email" placeholder="you@company.com" value={acc.email} onChange={e=>setAcc({...acc,email:e.target.value})}/>
      </F>
      <div className="ap-row">
        <F label="Password *">
          <div className="ap-input-wrap">
            <Inp type={showP?"text":"password"} placeholder="Min 8 characters" style={{paddingRight:40}}
              value={acc.password} onChange={e=>setAcc({...acc,password:e.target.value})}/>
            <button className="ap-input-icon" onClick={()=>setShowP(!showP)}><EyeIcon open={showP}/></button>
          </div>
          {acc.password && <>
            <div className="ap-strength" style={{marginTop:6}}>
              {[1,2,3,4].map(i=><div key={i} className={`ap-strength-bar${i<=strength?` s${strength}`:""}`}/>)}
            </div>
            <div className="ap-strength-label" style={{color:STR_COLORS[strength],marginTop:3}}>{STR_LABELS[strength]}</div>
          </>}
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
      <div className="ap-row">
        <F label="Company Name *">
          <Inp placeholder="Acme Corporation" value={biz.name} onChange={e=>setBiz({...biz,name:e.target.value})}/>
        </F>
        <F label="Business Type">
          <Sel value={biz.type} onChange={e=>setBiz({...biz,type:e.target.value})}>
            <option value="">Select type…</option>
            {BIZ_TYPES.map(t=><option key={t}>{t}</option>)}
          </Sel>
        </F>
      </div>
      <div className="ap-row">
        <F label="Company Email">
          <Inp type="email" placeholder="info@company.com" value={biz.email} onChange={e=>setBiz({...biz,email:e.target.value})}/>
        </F>
        <F label="Company Phone">
          <Inp placeholder="+855 023 xxx xxx" value={biz.phone} onChange={e=>setBiz({...biz,phone:e.target.value})}/>
        </F>
      </div>
      <div className="ap-row">
        <F label="Tax / VAT Number">
          <Inp placeholder="K001-XXXX" value={biz.tax} onChange={e=>setBiz({...biz,tax:e.target.value})}/>
        </F>
        <F label="Website">
          <Inp placeholder="https://company.com" value={biz.website} onChange={e=>setBiz({...biz,website:e.target.value})}/>
        </F>
      </div>
      <F label="Company Logo">
        <div className="ap-upload">
          <div className="ap-upload-icon">🖼️</div>
          <div className="ap-upload-text">Click or drag logo here · PNG, JPG, SVG · Max 2MB</div>
        </div>
      </F>
    </>
  );

  const Step3 = () => (
    <>
      <div className="ap-row">
        <F label="Country">
          <Sel value={loc.country} onChange={e=>setLoc({...loc,country:e.target.value})}>
            {COUNTRIES.map(c=><option key={c}>{c}</option>)}
          </Sel>
        </F>
        <F label="Province / State">
          <Sel value={loc.province} onChange={e=>{
            const prov = e.target.value;
            const districts = CAMBODIA_GEO[prov] || [];
            setLoc({...loc, province: prov, city: districts[0] || ""});
          }}>
            {Object.keys(CAMBODIA_GEO).map(p=><option key={p} value={p}>{p}</option>)}
          </Sel>
        </F>
      </div>
      <div className="ap-row">
        <F label="City / District">
          <Sel value={loc.city} onChange={e=>setLoc({...loc,city:e.target.value})}>
            {(CAMBODIA_GEO[loc.province] || []).map(d=><option key={d} value={d}>{d}</option>)}
          </Sel>
        </F>
        <F label="Timezone">
          <Sel value={loc.timezone} onChange={e=>setLoc({...loc,timezone:e.target.value})}>
            {TIMEZONES.map(t=><option key={t}>{t}</option>)}
          </Sel>
        </F>
      </div>
      <F label="Full Address">
        <Inp placeholder="Street, Building No, District…" value={loc.address} onChange={e=>setLoc({...loc,address:e.target.value})}/>
      </F>
      <div className="ap-row">
        <F label="Currency">
          <Sel value={loc.currency} onChange={e=>setLoc({...loc,currency:e.target.value})}>
            {CURRENCIES.map(c=><option key={c}>{c}</option>)}
          </Sel>
        </F>
        <F label="Default Language">
          <Sel value={loc.language} onChange={e=>setLoc({...loc,language:e.target.value})}>
            {LANGUAGES.map(l=><option key={l}>{l}</option>)}
          </Sel>
        </F>
      </div>
    </>
  );

  const Step4 = () => {
    const displayedPlans = dbPlans.length > 0 ? dbPlans : PLANS;
    return (
      <>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div className="ap-plan-toggle">
            {["Monthly","Yearly"].map(v=>(
              <button key={v} className={`ap-plan-toggle-btn${(v==="Yearly"?yearly:!yearly)?" active":""}`}
                onClick={()=>setYearly(v==="Yearly")}>
                {v}{v==="Yearly"&&<span style={{fontSize:10,marginLeft:4,opacity:.7}}>Save 20%</span>}
              </button>
            ))}
          </div>
          {yearly && <div style={{fontSize:11,color:"#22C55E",marginTop:8}}>🎉 2 months free with annual billing</div>}
        </div>
        <div className="ap-plan-cards">
          {displayedPlans.map(p=>(
            <div key={p.id} className={`ap-plan-card${plan===p.id?" selected":""}`} onClick={()=>setPlan(p.id)}>
              {p.popular && <div className="ap-plan-badge">⭐ Recommended</div>}
              <div className="ap-plan-name">{p.name}</div>
              <div className="ap-plan-price">${yearly && p.cycle === "monthly" ? Math.round(p.price * 0.8) : p.price}<span>/{p.cycle === "lifetime" ? "lifetime" : "mo"}</span></div>
              <ul className="ap-plan-feats">{p.feats.map(f=><li key={f}>{f}</li>)}</ul>
            </div>
          ))}
        </div>
      </>
    );
  };

  const Step5 = () => (
    <>
      <div style={{marginBottom:20,padding:"16px",background:"rgba(34,197,94,0.05)",border:"1px solid rgba(34,197,94,0.15)",borderRadius:14}}>
        <div style={{fontSize:12,fontWeight:600,color:"#22C55E",marginBottom:8}}>📧 Email Verification</div>
        <div style={{fontSize:12,color:"rgba(255,255,255,0.45)",marginBottom:12}}>Code sent to: {acc.email||"your email"}</div>
        <div className="ap-otp-row">
          {otp.map((v,i)=>(
            <input key={i} ref={otpRefs[i]} className="ap-otp-input" maxLength={1} value={v}
              onChange={e=>handleOtp(i,e.target.value)}
              onKeyDown={e=>e.key==="Backspace"&&!v&&i>0&&otpRefs[i-1].current?.focus()}/>
          ))}
        </div>
        <button style={{background:"none",border:"none",color:"#22C55E",fontSize:12,cursor:"pointer",fontFamily:"inherit",marginTop:4}}>
          ↺ Resend code
        </button>
      </div>
      <div style={{marginBottom:16,padding:"14px 16px",background:"rgba(255,255,255,0.02)",borderRadius:12,border:"1px solid rgba(255,255,255,0.06)"}}>
        <div style={{fontSize:12,fontWeight:600,color:"rgba(255,255,255,0.7)",marginBottom:8}}>📱 SMS Verification</div>
        <Inp placeholder="Enter 6-digit SMS code"/>
        <button style={{background:"none",border:"none",color:"#22C55E",fontSize:12,cursor:"pointer",fontFamily:"inherit",marginTop:6}}>
          ↺ Resend SMS
        </button>
      </div>
      <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"14px 16px"}}>
        <div className="ap-check-row" style={{marginBottom:10}}>
          <input type="checkbox" id="terms" checked={agreed} onChange={e=>setAgreed(e.target.checked)}/>
          <label htmlFor="terms" style={{fontSize:13}}>
            I agree to the <a href="#" style={{color:"#22C55E",textDecoration:"none"}}>Terms and Conditions</a>
          </label>
        </div>
        <div className="ap-check-row" style={{marginBottom:0}}>
          <input type="checkbox" id="priv" checked={privacyOk} onChange={e=>setPrivacy(e.target.checked)}/>
          <label htmlFor="priv" style={{fontSize:13}}>
            I have read the <a href="#" style={{color:"#22C55E",textDecoration:"none"}}>Privacy Policy</a>
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
        <div className="ap-logo-row">
          <div className="ap-logo-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="#020c05" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="ap-logo-name">SaaS<span>Platform</span></div>
        </div>

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
                background:isActive?"rgba(34,197,94,0.08)":isDone?"rgba(34,197,94,0.04)":"transparent",
                border:isActive?"1px solid rgba(34,197,94,0.2)":"1px solid transparent",
                transition:".25s",
              }}>
                <div style={{
                  width:30,height:30,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",
                  background:isDone?"#22C55E":isActive?"rgba(34,197,94,0.15)":"rgba(255,255,255,0.04)",
                  border:isDone?"none":isActive?"1px solid rgba(34,197,94,0.4)":"1px solid rgba(255,255,255,0.06)",
                  flexShrink:0,fontSize:14,
                  boxShadow:isDone?"0 0 12px rgba(34,197,94,0.4)":isActive?"0 0 8px rgba(34,197,94,0.2)":"none",
                }}>
                  {isDone
                    ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#020c05" strokeWidth="3"><polyline points="20,6 9,17 4,12"/></svg>
                    : <span style={{fontSize:13}}>{s.icon}</span>}
                </div>
                <div>
                  <div style={{fontSize:13,fontWeight:isActive?700:500,color:isActive?"#fff":isDone?"rgba(255,255,255,0.6)":"rgba(255,255,255,0.35)",marginBottom:1}}>
                    {s.title}
                  </div>
                  <div style={{fontSize:11,color:isActive?"rgba(255,255,255,0.45)":"rgba(255,255,255,0.2)"}}>{s.sub}</div>
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
              <span>Step <strong>{step}</strong> of {STEPS.length} — <strong style={{color:"rgba(255,255,255,0.8)"}}>{STEPS[step-1]}</strong></span>
              <span style={{color:"#22C55E",fontWeight:700}}>{Math.round(progress)}% complete</span>
            </div>
            <div className="ap-step-track"><div className="ap-step-fill" style={{width:`${progress}%`}}/></div>
          </div>

          {/* Step header */}
          <div style={{marginBottom:28}}>
            <h2 style={{fontSize:26,fontWeight:800,color:"#fff",letterSpacing:"-.5px",marginBottom:6}}>
              {STEP_INFO[step-1].icon} {STEP_INFO[step-1].title}
            </h2>
            <p style={{fontSize:14,color:"rgba(255,255,255,0.45)"}}>{STEP_INFO[step-1].sub}</p>
          </div>

          {/* Form body */}
          <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:20,padding:"28px 32px",marginBottom:20}}>
            {step===1 && <Step1/>}
            {step===2 && <Step2/>}
            {step===3 && <Step3/>}
            {step===4 && <Step4/>}
            {step===5 && <Step5/>}
          </div>

          {/* Navigation buttons */}
          <div style={{display:"flex",gap:12}}>
            {step>1
              ? <button className="ap-btn ap-btn-ghost" style={{flex:1}} onClick={back}>← Back</button>
              : <Link to="/login" className="ap-btn ap-btn-ghost" style={{flex:1,textAlign:"center"}}>← Sign In</Link>
            }
            {step<5
              ? <button className="ap-btn ap-btn-green" style={{flex:2}} onClick={next}>Continue →</button>
              : <button className={`ap-btn ap-btn-green${loading?" ap-btn-disabled":""}`} style={{flex:2}} onClick={onSubmit}>
                  {loading?"Creating Workspace…":"🚀 Create Workspace"}
                </button>
            }
          </div>

          <div style={{textAlign:"center",marginTop:16,fontSize:12,color:"rgba(255,255,255,0.3)"}}>
            Already have an account?{" "}
            <Link to="/login" style={{color:"#22C55E",fontWeight:600,textDecoration:"none"}}>Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}