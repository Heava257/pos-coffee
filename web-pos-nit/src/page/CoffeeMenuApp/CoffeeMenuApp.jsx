import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import dayjs from 'dayjs';
import { request } from '../../util/helper';
import { Config } from '../../util/config';
import { getProfile, getGuestProfile, setGuestProfile } from '../../store/profile.store';
import { message, Spin, Typography, Modal } from 'antd';
import { useGoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
const { Text } = Typography;

const CustomGoogleButton = ({ onSuccess, loading, bizId }) => {
  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      // For this custom flow, we might need to adjust the backend or fetch userinfo here
      // But to keep it simple, we'll try to get the profile info and send it
      fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${tokenResponse.access_token}`)
        .then(res => res.json())
        .then(data => {
           onSuccess({ 
             isCustom: true,
             profile: data,
             token: tokenResponse.access_token 
           });
        });
    },
    onError: () => message.error("Google Login Failed"),
  });

  return (
    <button 
      onClick={() => login()}
      disabled={loading}
      style={{ 
        width: "100%", 
        height: 50, 
        borderRadius: 100, 
        border: "1px solid #EDE8DF", 
        background: "#fff", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        gap: 12, 
        cursor: "pointer",
        fontWeight: 700,
        fontSize: 14,
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
        marginTop: 10,
        transition: "all 0.2s"
      }}
      onMouseOver={(e) => e.currentTarget.style.background = "#f9f9f9"}
      onMouseOut={(e) => e.currentTarget.style.background = "#fff"}
    >
      <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="G" style={{ width: 20 }} />
      <span style={{ color: "#3c4043" }}>Continue with Google</span>
    </button>
  );
};
import { useNavigate, useSearchParams } from 'react-router-dom';
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
.bnav{position:fixed;bottom:0;left:0;right:0;background:rgba(255,255,255,0.01) !important;
  backdrop-filter:blur(30px); -webkit-backdrop-filter:blur(30px);
  display:flex;align-items:center;justify-content:space-around;
  height:48px; padding:0 20px 2px; border-top:1px solid rgba(237,232,223,0.1);z-index:200}
.bnav-btn{background:none;color:#B0A496;padding:4px;transition:all .16s; border:none; outline:none; display:flex; align-items:center; justify-content:center;}
.bnav-btn.on{color:#4A6741; transform:translateY(-2px)}
.bnav-cart-wrap{position:relative}
.bnav-cart{width:48px;height:48px;background:none;
  color:#B0A496;display:flex;align-items:center;justify-content:center;
  transition:all .14s; border:none;}
.bnav-cart.on{color:#4A6741}
.bnav-cart:active{transform:scale(.9)}
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
  Lock: ()=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  Arrow: ()=><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  Leaf: ()=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2-8 2"/></svg>,
  Pin: ()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Check: ()=><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Heart: ({s=20})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.84-8.84 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  HeartFilled: ({s=20})=><svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.84-8.84 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
};

/* ──────────────────────────────────────────────────────────────
   HELPERS
────────────────────────────────────────────────────────────── */
const fmt = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);

const getDiscountPercent = (item, selectedShop) => {
  let dPercent = 0;
  const dScope = selectedShop?.discount_scope || 'all';
  const globalD = Number(selectedShop?.global_discount || 0);

  if (globalD > 0) {
    if (dScope === 'all') dPercent = globalD;
    else if (dScope === 'category') {
      const dCats = Array.isArray(selectedShop.discount_applied_categories) ? selectedShop.discount_applied_categories : [];
      if (dCats.map(String).includes(String(item.category_id))) dPercent = globalD;
    } else if (dScope === 'product') {
      const dProds = Array.isArray(selectedShop.discount_applied_products) ? selectedShop.discount_applied_products : [];
      if (dProds.map(String).includes(String(item.id))) dPercent = globalD;
    }
  }
  return dPercent;
};
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

function ProductCard({ p, onOpen, starred, onStar, selectedShop }) {
  const isOnPromo = isProductOnPromo(p, selectedShop);

  return (
    <div 
      onClick={() => onOpen(p)}
      style={{ 
        display: "flex", 
        gap: 16, 
        padding: 14, 
        background: "rgba(255, 255, 255, 0.8)", 
        backdropFilter: "blur(10px)",
        borderRadius: 24, 
        marginBottom: 16,
        boxShadow: "0 8px 20px rgba(0,0,0,0.03)",
        cursor: "pointer",
        position: "relative",
        border: "1px solid rgba(255, 255, 255, 0.5)",
        transition: "transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
      }}
      onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.98)"}
      onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
    >
      {/* Percentage Discount Badge (Floating Gradient) */}
      {(() => {
        const dP = getDiscountPercent(p, selectedShop);
        if (dP > 0) {
          return (
            <div style={{ 
              position: "absolute", top: -8, right: 16, 
              background: "linear-gradient(135deg, #FF6B6B 0%, #E8534A 100%)", 
              color: "#fff", 
              padding: "4px 12px", borderRadius: "10px 10px 10px 0", 
              fontSize: 11, fontWeight: 900, zIndex: 20,
              boxShadow: "0 4px 12px rgba(232, 83, 74, 0.3)",
              border: "2px solid #fff"
            }}>
              OFF {dP}%
            </div>
          );
        }
        return null;
      })()}

      {/* Promo Badge (BOGO) - Sleek Pill style */}
      {isOnPromo && (
        <div style={{ 
          position: "absolute", bottom: -8, left: 16, 
          background: "linear-gradient(135deg, #C8952A 0%, #A67C21 100%)", 
          color: "#fff", 
          padding: "4px 12px", borderRadius: 100, fontSize: 10, fontWeight: 800, zIndex: 20,
          boxShadow: "0 4px 10px rgba(200, 149, 42, 0.3)", textTransform: "uppercase",
          border: "2px solid #fff",
          display: "flex", alignItems: "center", gap: 4
        }}>
          <Ico.Check /> {p.promo_text || selectedShop?.global_bogo_text || "Buy 1 Get 1"}
        </div>
      )}

      {/* Thumbnail with soft inner shadow */}
      <div style={{ width: 90, height: 90, borderRadius: 20, overflow: "hidden", flexShrink: 0, background: "#F5F0E8", boxShadow: "inset 0 0 10px rgba(0,0,0,0.05)" }}>
        <img 
          src={Config.getFullImagePath(p.image)} 
          style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s" }} 
          alt={p.name}
          onMouseOver={(e) => e.target.style.transform = "scale(1.1)"}
          onMouseOut={(e) => e.target.style.transform = "scale(1)"}
          onError={e => { e.target.style.opacity = 0.5; }}
        />
      </div>

      {/* Info Section */}
      <div style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
        <h3 style={{ fontSize: 17, fontWeight: 800, color: "#1C1C1C", marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", letterSpacing: "-0.3px" }}>
          {p.name}
        </h3>
        <p style={{ fontSize: 12, color: "#9A9083", marginBottom: 10, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.5, opacity: 0.8 }}>
          {p.description || "Premium quality coffee brewed to perfection."}
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {getDiscountPercent(p, selectedShop) > 0 && (
              <span style={{ fontSize: 11, color: "#BBB3A8", textDecoration: "line-through", marginBottom: -2 }}>
                {(() => {
                  let displayPrice = p.price;
                  if (p.sizes) {
                    try {
                      const sizes = typeof p.sizes === 'string' ? JSON.parse(p.sizes) : p.sizes;
                      if (Array.isArray(sizes) && sizes.length > 0) {
                        displayPrice = Math.min(...sizes.map(s => parseFloat(s.price)));
                      }
                    } catch (e) {}
                  }
                  return fmt(displayPrice);
                })()}
              </span>
            )}
            <div style={{ fontSize: 18, fontWeight: 900, color: "#4A6741" }}>
              {(() => {
                let displayPrice = p.price;
                if (p.sizes) {
                  try {
                    const sizes = typeof p.sizes === 'string' ? JSON.parse(p.sizes) : p.sizes;
                    if (Array.isArray(sizes) && sizes.length > 0) {
                      // Find minimum price among sizes
                      displayPrice = Math.min(...sizes.map(s => parseFloat(s.price)));
                    }
                  } catch (e) {}
                }
                return fmt(displayPrice * (1 - getDiscountPercent(p, selectedShop) / 100));
              })()}
              {p.sizes && JSON.parse(p.sizes).length > 0 && (
                <span style={{ fontSize: 10, marginLeft: 4, opacity: 0.6 }}>Starting</span>
              )}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(200, 149, 42, 0.08)", padding: "4px 10px", borderRadius: 100 }}>
            <Ico.Star f={true} s={11} style={{ color: "#C8952A" }} />
            <span style={{ fontSize: 11, fontWeight: 800, color: "#C8952A" }}>{p.rating || (4.5 + (p.id % 5) * 0.1).toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* Actions (Heart & Add) */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
        <button 
          onClick={(e) => { e.stopPropagation(); onStar(p); }}
          style={{ 
            background: "none", 
            border: "none", 
            padding: 4, 
            cursor: "pointer",
            color: starred ? "#E8534A" : "#DDD8CF",
            transition: "transform 0.2s"
          }}
        >
          {starred ? <Ico.HeartFilled s={24} /> : <Ico.Heart s={24} />}
        </button>
        
        <button 
          onClick={(e) => { e.stopPropagation(); onOpen(p); }}
          style={{ 
            width: 32, 
            height: 32, 
            borderRadius: "50%", 
            background: "#4A6741", 
            color: "#fff", 
            border: "none", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            boxShadow: "0 2px 6px rgba(74, 103, 65, 0.3)",
            cursor: "pointer"
          }}
        >
          <Ico.Plus s={18} />
        </button>
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

const isProductOnPromo = (item, selectedShop) => {
  if (!selectedShop?.global_bogo_active) return item.is_promo || item.promotion_id;

  // CHECK DATES: Automatically disable if outside of range
  const today = new Date().toISOString().split('T')[0];
  const startDate = selectedShop.promo_start_date ? selectedShop.promo_start_date.split('T')[0] : null;
  const endDate = selectedShop.promo_end_date ? selectedShop.promo_end_date.split('T')[0] : null;

  const isDateValid = (!startDate || today >= startDate) && (!endDate || today <= endDate);
  if (!isDateValid) return item.is_promo || item.promotion_id;

  const scope = selectedShop.promo_scope || 'all';
  if (scope === 'all') return true;

  const appliedCats = Array.isArray(selectedShop.promo_applied_categories) ? selectedShop.promo_applied_categories : [];
  const appliedProds = Array.isArray(selectedShop.promo_applied_products) ? selectedShop.promo_applied_products : [];

  if (scope === 'category') {
    return appliedCats.map(String).includes(String(item.category_id));
  }
  if (scope === 'product') {
    return appliedProds.map(String).includes(String(item.id));
  }
  return item.is_promo || item.promotion_id;
};

function CartPanel({ cart, onClose, onQty, onRemove, onCheckout, asSidebar, selectedShop, loading, activeOrder }) {
  const total = cart.reduce((s, i) => s + (i.price * i.qty), 0);
  
  // Calculate Discounts & BOGO Savings
  const savings = cart.reduce((total_savings, item) => {
    const dPercent = getDiscountPercent(item, selectedShop);
    const discAmount = (item.price * item.qty * dPercent) / 100;
    const discountedPrice = item.price * (1 - dPercent / 100);

    const isBOGO = isProductOnPromo(item, selectedShop);
    let bogoSavings = 0;
    if (isBOGO) {
      const buyQty = Number(selectedShop?.promo_buy_qty || 1);
      const getQty = Number(selectedShop?.promo_get_qty || 1);
      const totalPerSet = buyQty + getQty;
      const numSets = Math.floor(item.qty / totalPerSet);
      const freeItems = numSets * getQty;
      bogoSavings = freeItems * discountedPrice;
    }
    return total_savings + discAmount + bogoSavings;
  }, 0);

  const final_total = total - savings;
  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      <div style={{ padding:"20px 20px 14px", borderBottom:"1px solid #EDE8DF", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <h2 style={{ fontSize:19, fontWeight:700, color:"#1C1C1C" }}>Your Order</h2>
        {!asSidebar && <button onClick={onClose} style={{ width:32, height:32, borderRadius:"50%", background:"#F5F0E8", border:"none", display:"flex", alignItems:"center", justifyContent:"center" }}><Ico.X s={16}/></button>}
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"16px" }} className="noscroll">
        {/* ACTIVE BILL SECTION */}
        {activeOrder && activeOrder.details && activeOrder.details.length > 0 && (
          <div style={{ marginBottom: 24, padding: "16px", background: "#fdf8ef", borderRadius: 20, border: "1.5px dashed #D0C5B3" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#8A7E6A", textTransform: "uppercase", letterSpacing: 0.5 }}>Ongoing Bill / មុខម្ហូបកំពុងមាន</span>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4A6741", boxShadow: "0 0 10px #4A6741" }}></div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {activeOrder.details.map((d, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                  <span style={{ color: "#4B5563", fontWeight: 500 }}>
                    {d.product_name} <span style={{ color: "#9A9083", fontSize: 12 }}>x{d.qty}</span>
                  </span>
                  <span style={{ fontWeight: 700, color: "#1C1C1C" }}>{fmt(d.price * d.qty)}</span>
                </div>
              ))}
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #EDE8DF", display: "flex", justifyContent: "space-between", fontWeight: 800, color: "#4A6741" }}>
                <span>Subtotal</span>
                <span>{fmt(activeOrder.total_amount)}</span>
              </div>
            </div>
          </div>
        )}

        {cart.length === 0 ? (
          !activeOrder && (
            <div style={{ textAlign:"center", padding:"52px 0", color:"#B0A496" }}>
              <div style={{ fontSize:46, marginBottom:12 }}>🛒</div>
              <p style={{ fontSize:15, fontWeight:600 }}>Your basket is empty</p>
            </div>
          )
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {cart.map(item => (
              <div key={item.cid} className="cart-item">
                <img src={Config.getFullImagePath(item.image)} alt={item.name} style={{ width:54, height:54, borderRadius:12, objectFit:"cover" }} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"#1C1C1C" }}>{item.name}</div>
                  {isProductOnPromo(item, selectedShop) && (
                    <div style={{ display: "inline-flex", color: "#059669", fontSize: 10, fontWeight: 700, marginTop: 1 }}>
                      • {selectedShop?.global_bogo_text || "Buy 1 Get 1 Applied"}
                    </div>
                  )}
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
            ))}
          </div>
        )}
      </div>
      {cart.length > 0 && (
        <div style={{ padding:"16px 18px 28px", borderTop:"1px solid #EDE8DF", background:"#fff" }}>
          <div style={{ background:"#FAFAF8", borderRadius:14, padding:"12px 14px", marginBottom:14 }}>
            <Row label="Subtotal" val={fmt(total)} />
            {savings > 0 && <Row label="Promotion" val={`-${fmt(savings)}`} valColor="#e85d5d" />}
            <Row label="Service" val="Free" valColor="#4A6741" />
            <div style={{ height:1, background:"#EDE8DF", margin:"10px 0" }}/>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline" }}>
              <span style={{ fontSize:14, fontWeight:700, color:"#4A6741" }}>Total</span>
              <span style={{ fontSize:24, fontWeight:800, color:"#4A6741" }}>{fmt(final_total)}</span>
            </div>
          </div>
          <button 
            disabled={loading}
            onClick={onCheckout} 
            style={{ width:"100%", height:54, borderRadius:100, background:loading ? "#9A9083" : "#4A6741", color:"#fff", fontSize:15, fontWeight:700, border:"none", cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "Processing..." : "Place Order ☕"}
          </button>
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
  const [searchParams] = useSearchParams();
  const { lang } = useLanguage();
  const t = translations[lang] || translations.en;

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => { const r = () => setIsMobile(window.innerWidth < 768); window.addEventListener("resize", r); return () => window.removeEventListener("resize", r); }, []);

  const [selectedShop, setSelectedShop] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const br = params.get('br') || params.get('branch');
    const biz = params.get('biz');
    if (br && biz) {
      const obj = { id: parseInt(br), business_id: parseInt(biz) };
      localStorage.setItem('coffee_pos_shop', JSON.stringify(obj));
      return obj;
    }
    const saved = localStorage.getItem('coffee_pos_shop');
    return saved ? JSON.parse(saved) : null;
  });

  const [selectedTable, setSelectedTable] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const tbl = params.get('tbl') || params.get('table');
    if (tbl) {
      localStorage.setItem('coffee_pos_table', tbl);
      return tbl;
    }
    return localStorage.getItem('coffee_pos_table') || "Web";
  });

  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cat, setCat] = useState("all");
  const [activeOrder, setActiveOrder] = useState(null); // Existing bill for table
  const [q, setQ] = useState("");
  const searchInputRef = React.useRef(null);
  const [cart, setCart] = useState([]);
  const [transactionId, setTransactionId] = useState(() => Math.random().toString(36).slice(2));

  // Initialize cart from storage on mount
  useEffect(() => {
    // SECURITY: If the last order was a success, force a clean slate
    const lastSuccess = localStorage.getItem('last_order_success');
    if (lastSuccess === 'true') {
      console.log("Detected previous successful order. Forcing hard clear.");
      localStorage.removeItem('coffee_pos_cart');
      localStorage.removeItem('last_order_success');
      setCart([]);
      return;
    }

    const s = localStorage.getItem('coffee_pos_cart');
    if (s) {
      try {
        const saved = JSON.parse(s);
        setCart(Array.isArray(saved) ? saved : []);
      } catch (e) {
        setCart([]);
      }
    }
  }, []);

  const bizId = selectedShop?.business_id;

  const [member, setMember] = useState(getGuestProfile());
  const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
  const [isRegisterModalVisible, setIsRegisterModalVisible] = useState(false);
  const [isEditProfileVisible, setIsEditProfileVisible] = useState(false);
  const [loginValue, setLoginValue] = useState("");
  const [otpValue, setOtpValue] = useState("");
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const handleLinkMember = async () => {
    if (!loginValue) return message.warning("Please enter Phone or Card ID");
    setLoginLoading(true);
    try {
      const res = await request(`customer/send-otp`, "post", { loginValue, business_id: bizId });
      if (res && res.success) {
        setIsOtpStep(true);
        message.success(res.message);
      } else {
        message.error(res?.message || "Member not found or error occurred.");
      }
    } catch (e) {
      message.error("Connection failed.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpValue) return message.warning("Please enter verification code");
    setLoginLoading(true);
    try {
      const res = await request(`customer/verify-otp`, "post", { loginValue, otp: otpValue, business_id: bizId });
      if (res && res.success && res.data) {
        setGuestProfile(res.data);
        setMember(res.data);
        setIsLoginModalVisible(false);
        setIsOtpStep(false);
        setOtpValue("");
        message.success(`Welcome back, ${res.data.name}!`);
      } else {
        message.error(res?.message || "Invalid or expired code.");
      }
    } catch (e) {
      message.error("Verification failed.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleGoogleLogin = async (credentialResponse) => {
    setLoginLoading(true);
    try {
      const payload = credentialResponse.isCustom 
        ? { isCustom: true, profile: credentialResponse.profile, business_id: bizId }
        : { token: credentialResponse.credential, business_id: bizId };

      const res = await request(`customer/google-login`, "post", payload);
      if (res && res.success && res.data) {
        setGuestProfile(res.data);
        setMember(res.data);
        setIsLoginModalVisible(false);
        message.success(`Logged in with Google as ${res.data.name}`);
      } else {
        message.error(res?.message || "Google login failed.");
      }
    } catch (e) {
      message.error("Google authentication failed.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRedeemReward = async (gift) => {
    if (!member) return message.warning("Please login first");
    if (member.points < gift.cost) return message.error("Not enough stars");

    Modal.confirm({
      title: 'Redeem Reward',
      content: `Are you sure you want to spend ${gift.cost} stars for ${gift.name}?`,
      okText: 'Yes, Redeem',
      cancelText: 'Cancel',
      centered: true,
      onOk: async () => {
        try {
          const res = await request(`customer/redeem`, "post", {
            customer_id: member.id,
            business_id: bizId,
            reward_name: gift.name,
            stars_cost: gift.cost
          });
          if (res && res.success) {
            message.success(res.message);
            // Refresh member data
            const detailRes = await request(`customer/detail/${member.id}`, "get");
            if (detailRes && detailRes.success) {
              setGuestProfile(detailRes.data);
              setMember(detailRes.data);
            }
          } else {
            message.error(res?.message || "Redeem failed");
          }
        } catch (e) {
          message.error("Connection failed");
        }
      }
    });
  };

  const handleRegister = async () => {
    if (!regName || !regPhone) return message.warning("Please fill all fields");
    setLoginLoading(true);
    try {
      const res = await request("customer/public-create", "post", {
        name: regName,
        phone: regPhone,
        email: regEmail,
        business_id: selectedShop.business_id
      });
      if (res && res.success) {
        setGuestProfile(res.data);
        setMember(res.data);
        setIsRegisterModalVisible(false);
        message.success("Registered successfully!");
      }
    } catch (e) { } finally { setLoginLoading(false); }
  };

  const handleUpdateProfile = async () => {
    if (!regName || !regEmail) {
      message.error("Please fill in name and email");
      return;
    }
    setLoginLoading(true);
    try {
      const res = await request("customer/public-update", "put", {
        id: member.id,
        name: regName,
        email: regEmail
      });
      if (res && res.success) {
        const updatedMember = { ...member, name: regName, email: regEmail };
        setMember(updatedMember);
        localStorage.setItem("pos_customer", JSON.stringify(updatedMember));
        message.success("Profile updated!");
        setIsEditProfileVisible(false);
      }
    } catch (error) {
      console.error(error);
      message.error("Failed to update profile");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogoutMember = () => {
    localStorage.removeItem("guest_profile");
    setMember(null);
    message.info("Logged out from membership");
  };

  const [starred, setStarred] = useState(() => {
    const s = localStorage.getItem('coffee_pos_starred_ids');
    return s ? new Set(JSON.parse(s)) : new Set();
  });

  const [orderId, setOrderId] = useState(() => localStorage.getItem('last_order_id'));
  const [orderStatus, setOrderStatus] = useState(null);
  const [orderHistory, setOrderHistory] = useState([]);
  const [selectedHistoryOrder, setSelectedHistoryOrder] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
    
  useEffect(() => {
    let interval;
    if (orderId) {
      const fetchStatus = async () => {
        try {
          const res = await request(`order-web/${orderId}`, "get");
          if (res && res.order) {
            setOrderStatus(res.order.kitchen_status?.toLowerCase());
          }
        } catch (e) { }
      };
      fetchStatus();
      interval = setInterval(fetchStatus, 5000);
    }
    return () => clearInterval(interval);
  }, [orderId]);

  const fetchHistory = async () => {
    const profile = member || getGuestProfile();
    if (profile?.id) {
      setHistoryLoading(true);
      try {
        const res = await request(`order-web/customer/${profile.id}?limit=10&business_id=${selectedShop.business_id}`, "get");
        if (res?.list) setOrderHistory(res.list);
      } catch (e) { } finally { setHistoryLoading(false); }
    }
  };

  const showOrderDetail = async (order) => {
    setLoading(true);
    try {
      const res = await request(`order-web/${order.id}`, "get");
      if (res?.order) {
        setSelectedHistoryOrder(res);
      }
    } catch (e) { } finally { setLoading(false); }
  };

  const fetchProfile = async () => {
    const profile = member || getGuestProfile();
    if (profile?.id) {
      try {
        const res = await request(`customer/detail/${profile.id}`, "get");
        if (res?.success && res.data) {
          setGuestProfile(res.data);
          setMember(res.data);
        }
      } catch (e) { }
    }
  };

  const [modalProd, setModalProd] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isPlacingOrder = useRef(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [view, setView] = useState("home");
  const [tab, setTab] = useState("home");

  useEffect(() => {
    if (tab === 'profile') {
      fetchHistory();
      fetchProfile();
    }
  }, [tab]);


  useEffect(() => {
    if (selectedShop?.id) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const [cRes, pRes] = await Promise.all([
            request("category", "get", { business_id: selectedShop.business_id }), 
            request("product", "get", { business_id: selectedShop.business_id, branch_id: selectedShop.id })
          ]);
          if (cRes?.list) setCategories([{ id: "all", name: "All" }, ...cRes.list]);
          if (pRes?.list) {
            // Sort by rating (calculated or actual) descending
            const withRating = pRes.list.map(p => ({
              ...p,
              _rating: p.rating || (4.7 + (p.id % 4) * 0.1)
            }));
            const sorted = withRating.sort((a, b) => b._rating - a._rating);
            setMenuItems(sorted);
          }
        } catch { } finally { setLoading(false); }
      };
      fetchData();
    }
  }, [selectedShop?.id]);

  useEffect(() => {
    const bizId = searchParams.get('biz');
    if (bizId) {
      request("business/public-config", "get", { business_id: bizId })
        .then(res => {
          if (res?.config) {
            setSelectedShop(prev => ({ ...prev, ...res.config }));
          }
        }).catch(() => {});
    }
  }, [searchParams]);

  useEffect(() => {
    // SAFETY: If table changes or is new session, ensure cart is clean if it was from another session
    const savedTable = localStorage.getItem('coffee_pos_table');
    if (selectedTable && savedTable && selectedTable !== savedTable) {
      console.log("Table context changed. Clearing stale cart.");
      setCart([]);
      localStorage.removeItem('coffee_pos_cart');
    }
    
    // Prevent saving empty cart back to storage IF we just cleared it during checkout
    if (!isPlacingOrder.current) {
      localStorage.setItem('coffee_pos_cart', JSON.stringify(cart));
      localStorage.setItem('coffee_pos_table', selectedTable || "");
      if (selectedShop) localStorage.setItem('coffee_pos_shop', JSON.stringify(selectedShop));
    }
  }, [cart, selectedTable, selectedShop]);

  const fetchActive = useCallback(async () => {
    if (!selectedShop?.id || !selectedTable || selectedTable === "Web") return;
    try {
      const res = await request(`order-web/active?branch_id=${selectedShop.id}&table_no=${selectedTable}`, "get");
      if (res && res.order) {
        setActiveOrder(res.order);
      } else {
        setActiveOrder(null);
      }
    } catch (err) {
      console.error("Failed to fetch active order:", err);
    }
  }, [selectedShop?.id, selectedTable]);

  useEffect(() => {
    fetchActive();
    const interval = setInterval(fetchActive, 10000);
    return () => clearInterval(interval);
  }, [fetchActive]);

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
    if (loading || cart.length === 0) return;
    if (selectedTable === "Web") {
      message.warning("Please scan the QR code on your table to place an order.");
      return;
    }
    
    setLoading(true);
    isPlacingOrder.current = true;
    try {
      // Try to get GPS but don't block if fails
      let lat = null, lng = null;
      try {
        const pos = await new Promise((res, rej) => {
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 });
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch (err) {
        console.warn("GPS access denied or timed out. Proceeding without coordinates.");
      }

      const sub = cart.reduce((s, i) => s + (i.price * i.qty), 0);
      const profile = member || getGuestProfile();
      
      // Explicitly map fresh items from current cart state
      const itemsToSend = cart.map(i => ({ 
        product_id: i.id, 
        qty: i.qty, 
        price: i.price, 
        note: i.custom 
      }));

      const data = {
        business_id: selectedShop.business_id, 
        branch_id: selectedShop.id, 
        table_no: selectedTable,
        customer_id: profile?.id || null, 
        sub_total: sub, 
        total_amount: sub, 
        payment_method: "Unpaid (Web QR)", 
        order_type: "dine_in",
        lat, 
        lng,
        cart_items: itemsToSend
      };

      const res = await request("order-web", "post", data);
      if (res?.success) {
        // SUCCESS: Aggressively clear everything
        localStorage.setItem('last_order_success', 'true'); // Flag for hard clear on reload/back
        localStorage.removeItem('coffee_pos_cart');
        setCart([]);
        setTransactionId(Math.random().toString(36).slice(2)); // Change transaction ID
        setOrderId(res.order_id);
        localStorage.setItem('last_order_id', res.order_id);
        setCartOpen(false); 
        setTab("status"); 
        message.success(t.order_success_msg);
        fetchHistory(); 
        fetchActive(); 
        
        // HARD RESET: Reload to ensure clean slate for next order
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        isPlacingOrder.current = false;
        message.error(res?.message || t.order_failed_msg);
      }
    } catch (err) {
      isPlacingOrder.current = false;
      console.error("Checkout Error:", err);
      message.error(t.order_failed_msg);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedShop?.id) return <div className="app-container" style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:40, textAlign:"center" }}><div><h2 className="brand" style={{ fontSize:32, marginBottom:16 }}>Please Scan QR</h2><p>Please scan the QR code on your table to browse the menu.</p></div></div>;

  return (
    <div className="app-container">
      <style>{`${CSS}
        @keyframes pulse-gold {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(200, 149, 42, 0.4); }
          70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(200, 149, 42, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(200, 149, 42, 0); }
        }
        @keyframes steam {
          0% { transform: translateY(0) scale(1); opacity: 0.5; }
          50% { transform: translateY(-4px) scale(1.1); opacity: 1; }
          100% { transform: translateY(0) scale(1); opacity: 0.5; }
        }
        @keyframes cook {
          0% { transform: rotate(-5deg) translateX(-2px); }
          50% { transform: rotate(5deg) translateX(2px); }
          100% { transform: rotate(-5deg) translateX(-2px); }
        }
        @keyframes celebrate {
          0% { transform: scale(1); }
          20% { transform: scale(1.2) rotate(5deg); }
          40% { transform: scale(1) rotate(-5deg); }
          60% { transform: scale(1.1) rotate(5deg); }
          100% { transform: scale(1); }
        }
        .pulse-gold { animation: pulse-gold 2s infinite; }
        .ani-steam { animation: steam 2s infinite ease-in-out; }
        .ani-cook { animation: cook 0.5s infinite ease-in-out; }
        .ani-celebrate { animation: celebrate 1s infinite ease-in-out; }
      `}</style>
      <div className="app-root" style={{ minHeight: "100vh" }}>
        <div className="main-col" style={{ 
          minHeight: "100vh", 
          overflowY: "auto", 
          WebkitOverflowScrolling: "touch",
          display: "flex",
          flexDirection: "column"
        }}>
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
                <div style={{ padding:"16px 16px 6px", textAlign:"center" }}>
                  <h1 className="brand" style={{ fontSize:18, fontWeight:700, letterSpacing:".05em", color:"#1C1C1C", textTransform:"uppercase" }}>{selectedShop.name || "AURORA BREW CO."}</h1>
                  <div style={{ fontSize:9, fontWeight:800, color:"#4A6741", marginTop:1, letterSpacing:1 }}>TABLE {selectedTable}</div>
                </div>
              )}

              {/* Promo Banner */}
              {tab === 'home' && !q && selectedShop?.promo_is_active && (
                <div style={{ padding: "0 20px 24px" }}>
                  <div style={{ 
                    position: "relative",
                    height: 200,
                    borderRadius: 32,
                    overflow: "hidden",
                    boxShadow: "0 15px 35px rgba(0,0,0,0.15)",
                    background: "#1C1C1C"
                  }}>
                    <img 
                      src={selectedShop?.promo_image || "https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=1000&auto=format&fit=crop"} 
                      style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.6 }} 
                    />
                    <div style={{ 
                      position: "absolute", top: 0, left: 0, right: 0, bottom: 0, 
                      background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)",
                      padding: 24, display: "flex", flexDirection: "column", justifyContent: "flex-end"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <span style={{ 
                          background: selectedShop?.promo_tag_color || "#C8952A", 
                          color: "#fff", padding: "4px 12px", borderRadius: 100, 
                          fontSize: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: 1
                        }}>
                          {selectedShop?.promo_tag || "SPECIAL OFFER"}
                        </span>
                        {(selectedShop?.promo_start_date || selectedShop?.promo_end_date) && (
                          <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 10, fontWeight: 600 }}>
                             {dayjs(selectedShop.promo_start_date).format('DD/MM')} - {dayjs(selectedShop.promo_end_date).format('DD/MM')}
                          </span>
                        )}
                      </div>
                      <h1 style={{ color: "#fff", fontSize: 24, fontWeight: 900, marginBottom: 4, letterSpacing: "-0.5px", lineHeight: 1.1 }}>
                        {selectedShop?.promo_title || "Premium Coffee Selection"}
                      </h1>
                      <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, lineHeight: 1.4 }}>
                        {selectedShop?.promo_desc || "Experience the finest brew from our selected beans."}
                      </p>
                      {selectedShop.promo_discount && (
                        <div style={{ marginTop: 12, display: "inline-flex", background: "#FEF3C7", color: "#92400E", padding: "4px 12px", borderRadius: 8, fontSize: 12, fontWeight: 800 }}>
                          {selectedShop.promo_discount} OFF
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Search Bar (Only on Search Tab) */}
              {tab === 'search' && (
                <div className="search-wrap" style={!isMobile ? { padding:"12px 20px", margin:0 } : { marginTop: 60, margin: "0 16px 12px" }}>
                  <div className="search-icon"><Ico.Search s={18}/></div>
                  <input ref={searchInputRef} className="search-inp" type="text" placeholder="Search menu items..." value={q} onChange={e => setQ(e.target.value)} />
                  {q && <button onClick={() => setQ("")} style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"#B0A496" }}><Ico.X s={14} /></button>}
                </div>
              )}

              {/* Categories (Only Home) */}
              {(tab === 'home' && !q) && (
                <div style={{ padding:"4px 0 2px", overflowX:"auto" }} className="noscroll">
                  <div style={{ display:"flex", gap:10, paddingLeft:16, paddingRight:16 }}>
                    {categories.map(c => (
                      <button 
                        key={c.id} 
                        className={`cpill ${cat == c.id ? "on" : "off"}`} 
                        onClick={() => setCat(c.id)}
                        style={{ padding: "10px 20px", height: "auto" }}
                      >
                        <span style={{ fontSize: 11 }}>{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Product Grid */}
              <div style={{ padding:"4px 14px", paddingBottom: isMobile ? 0 : 30 }}>
                {q && <div style={{ padding: "0 4px 10px", fontSize: 11, fontWeight: 700, color: "#8A8070" }}>Found {products.length} results</div>}
                {loading ? <div style={{ textAlign:"center", padding:40 }}><Spin /></div> : (
                  <div style={{ display:"flex", flexDirection: "column", gap: 0 }}>
                    {products.map(p => (
                      <ProductCard 
                        key={p.id} p={p} starred={starred.has(p.id)} onStar={toggleStar} onOpen={setModalProd} 
                        selectedShop={selectedShop}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : tab === 'status' ? (
            <div className="fade-in">
              <div style={{ padding: "40px 20px" }}>
                {orderStatus === 'served' ? (
                  <div className="fade-in" style={{ textAlign: "center", padding: "40px 0" }}>
                    <div style={{ fontSize: 80, marginBottom: 20 }}>✨</div>
                    <h2 className="brand" style={{ fontSize: 32, color: "#1C1C1C" }}>Enjoy your brew!</h2>
                    <p style={{ fontSize: 15, color: "#9A9083", marginTop: 12, lineHeight: 1.5 }}>
                      Thank you for choosing Aurora Brew Co. <br/>
                      Your order has been served. Have a wonderful day!
                    </p>
                    <div style={{ marginTop: 40, display:"flex", flexDirection:"column", gap:12 }}>
                      <button onClick={() => setTab('home')} style={{ width: "100%", height: 54, borderRadius: 100, background: "#4A6741", color: "#fff", border: "none", fontWeight: 700 }}>Order Again</button>
                      <button onClick={() => setTab('profile')} style={{ width: "100%", height: 54, borderRadius: 100, background: "#fff", color: "#4A6741", border: "1.5px solid #EDE8DF", fontWeight: 700 }}>View History</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ textAlign: "center", marginBottom: 40 }}>
                       <div style={{ display:"inline-flex", background:"#FEF3C7", color:"#92400E", padding:"6px 20px", borderRadius:100, fontSize:12, fontWeight:800, marginBottom:10 }}>
                          {['preparing', 'cooking'].includes(orderStatus) ? 'PREPARING' : orderStatus === 'served' ? 'SERVED' : 'ORDER RECEIVED'}
                       </div>
                       <h2 className="brand" style={{ fontSize: 28, color: "#1C1C1C" }}>Order Tracking</h2>
                       <p style={{ fontSize: 13, color: "#9A9083", marginTop: 4 }}>Order #{orderId || activeOrder?.order_no || activeOrder?.id || 'N/A'}</p>
                    </div>

                    <div style={{ padding: "0 20px" }}>
                      {[
                        { label: "Order Received", icon: "☕", key: 'pending', desc: "We've got your order.", ani: "ani-steam" },
                        { label: "Preparing", icon: "👨‍🍳", key: 'preparing', desc: "Crafting your espresso.", ani: "ani-cook" },
                        { label: "Ready to Serve", icon: "🛍️", key: 'served', desc: "Enjoy your drink!", ani: "ani-celebrate" }
                      ].map((step, i, arr) => {
                        const statusOrder = ['pending', 'preparing', 'cooking', 'ready', 'served'];
                        let s = orderStatus || activeOrder?.kitchen_status?.toLowerCase() || 'pending';
                        if (s === 'received') s = 'pending';
                        const currentIdxRaw = statusOrder.indexOf(s);
                        let currentStepIdx = 0;
                        if (currentIdxRaw >= 3) currentStepIdx = 2;
                        else if (currentIdxRaw >= 1) currentStepIdx = 1;
                        
                        const isDone = i < currentStepIdx;
                        const isCurrent = i === currentStepIdx;
                        
                        return (
                          <div key={step.key} style={{ display: "flex", gap: 20, marginBottom: 40, position: "relative" }}>
                            {i < arr.length - 1 && (
                              <div style={{ position: "absolute", left: 24, top: 50, width: 2, height: 40, background: isDone || isCurrent ? "#C8952A" : "#EDE8DF" }} />
                            )}
                            <div className={`step-circle ${isCurrent ? "pulse-gold" : ""}`} style={{ 
                              width: 50, height: 50, 
                              borderColor: isCurrent || isDone ? "#C8952A" : "#DDD8CF", 
                              background: isCurrent || isDone ? "#FEF3C7" : "#FAFAF8",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              borderRadius: "50%", border: "2px solid", transition: "all 0.5s ease",
                              zIndex: 2
                            }}>
                              {isDone ? <Ico.Check s={18} /> : <span className={isCurrent ? step.ani : ""} style={{ fontSize: 20 }}>{step.icon}</span>}
                            </div>
                            <div>
                              <h4 style={{ fontSize: 14, fontWeight: 700, color: isCurrent || isDone ? "#1C1C1C" : "#B0A496" }}>{step.label}</h4>
                              <p style={{ fontSize: 11, color: "#9A9083" }}>{step.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <button onClick={() => setTab('home')} style={{ width: "100%", height: 54, borderRadius: 100, background: "#4A6741", color: "#fff", border: "none", fontWeight: 700, marginTop: 20 }}>Back to Menu</button>
                  </>
                )}
              </div>
            </div>
          ) : tab === 'profile' ? (
            <div className="fade-in">
              <div style={{ padding: "40px 20px" }}>
                {member?.id ? (
                  /* PREMIUM DIGITAL MEMBER CARD */
                  <div style={{ 
                    position: "relative",
                    background: member.tier_id >= 3 ? "linear-gradient(135deg, #BF953F, #FCF6BA, #B38728, #FBF5B7, #AA771C)" : 
                                member.tier_id === 2 ? "linear-gradient(135deg, #757F9A, #D7DDE8)" : 
                                "linear-gradient(135deg, #134E5E, #71B280)",
                    borderRadius: 24, 
                    padding: 24, 
                    color: member.tier_id >= 2 ? "#1C1C1C" : "#fff",
                    boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
                    marginBottom: 32,
                    overflow: "hidden"
                  }}>
                    {/* Glossy Overlay */}
                    <div style={{ position: "absolute", top: "-50%", left: "-50%", width: "200%", height: "200%", background: "radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 70%)", pointerEvents: "none" }} />
                    
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative", zIndex: 1 }}>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, opacity: 0.8, textTransform: "uppercase" }}>{member.tier_name} MEMBER</div>
                        <h2 style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>{member.name}</h2>
                        <button 
                          onClick={() => {
                            setRegName(member.name);
                            setRegPhone(member.phone);
                            setRegEmail(member.email || '');
                            setIsEditProfileVisible(true);
                          }}
                          style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", padding: "4px 12px", borderRadius: 100, fontSize: 10, fontWeight: 700, marginTop: 4, cursor: "pointer" }}
                        >
                          EDIT PROFILE
                        </button>
                      </div>
                      <div style={{ background: "#fff", padding: 8, borderRadius: 12, boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }}>
                        <div style={{ width: 60, height: 60, background: "#eee", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8 }}>
                           {/* Simplified QR Placeholder */}
                           <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:2 }}>
                              {[...Array(16)].map((_, i) => <div key={i} style={{ width:8, height:8, background: Math.random() > 0.5 ? "#000" : "#fff" }} />)}
                           </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: 40, display: "flex", justifyContent: "space-between", alignItems: "flex-end", position: "relative", zIndex: 1 }}>
                      <div>
                        <div style={{ fontSize: 10, opacity: 0.8 }}>MEMBER ID</div>
                        <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: 1 }}>{member.card_number || (member.id ? `AUR-${member.id.toString().padStart(4, '0')}` : "GUEST")}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span className="brand" style={{ fontSize: 16, fontWeight: 800 }}>AURORA</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ background: "#fff", borderRadius: 24, padding: 32, textAlign: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", marginBottom: 32 }}>
                    <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#F5F0E8", color: "#C0B8AE", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>
                      <Ico.User />
                    </div>
                    <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1C1C1C" }}>Guest Customer</h2>
                    <p style={{ fontSize: 12, color: "#9A9083", fontWeight: 700, textTransform: "uppercase", marginTop: 4 }}>
                      Table {selectedTable}
                    </p>
                    <div style={{ marginTop: 20, display: "flex", gap: 10, justifyContent: "center" }}>
                      <button onClick={() => setIsLoginModalVisible(true)} style={{ background: "#fff", color: "#4A6741", border: "1.5px solid #4A6741", padding: "8px 20px", borderRadius: 100, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Link Account</button>
                      <button onClick={() => setIsRegisterModalVisible(true)} style={{ background: "#4A6741", color: "#fff", border: "none", padding: "8px 20px", borderRadius: 100, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Join Now</button>
                    </div>
                  </div>
                )}

                {member && (
                  <div style={{ marginBottom: 32 }}>
                    {member.next_tier ? (
                      <>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#9A9083" }}>NEXT TIER: {member.next_tier.name}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#4A6741" }}>{member.next_tier.min_points - member.points} stars to go</span>
                        </div>
                        <div style={{ height: 8, background: "#F5F0E8", borderRadius: 100, overflow: "hidden" }}>
                          <div style={{ 
                            height: "100%", 
                            background: "#C8952A", 
                            width: `${Math.min(100, (member.points / member.next_tier.min_points) * 100)}%`,
                            transition: "width 1s ease-out"
                          }} />
                        </div>
                      </>
                    ) : (
                      <div style={{ textAlign: "center", color: "#C8952A", fontWeight: 800, fontSize: 12, marginBottom: 20 }}>👑 ULTIMATE TIER REACHED</div>
                    )}

                    <div style={{ marginTop: 24, padding: "16px 0", borderTop: "1.5px solid #F5F0E8", borderBottom: "1.5px solid #F5F0E8", display: "flex", justifyContent: "center", gap: 32 }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: "#1C1C1C" }}>{member.points || 0}</div>
                        <div style={{ fontSize: 11, color: "#9A9083", fontWeight: 700 }}>STARS</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: "#1C1C1C" }}>{fmt(member.wallet_balance || 0)}</div>
                        <div style={{ fontSize: 11, color: "#9A9083", fontWeight: 700 }}>WALLET</div>
                      </div>
                    </div>

                    <div style={{ marginTop: 24 }}>
                      <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>REWARDS EXCHANGE</h4>
                      <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8, msOverflowStyle: "none", scrollbarWidth: "none" }}>
                        {[
                          { name: "Free Espresso", cost: 10, img: "☕" },
                          { name: "Aurora Mug", cost: 50, img: "🏺" },
                          { name: "$5 Voucher", cost: 100, img: "🎟️" }
                        ].map(gift => (
                          <div key={gift.name} style={{ flexShrink: 0, width: 120, background: "#fff", padding: 12, borderRadius: 16, border: "1px solid #EDE8DF", textAlign: "center" }}>
                            <div style={{ fontSize: 24, marginBottom: 8 }}>{gift.img}</div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "#1C1C1C", marginBottom: 4 }}>{gift.name}</div>
                            <button 
                              disabled={!member || member.points < gift.cost}
                              onClick={() => handleRedeemReward(gift)}
                              style={{ width: "100%", padding: "4px 0", borderRadius: 8, border: "none", background: (member && member.points >= gift.cost) ? "#4A6741" : "#EDE8DF", color: "#fff", fontSize: 10, fontWeight: 700, cursor: "pointer" }}
                            >
                              {gift.cost} Stars
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {member?.id ? (
                      <button 
                        onClick={handleLogoutMember}
                        style={{ marginTop: 24, background: "#FEF2F2", border: "none", width: "100%", height: 48, borderRadius: 12, fontSize: 13, color: "#E8534A", fontWeight: 700, cursor: "pointer" }}
                      >
                        Logout Membership
                      </button>
                    ) : (
                      <button 
                        onClick={() => setIsRegisterModalVisible(true)}
                        style={{ marginTop: 24, background: "#4A6741", border: "none", width: "100%", height: 48, borderRadius: 12, fontSize: 13, color: "#fff", fontWeight: 700, cursor: "pointer" }}
                      >
                        Join Loyalty Program
                      </button>
                    )}
                  </div>
                )}

                <div style={{ marginTop: 32 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1C1C1C", marginBottom: 16 }}>Order History</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {orderHistory.length === 0 ? (
                      <div style={{ padding: 40, textAlign: "center", color: "#B0A496", background: "#fff", borderRadius: 18, border: "1px dashed #EDE8DF" }}>No history found</div>
                    ) : (
                      orderHistory.map(o => (
                        <div key={o.id} onClick={() => showOrderDetail(o)} style={{ background: "#fff", padding: 18, borderRadius: 18, border: "1px solid #EDE8DF", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700 }}>Order #{o.order_no || o.id}</div>
                            <div style={{ fontSize: 11, color: "#9A9083" }}>{new Date(o.created_at).toLocaleDateString()}</div>
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: "#4A6741" }}>{fmt(o.total_amount)}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 12 }}>
                  {["Language", "Settings", "Help Center"].map(item => (
                    <button key={item} style={{ background: "#fff", padding: 18, borderRadius: 18, textAlign: "left", fontSize: 14, fontWeight: 600, color: "#4B5563", border: "1px solid #EDE8DF", display: "flex", justifyContent: "space-between", cursor:"pointer" }}>
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
            <CartPanel 
              cart={cart} onClose={() => setCartOpen(false)} onQty={updateQty} 
              onRemove={removeItem} onCheckout={handleCheckout} asSidebar 
              selectedShop={selectedShop} loading={loading} 
              activeOrder={activeOrder}
            />
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
            <button className={`bnav-cart ${cart.length > 0 ? "on" : ""}`} onClick={() => setCartOpen(true)}>
              <Ico.Bag />
              {cart.length > 0 && <div className="cart-badge">{cart.length}</div>}
            </button>
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
            <CartPanel 
              cart={cart} onClose={() => setCartOpen(false)} onQty={updateQty} onRemove={removeItem} onCheckout={handleCheckout} 
              selectedShop={selectedShop} loading={loading}
              activeOrder={activeOrder}
            />
          </div>
        </div>
      )}
      {/* Order Detail Modal */}
      {selectedHistoryOrder && (
        <div className="overlay fade-in" onClick={() => setSelectedHistoryOrder(null)}>
          <div className="modal-sheet center-modal slide-up" onClick={e => e.stopPropagation()} style={{ padding: 24, maxWidth: 400 }}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
               <h3 style={{ fontSize: 18, fontWeight: 800 }}>Order Receipt</h3>
               <p style={{ fontSize: 12, color: "#9A9083" }}>Order #{selectedHistoryOrder.order.order_no || selectedHistoryOrder.order.id}</p>
            </div>
            
            <div style={{ borderTop: "1px dashed #EDE8DF", borderBottom: "1px dashed #EDE8DF", padding: "16px 0", marginBottom: 20 }}>
               {selectedHistoryOrder.details.map((item, idx) => (
                 <div key={idx} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13 }}>
                   <div style={{ color: "#4B5563" }}>
                      <span style={{ fontWeight: 700 }}>{item.qty}x</span> {item.product_name}
                      {item.note && <div style={{ fontSize: 10, color: "#9CA3AF" }}>{item.note}</div>}
                   </div>
                   <div style={{ fontWeight: 600 }}>{fmt(item.price * item.qty)}</div>
                 </div>
               ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
               <span style={{ fontWeight: 700, fontSize: 16 }}>Total Amount</span>
               <span style={{ fontWeight: 800, fontSize: 18, color: "#4A6741" }}>{fmt(selectedHistoryOrder.order.total_amount)}</span>
            </div>

            <button onClick={() => setSelectedHistoryOrder(null)} style={{ width: "100%", height: 48, borderRadius: 12, border: "none", background: "#4A6741", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Close</button>
          </div>
        </div>
      )}
      {isLoginModalVisible && (
        <div className="overlay fade-in" onClick={() => { setIsLoginModalVisible(false); setIsOtpStep(false); }}>
          <div className="modal-sheet center-modal slide-up" onClick={e => e.stopPropagation()} style={{ padding: 24 }}>
            {!isOtpStep ? (
              <>
                <div style={{ textAlign: "center", marginBottom: 24 }}>
                  <div style={{ width: 60, height: 60, background: "#F5F0E8", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                    <Ico.User />
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 800 }}>Member Login</h3>
                  <p style={{ fontSize: 13, color: "#9A9083", marginTop: 4 }}>Enter your Phone number or Card ID to receive a verification code.</p>
                </div>
                
                <div style={{ marginBottom: 24 }}>
                  <input 
                    type="text" 
                    className="search-inp" 
                    placeholder="Phone or Card ID" 
                    style={{ paddingLeft: 16 }}
                    value={loginValue}
                    onChange={e => setLoginValue(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLinkMember()}
                  />
                </div>

                <div style={{ display: "flex", gap: 12 }}>
                  <button onClick={() => setIsLoginModalVisible(false)} style={{ flex: 1, height: 48, borderRadius: 12, border: "1.5px solid #EDE8DF", background: "#fff", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                  <button 
                    onClick={handleLinkMember} 
                    disabled={loginLoading}
                    style={{ flex: 1, height: 48, borderRadius: 12, border: "none", background: "#4A6741", color: "#fff", fontWeight: 700, cursor: "pointer", opacity: loginLoading ? 0.7 : 1 }}
                  >
                    {loginLoading ? "Sending..." : "Send Code"}
                  </button>
                </div>

                <div style={{ margin: "24px 0", display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ flex: 1, height: 1, background: "#EDE8DF" }} />
                  <span style={{ fontSize: 12, color: "#9A9083", fontWeight: 700 }}>OR</span>
                  <div style={{ flex: 1, height: 1, background: "#EDE8DF" }} />
                </div>

                <div style={{ display: "flex", justifyContent: "center" }}>
                   <GoogleOAuthProvider clientId="222467462843-3mc4kb1636gcpugur0cgmb4mbdgfpbfl.apps.googleusercontent.com">
                      <CustomGoogleButton 
                        onSuccess={handleGoogleLogin} 
                        loading={loginLoading}
                        bizId={bizId}
                      />
                   </GoogleOAuthProvider>
                </div>
              </>
            ) : (
              <>
                <div style={{ textAlign: "center", marginBottom: 24 }}>
                  <div style={{ width: 60, height: 60, background: "#E6FFFA", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                    <Ico.Lock />
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 800 }}>Verify Code</h3>
                  <p style={{ fontSize: 13, color: "#9A9083", marginTop: 4 }}>We've sent a 6-digit code to your email. Please enter it below.</p>
                </div>
                
                <div style={{ marginBottom: 24 }}>
                  <input 
                    type="text" 
                    className="search-inp" 
                    placeholder="000000" 
                    maxLength={6}
                    style={{ paddingLeft: 16, textAlign: "center", fontSize: 24, letterSpacing: 8, fontWeight: 800 }}
                    value={otpValue}
                    onChange={e => setOtpValue(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <button 
                    onClick={handleVerifyOtp} 
                    disabled={loginLoading}
                    style={{ height: 48, borderRadius: 12, border: "none", background: "#4A6741", color: "#fff", fontWeight: 700, cursor: "pointer", opacity: loginLoading ? 0.7 : 1 }}
                  >
                    {loginLoading ? "Verifying..." : "Verify & Login"}
                  </button>
                  <button onClick={() => setIsOtpStep(false)} style={{ height: 48, borderRadius: 12, border: "none", background: "transparent", color: "#9A9083", fontWeight: 700, cursor: "pointer" }}>Back</button>
                </div>
              </>
            )}
            
            <div style={{ marginTop: 16, textAlign: "center" }}>
               <Text type="secondary" style={{ fontSize: 12 }}>Don't have an account? </Text>
               <button onClick={() => { setIsLoginModalVisible(false); setIsRegisterModalVisible(true); setIsOtpStep(false); }} style={{ background: "none", border: "none", color: "#4A6741", fontWeight: 700, cursor: "pointer", padding: 0 }}>Join Now</button>
            </div>
          </div>
        </div>
      )}

      {/* Register Modal */}
      {isRegisterModalVisible && (
        <div className="overlay fade-in" onClick={() => setIsRegisterModalVisible(false)}>
          <div className="modal-sheet center-modal slide-up" onClick={e => e.stopPropagation()} style={{ padding: 24 }}>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ width: 60, height: 60, background: "#FEF3C7", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <Ico.Star f={true} s={28} style={{ color: "#C8952A" }} />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800 }}>Join Loyalty Program</h3>
              <p style={{ fontSize: 13, color: "#9A9083", marginTop: 4 }}>Earn stars, get discounts, and enjoy exclusive perks!</p>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
              <input 
                type="text" 
                className="search-inp" 
                placeholder="Full Name" 
                style={{ paddingLeft: 16 }}
                value={regName}
                onChange={e => setRegName(e.target.value)}
              />
              <input 
                type="tel" 
                className="search-inp" 
                placeholder="Phone Number" 
                style={{ paddingLeft: 16 }}
                value={regPhone}
                onChange={e => setRegPhone(e.target.value)}
              />
              <input 
                type="email" 
                className="search-inp" 
                placeholder="Email Address (Optional)" 
                style={{ paddingLeft: 16 }}
                value={regEmail}
                onChange={e => setRegEmail(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setIsRegisterModalVisible(false)} style={{ flex: 1, height: 48, borderRadius: 12, border: "1.5px solid #EDE8DF", background: "#fff", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
              <button 
                onClick={handleRegister} 
                disabled={loginLoading}
                style={{ flex: 1, height: 48, borderRadius: 12, border: "none", background: "#4A6741", color: "#fff", fontWeight: 700, cursor: "pointer", opacity: loginLoading ? 0.7 : 1 }}
              >
                {loginLoading ? "Creating..." : "Join & Save"}
              </button>
            </div>
            <div style={{ marginTop: 16, textAlign: "center" }}>
               <Text type="secondary" style={{ fontSize: 12 }}>Already a member? </Text>
               <button onClick={() => { setIsRegisterModalVisible(false); setIsLoginModalVisible(true); }} style={{ background: "none", border: "none", color: "#4A6741", fontWeight: 700, cursor: "pointer", padding: 0 }}>Link Account</button>
            </div>
          </div>
        </div>
      )}
        {/* EDIT PROFILE MODAL */}
        {isEditProfileVisible && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <div style={{ background: "#fff", width: "100%", maxWidth: 400, borderRadius: 32, padding: 32, textAlign: "center", position: "relative" }}>
               <div style={{ marginBottom: 24 }}>
                 <h3 style={{ fontSize: 20, fontWeight: 800 }}>Edit Your Profile</h3>
                 <p style={{ fontSize: 13, color: "#9A9083", marginTop: 4 }}>Update your contact information</p>
               </div>
               
               <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
                 <div style={{ textAlign: "left" }}>
                   <label style={{ fontSize: 11, fontWeight: 800, color: "#9A9083", marginLeft: 16 }}>FULL NAME</label>
                   <input type="text" className="search-inp" value={regName} onChange={e => setRegName(e.target.value)} style={{ paddingLeft: 16, marginTop: 4 }} />
                 </div>
                 <div style={{ textAlign: "left" }}>
                   <label style={{ fontSize: 11, fontWeight: 800, color: "#9A9083", marginLeft: 16 }}>EMAIL ADDRESS</label>
                   <input type="email" className="search-inp" value={regEmail} onChange={e => setRegEmail(e.target.value)} style={{ paddingLeft: 16, marginTop: 4 }} />
                 </div>
                 <div style={{ textAlign: "left" }}>
                   <label style={{ fontSize: 11, fontWeight: 800, color: "#9A9083", marginLeft: 16 }}>PHONE (Read-only)</label>
                   <input type="text" className="search-inp" value={regPhone} disabled style={{ paddingLeft: 16, marginTop: 4, background: "#f9f9f9" }} />
                 </div>
               </div>

               <div style={{ display: "flex", gap: 12 }}>
                 <button onClick={() => setIsEditProfileVisible(false)} style={{ flex: 1, height: 48, borderRadius: 12, border: "1.5px solid #EDE8DF", background: "#fff", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                 <button 
                   onClick={handleUpdateProfile}
                   disabled={loginLoading}
                   style={{ flex: 1, height: 48, borderRadius: 12, border: "none", background: "#4A6741", color: "#fff", fontWeight: 700, cursor: "pointer", opacity: loginLoading ? 0.7 : 1 }}
                 >
                   {loginLoading ? "Saving..." : "Save Changes"}
                 </button>
               </div>
            </div>
          </div>
        )}
      </div>
    );
};

export default CoffeeMenuApp;
