import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { request } from "@/shared/utils/helper";
import { getProfile } from "@/app/store/profile.store";
import { useLanguage, translations } from "@/app/store/language.store";
import platformLogo from "@/assets/platform_logo.png";
import { ArrowRight } from "lucide-react";

// Import Refactored Modular Components
import LandingHeader from "../components/LandingHeader";
import LandingHero from "../components/LandingHero";
import LandingStats from "../components/LandingStats";
import LandingVerticals from "../components/LandingVerticals";
import LandingFooter from "../components/LandingFooter";

const SaasLandingPage = () => {
  const navigate = useNavigate();
  const { lang, setLang } = useLanguage();
  const t = translations[lang] || translations.en;
  const profile = getProfile();

  const [packages, setPackages] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
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
    fetchPackages();
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

  const fetchPackages = async () => {
    setLoadingPackages(true);
    try {
      const res = await request("subscription/packages/public", "get");
      if (res && res.success && res.list) {
        setPackages(res.list);
      }
    } catch (err) {
      console.error("Failed to load packages:", err);
    } finally {
      setLoadingPackages(false);
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
          display: inline-flex;
          align-items: center;
          text-decoration: none;
        }
        .btn-secondary:hover {
          background-color: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.25);
        }

        .btn-primary {
          background-color: #c0a060;
          color: #0b0f19;
          padding: 10px 24px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          border: none;
          transition: all 0.3s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          box-shadow: 0 4px 14px rgba(192, 160, 96, 0.3);
        }
        .btn-primary:hover {
          background-color: #b09050;
          box-shadow: 0 6px 20px rgba(192, 160, 96, 0.4);
          transform: translateY(-1px);
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

        .hero-section {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 60px;
          padding: 100px 8% 80px 8%;
          align-items: center;
          position: relative;
          z-index: 10;
        }

        .hero-content {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background-color: rgba(192, 160, 96, 0.1);
          color: #c0a060;
          padding: 6px 14px;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 24px;
          border: 1px solid rgba(192, 160, 96, 0.15);
        }

        .hero-title {
          font-size: 56px;
          font-weight: 800;
          line-height: 1.15;
          margin-bottom: 20px;
          letter-spacing: -1.5px;
          color: #ffffff;
        }
        .hero-title span {
          color: #c0a060;
          font-family: 'Playfair Display', serif;
          font-style: italic;
          font-weight: 600;
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
          gap: 16px;
        }

        .hero-visual {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .hero-image-wrapper {
          position: relative;
          width: 100%;
          max-width: 480px;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 30px 60px rgba(0,0,0,0.5), 
                      0 0 0 1px rgba(255,255,255,0.05);
          transition: all 0.5s ease;
          aspect-ratio: 1;
        }
        .hero-image-wrapper:hover {
          transform: translateY(-5px) scale(1.01);
          box-shadow: 0 40px 80px rgba(0,0,0,0.6), 
                      0 0 0 1px rgba(192, 160, 96, 0.2);
        }
        .hero-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .stats-section {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
          padding: 60px 8%;
          background-color: rgba(255, 255, 255, 0.01);
          border-top: 1px solid rgba(255, 255, 255, 0.03);
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
          position: relative;
          z-index: 10;
        }
        .stat-card {
          text-align: center;
          padding: 20px;
        }
        .stat-value {
          font-size: 36px;
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 8px;
          letter-spacing: -1px;
        }
        .stat-label {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.45);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .verticals-section {
          padding: 100px 8%;
          position: relative;
          z-index: 10;
        }
        .section-header {
          text-align: center;
          max-width: 650px;
          margin: 0 auto 60px auto;
        }
        .section-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background-color: rgba(46, 125, 50, 0.1);
          color: #81c784;
          padding: 6px 14px;
          border-radius: 100px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 16px;
          border: 1px solid rgba(46, 125, 50, 0.15);
        }
        .section-title {
          font-size: 40px;
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 16px;
          letter-spacing: -1px;
        }
        .section-desc {
          font-size: 16px;
          color: rgba(255, 255, 255, 0.5);
          line-height: 1.6;
        }

        .verticals-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 32px;
        }
        .vertical-card {
          background-color: rgba(255, 255, 255, 0.01);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 24px;
          padding: 36px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        .vertical-card:hover {
          background-color: rgba(255, 255, 255, 0.02);
          border-color: rgba(255, 255, 255, 0.08);
          transform: translateY(-4px);
        }
        .vertical-card.active {
          border-color: rgba(192, 160, 96, 0.2);
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        }
        .vertical-icon-wrapper {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
        }
        .vertical-status {
          position: absolute;
          top: 36px;
          right: 36px;
          font-size: 10px;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 100px;
          letter-spacing: 0.5px;
        }
        .vertical-title {
          font-size: 22px;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 12px;
        }
        .vertical-desc {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.55);
          line-height: 1.6;
          margin-bottom: 0;
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

        @media (max-width: 1200px) {
          .footer-grid {
            grid-template-columns: 1.5fr repeat(3, 1fr);
            gap: 32px;
          }
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
          .footer-grid {
            grid-template-columns: 1fr 1fr;
            gap: 30px;
          }
        }

        @media (max-width: 850px) {
          .footer-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 28px;
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

        {/* Dynamic Refactored Header */}
        <LandingHeader 
          platformLogo={platformLogo} 
          lang={lang} 
          setLang={setLang} 
        />

        {/* Dynamic Refactored Hero Section */}
        <LandingHero settings={settings} />

        {/* Refactored Stats Section */}
        <LandingStats />

        {/* Dynamic Verticals/Services Grid Section */}
        <LandingVerticals 
          packages={packages} 
          loading={loadingPackages} 
          lang={lang} 
        />

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

        {/* Refactored Footer */}
        <LandingFooter platformLogo={platformLogo} />
      </div>
    </>
  );
};

export default SaasLandingPage;
