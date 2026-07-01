import React from "react";
import MarketingLayout from "./MarketingLayout";

export default function FeaturesPage() {
  const FEATURES = [
    {
      title: "Real-time Live Analytics",
      desc: "Instant reporting on revenue splits, hot-selling items, cost allocations, and margins. Built-in interactive dashboards help you make decisions in seconds.",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
    },
    {
      title: "Granular Team Control",
      desc: "Establish branch-specific roles (Cashier, Store Manager, Accountant, Owner). Track staff logs, clock-in performance, shift durations, and commission ratios.",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        </svg>
      ),
    },
    {
      title: "Smart Multi-Branch Sync",
      desc: "Synchronize raw ingredients and products across multiple outlets. Generate and approve stock transfers, check stock levels instantly, and coordinate suppliers.",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      ),
    },
    {
      title: "Enterprise Grade Security",
      desc: "All workspaces operate on secure SOC 2 compliant databases with multi-factor authentication setup options. End-to-end HTTPS/SSL encryption keeps transactions safe.",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      ),
    },
    {
      title: "Offline-First Fallback",
      desc: "Keep processing sales even if the internet drops. The platform automatically caches transactions and queues sync tasks, syncing once connection is restored.",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
      ),
    },
    {
      title: "Dynamic Customer Portals",
      desc: "Let customers view their purchases, track loyalty reward points, lookup receipts, and place orders directly via KHQR scans or mobile web menus.",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 14s1.5 2 4 2 4-2 4-2" />
        </svg>
      ),
    },
  ];

  return (
    <MarketingLayout>
      {/* Hero Features */}
      <section style={{ padding: "80px 6% 60px", textAlign: "center" }}>
        <div className="pl-hero-badge" style={{ margin: "0 auto 16px" }}>
          <span className="pl-hero-badge-dot" />
          Core Features
        </div>
        <h1 className="pl-hero-title" style={{ fontSize: 44, maxWidth: 800, margin: "0 auto 20px" }}>
          Engineered to scale <span className="green-word" style={{ color: "var(--green)" }}>your business</span>
        </h1>
        <p className="pl-hero-desc" style={{ margin: "0 auto 40px", maxWidth: 600 }}>
          An all-in-one suite of business features, optimized for peak performance and user experience.
        </p>
      </section>

      {/* Features Grid */}
      <section style={{ padding: "0 6% 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 30 }}>
          {FEATURES.map((f) => (
            <div key={f.title} className="pl-card" style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: "rgba(10,92,54,0.08)", color: "var(--green)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0
              }}>
                {f.icon}
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8, color: "var(--text)" }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </MarketingLayout>
  );
}
