import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getProfile } from "@/app/store/profile.store";
import { request } from "@/shared/utils/helper";
import { useLanguage } from "@/app/store/language.store";
import "./PremiumLanding.css";

/* ─── SVG Icons (inline, zero deps) ─── */
const Icon = ({ d, size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const CheckIcon = () => <Icon d="M20 6L9 17l-5-5" color="#0A5C36" size={13} />;
const ArrowIcon = () => <Icon d="M5 12h14M12 5l7 7-7 7" size={14} />;
const PlayIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="#ffffff">
    <polygon points="5,3 19,12 5,21" />
  </svg>
);

/* ─── Bar chart heights for mock dashboard ─── */
const BARS = [35, 55, 42, 68, 52, 78, 60, 85, 72, 90, 65, 88];

/* ─── Module definitions ─── */
const MODULES = [
  { name: "POS", icon: "🏪", bg: "rgba(34,197,94,0.12)", color: "#22C55E" },
  { name: "ERP", icon: "🏢", bg: "rgba(59,130,246,0.12)", color: "#60a5fa" },
  { name: "HRM", icon: "👥", bg: "rgba(168,85,247,0.12)", color: "#c084fc" },
  { name: "CRM", icon: "💼", bg: "rgba(234,179,8,0.12)", color: "#eab308" },
  { name: "Inventory", icon: "📦", bg: "rgba(249,115,22,0.12)", color: "#fb923c" },
  { name: "Accounting", icon: "📊", bg: "rgba(236,72,153,0.12)", color: "#f472b6" },
  { name: "Projects", icon: "🚀", bg: "rgba(20,184,166,0.12)", color: "#2dd4bf" },
  { name: "Reports", icon: "📈", bg: "rgba(99,102,241,0.12)", color: "#818cf8" },
];

/* ─── Trusted companies ─── */
const TRUSTED = ["Petronas", "Maybank", "AirAsia", "99 Speedmart", "Grab", "Samsung", "TM", "UOB"];

/* ─── Projects ─── */
const PROJECTS = [
  { abbr: "Pe", name: "Petronas Retail System", desc: "Retail & POS Solution", badge: "active", bg: "#15803d", color: "#22C55E" },
  { abbr: "Mb", name: "Maybank ERP System", desc: "Enterprise Resource Planning", badge: "progress", bg: "#1d4ed8", color: "#60a5fa" },
  { abbr: "AA", name: "AirAsia HR Portal", desc: "Human Resource Management", badge: "done", bg: "#b91c1c", color: "#f87171" },
  { abbr: "99", name: "99 Speedmart Inventory", desc: "Inventory Management", badge: "active", bg: "#d97706", color: "#fbbf24" },
  { abbr: "Gr", name: "Grab CRM Platform", desc: "Customer Relationship Mgmt", badge: "progress", bg: "#047857", color: "#34d399" },
];

const BADGE_MAP = {
  active: { label: "Active", cls: "pl-badge-green" },
  progress: { label: "In Progress", cls: "pl-badge-yellow" },
  done: { label: "Completed", cls: "pl-badge-blue" },
};

/* ─── Footer nav ─── */
const FOOTER_COLS = [
  { title: "Product", links: ["Features", "Modules", "Pricing", "Integrations"] },
  { title: "Solutions", links: ["Retail", "Restaurant", "Wholesale", "Services"] },
  { title: "Resources", links: ["Documentation", "Help Center", "Blog", "Guides"] },
  { title: "Company", links: ["About Us", "Careers", "Partners", "Contact"] },
];

/* ════════════════════════════════════════════ */
const SaasLandingPage = () => {
  const navigate = useNavigate();
  const { lang, setLang } = useLanguage();
  const theme = "dark";

  useEffect(() => {
    document.documentElement.classList.add("dark");
    localStorage.setItem("landing_theme", "dark");
  }, []);

  const profile = getProfile();
  const [email, setEmail] = useState("");
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [landingData, setLandingData] = useState({
    heroTitle: "Run Your Business Smarter, Faster, Better",
    heroSubtext: "One platform to manage POS, ERP, HRM, CRM, Inventory, Accounting and more. Built for modern teams and growing enterprises.",
    primaryCTA: "Get Started Free",
    secondaryCTA: "Watch Demo",
    promoMart: "",
    promoRx: "",
    promoResto: "",
    telegram: "",
    phone: "",
    navLinks: "Home, Solutions, Features, Pricing, Resources, Company"
  });

  useEffect(() => {
    if (profile) {
      const isAdmin = profile.is_super_admin === 1 || ["Owner", "Executive", "Admin"].includes(profile.role_name);
      navigate(isAdmin ? "/dashboard" : "/invoices");
    }
  }, [profile]);

  useEffect(() => {
    const fetchLandingData = async () => {
      try {
        const res = await request("system-settings/public", "get");
        if (res && res.success && res.settings && res.settings.landing_page) {
          const parsed = JSON.parse(res.settings.landing_page);
          setLandingData(prev => ({
            ...prev,
            ...parsed
          }));
        }
      } catch (err) {
        console.error("Failed to load landing page config from database:", err);
      }
    };
    fetchLandingData();
  }, []);

  return (
    <div className="pl-landing-page" style={{ minHeight: "100vh", fontFamily: "'Inter',system-ui,sans-serif" }}>

      {/* ── NAVBAR ── */}
      <header className="pl-nav">
        <Link to="/" className="pl-logo">
          <div className="pl-logo-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="pl-logo-text">GrowMe<span>Platform</span></span>
        </Link>

        <nav className="pl-navlinks">
          {(landingData.navLinks ? landingData.navLinks.split(",").map(item => item.trim()) : ["Home", "Solutions", "Features", "Pricing", "Resources", "Company"]).map(n => {
            const path = n === "Home" ? "/" : `/${n.toLowerCase()}`;
            return (
              <Link key={n} to={path} className={`pl-navlink${n === "Home" ? " active" : ""}`}>
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

      {/* ── HERO ── */}
      <section className="pl-hero">
        {/* Left */}
        <div>
          <div className="pl-hero-badge">
            <span className="pl-hero-badge-dot" />
            All-in-One Multi-Platform SaaS
          </div>
          <h1 className="pl-hero-title" style={{ whiteSpace: "pre-line" }}>
            {landingData.heroTitle}
          </h1>
          <p className="pl-hero-desc">
            {landingData.heroSubtext}
          </p>
          <div className="pl-hero-ctas">
            <Link to="/register" className="pl-btn pl-btn-green pl-btn-lg">
              {landingData.primaryCTA} <ArrowIcon />
            </Link>
            <button className="pl-btn pl-btn-outline pl-btn-lg" onClick={() => setShowVideoModal(true)}>
              <PlayIcon /> {landingData.secondaryCTA}
            </button>
          </div>
          <div className="pl-hero-perks">
            {["No Credit Card", "30 Days Free Trial", "Cancel Anytime", "Setup in 5 Minutes"].map(p => (
              <span key={p} className="pl-perk"><CheckIcon />{p}</span>
            ))}
          </div>
        </div>

        {/* Right – Dashboard Mockup */}
        <div className="pl-hero-visual">
          <div className="pl-dashboard-mockup" style={{ position: "relative" }}>
            <div>
              <img
                src="/images/saas_dashboard_mockup.png"
                alt="Enterprise SaaS Dashboard"
                style={{ width: "100%", display: "block" }}
              />
            </div>

            {/* Floating cards */}
            <div className="pl-float-card pl-float-card-green"
              style={{ top: 10, right: -20, minWidth: 130 }}>
              <div className="pl-float-label">Monthly Revenue</div>
              <div className="pl-float-val green">↑ +24.5%</div>
            </div>
            <div className="pl-float-card"
              style={{ bottom: 40, left: -20, minWidth: 120 }}>
              <div className="pl-float-label">Active Users</div>
              <div className="pl-float-val">8,654 Online</div>
            </div>
            <div className="pl-float-card"
              style={{ bottom: 120, right: -24, minWidth: 110 }}>
              <div className="pl-float-label">Orders Today</div>
              <div className="pl-float-val green">142 New</div>
            </div>
          </div>
        </div>
      </section>


      {/* ── CTA BANNER ── */}
      <section className="pl-cta">
        <div className="pl-cta-rocket">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4.5 16.5c-1.5 1.5-2.5 3.5-2.5 5.5C4 22 6 21 7.5 19.5" />
            <path d="M12 2C6 2 2 6 2 12c0 .5.1 1 .2 1.5l5.3-5.3c.4-.4 1-.4 1.4 0s.4 1 0 1.4L3.6 14.9c.5.1 1 .2 1.5.2 6 0 10-4 10-10H12z" />
            <path d="M9 15l-3 3M15 9l3-3" />
          </svg>
        </div>
        <div className="pl-cta-content">
          <h2 className="pl-cta-title">Ready to Transform Your Business?</h2>
          <p className="pl-cta-desc">
            Join thousands of companies using our platform to grow faster and work smarter.
          </p>
        </div>
        <div className="pl-cta-actions">
          <Link to="/register" className="pl-btn pl-btn-green pl-btn-lg">
            Start Free Trial <ArrowIcon />
          </Link>
          <a href="#" className="pl-btn pl-btn-ghost pl-btn-lg">
            Contact Sales
          </a>
        </div>
      </section>

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
            {(landingData.telegram || landingData.phone) && (
              <div style={{ marginTop: 16, fontSize: 12, color: "rgba(255,255,255,0.5)", display: "flex", flexDirection: "column", gap: 6 }}>
                {landingData.telegram && <span>💬 Telegram: <a href={`https://t.me/${landingData.telegram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" style={{ color: "#4ade80", textDecoration: "none" }}>{landingData.telegram}</a></span>}
                {landingData.phone && <span>📞 Phone: <span style={{ color: "#fff" }}>{landingData.phone}</span></span>}
              </div>
            )}
            {/* Newsletter */}
            <div style={{ marginBottom: 4, fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)", letterSpacing: ".5px" }}>
              STAY UPDATED
            </div>
            <div className="pl-footer-newsletter">
              <input
                className="pl-footer-input"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
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
              ].map(s => (
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
          {FOOTER_COLS.map(col => (
            <div key={col.title}>
              <div className="pl-footer-col-title">{col.title}</div>
              <ul className="pl-footer-links">
                {col.links.map(l => {
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
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Security</a>
          </div>
        </div>
      </footer>

      {/* ── VIDEO MODAL ── */}
      {showVideoModal && (
        <div className="pl-video-modal-overlay" onClick={() => setShowVideoModal(false)}>
          <div className="pl-video-modal-content" onClick={e => e.stopPropagation()}>
            <button className="pl-video-modal-close" onClick={() => setShowVideoModal(false)}>
              ✕
            </button>
            <div className="pl-video-aspect">
              <iframe
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
                title="SaaS Platform Demo"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SaasLandingPage;
