import React from "react";
import MarketingLayout from "./MarketingLayout";

export default function ResourcesPage() {
  const RESOURCES = [
    {
      title: "Help Documentation",
      desc: "Complete user manual, setting setup configurations, branch authorization steps, and catalog import walkthroughs.",
      linkText: "Read Docs →",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    {
      title: "Video Tutorials",
      desc: "Watch step-by-step visual guides on setting up your POS system, adding products, managing recipes, and syncing stock.",
      linkText: "Watch Videos →",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="23 7 16 12 23 17 23 7" />
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </svg>
      ),
    },
    {
      title: "Developer API Portal",
      desc: "Integrate third-party checkout modules, fetch real-time stock transfer statistics, and coordinate custom invoice queries.",
      linkText: "Explore API Docs →",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      ),
    },
  ];

  return (
    <MarketingLayout>
      {/* Hero Resources */}
      <section style={{ padding: "80px 6% 60px", textAlign: "center" }}>
        <div className="pl-hero-badge" style={{ margin: "0 auto 16px" }}>
          <span className="pl-hero-badge-dot" />
          Platform Resources
        </div>
        <h1 className="pl-hero-title" style={{ fontSize: 44, maxWidth: 800, margin: "0 auto 20px" }}>
          Knowledge base & <span className="green-word" style={{ color: "var(--green)" }}>learning center</span>
        </h1>
        <p className="pl-hero-desc" style={{ margin: "0 auto 40px", maxWidth: 600 }}>
          Everything you need to successfully deploy, configure, and make the most of GrowMe Platform.
        </p>
      </section>

      {/* Resources Cards */}
      <section style={{ padding: "0 6% 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 30, maxWidth: 1000, margin: "0 auto" }}>
          {RESOURCES.map((r) => (
            <div key={r.title} className="pl-card" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: "rgba(10,92,54,0.08)", color: "var(--green)",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 20
              }}>
                {r.icon}
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12, color: "var(--text)" }}>{r.title}</h3>
              <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6, marginBottom: 24, flex: 1 }}>{r.desc}</p>
              
              <a href="#" style={{ fontSize: 13, fontWeight: 700, color: "var(--green)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
                {r.linkText}
              </a>
            </div>
          ))}
        </div>
      </section>
    </MarketingLayout>
  );
}
