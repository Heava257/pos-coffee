import React from "react";
import { Link } from "react-router-dom";
import { Sparkles, ArrowRight } from "lucide-react";

const LandingHero = ({ settings }) => {
  return (
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
            {settings.primaryCTA || "Get Started"}
            <ArrowRight size={16} />
          </Link>
          <a href="#verticals" className="btn-secondary">
            {settings.secondaryCTA || "View Services"}
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
  );
};

export default LandingHero;
