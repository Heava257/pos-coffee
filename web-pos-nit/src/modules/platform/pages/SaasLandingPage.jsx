import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { request } from "@/shared/utils/helper";
import { getProfile } from "@/app/store/profile.store";
import { useLanguage, translations } from "@/app/store/language.store";
import platformLogo from "@/assets/platform_logo.png";
import {
  Rocket,
  Layers,
  Store,
  Users,
  Coffee,
  Check,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Smartphone,
  Gauge,
  Activity,
  UtensilsCrossed,
  Pill,
  ShoppingBag
} from "lucide-react";
import { Spin } from "antd";

const SaasLandingPage = () => {
  const navigate = useNavigate();
  const { lang, setLang } = useLanguage();
  const t = translations[lang] || translations.en;
  const profile = getProfile();

  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [settings, setSettings] = useState({});

  useEffect(() => {
    // If user is already logged in, redirect to appropriate view
    if (profile) {
      const isAdmin = profile.is_super_admin === 1 ||
        ["Owner", "Executive", "Admin"].includes(profile.role_name);
      if (isAdmin) {
        navigate("/dashboard");
      } else {
        navigate("/invoices");
      }
    }
    fetchPlans();
    fetchSettings();
  }, [profile]);

  const fetchSettings = async () => {
    try {
      const res = await request("system-settings/public", "get");
      if (res && res.success && res.settings && res.settings.landing_page) {
        const landingData = JSON.parse(res.settings.landing_page);
        setSettings(landingData);
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    }
  };

  const fetchPlans = async () => {
    setLoadingPlans(true);
    try {
      const res = await request("plans/public", "get");
      if (res && res.success && res.plans) {
        setPlans(res.plans.filter(p => p.is_active !== 0));
      }
    } catch (err) {
      console.error("Failed to load plans:", err);
    } finally {
      setLoadingPlans(false);
    }
  };

  const getPlanDetails = (planName) => {
    const nameLower = planName.toLowerCase();
    if (nameLower.includes("free") || nameLower.includes("trial")) {
      return {
        badge: "Get Started",
        icon: Sparkles,
        color: "#a3a3a3",
        bgColor: "rgba(255, 255, 255, 0.03)",
        borderColor: "rgba(255, 255, 255, 0.1)",
        popular: false
      };
    } else if (nameLower.includes("pro") || nameLower.includes("standard") || nameLower.includes("growth")) {
      return {
        badge: "Most Popular",
        icon: Rocket,
        color: "#c0a060",
        bgColor: "rgba(192, 160, 96, 0.03)",
        borderColor: "rgba(192, 160, 96, 0.3)",
        popular: true
      };
    } else {
      return {
        badge: "Enterprise",
        icon: ShieldCheck,
        color: "#2e7d32",
        bgColor: "rgba(46, 125, 50, 0.03)",
        borderColor: "rgba(46, 125, 50, 0.3)",
        popular: false
      };
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,600;0,700;1,500&display=swap');
        
        .saas-container {
          background-color: #0b0f19;
          color: #f3f4f6;
          font-family: 'Plus Jakarta Sans', sans-serif;
          min-height: 100vh;
          overflow-x: hidden;
          position: relative;
        }

        .blur-blob {
          position: absolute;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          filter: blur(150px);
          z-index: 0;
          opacity: 0.15;
          pointer-events: none;
        }
        .blob-1 {
          background: #c0a060;
          top: -100px;
          left: -100px;
        }
        .blob-2 {
          background: #2e7d32;
          bottom: 10%;
          right: -100px;
        }

        .saas-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 8%;
          position: sticky;
          top: 0;
          z-index: 1000;
          backdrop-filter: blur(16px);
          background-color: rgba(11, 15, 25, 0.7);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .nav-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 20px;
          font-weight: 800;
          color: #ffffff;
          text-decoration: none;
          letter-spacing: -0.5px;
        }
        .nav-logo span {
          color: #c0a060;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 32px;
        }
        .nav-link {
          color: rgba(255, 255, 255, 0.7);
          text-decoration: none;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.3s;
        }
        .nav-link:hover {
          color: #c0a060;
        }

        .nav-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .btn-secondary {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #ffffff;
          padding: 10px 20px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
        }
        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.3);
        }

        .btn-primary {
          background: linear-gradient(135deg, #c0a060 0%, #a48446 100%);
          color: #0b0f19;
          padding: 12px 24px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
          border: none;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 20px rgba(192, 160, 96, 0.25);
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(192, 160, 96, 0.35);
        }

        .hero-section {
          padding: 100px 8% 80px 8%;
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 60px;
          align-items: center;
          position: relative;
          z-index: 10;
        }

        .hero-content {
          display: flex;
          flex-direction: column;
        }

        .hero-badge {
          align-self: flex-start;
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(192, 160, 96, 0.1);
          border: 1px solid rgba(192, 160, 96, 0.2);
          color: #c0a060;
          padding: 6px 14px;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 24px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .hero-title {
          font-family: 'Playfair Display', serif;
          font-size: 56px;
          font-weight: 700;
          line-height: 1.15;
          margin-bottom: 24px;
          color: #ffffff;
        }
        .hero-title span {
          color: #c0a060;
          font-style: italic;
        }

        .hero-desc {
          font-size: 18px;
          color: rgba(255, 255, 255, 0.6);
          line-height: 1.6;
          margin-bottom: 40px;
          max-width: 580px;
        }

        .hero-ctas {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 48px;
        }

        .hero-visual {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .hero-image-wrapper {
          border-radius: 24px;
          padding: 10px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(10px);
          max-width: 100%;
          transform: perspective(1000px) rotateY(-5deg) rotateX(5deg);
          transition: transform 0.5s ease;
        }
        .hero-image-wrapper:hover {
          transform: perspective(1000px) rotateY(0deg) rotateX(0deg);
        }

        .hero-image {
          width: 100%;
          height: auto;
          border-radius: 16px;
          display: block;
        }

        .stats-section {
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          background: rgba(255, 255, 255, 0.01);
          padding: 40px 8%;
          display: flex;
          justify-content: space-around;
          align-items: center;
          flex-wrap: wrap;
          gap: 30px;
          position: relative;
          z-index: 10;
        }

        .stat-card {
          text-align: center;
        }
        .stat-value {
          font-size: 36px;
          font-weight: 800;
          color: #c0a060;
          margin-bottom: 4px;
        }
        .stat-label {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.5);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .section-header {
          text-align: center;
          margin-bottom: 60px;
          padding: 0 8%;
        }

        .section-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(46, 125, 50, 0.1);
          border: 1px solid rgba(46, 125, 50, 0.2);
          color: #81c784;
          padding: 6px 14px;
          border-radius: 100px;
          font-size: 11px;
          font-weight: 700;
          margin-bottom: 16px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .section-title {
          font-family: 'Playfair Display', serif;
          font-size: 40px;
          color: #ffffff;
          margin-bottom: 16px;
        }

        .section-desc {
          font-size: 16px;
          color: rgba(255, 255, 255, 0.5);
          max-width: 600px;
          margin: 0 auto;
          line-height: 1.6;
        }

        .verticals-section {
          padding: 100px 8%;
          position: relative;
          z-index: 10;
        }

        .verticals-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 30px;
        }

        .vertical-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          padding: 32px;
          transition: all 0.3s;
          position: relative;
          overflow: hidden;
        }
        .vertical-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 3px;
          background: transparent;
          transition: all 0.3s;
        }
        .vertical-card:hover {
          transform: translateY(-5px);
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(255, 255, 255, 0.1);
        }
        .vertical-card.active {
          border-color: rgba(192, 160, 96, 0.2);
        }
        .vertical-card.active::before {
          background: linear-gradient(90deg, #c0a060, #a48446);
        }

        .vertical-icon-wrapper {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
        }

        .vertical-status {
          position: absolute;
          top: 32px;
          right: 32px;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 100px;
        }

        .vertical-title {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 12px;
          color: #ffffff;
        }

        .vertical-desc {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.5);
          line-height: 1.6;
        }

        .pricing-section {
          padding: 60px 8% 120px 8%;
          position: relative;
          z-index: 10;
        }

        .pricing-grid {
          display: flex;
          justify-content: center;
          gap: 30px;
          flex-wrap: wrap;
          margin-top: 40px;
        }

        .pricing-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 24px;
          padding: 40px 32px;
          width: 340px;
          max-width: 100%;
          display: flex;
          flex-direction: column;
          position: relative;
          transition: all 0.3s;
        }
        .pricing-card.popular {
          transform: scale(1.03);
          background: rgba(192, 160, 96, 0.02);
          border-color: rgba(192, 160, 96, 0.3);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
        }
        .pricing-card:hover {
          transform: translateY(-5px);
          border-color: rgba(255, 255, 255, 0.1);
        }
        .pricing-card.popular:hover {
          transform: translateY(-5px) scale(1.03);
          border-color: rgba(192, 160, 96, 0.5);
        }

        .plan-badge {
          position: absolute;
          top: 24px;
          right: 24px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 4px 10px;
          border-radius: 100px;
        }

        .plan-header {
          margin-bottom: 28px;
        }
        .plan-name {
          font-size: 22px;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .plan-price-box {
          display: flex;
          align-items: baseline;
          gap: 4px;
        }
        .plan-currency {
          font-size: 24px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.8);
        }
        .plan-price {
          font-size: 48px;
          font-weight: 800;
          color: #ffffff;
          line-height: 1;
        }
        .plan-cycle {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.4);
          font-weight: 500;
        }

        .plan-divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.06);
          margin-bottom: 28px;
        }

        .plan-features {
          list-style: none;
          margin: 0 0 36px 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 16px;
          flex-grow: 1;
        }
        .plan-feature-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.7);
        }
        .feature-icon-check {
          color: #81c784;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .plan-btn {
          width: 100%;
          padding: 14px 20px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
          border: none;
          text-align: center;
          text-decoration: none;
          display: inline-block;
        }

        .pricing-loader {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 0;
          width: 100%;
        }

        .cta-banner {
          margin: 0 8% 100px 8%;
          background: linear-gradient(135deg, rgba(192, 160, 96, 0.1) 0%, rgba(46, 125, 50, 0.05) 100%);
          border: 1px solid rgba(192, 160, 96, 0.15);
          border-radius: 32px;
          padding: 80px 40px;
          text-align: center;
          position: relative;
          overflow: hidden;
          z-index: 10;
        }

        .cta-banner-title {
          font-family: 'Playfair Display', serif;
          font-size: 40px;
          color: #ffffff;
          font-weight: 700;
          margin-bottom: 16px;
        }
        .cta-banner-desc {
          font-size: 16px;
          color: rgba(255, 255, 255, 0.6);
          max-width: 600px;
          margin: 0 auto 36px auto;
          line-height: 1.6;
        }

        .saas-footer {
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          padding: 60px 8% 40px 8%;
          position: relative;
          z-index: 10;
        }

        .footer-grid {
          display: grid;
          grid-template-columns: 1.8fr repeat(6, 1fr);
          gap: 24px;
          margin-bottom: 48px;
        }
        @media (max-width: 1200px) {
          .footer-grid {
            grid-template-columns: 1.5fr repeat(3, 1fr);
            gap: 32px;
          }
        }
        @media (max-width: 850px) {
          .footer-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 28px;
          }
        }
        @media (max-width: 480px) {
          .footer-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }
        }

        .footer-brand-title {
          font-size: 18px;
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 16px;
        }
        .footer-brand-desc {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.45);
          line-height: 1.6;
          max-width: 280px;
        }

        .footer-col-title {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: rgba(255, 255, 255, 0.3);
          margin-bottom: 20px;
        }

        .footer-links-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .footer-link-item a {
          color: rgba(255, 255, 255, 0.5);
          text-decoration: none;
          font-size: 13px;
          transition: all 0.3s;
        }
        .footer-link-item a:hover {
          color: #c0a060;
        }

        .footer-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 32px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          font-size: 12px;
          color: rgba(255, 255, 255, 0.4);
        }

        .lang-toggle-landing {
          display: flex;
          background: rgba(255, 255, 255, 0.05);
          padding: 4px;
          border-radius: 8px;
          gap: 2px;
        }
        .lang-toggle-btn {
          border: none;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          transition: 0.2s;
        }

        @media (max-width: 991px) {
          .hero-section {
            grid-template-columns: 1fr;
            text-align: center;
            gap: 40px;
            padding-top: 60px;
          }
          .hero-content {
            align-items: center;
          }
          .hero-title {
            font-size: 40px;
          }
          .hero-desc {
            margin-bottom: 30px;
          }
          .hero-image-wrapper {
            transform: none;
          }
          .hero-image-wrapper:hover {
            transform: none;
          }
          .footer-grid {
            grid-template-columns: 1fr 1fr;
            gap: 30px;
          }
        }

        @media (max-width: 576px) {
          .saas-nav {
            padding: 16px 5%;
          }
          .hero-section {
            padding-left: 5%;
            padding-right: 5%;
          }
          .nav-links {
            display: none;
          }
          .hero-ctas {
            flex-direction: column;
            width: 100%;
          }
          .hero-ctas .btn-primary, .hero-ctas .btn-secondary {
            width: 100%;
            justify-content: center;
          }
          .footer-grid {
            grid-template-columns: 1fr;
          }
          .footer-bottom {
            flex-direction: column;
            gap: 16px;
            text-align: center;
          }
        }
      `}</style>

      <div className="saas-container">
        {/* Decorative Blurred Blobs */}
        <div className="blur-blob blob-1"></div>
        <div className="blur-blob blob-2"></div>

        {/* Navigation Bar */}
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
            <a href="#pricing" className="nav-link">Pricing Plans</a>
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

        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content">
            <div className="hero-badge">
              <Sparkles size={14} />
              Enterprise-Grade SaaS POS Platform
            </div>
            <h1 className="hero-title">
              {settings.heroTitle ? settings.heroTitle : <>Run your business <br />smarter with <span>Green Grounds</span></>}
            </h1>
            <p className="hero-desc">
              {settings.heroSubtext || "The ultimate multi-tenant SaaS platform built for high-performance coffee shops, food services, and retail. Manage inventory, branches, and staff all from a single secure cloud dashboard."}
            </p>
            <div className="hero-ctas">
              <Link to="/register" className="btn-primary">
                {settings.primaryCTA || "Start Free Trial"}
                <ArrowRight size={16} />
              </Link>
              <a href="#pricing" className="btn-secondary">
                {settings.secondaryCTA || "View Pricing"}
              </a>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-image-wrapper">
              <img
                src="/images/coffee_hero_landing.png"
                alt="Green Grounds POS Dashboard Mockup"
                className="hero-image"
              />
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="stats-section">
          <div className="stat-card">
            <div className="stat-value">99.99%</div>
            <div className="stat-label">System Uptime</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">&lt; 100ms</div>
            <div className="stat-label">API Latency</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">Real-Time</div>
            <div className="stat-label">Data Sync</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">Multi-Branch</div>
            <div className="stat-label">Architecture</div>
          </div>
        </section>

        {/* Future Verticals Section */}
        <section id="verticals" className="verticals-section">
          <div className="section-header">
            <div className="section-badge">
              <Layers size={12} />
              Platform Verticals
            </div>
            <h2 className="section-title">Built for SaaS Expansion</h2>
            <p className="section-desc">
              Green Grounds is designed to power multiple industries. Start with our fully featured Coffee POS today and easily branch out into new business models as you grow.
            </p>
          </div>

          <div className="verticals-grid">
            {/* Coffee POS */}
            <div className="vertical-card active">
              <div className="vertical-icon-wrapper" style={{ background: "rgba(192, 160, 96, 0.1)", color: "#c0a060" }}>
                <Coffee size={24} />
              </div>
              <span className="vertical-status" style={{ background: "rgba(46, 125, 50, 0.15)", color: "#81c784" }}>
                LIVE NOW
              </span>
              <h3 className="vertical-title">Coffee Shop & Cafe</h3>
              <p className="vertical-desc">
                Includes custom drink options (temperature, sugar level), recipe inventory depletion, Z-Reports, branch-level sales tracking, and table QR code digital ordering.
              </p>
              {settings.promoMart && (
                <div style={{ marginTop: 12, fontSize: 12, color: "#c0a060", fontWeight: 700 }}>
                  Active Promo: <span style={{ background: "rgba(192, 160, 96, 0.1)", padding: "2px 6px", borderRadius: 4 }}>{settings.promoMart}</span>
                </div>
              )}
            </div>

            {/* Restaurant */}
            <div className="vertical-card">
              <div className="vertical-icon-wrapper" style={{ background: "rgba(235, 87, 87, 0.1)", color: "#eb5757" }}>
                <UtensilsCrossed size={24} />
              </div>
              <span className="vertical-status" style={{ background: "rgba(255, 255, 255, 0.08)", color: "rgba(255,255,255,0.4)" }}>
                COMING SOON
              </span>
              <h3 className="vertical-title">Restaurant & KDS</h3>
              <p className="vertical-desc">
                Advanced table layouts, course ordering, split billing, and fully synchronized Kitchen Display System (KDS) for optimized order preparation workflows.
              </p>
              {settings.promoResto && (
                <div style={{ marginTop: 12, fontSize: 12, color: "#eb5757", fontWeight: 700 }}>
                  Active Promo: <span style={{ background: "rgba(235, 87, 87, 0.1)", padding: "2px 6px", borderRadius: 4 }}>{settings.promoResto}</span>
                </div>
              )}
            </div>

            {/* Pharmacy */}
            <div className="vertical-card">
              <div className="vertical-icon-wrapper" style={{ background: "rgba(45, 156, 219, 0.1)", color: "#2d9cdb" }}>
                <Pill size={24} />
              </div>
              <span className="vertical-status" style={{ background: "rgba(255, 255, 255, 0.08)", color: "rgba(255,255,255,0.4)" }}>
                COMING SOON
              </span>
              <h3 className="vertical-title">Pharmacy & Health</h3>
              <p className="vertical-desc">
                Track pharmaceutical drug batches, expiration dates, medicine classifications, doctor prescription uploads, and legal regulations control.
              </p>
              {settings.promoRx && (
                <div style={{ marginTop: 12, fontSize: 12, color: "#2d9cdb", fontWeight: 700 }}>
                  Active Promo: <span style={{ background: "rgba(45, 156, 219, 0.1)", padding: "2px 6px", borderRadius: 4 }}>{settings.promoRx}</span>
                </div>
              )}
            </div>

            {/* Retail */}
            <div className="vertical-card">
              <div className="vertical-icon-wrapper" style={{ background: "rgba(39, 174, 96, 0.1)", color: "#27ae60" }}>
                <ShoppingBag size={24} />
              </div>
              <span className="vertical-status" style={{ background: "rgba(255, 255, 255, 0.08)", color: "rgba(255,255,255,0.4)" }}>
                COMING SOON
              </span>
              <h3 className="vertical-title">Retail & Boutique</h3>
              <p className="vertical-desc">
                Barcode scanner integrations, variant tracking (sizes, colors), loyalty point tier algorithms, and seasonal product discount promotions engine.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing Section (Real Data) */}
        <section id="pricing" className="pricing-section">
          <div className="section-header">
            <div className="section-badge">
              <Rocket size={12} />
              Flexible Pricing
            </div>
            <h2 className="section-title">Plans tailored to your scale</h2>
            <p className="section-desc">
              All plans use live configs controlled by the Platform Admin role. Pick a plan that fits your business needs, and upgrade anytime.
            </p>
          </div>

          <div className="pricing-grid">
            {loadingPlans ? (
              <div className="pricing-loader">
                <Spin size="large" />
                <p style={{ marginTop: 16, color: "rgba(255,255,255,0.4)" }}>Loading dynamic platform plans...</p>
              </div>
            ) : plans.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.4)" }}>
                No active pricing plans found. Please contact platform support.
              </div>
            ) : (
              plans.map((plan) => {
                const details = getPlanDetails(plan.name);
                const IconComponent = details.icon;

                return (
                  <div key={plan.id} className={`pricing-card ${details.popular ? "popular" : ""}`}>
                    <span
                      className="plan-badge"
                      style={{
                        color: details.color,
                        background: details.color + "22",
                        border: `1px solid ${details.color}33`
                      }}
                    >
                      {details.badge}
                    </span>

                    <div className="plan-header">
                      <h3 className="plan-name">
                        <IconComponent size={20} style={{ color: details.color }} />
                        {plan.name}
                      </h3>
                      <div className="plan-price-box">
                        <span className="plan-currency">$</span>
                        <span className="plan-price">{parseFloat(plan.price).toFixed(0)}</span>
                        <span className="plan-cycle">/{plan.billing_cycle || "month"}</span>
                      </div>
                    </div>

                    <div className="plan-divider"></div>

                    <ul className="plan-features">
                      <li className="plan-feature-item">
                        <Check size={16} className="feature-icon-check" />
                        <span>Branches limit: <strong>{plan.max_branches || "Unlimited"}</strong></span>
                      </li>
                      <li className="plan-feature-item">
                        <Check size={16} className="feature-icon-check" />
                        <span>Staff limit: <strong>{plan.max_staff || "Unlimited"}</strong></span>
                      </li>
                      <li className="plan-feature-item">
                        <Check size={16} className="feature-icon-check" />
                        <span>Products limit: <strong>{plan.max_products || "Unlimited"}</strong></span>
                      </li>
                      <li className="plan-feature-item">
                        <Check size={16} className="feature-icon-check" />
                        <span>Categories limit: <strong>{plan.max_categories || "Unlimited"}</strong></span>
                      </li>
                      <li className="plan-feature-item">
                        <Check size={16} className="feature-icon-check" />
                        <span>Active Modules: <strong style={{ fontSize: 12, color: "#81c784" }}>{(plan.active_modules || "").replace(/_/g, " ")}</strong></span>
                      </li>
                    </ul>

                    <button
                      onClick={() => navigate(`/register?plan_id=${plan.id}`)}
                      className="plan-btn"
                      style={{
                        backgroundColor: details.popular ? "#c0a060" : "rgba(255,255,255,0.06)",
                        color: details.popular ? "#0b0f19" : "#ffffff",
                        border: details.popular ? "none" : "1px solid rgba(255,255,255,0.1)"
                      }}
                    >
                      Choose Plan
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Bottom CTA Banner */}
        <section className="cta-banner">
          <h2 className="cta-banner-title">Ready to digitize your Coffee business?</h2>
          <p className="cta-banner-desc">
            Join hundreds of modern merchants scaling their branches with Green Grounds POS. Set up your shop menu, customize options, and sync your inventory today.
          </p>
          <Link to="/register" className="btn-primary" style={{ padding: "16px 36px", fontSize: 16 }}>
            Create Your Account Now
            <ArrowRight size={18} />
          </Link>
        </section>

        {/* Footer */}
        <footer className="saas-footer">
          <div className="footer-grid">
            <div>
              <div className="footer-brand-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <img src={platformLogo} alt="Platform Logo" style={{ height: "42px", width: "42px", objectFit: "contain", borderRadius: "50%" }} />
                <div style={{ display: "flex", flexDirection: "column", lineHeight: "1.2" }}>
                  <span style={{ fontSize: "16px", fontWeight: 800, color: "#fff" }}>អាយធីស្រុកស្រែ</span>
                  <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", fontWeight: 500, letterSpacing: "1px", textTransform: "uppercase" }}>IT SrukSrae</span>
                </div>
              </div>
              <p className="footer-brand-desc">
                Multi-tenant cloud platform offering state-of-the-art POS management systems for vertical business scales.
              </p>
            </div>

            {/* Product Column */}
            <div>
              <div className="footer-col-title">Product</div>
              <ul className="footer-links-list">
                <li className="footer-link-item"><a href="#features">Features</a></li>
                <li className="footer-link-item"><a href="#pricing">Pricing</a></li>
                <li className="footer-link-item"><a href="#verticals">Modules</a></li>
                <li className="footer-link-item"><a href="#">Integrations</a></li>
                <li className="footer-link-item"><a href="#">Release Notes</a></li>
              </ul>
            </div>

            {/* Resources Column */}
            <div>
              <div className="footer-col-title">Resources</div>
              <ul className="footer-links-list">
                <li className="footer-link-item"><a href="#">Documentation</a></li>
                <li className="footer-link-item"><a href="#">API Docs</a></li>
                <li className="footer-link-item"><a href="#">Help Center</a></li>
                <li className="footer-link-item"><a href="#">Tutorials</a></li>
                <li className="footer-link-item"><a href="#">FAQ</a></li>
              </ul>
            </div>

            {/* Company Column */}
            <div>
              <div className="footer-col-title">Company</div>
              <ul className="footer-links-list">
                <li className="footer-link-item"><Link to="/about">About Us</Link></li>
                <li className="footer-link-item"><Link to="/contact">Contact Us</Link></li>
                <li className="footer-link-item"><a href="#">Careers</a></li>
                <li className="footer-link-item"><a href="#">Partners</a></li>
              </ul>
            </div>

            {/* Legal Column */}
            <div>
              <div className="footer-col-title">Legal</div>
              <ul className="footer-links-list">
                <li className="footer-link-item"><Link to="/terms">Terms of Service</Link></li>
                <li className="footer-link-item"><Link to="/privacy">Privacy Policy</Link></li>
                <li className="footer-link-item"><Link to="/cookies">Cookie Policy</Link></li>
                <li className="footer-link-item"><Link to="/refund-policy">Refund Policy</Link></li>
                <li className="footer-link-item"><Link to="/acceptable-use">Acceptable Use</Link></li>
              </ul>
            </div>

            {/* Support Column */}
            <div>
              <div className="footer-col-title">Support</div>
              <ul className="footer-links-list">
                <li className="footer-link-item"><a href="https://t.me/pongchiva" target="_blank" rel="noreferrer">Telegram</a></li>
                <li className="footer-link-item"><a href="mailto:support@yourcompany.com">Email Support</a></li>
                <li className="footer-link-item"><a href="#">Live Chat</a></li>
                <li className="footer-link-item"><a href="#">Status Page</a></li>
              </ul>
            </div>

            {/* Social Column */}
            <div>
              <div className="footer-col-title">Social</div>
              <ul className="footer-links-list">
                <li className="footer-link-item"><a href="https://facebook.com" target="_blank" rel="noreferrer">Facebook</a></li>
                <li className="footer-link-item"><a href="https://linkedin.com" target="_blank" rel="noreferrer">LinkedIn</a></li>
                <li className="footer-link-item"><a href="https://youtube.com" target="_blank" rel="noreferrer">YouTube</a></li>
                <li className="footer-link-item"><a href="https://tiktok.com" target="_blank" rel="noreferrer">TikTok</a></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <div>
              &copy; {new Date().getFullYear()} Green Grounds. All rights reserved. Version 1.0.0
            </div>
            <div>
              Status: <span style={{ color: "#81c784", fontWeight: 700 }}>● Operational</span>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default SaasLandingPage;
