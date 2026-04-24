import React, { useState, useEffect, useMemo } from 'react';
import { request } from '../../util/helper';
import { Config } from '../../util/config';
import { getProfile, getGuestProfile } from '../../store/profile.store';
import { message, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useLanguage, translations } from '../../store/language.store';

/* ──────────────────────────────────────────────────────────────
   CSS INJECTION (Aurora Style)
────────────────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
.app-container { font-family:'DM Sans',sans-serif; background:#F4EFE6; -webkit-font-smoothing:antialiased; min-height: 100vh; }
.brand{font-family:'Cormorant Garamond',serif}
.noscroll::-webkit-scrollbar{display:none}
.noscroll{-ms-overflow-style:none;scrollbar-width:none}
.fade-in{animation:fadeIn .18s ease}
.slide-up{animation:slideUp .28s cubic-bezier(.34,1.4,.64,1)}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
@keyframes pulseGold{0%,100%{box-shadow:0 0 0 0 rgba(200,149,42,.45)}50%{box-shadow:0 0 0 8px rgba(200,149,42,0)}}
.pulse-gold{animation:pulseGold 2s infinite}

/* ── PRODUCT CARD ── */
.pcard{background:#fff;border-radius:18px;overflow:hidden;cursor:pointer;
  box-shadow:0 2px 12px rgba(0,0,0,.06);transition:transform .14s,box-shadow .14s}
