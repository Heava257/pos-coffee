import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "@/app/store/language.store";
import "./PremiumLanding.css";

const FOOTER_COLS = [
  { title:"Product",    links:["Features","Modules","Pricing","Integrations"] },
  { title:"Solutions",  links:["Retail","Restaurant","Wholesale","Services"] },
  { title:"Resources",  links:["Documentation","Help Center","Blog","Guides"] },
  { title:"Company",    links:["About Us","Careers","Partners","Contact"] },
];

export default function MarketingLayout({ children }) {
  const { lang, setLang } = useLanguage();
  const theme = "dark";

  useEffect(() => {
    document.documentElement.classList.add("dark");
    localStorage.setItem("landing_theme", "dark");
  }, []);

  const { pathname } = useLocation();
  const [email, setEmail] = useState("");

  // Scroll to top on navigation
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="pl-landing-page" style={{ minHeight: "100vh", fontFamily: "'Inter',system-ui,sans-serif" }}>
      {/* ── HEADER ── */}
      <header className="pl-nav">
        <Link to="/" className="pl-logo">
          <div className="pl-logo-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="pl-logo-text">GrowMe<span>Platform</span></span>
        </Link>

        <nav className="pl-navlinks">
          {["Home", "Solutions", "Features", "Pricing", "Resources", "Company"].map((n) => {
            const path = n === "Home" ? "/" : `/${n.toLowerCase()}`;
            const isActive = pathname === path;
            return (
              <Link
                key={n}
                to={path}
                className={`pl-navlink${isActive ? " active" : ""}`}
              >
                {n}
              </Link>
            );
          })}
        </nav>

        <div className="pl-nav-actions">
          <div className="pl-header-controls">

            <select className="pl-header-select" value={lang} onChange={(e) => setLang(e.target.value)}>
              <option value="en">🌐 EN</option>
              <option value="kh">🇰🇭 KH</option>
            </select>
          </div>

          <Link to="/login" className="pl-btn pl-btn-outline">Login</Link>
          <Link to="/register" className="pl-btn pl-btn-green">Register</Link>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main style={{ minHeight: "calc(100vh - 68px - 360px)" }}>
        {children}
      </main>

      {/* ── FOOTER ── */}
      <footer className="pl-footer">
        <div className="pl-footer-top">
          {/* Brand */}
          <div>
            <div className="pl-footer-brand-name">
              <div className="pl-logo-icon" style={{ width: 30, height: 30, borderRadius: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                    stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span style={{ fontWeight: 800, fontSize: 16, color: "#fff" }}>GrowMe<span style={{ color: "#4ade80" }}>Platform</span></span>
            </div>
            <p className="pl-footer-brand-desc">
              All-in-one business platform for modern companies and growing enterprises worldwide.
            </p>
            {/* Newsletter */}
            <div style={{ marginBottom: 4, fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)", letterSpacing: ".5px" }}>
              STAY UPDATED
            </div>
            <div className="pl-footer-newsletter">
              <input
                className="pl-footer-input"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button className="pl-btn pl-btn-green" style={{ padding: "9px 16px", borderRadius: 10, flexShrink: 0 }}>
                Subscribe
              </button>
            </div>
            {/* Social icons */}
            <div className="pl-social-row">
              {[
                { label: "fb", d: "M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" },
                { label: "tw", d: "M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" },
                { label: "li", d: "M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 6a2 2 0 100-4 2 2 0 000 4z" },
                { label: "yt", d: "M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 1.96A29 29 0 001 12a29 29 0 00.46 5.58 2.78 2.78 0 001.95 1.95C5.12 20 12 20 12 20s6.88 0 8.59-.47a2.78 2.78 0 001.95-1.95A29 29 0 0023 12a29 29 0 00-.46-5.58z M9.75 15.02V8.98L15.5 12l-5.75 3.02z" },
                { label: "gh", d: "M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22" },
              ].map((s) => (
                <a key={s.label} href="#" className="pl-social-btn">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={s.d} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Nav columns */}
          {FOOTER_COLS.map((col) => (
            <div key={col.title}>
              <div className="pl-footer-col-title">{col.title}</div>
              <ul className="pl-footer-links">
                {col.links.map((l) => {
                  let path = "#";
                  const lower = l.toLowerCase();
                  if (lower === "features") path = "/features";
                  else if (lower === "modules") path = "/modules";
                  else if (lower === "pricing") path = "/pricing";
                  else if (lower === "integrations") path = "/integrations";
                  else if (lower === "about us" || lower === "contact" || lower === "careers" || lower === "partners") path = "/company";
                  else if (lower === "documentation" || lower === "help center" || lower === "blog" || lower === "guides") path = "/resources";
                  else if (["retail", "restaurant", "wholesale", "services"].includes(lower)) path = "/solutions";

                  return (
                    <li key={l}>
                      <Link to={path}>{l}</Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="pl-footer-bottom">
          <div>© {new Date().getFullYear()} GrowMePlatform. All rights reserved.</div>
          <div className="pl-footer-bottom-links">
            <Link to="/terms">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/terms">Security</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
