import React from "react";

const StepAccountInfo = ({ formData, setFormData, lang, t }) => {
  const [bizFocus, setBizFocus] = React.useState(false);
  const [ownerFocus, setOwnerFocus] = React.useState(false);
  const [emFocus, setEmFocus] = React.useState(false);
  const [phFocus, setPhFocus] = React.useState(false);
  const [pwFocus, setPwFocus] = React.useState(false);
  const [showPw, setShowPw] = React.useState(false);

  const inputBase = (focused) => ({
    width: "100%",
    height: 44,
    borderRadius: 10,
    border: `1.5px solid ${focused ? "#c0a060" : "rgba(255,255,255,0.08)"}`,
    background: focused ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
    color: "white",
    fontSize: 13,
    padding: "0 16px",
    outline: "none",
    transition: "0.2s",
    boxSizing: "border-box"
  });

  return (
    <div style={{ animation: "fadeIn 0.3s ease-in-out" }}>
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 6, display: "block" }}>
          {lang === 'kh' ? "ឈ្មោះអាជីវកម្ម" : "Business Name"} <span style={{ color: "#c0a060" }}>*</span>
        </label>
        <input 
          type="text" 
          value={formData.business_name || ""} 
          onChange={(e) => setFormData({ ...formData, business_name: e.target.value })} 
          onFocus={() => setBizFocus(true)} 
          onBlur={() => setBizFocus(false)} 
          style={inputBase(bizFocus)} 
          placeholder={lang === 'kh' ? "ឧ. ហ្គ្រីន ហ្គ្រោន" : "e.g. Green Grounds"} 
          required 
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 6, display: "block" }}>
          {lang === 'kh' ? "ឈ្មោះតំណាងម្ចាស់" : "Owner Name"} <span style={{ color: "#c0a060" }}>*</span>
        </label>
        <input 
          type="text" 
          value={formData.owner_name || ""} 
          onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })} 
          onFocus={() => setOwnerFocus(true)} 
          onBlur={() => setOwnerFocus(false)} 
          style={inputBase(ownerFocus)} 
          placeholder={lang === 'kh' ? "ឧ. សុខ ម៉េង" : "e.g. Sok Meng"} 
          required 
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 6, display: "block" }}>
          {lang === 'kh' ? "លេខទូរស័ព្ទ" : "Phone Number"} <span style={{ color: "#c0a060" }}>*</span>
        </label>
        <input 
          type="tel" 
          value={formData.phone || ""} 
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
          onFocus={() => setPhFocus(true)} 
          onBlur={() => setPhFocus(false)} 
          style={inputBase(phFocus)} 
          placeholder={lang === 'kh' ? "ឧ. ០៩២ ៨៨៨ ៩៩៩" : "e.g. 092 888 999"} 
          required 
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 6, display: "block" }}>
          {lang === 'kh' ? "អាសយដ្ឋានអ៊ីមែល" : "Email Address"} <span style={{ color: "#c0a060" }}>*</span>
        </label>
        <input 
          type="email" 
          value={formData.email || ""} 
          onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
          onFocus={() => setEmFocus(true)} 
          onBlur={() => setEmFocus(false)} 
          style={inputBase(emFocus)} 
          placeholder="owner@domain.com" 
          required 
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 6, display: "block" }}>
          {lang === 'kh' ? "លេខសម្ងាត់" : "Password"} <span style={{ color: "#c0a060" }}>*</span>
        </label>
        <div style={{ position: "relative" }}>
          <input 
            type={showPw ? "text" : "password"} 
            value={formData.password || ""} 
            onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
            onFocus={() => setPwFocus(true)} 
            onBlur={() => setPwFocus(false)} 
            style={inputBase(pwFocus)} 
            placeholder="••••••••" 
            required 
          />
          <button 
            type="button" 
            onClick={() => setShowPw(!showPw)} 
            style={{ 
              position: "absolute", 
              right: 15, 
              top: "50%", 
              transform: "translateY(-50%)", 
              background: "none", 
              border: "none", 
              color: "rgba(255,255,255,0.4)", 
              cursor: "pointer",
              fontSize: 14
            }}
          >
            {showPw ? "🙈" : "👁"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StepAccountInfo;
