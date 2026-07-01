import React, { useState } from "react";
import MarketingLayout from "./MarketingLayout";

const ShieldIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const UsersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block" }}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

export default function CompanyPage() {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    setSubmitted(true);
  };

  return (
    <MarketingLayout>
      {/* Hero Company */}
      <section style={{ padding: "80px 6% 40px", textAlign: "center" }}>
        <div className="pl-hero-badge" style={{ margin: "0 auto 16px" }}>
          <span className="pl-hero-badge-dot" />
          About GrowMe Platform
        </div>
        <h1 className="pl-hero-title" style={{ fontSize: 44, maxWidth: 800, margin: "0 auto 20px" }}>
          Empowering business growth <span className="green-word" style={{ color: "var(--green)" }}>everywhere</span>
        </h1>
        <p className="pl-hero-desc" style={{ margin: "0 auto 40px", maxWidth: 600 }}>
          We build modern, easy-to-use business software designed to streamline operations, cut waste, and enhance team performance.
        </p>
      </section>

      {/* Grid: About and Contact */}
      <section style={{ padding: "0 6% 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 50, maxWidth: 1100, margin: "0 auto" }}>
          {/* Company details */}
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 20, color: "var(--text)" }}>Our Mission & Values</h2>
            <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7, marginBottom: 20 }}>
              GrowMe Platform was founded with a single mission: to provide small-to-medium enterprises (SMEs) with the same powerful operational tools used by multi-national corporations.
            </p>
            <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7, marginBottom: 28 }}>
              We believe in deep simplicity, absolute data integrity, and local compliance setups (including localized tax, currencies, and KHQR payment support).
            </p>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <span style={{ display: "flex", color: "var(--green)" }}><ShieldIcon /></span>
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Security First</h4>
                  <p style={{ fontSize: 12, color: "var(--dim)" }}>Multi-branch encryption and daily automatic database backups.</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <span style={{ display: "flex", color: "var(--green)" }}><UsersIcon /></span>
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Customer Success</h4>
                  <p style={{ fontSize: 12, color: "var(--dim)" }}>Dedicated onboarding and 24/7 technical chat support.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact form card */}
          <div className="pl-card" style={{ padding: "36px" }}>
            <h3 style={{ fontSize: 20, fontWeight: 900, marginBottom: 8, color: "var(--text)" }}>Contact Our Team</h3>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 24 }}>Have questions about plans, custom integrations, or request demonstrations?</p>
            
            {submitted ? (
              <div style={{ padding: "20px", background: "rgba(10,92,54,0.08)", border: "1px solid var(--green)", borderRadius: 12, textAlign: "center" }}>
                <div style={{ color: "var(--green)", marginBottom: 8 }}><CheckCircleIcon /></div>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: "var(--green)" }}>Message Received!</h4>
                <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>Our business reps will reach out to you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div className="ap-field" style={{ marginBottom: 0 }}>
                  <label className="ap-label">Full Name</label>
                  <input
                    type="text"
                    className="ap-input"
                    placeholder="John Doe"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="ap-field" style={{ marginBottom: 0 }}>
                  <label className="ap-label">Email Address</label>
                  <input
                    type="email"
                    className="ap-input"
                    placeholder="john@company.com"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="ap-field" style={{ marginBottom: 0 }}>
                  <label className="ap-label">Your Message</label>
                  <textarea
                    className="ap-input"
                    rows={4}
                    placeholder="Tell us about your business needs..."
                    required
                    style={{ resize: "none" }}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  />
                </div>
                <button type="submit" className="ap-btn ap-btn-green" style={{ marginTop: 8 }}>
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
