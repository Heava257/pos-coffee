import React from "react";
import { Link } from "react-router-dom";

const LandingHeader = ({ platformLogo, lang, setLang }) => {
  return (
    <header className="saas-nav">
      <Link to="/" className="nav-logo">
        <img src={platformLogo} alt="Platform Logo" style={{ height: "38px", width: "38px", objectFit: "contain", borderRadius: "50%" }} />
        <div style={{ display: "flex", flexDirection: "column", lineHeight: "1" }}>
          <span style={{ fontSize: "16px", fontWeight: 800 }}>អាយធីស្រុកស្រែ</span>
          <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", fontWeight: 500, letterSpacing: "1px", textTransform: "uppercase" }}>IT SrukSrae</span>
        </div>
      </Link>

      <nav className="nav-links">
        <a href="#features" className="nav-link">Features</a>
        <a href="#verticals" className="nav-link">Verticals</a>
      </nav>

      <div className="nav-actions">
        <div className="lang-toggle-landing">
          <button
            className="lang-toggle-btn"
            onClick={() => setLang("en")}
            style={{
              backgroundColor: lang === "en" ? "#c0a060" : "transparent",
              color: lang === "en" ? "#0b0f19" : "#ffffff"
            }}
          >
            EN
          </button>
          <button
            className="lang-toggle-btn"
            onClick={() => setLang("kh")}
            style={{
              backgroundColor: lang === "kh" ? "#c0a060" : "transparent",
              color: lang === "kh" ? "#0b0f19" : "#ffffff"
            }}
          >
            KH
          </button>
        </div>
        <Link to="/login" className="btn-secondary" style={{ padding: "8px 16px" }}>
          Sign In
        </Link>
        <Link to="/register" className="btn-primary" style={{ padding: "8px 18px" }}>
          Register
        </Link>
      </div>
    </header>
  );
};

export default LandingHeader;