.pcard:active{transform:scale(.97);box-shadow:0 1px 6px rgba(0,0,0,.08)}
.pcard-img{width:100%;aspect-ratio:4/3;object-fit:cover;display:block;background:#EDE8DF}

/* ── CATEGORY PILL ── */
.cpill{display:flex;flex-direction:column;align-items:center;gap:5px;
  padding:10px 14px;border-radius:18px;transition:all .18s;white-space:nowrap;flex-shrink:0; border:none; outline:none; cursor:pointer;}
.cpill.on{background:#4A6741;color:#fff}
.cpill.off{background:#fff;color:#8A8070}
.cpill-icon{width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px}
.cpill.on  .cpill-icon{background:rgba(255,255,255,.2)}
.cpill.off .cpill-icon{background:#F5F0E8}
.cpill span{font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase}

/* ── BOTTOM NAV ── */
.bnav{position:fixed;bottom:0;left:0;right:0;background:#fff;
  display:flex;align-items:center;justify-content:space-around;
  padding:10px 20px 28px;border-top:1px solid #EDE8DF;z-index:200}
.bnav-btn{display:flex;flex-direction:column;align-items:center;gap:3px;
  background:none;color:#B0A496;padding:6px 10px;transition:color .16s; border:none; outline:none;}
.bnav-btn.on{color:#4A6741}
.bnav-cart-wrap{position:relative}
.bnav-cart{width:52px;height:52px;border-radius:15px;background:#1C1C1C;
  color:#fff;display:flex;align-items:center;justify-content:center;
  box-shadow:0 4px 14px rgba(0,0,0,.22);transition:transform .14s; border:none;}
.bnav-cart:active{transform:scale(.93)}
.cart-badge{position:absolute;top:-6px;right:-6px;width:20px;height:20px;border-radius:50%;
  background:#E8534A;color:#fff;font-size:10px;font-weight:700;
  display:flex;align-items:center;justify-content:center;border:2px solid #fff}

/* ── SEARCH ── */
.search-wrap{position:relative;margin:16px 16px 0}
.search-icon{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:#B0A496;pointer-events:none}
.search-inp{width:100%;height:46px;padding:0 16px 0 42px;border-radius:14px;
  border:1.5px solid #EDE8DF;background:#fff;font-size:14px;color:#1C1C1C;
  transition:border-color .18s; outline:none;}
.search-inp:focus{border-color:#4A6741}
.search-inp::placeholder{color:#C0B8AE}

/* ── MODAL OVERLAY ── */
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.46);z-index:300;
  display:flex;align-items:flex-end;justify-content:center}
.modal-sheet{background:#fff;width:100%;border-radius:26px 26px 0 0;
  max-height:92vh;display:flex;flex-direction:column;overflow:hidden}
.modal-sheet.center-modal{border-radius:22px;max-width:480px;margin:16px;max-height:90vh; align-self: center;}
.modal-inner{overflow-y:auto;flex:1}
.modal-inner::-webkit-scrollbar{display:none}
.drag-handle{width:38px;height:4px;border-radius:2px;background:#DDD8CF;margin:10px auto 0;flex-shrink:0}

.opill{padding:10px 18px;border-radius:100px;border:1.5px solid;
  font-size:13px;font-weight:600;transition:all .16s;white-space:nowrap; background:none; cursor:pointer;}

.tgl{width:48px;height:26px;border-radius:13px;position:relative;cursor:pointer;transition:background .28s;flex-shrink:0}
.tgl-dot{position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;
  background:#fff;transition:transform .28s;box-shadow:0 1px 4px rgba(0,0,0,.18)}
.tgl-dot.on{transform:translateX(22px)}

.qty-ctrl{display:flex;align-items:center;gap:12px;background:#F5F0E8;padding:6px 10px;border-radius:100px}
.qty-btn{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;transition:transform .13s; border:none; cursor:pointer;}
.qty-btn:active{transform:scale(.9)}

.cart-item{display:flex;gap:12px;padding:12px;background:#FAFAF8;
  border-radius:14px;border:1px solid #EDE8DF}

.step-circle{width:58px;height:58px;border-radius:50%;border:3px solid;
  display:flex;align-items:center;justify-content:center;font-size:22px;
  position:relative;z-index:1;flex-shrink:0}

@media(min-width:768px){
  .app-root{display:flex;min-height:100vh;max-width:1160px;margin:0 auto;position:relative}
  .main-col{flex:1;min-width:0;background:#F4EFE6}
  .sidebar{width:380px;flex-shrink:0;background:#fff;border-left:1px solid #EDE8DF;
    position:sticky;top:0;height:100vh;overflow-y:auto;padding:0}
  .bnav{display:none}
  .overlay{align-items:center}
}
`;

/* ──────────────────────────────────────────────────────────────
   SVG ICONS
────────────────────────────────────────────────────────────── */
const Ico = {
  Home: ()=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Search: ({s=20})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Bag: ({s=22})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  User: ()=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Clock: ()=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Star: ({f})=><svg width="15" height="15" viewBox="0 0 24 24" fill={f?"currentColor":"none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  Plus: ({s=16})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Minus: ({s=15})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  X: ({s=18})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Arrow: ()=><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  Leaf: ()=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2-8 2"/></svg>,
  Pin: ()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Check: ()=><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
};

/* ──────────────────────────────────────────────────────────────
   HELPERS
────────────────────────────────────────────────────────────── */
const fmt = (n) => `$${parseFloat(n || 0).toFixed(2)}`;
const uid = () => Math.random().toString(36).slice(2);
const CAT_ICONS = { all:"⊞", coffee:"☕", tea:"🍵", pastry:"🥐", cold:"🧋" };
const TEMP_ICON  = { Hot:"☕", Iced:"🧊", Frappe:"🥤" };
const TEMP_COLOR = { Hot:"#C9463D", Iced:"#3B78C9", Frappe:"#7B5EA7" };

const Section = ({ title, sub, children }) => (
  <div style={{ marginBottom:18 }}>
    <div style={{ display:"flex", alignItems:"baseline", gap:6, marginBottom:10 }}>
      <h4 style={{ fontSize:13, fontWeight:700, color:"#1C1C1C" }}>{title}</h4>
      {sub && <span style={{ fontSize:12, color:"#9A9083", fontWeight:500 }}>({sub})</span>}
    </div>
    {children}
  </div>
);

const Row = ({ label, val, valColor }) => (
  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:7 }}>
    <span style={{ fontSize:12, color:"#9A9083", fontWeight:600 }}>{label}</span>
    <span style={{ fontSize:13, fontWeight:700, color: valColor||"#1C1C1C" }}>{val}</span>
  </div>
);

/* ──────────────────────────────────────────────────────────────
   COMPONENTS
────────────────────────────────────────────────────────────── */

function ProductCard({ p, onOpen, starred, onStar }) {
  return (
    <div className="pcard" onClick={() => onOpen(p)}>
      <div style={{ position:"relative", padding:"8px 8px 0" }}>
        <img className="pcard-img" src={Config.getFullImagePath(p.image)} alt={p.name}
          style={{ borderRadius:14 }}
          onError={e=>{ e.target.style.background="#EDE8DF"; e.target.src=""; }} />
        <button
          onClick={e=>{ e.stopPropagation(); onStar(p); }}
          style={{ position:"absolute", top:16, right:16, width:30, height:30,
            borderRadius:"50%", background:"rgba(255,255,255,.9)",
            backdropFilter:"blur(4px)", display:"flex", alignItems:"center",
            justifyContent:"center", color: starred ? "#C8952A" : "#B0A496",
            boxShadow:"0 2px 8px rgba(0,0,0,.1)", transition:"color .16s", border:"none", outline:"none" }}>
          <Ico.Star f={starred} />
        </button>
      </div>
      <div style={{ padding:"10px 12px 12px", display:"flex", flexDirection:"column", gap:3 }}>
        <div style={{ fontSize:13, fontWeight:700, color:"#1C1C1C", lineHeight:1.3 }}>{p.name}</div>
        <div style={{ fontSize:11, color:"#9A9083", fontWeight:500, lineClamp: 1, overflow:"hidden" }}>{p.category_name || "Drink"}</div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:8 }}>
          <span style={{ fontSize:16, fontWeight:700, color:"#1C1C1C" }}>{fmt(p.price)}</span>
          <div style={{ width:30, height:30, borderRadius:"50%", background:"#4A6741",
              color:"#fff", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Ico.Plus s={15} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductModal({ p, onClose, onAdd, isDesktop }) {
  const parseJson = (val) => { try { return typeof val === 'string' ? JSON.parse(val) : val; } catch { return []; } };
  const moods = useMemo(() => parseJson(p.moods), [p]);
  const sizes = useMemo(() => parseJson(p.sizes), [p]);
  const addons = useMemo(() => parseJson(p.addons), [p]);

  const moodConfig = useMemo(() => {
    const temp = []; const sugar = [];
    moods.forEach(m => {
      const label = (typeof m === 'object' ? m.label : m) || "";
      const lower = label.toLowerCase();
      if (lower.includes('hot') || lower.includes('iced') || lower.includes('frappe')) temp.push(label);
      else if (lower.includes('sugar') || lower.includes('%')) sugar.push(label);
    });
    return { temp, sugar };
  }, [moods]);

  const [temp, setTemp] = useState(moodConfig.temp[0] || "");
  const [sugar, setSugar] = useState(moodConfig.sugar[0] || "");
  const [size, setSize] = useState(sizes[0]?.label || "");
  const [selAddons, setSelAddons] = useState({});
  const [qty, setQty] = useState(1);

  const price = useMemo(() => {
    let base = parseFloat(p.price);
    const s = sizes.find(x => x.label === size);
    if (s) base = parseFloat(s.price);
    addons.forEach(a => { if (selAddons[a.label]) base += parseFloat(a.price); });
    return base;
  }, [size, selAddons, p, sizes, addons]);

  const toggleAddon = (l) => setSelAddons(prev => ({ ...prev, [l]: !prev[l] }));

  const handleAdd = () => {
    const parts = [temp, sugar, size].filter(Boolean);
    const extras = addons.filter(a => selAddons[a.label]).map(a => a.label);
    onAdd(p, [...parts, ...extras].join(", "), qty, price);
    onClose();
  };

  return (
    <div className="overlay fade-in" onClick={onClose}>
      <div className={`modal-sheet slide-up ${isDesktop ? "center-modal" : ""}`} onClick={e => e.stopPropagation()}>
        <div className="drag-handle" />
        <div style={{ position:"relative", height:220, margin:"10px 14px 0", borderRadius:18, overflow:"hidden", flexShrink:0 }}>
          <img src={Config.getFullImagePath(p.image)} alt={p.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e => { e.target.style.background="#EDE8DF"; }} />
          <button onClick={onClose} style={{ position:"absolute", top:12, right:12, width:34, height:34, borderRadius:"50%", background:"rgba(0,0,0,.38)", color:"#fff", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", border:"none" }}>
            <Ico.X s={16} />
          </button>
        </div>
        <div className="modal-inner">
          <div style={{ padding:"18px 18px 4px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:18 }}>
              <div>
                <h2 style={{ fontSize:22, fontWeight:700, color:"#1C1C1C", lineHeight:1.2 }}>{p.name}</h2>
                <p style={{ fontSize:13, color:"#9A9083", marginTop:3 }}>Signature Selection</p>
              </div>
              <span style={{ fontSize:22, fontWeight:700, color:"#1C1C1C", marginLeft:12, flexShrink:0 }}>{fmt(price)}</span>
            </div>

            {moodConfig.sugar.length > 0 && (
              <Section title="Sugar Level">
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {moodConfig.sugar.map(s => (
                    <button key={s} className="opill" onClick={() => setSugar(s)} style={{ background: sugar === s ? "#9B6F2A" : "#fff", color: sugar === s ? "#fff" : "#6B6058", borderColor: sugar === s ? "#9B6F2A" : "#DDD8CF" }}>{s}</button>
                  ))}
                </div>
              </Section>
            )}

            {moodConfig.temp.length > 0 && (
              <Section title="Temperature">
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {moodConfig.temp.map(t => (
                    <button key={t} className="opill" onClick={() => setTemp(t)} style={{ background: temp === t ? (TEMP_COLOR[t] || "#4A6741") : "#fff", color: temp === t ? "#fff" : "#6B6058", borderColor: temp === t ? (TEMP_COLOR[t] || "#4A6741") : "#DDD8CF", display:"flex", alignItems:"center", gap:6 }}>
                      <span style={{ fontSize:15 }}>{TEMP_ICON[t] || "☕"}</span>{t}
                    </button>
                  ))}
                </div>
              </Section>
            )}

            {sizes.length > 0 && (
              <Section title="Size">
                <div style={{ display:"flex", gap:8 }}>
                  {sizes.map(s => (
                    <button key={s.label} onClick={() => setSize(s.label)} style={{ flex:1, padding:"12px 8px", borderRadius:14, border: `1.5px solid ${size === s.label ? "#3B78C9" : "#DDD8CF"}`, background: size === s.label ? "#3B78C9" : "#fff", color: size === s.label ? "#fff" : "#6B6058", fontSize:13, fontWeight:600, display:"flex", flexDirection:"column", alignItems:"center", gap:4, outline:"none", cursor:"pointer" }}>
                      <span>{s.label}</span>
                      <span style={{ fontSize:11, opacity:.8 }}>{fmt(s.price)}</span>
                    </button>
                  ))}
                </div>
              </Section>
            )}

            {addons.length > 0 && (
              <Section title="Add-Ons" sub="Optional">
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {addons.map(a => (
                    <div key={a.label} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"11px 14px", background:"#FAFAF8", borderRadius:13, border:"1px solid #EDE8DF" }}>
                      <div>
                        <div style={{ fontSize:13, fontWeight:600, color:"#1C1C1C" }}>{a.label}</div>
                        <div style={{ fontSize:11, color:"#4A6741", fontWeight:600 }}>+{fmt(a.price)}</div>
                      </div>
                      <div className="tgl" onClick={() => toggleAddon(a.label)} style={{ background: selAddons[a.label] ? "#4A6741" : "#D0CBC2" }}>
                        <div className={`tgl-dot${selAddons[a.label] ? " on" : ""}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </div>
        </div>
        <div style={{ padding:"14px 18px 28px", borderTop:"1px solid #EDE8DF", background:"#fff", display:"flex", alignItems:"center", gap:14, flexShrink:0 }}>
          <div className="qty-ctrl">
            <button className="qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))}><Ico.Minus /></button>
            <span style={{ fontSize:16, fontWeight:700, minWidth:22, textAlign:"center" }}>{qty}</span>
            <button className="qty-btn" onClick={() => setQty(q => q + 1)}><Ico.Plus /></button>
          </div>
          <button onClick={handleAdd} style={{ flex:1, height:52, borderRadius:100, background:"#4A6741", color:"#fff", fontSize:14, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", gap:10, border:"none" }}>
            <span>Add to Cart — {fmt(price * qty)}</span>
            <Ico.Arrow />
          </button>
        </div>
      </div>
    </div>
  );
}

function CartPanel({ cart, onClose, onQty, onRemove, onCheckout, asSidebar }) {
  const total = cart.reduce((s, i) => s + (i.price * i.qty), 0);
  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      <div style={{ padding:"20px 20px 14px", borderBottom:"1px solid #EDE8DF", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <h2 style={{ fontSize:19, fontWeight:700, color:"#1C1C1C" }}>Your Order</h2>
        {!asSidebar && <button onClick={onClose} style={{ width:32, height:32, borderRadius:"50%", background:"#F5F0E8", border:"none", display:"flex", alignItems:"center", justifyContent:"center" }}><Ico.X s={16}/></button>}
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"16px" }} className="noscroll">
        {cart.length === 0 ? <div style={{ textAlign:"center", padding:"52px 0", color:"#B0A496" }}><div style={{ fontSize:46, marginBottom:12 }}>🛒</div><p style={{ fontSize:15, fontWeight:600 }}>Your basket is empty</p></div>
        : <div style={{ display:"flex", flexDirection:"column", gap:10 }}>{cart.map(item => (
          <div key={item.cid} className="cart-item">
            <img src={Config.getFullImagePath(item.image)} alt={item.name} style={{ width:54, height:54, borderRadius:12, objectFit:"cover" }} />
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:700, color:"#1C1C1C" }}>{item.name}</div>
              <div style={{ fontSize:11, color:"#9A9083", marginBottom:4 }}>{item.custom}</div>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <span style={{ fontSize:14, fontWeight:700, color:"#4A6741" }}>{fmt(item.price * item.qty)}</span>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <button className="qty-btn" style={{ width:26, height:26, background:"#EDE8DF" }} onClick={() => onQty(item.cid, -1)}><Ico.Minus s={12}/></button>
                  <span style={{ fontSize:13, fontWeight:700 }}>{item.qty}</span>
                  <button className="qty-btn" style={{ width:26, height:26, background:"#4A6741", color:"#fff" }} onClick={() => onQty(item.cid, 1)}><Ico.Plus s={12}/></button>
                </div>
              </div>
            </div>
            <button onClick={() => onRemove(item.cid)} style={{ background:"none", border:"none", color:"#C0B8AE" }}><Ico.X s={15}/></button>
          </div>
        ))}</div>}
      </div>
      {cart.length > 0 && (
        <div style={{ padding:"16px 18px 28px", borderTop:"1px solid #EDE8DF", background:"#fff" }}>
          <div style={{ background:"#FAFAF8", borderRadius:14, padding:"12px 14px", marginBottom:14 }}>
            <Row label="Subtotal" val={fmt(total)} />
            <Row label="Service" val="Free" valColor="#4A6741" />
            <div style={{ height:1, background:"#EDE8DF", margin:"10px 0" }}/>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline" }}>
              <span style={{ fontSize:14, fontWeight:700, color:"#4A6741" }}>Total</span>
              <span style={{ fontSize:24, fontWeight:800, color:"#4A6741" }}>{fmt(total)}</span>
            </div>
          </div>
          <button onClick={onCheckout} style={{ width:"100%", height:54, borderRadius:100, background:"#4A6741", color:"#fff", fontSize:15, fontWeight:700, border:"none" }}>Place Order ☕</button>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   MAIN APPLICATION
────────────────────────────────────────────────────────────── */

const CoffeeMenuApp = () => {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = translations[lang] || translations.en;

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => { const r = () => setIsMobile(window.innerWidth < 768); window.addEventListener("resize", r); return () => window.removeEventListener("resize", r); }, []);

  const [selectedShop, setSelectedShop] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const br = params.get('br') || params.get('branch');
    const biz = params.get('biz');
    if (br && biz) return { id: parseInt(br), business_id: parseInt(biz) };
    const saved = localStorage.getItem('coffee_pos_shop');
    return saved ? JSON.parse(saved) : null;
  });

  const [selectedTable, setSelectedTable] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tbl') || params.get('table') || localStorage.getItem('coffee_pos_table') || "Web";
  });

  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cat, setCat] = useState("all");
  const [q, setQ] = useState("");
  const searchInputRef = React.useRef(null);
  const [cart, setCart] = useState(() => {
    const s = localStorage.getItem('coffee_pos_cart');
    return s ? JSON.parse(s) : [];
  });
  const [starred, setStarred] = useState(() => {
    const s = localStorage.getItem('coffee_pos_starred_ids');
    return s ? new Set(JSON.parse(s)) : new Set();
  });
  const [modalProd, setModalProd] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [view, setView] = useState("home");
  const [tab, setTab] = useState("home");

  useEffect(() => {
    if (selectedShop?.id) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const [cRes, pRes] = await Promise.all([request("category", "get"), request("product", "get", { branch_id: selectedShop.id })]);
          if (cRes?.list) setCategories([{ id: "all", name: "All" }, ...cRes.list]);
          if (pRes?.list) setMenuItems(pRes.list);
        } catch { } finally { setLoading(false); }
      };
      fetchData();
    }
  }, [selectedShop?.id]);

  useEffect(() => {
    localStorage.setItem('coffee_pos_cart', JSON.stringify(cart));
    localStorage.setItem('coffee_pos_table', selectedTable);
    if (selectedShop) localStorage.setItem('coffee_pos_shop', JSON.stringify(selectedShop));
  }, [cart, selectedTable, selectedShop]);

  const products = useMemo(() => menuItems.filter(p => {
    const productName = p.name || "";
    const qOk = !q || productName.toLowerCase().includes(q.toLowerCase());
    if (tab === 'search' || q) return qOk;
    const catOk = cat === "all" || p.category_id == cat;
    return catOk;
  }), [cat, q, menuItems, tab]);

  const addToCart = (prod, custom, qty, price) => setCart(prev => [...prev, { ...prod, cid: uid(), custom, qty, price }]);
  const updateQty = (cid, delta) => setCart(prev => prev.map(i => i.cid === cid ? { ...i, qty: Math.max(1, i.qty + delta) } : i));
  const removeItem = (cid) => setCart(prev => prev.filter(i => i.cid !== cid));
  const toggleStar = (p) => setStarred(prev => { const n = new Set(prev); n.has(p.id) ? n.delete(p.id) : n.add(p.id); return n; });

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    try {
      const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej));
      const sub = cart.reduce((s, i) => s + (i.price * i.qty), 0);
      const data = {
        business_id: selectedShop.business_id, branch_id: selectedShop.id, table_no: selectedTable,
        sub_total: sub, total_amount: sub, payment_method: "Unpaid (Web QR)", order_type: "dine_in",
        lat: pos.coords.latitude, lng: pos.coords.longitude,
        cart_items: cart.map(i => ({ product_id: i.id, qty: i.qty, price: i.price, note: i.custom }))
      };
      const res = await request("order-web", "post", data);
      if (res?.success) {
        localStorage.setItem('last_order_id', res.order_id);
        setCart([]); setCartOpen(false); setTab("status"); message.success(t.order_success_msg);
      }
    } catch { message.error("GPS Verification Required"); } finally { setLoading(false); }
  };

  if (!selectedShop?.id) return <div className="app-container" style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:40, textAlign:"center" }}><div><h2 className="brand" style={{ fontSize:32, marginBottom:16 }}>Please Scan QR</h2><p>Please scan the QR code on your table to browse the menu.</p></div></div>;

  return (
    <div className="app-container">
      <style>{CSS}</style>
      <div className="app-root">
        <div className="main-col">
          {/* Header & Navigation */}
          {!isMobile && (
            <div style={{ background:"#fff", borderBottom:"1px solid #EDE8DF", padding:"0 28px", display:"flex", alignItems:"center", justifyContent:"space-between", height:64, position:"sticky", top:0, zIndex:100 }}>
              <div style={{ display:"flex", alignItems:"center", gap:32 }}>
                <span className="brand" style={{ fontSize:20, fontWeight:700, color:"#1C1C1C", textTransform:"uppercase" }}>{selectedShop.business_name || "AURORA"}</span>
                <div style={{ display:"flex", gap:4 }}>
                  {["home", "search", "status", "profile"].map(id => <button key={id} onClick={() => setTab(id)} style={{ padding:"6px 14px", borderRadius:10, fontSize:12, fontWeight:700, background: tab === id ? "#4A6741" : "transparent", color: tab === id ? "#fff" : "#8A8070", textTransform:"uppercase", border:"none", cursor:"pointer" }}>{id}</button>)}
                </div>
              </div>
              <button onClick={() => setCartOpen(true)} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 18px", borderRadius:10, border:"1.5px solid #EDE8DF", background:"#FAFAF8", color:"#4A6741", fontSize:12, fontWeight:700, cursor:"pointer" }}>
                <Ico.Bag s={18}/> Cart {cart.length > 0 && <span style={{ background:"#4A6741", color:"#fff", borderRadius:"50%", width:18, height:18, display:"flex", alignItems:"center", justifyContent:"center" }}>{cart.length}</span>}
              </button>
            </div>
          )}

          {/* VIEWS RENDERING */}
          {tab === 'home' || tab === 'search' ? (
            <div className="fade-in">
              {/* Header Mobile (Only on Home) */}
              {(isMobile && tab === 'home' && !q) && (
                <div style={{ padding:"52px 16px 16px", textAlign:"center" }}>
                  <h1 className="brand" style={{ fontSize:21, fontWeight:700, letterSpacing:".1em", color:"#1C1C1C", textTransform:"uppercase" }}>{selectedShop.business_name || "AURORA BREW CO."}</h1>
                  <div style={{ fontSize:10, fontWeight:700, color:"#4A6741", marginTop:4 }}>TABLE {selectedTable}</div>
                </div>
              )}

              {/* Search Bar */}
              <div className="search-wrap" style={!isMobile ? { padding:"16px 20px", margin:0 } : (tab === 'search' ? { marginTop: 60 } : {})}>
                <div className="search-icon"><Ico.Search s={18}/></div>
                <input ref={searchInputRef} className="search-inp" type="text" placeholder="Search menu items..." value={q} onChange={e => setQ(e.target.value)} />
                {q && <button onClick={() => setQ("")} style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"#B0A496" }}><Ico.X s={14} /></button>}
              </div>

              {/* Categories (Only Home) */}
              {(tab === 'home' && !q) && (
                <div style={{ padding:"14px 0 6px", overflowX:"auto" }} className="noscroll">
                  <div style={{ display:"flex", gap:10, paddingLeft:16, paddingRight:16 }}>
                    {categories.map(c => (
                      <button key={c.id} className={`cpill ${cat == c.id ? "on" : "off"}`} onClick={() => setCat(c.id)}>
                        <div className="cpill-icon">{CAT_ICONS[c.name.toLowerCase()] || CAT_ICONS.all}</div>
                        <span>{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Product Grid */}
              <div style={{ padding:"10px 14px", paddingBottom: isMobile ? 110 : 30 }}>
                {q && <div style={{ padding: "0 4px 10px", fontSize: 11, fontWeight: 700, color: "#8A8070" }}>Found {products.length} results</div>}
                {loading ? <div style={{ textAlign:"center", padding:40 }}><Spin /></div> : (
                  <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(auto-fill, minmax(180px, 1fr))", gap:12 }}>
                    {products.map(p => <ProductCard key={p.id} p={p} onOpen={setModalProd} starred={starred.has(p.id)} onStar={toggleStar} />)}
                  </div>
                )}
              </div>
            </div>
          ) : tab === 'status' ? (
            <div className="fade-in">
              {/* Simple Status View */}
              <div style={{ padding: "60px 20px", textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>☕</div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: "#1C1C1C" }}>Order Tracking</h2>
                <p style={{ fontSize: 13, color: "#9A9083", marginTop: 8 }}>Coming soon: Real-time status of your espresso!</p>
                <button onClick={() => setTab('home')} style={{ marginTop: 24, padding: "12px 24px", borderRadius: 100, background: "#4A6741", color: "#fff", border: "none", fontWeight: 700 }}>Back to Menu</button>
              </div>
            </div>
          ) : tab === 'profile' ? (
            <div className="fade-in">
              {/* Simple Profile View */}
              <div style={{ padding: "60px 20px" }}>
                <div style={{ background: "#fff", borderRadius: 24, padding: 24, textAlign: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
                  <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#F5F0E8", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyCenter: "center", fontSize: 32 }}>👤</div>
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1C1C1C" }}>Guest Customer</h2>
                  <p style={{ fontSize: 12, color: "#9A9083", fontWeight: 700, textTransform: "uppercase", marginTop: 4 }}>Table {selectedTable}</p>
                </div>
                <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
                  {["Order History", "Language", "Settings", "Help Center"].map(item => (
                    <button key={item} style={{ background: "#fff", padding: 18, borderRadius: 18, textAlign: "left", fontSize: 14, fontWeight: 600, color: "#4B5563", border: "1px solid #EDE8DF", display: "flex", justifyContent: "space-between" }}>
                      {item} <span style={{ color: "#D1D5DB" }}>→</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Sidebar Desktop */}
        {!isMobile && (
          <div className="sidebar">
            <CartPanel cart={cart} onClose={() => setCartOpen(false)} onQty={updateQty} onRemove={removeItem} onCheckout={handleCheckout} asSidebar />
          </div>
        )}
      </div>

      {/* Bottom Nav Mobile */}
      {isMobile && (
        <div className="bnav">
          <button className={`bnav-btn ${tab === 'home' ? "on" : ""}`} onClick={() => setTab('home')}><Ico.Home /></button>
          <button className={`bnav-btn ${tab === 'search' ? "on" : ""}`} onClick={() => {
            setTab('search');
            setTimeout(() => searchInputRef.current?.focus(), 100);
          }}><Ico.Search /></button>
          <div className="bnav-cart-wrap">
            <button className="bnav-cart" onClick={() => setCartOpen(true)}><Ico.Bag /></button>
            {cart.length > 0 && <div className="cart-badge">{cart.length}</div>}
          </div>
          <button className={`bnav-btn ${tab === 'status' ? "on" : ""}`} onClick={() => setTab('status')}><Ico.Clock /></button>
          <button className={`bnav-btn ${tab === 'profile' ? "on" : ""}`} onClick={() => setTab('profile')}><Ico.User /></button>
        </div>
      )}

      {/* Modal & Overlays */}
      {modalProd && <ProductModal p={modalProd} onClose={() => setModalProd(null)} onAdd={addToCart} isDesktop={!isMobile} />}
      {cartOpen && isMobile && (
        <div className="overlay fade-in" onClick={() => setCartOpen(false)}>
          <div className="modal-sheet slide-up" onClick={e => e.stopPropagation()}>
            <div className="drag-handle" />
            <CartPanel cart={cart} onClose={() => setCartOpen(false)} onQty={updateQty} onRemove={removeItem} onCheckout={handleCheckout} />
          </div>
        </div>
      )}
    </div>
  );
};

export default CoffeeMenuApp;
