import React from "react";
import MarketingLayout from "./MarketingLayout";

export default function IntegrationsPage() {
  const INTEGRATIONS = [
    {
      name: "Bakong KHQR Payments",
      desc: "Receive instant payments locally in Cambodia. Customers scan dynamic KHQR codes directly from their banking apps (ABA, ACLEDA, Sathapana, Wing), instantly updating register receipt status.",
      type: "Finance & Billing",
      badge: "Built-in",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
      )
    },
    {
      name: "Brevo (Transactional Emails)",
      desc: "Deliver beautiful digital checkout receipts and invoice statements straight to your customer's inbox. Run automated discount email campaigns easily.",
      type: "Marketing & Notification",
      badge: "Active",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
      )
    },
    {
      name: "Cloudinary (Asset Hosting)",
      desc: "Fast, reliable cloud hosting for product menu graphics. Automatically compresses images for faster menu loading and optimized cashier screen checkout rendering.",
      type: "Storage & Assets",
      badge: "Configured",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        </svg>
      )
    },
    {
      name: "Telegram Alert Bot",
      desc: "Get instant sales alerts directly in your group or channel. Send automated closing shift records, low-stock warnings, and expense alerts directly to your phone.",
      type: "Business Alerts",
      badge: "Built-in",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      )
    }
  ];

  return (
    <MarketingLayout>
      {/* Hero Integrations */}
      <section style={{ padding: "80px 6% 60px", textAlign: "center" }}>
        <div className="pl-hero-badge" style={{ margin: "0 auto 16px" }}>
          <span className="pl-hero-badge-dot" />
          Integrations Hub
        </div>
        <h1 className="pl-hero-title" style={{ fontSize: 44, maxWidth: 800, margin: "0 auto 20px" }}>
          Connected to the tools <span className="green-word" style={{ color: "var(--green)" }}>you love</span>
        </h1>
        <p className="pl-hero-desc" style={{ margin: "0 auto 40px", maxWidth: 600 }}>
          Seamlessly link your database, payment gateways, marketing clients, and alert panels to streamline workflows.
        </p>
      </section>

      {/* Integrations Grid */}
      <section style={{ padding: "0 6% 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 30, maxWidth: 1000, margin: "0 auto" }}>
          {INTEGRATIONS.map((i) => (
            <div key={i.name} className="pl-card" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: "rgba(10,92,54,0.08)", color: "var(--green)",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  {i.icon}
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 8px", background: "var(--bg3)", color: "var(--muted)", borderRadius: 6 }}>
                  {i.badge}
                </span>
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6, color: "var(--text)" }}>{i.name}</h3>
              <div style={{ fontSize: 12, color: "var(--green)", fontWeight: 600, marginBottom: 12 }}>{i.type}</div>
              <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, flex: 1 }}>{i.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </MarketingLayout>
  );
}
