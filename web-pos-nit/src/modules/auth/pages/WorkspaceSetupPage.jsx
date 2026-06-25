import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AuthPremium.css";

const ROLES = ["Owner","Admin","Manager","Staff","Cashier"];
const MODULES = [
  { id:"pos",        icon:"🏪", name:"POS" },
  { id:"inventory",  icon:"📦", name:"Inventory" },
  { id:"hrm",        icon:"👥", name:"HRM" },
  { id:"crm",        icon:"💼", name:"CRM" },
  { id:"accounting", icon:"📊", name:"Accounting" },
  { id:"projects",   icon:"🚀", name:"Projects" },
  { id:"reports",    icon:"📈", name:"Reports" },
];
const IMPORT_OPTIONS = [
  { id:"excel",  icon:"📗", label:"Excel (.xlsx)" },
  { id:"csv",    icon:"📄", label:"CSV File" },
  { id:"sheets", icon:"📋", label:"Google Sheets" },
  { id:"skip",   icon:"⏭️", label:"Skip for now" },
];
const STEPS = ["Branch","Team","Modules","Import","Complete"];

export default function WorkspaceSetupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Step 1
  const [branch, setBranch] = useState({ name:"", address:"", phone:"" });
  // Step 2
  const [members, setMembers] = useState([{ email:"", role:"Admin" }]);
  // Step 3
  const [mods, setMods]   = useState(["pos","inventory"]);
  // Step 4
  const [importOpt, setImportOpt] = useState("skip");

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;
  const next = () => setStep(s => Math.min(s+1, STEPS.length));
  const back = () => setStep(s => Math.max(s-1, 1));

  const addMember = () => setMembers(m => [...m, { email:"", role:"Staff" }]);
  const removeMember = i => setMembers(m => m.filter((_,idx) => idx !== i));
  const toggleMod = id => setMods(m => m.includes(id) ? m.filter(x=>x!==id) : [...m, id]);

  const renderStep1 = () => (
    <>
      <div style={{background:"rgba(34,197,94,0.06)",border:"1px solid rgba(34,197,94,0.15)",borderRadius:14,padding:"14px 16px",marginBottom:20}}>
        <div style={{fontSize:12,color:"#22C55E",fontWeight:600,marginBottom:4}}>🏪 First Branch Setup</div>
        <div style={{fontSize:12,color:"rgba(255,255,255,0.5)"}}>You can add more branches anytime from your dashboard.</div>
      </div>
      <div className="ap-field"><label className="ap-label">Branch Name *</label>
        <input className="ap-input" placeholder="Main Branch / Headquarters" value={branch.name}
          onChange={e => setBranch({...branch,name:e.target.value})} />
      </div>
      <div className="ap-field"><label className="ap-label">Address</label>
        <input className="ap-input" placeholder="Street, District, City" value={branch.address}
          onChange={e => setBranch({...branch,address:e.target.value})} />
      </div>
      <div className="ap-field"><label className="ap-label">Phone</label>
        <input className="ap-input" placeholder="+855 xxx xxx xxx" value={branch.phone}
          onChange={e => setBranch({...branch,phone:e.target.value})} />
      </div>
    </>
  );

  const renderStep2 = () => (
    <>
      <div style={{fontSize:13,color:"rgba(255,255,255,0.5)",marginBottom:16}}>
        Invite teammates to collaborate. They'll receive an email invitation.
      </div>
      {members.map((m, i) => (
        <div key={i} className="ap-member-row">
          <input className="ap-input" placeholder="teammate@company.com" value={m.email}
            onChange={e => { const n=[...members]; n[i]={...n[i],email:e.target.value}; setMembers(n); }} />
          <select className="ap-input" value={m.role}
            onChange={e => { const n=[...members]; n[i]={...n[i],role:e.target.value}; setMembers(n); }}>
            {ROLES.map(r => <option key={r}>{r}</option>)}
          </select>
          {members.length > 1 && (
            <button className="ap-remove-btn" onClick={() => removeMember(i)}>✕</button>
          )}
        </div>
      ))}
      <button className="ap-add-btn" onClick={addMember}>+ Add another member</button>
      <div style={{marginTop:16,padding:"10px 14px",background:"rgba(255,255,255,0.02)",borderRadius:10,border:"1px solid rgba(255,255,255,0.06)"}}>
        <div style={{fontSize:11,color:"rgba(255,255,255,0.3)",marginBottom:6}}>ROLE PERMISSIONS OVERVIEW</div>
        {[["Owner","Full access to everything"],["Admin","Manage all except billing"],["Manager","Manage branches & staff"],["Staff","Basic operations"],["Cashier","POS & sales only"]].map(([r,d]) => (
          <div key={r} style={{display:"flex",justifyContent:"space-between",fontSize:11,padding:"4px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
            <span style={{color:"rgba(255,255,255,0.6)",fontWeight:600}}>{r}</span>
            <span style={{color:"rgba(255,255,255,0.35)"}}>{d}</span>
          </div>
        ))}
      </div>
    </>
  );

  const renderStep3 = () => (
    <>
      <div style={{fontSize:13,color:"rgba(255,255,255,0.5)",marginBottom:16}}>
        Select modules to enable for your workspace. You can change this later.
      </div>
      <div className="ap-module-grid">
        {MODULES.map(m => (
          <div key={m.id} className={`ap-module-item${mods.includes(m.id)?" sel":""}`}
            onClick={() => toggleMod(m.id)}>
            <div className="icon">{m.icon}</div>
            <div className="name">{m.name}</div>
          </div>
        ))}
      </div>
      <div style={{fontSize:11,color:"rgba(255,255,255,0.3)",textAlign:"center"}}>
        {mods.length} module{mods.length!==1?"s":""} selected
      </div>
    </>
  );

  const renderStep4 = () => (
    <>
      <div style={{fontSize:13,color:"rgba(255,255,255,0.5)",marginBottom:16}}>
        Import your existing data or start fresh and add data manually.
      </div>
      <div className="ap-import-grid">
        {IMPORT_OPTIONS.map(o => (
          <div key={o.id} className={`ap-import-card${importOpt===o.id?" sel":""}`}
            onClick={() => setImportOpt(o.id)}>
            <div className="icon">{o.icon}</div>
            <div className="label">{o.label}</div>
          </div>
        ))}
      </div>
      {importOpt !== "skip" && (
        <div className="ap-upload" style={{marginTop:8}}>
          <div className="ap-upload-icon">📂</div>
          <div className="ap-upload-text">Drop your {importOpt.toUpperCase()} file here or click to browse</div>
        </div>
      )}
    </>
  );

  const renderStep5 = () => (
    <div className="ap-success">
      <div className="ap-success-anim" style={{width:80,height:80}}>
        <span style={{fontSize:32}}>🎉</span>
      </div>
      <div className="ap-success-title">Welcome to SaaS Platform!</div>
      <div className="ap-success-sub">Your workspace is ready. Start managing your business smarter.</div>
      <div style={{display:"flex",flexDirection:"column",gap:10,marginTop:8}}>
        <button className="ap-btn ap-btn-green" onClick={() => navigate("/dashboard")}>
          🚀 Go to Dashboard
        </button>
        <button className="ap-btn ap-btn-ghost" onClick={() => {}}>
          🎬 Watch Tutorial
        </button>
        <button className="ap-btn ap-btn-ghost" onClick={() => {}}>
          📅 Book a Demo
        </button>
      </div>
      {/* Setup summary */}
      <div style={{marginTop:20,background:"rgba(255,255,255,0.02)",borderRadius:12,border:"1px solid rgba(255,255,255,0.06)",padding:"14px 16px",textAlign:"left"}}>
        <div style={{fontSize:11,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:".5px",marginBottom:10}}>Setup Summary</div>
        {[
          ["Branch", branch.name || "Main Branch"],
          ["Team Members", `${members.length} invited`],
          ["Modules", `${mods.length} enabled`],
          ["Data Import", importOpt === "skip" ? "Skipped" : importOpt.toUpperCase()],
        ].map(([k,v]) => (
          <div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:12,padding:"5px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
            <span style={{color:"rgba(255,255,255,0.45)"}}>{k}</span>
            <span style={{color:"rgba(255,255,255,0.8)",fontWeight:600}}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="ap-root" style={{alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:"32px 20px"}}>
      <div className="ap-card" style={{maxWidth:500}}>
        {/* Logo */}
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:24}}>
          <div className="ap-logo-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="#020c05" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div className="ap-logo-name">Workspace <span style={{color:"#22C55E"}}>Setup</span></div>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.3)"}}>Let's get you ready in 2 minutes</div>
          </div>
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
        {step < 5 && (
          <div style={{marginBottom:20}}>
            <div className="ap-card-title">{STEPS[step-1]}</div>
            <div style={{fontSize:13,color:"rgba(255,255,255,0.4)"}}>
              {["Create your first branch location","Invite your team to collaborate","Select modules to activate","Import existing data (optional)",""][step-1]}
            </div>
          </div>
        )}

        {/* Step content */}
        {step===1 && renderStep1()}
        {step===2 && renderStep2()}
        {step===3 && renderStep3()}
        {step===4 && renderStep4()}
        {step===5 && renderStep5()}

        {/* Navigation */}
        {step < 5 && (
          <div className="ap-btn-group" style={{marginTop:20}}>
            {step > 1
              ? <button className="ap-btn ap-btn-ghost" onClick={back}>← Back</button>
              : <div />
            }
            <button className="ap-btn ap-btn-green" onClick={next}>
              {step === 4 ? "🚀 Finish Setup" : "Continue →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
