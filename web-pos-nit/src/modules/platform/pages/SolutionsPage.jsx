import React from "react";
import MarketingLayout from "./MarketingLayout";

export default function SolutionsPage() {
  const SOLUTIONS = [
    {
      title: "Retail & Shop Management",
      desc: "Run modern storefronts with ease. Handles instant barcode scanning, multi-method payments, customer loyalty accounts, and real-time inventory adjustments.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
      benefits: ["Fast Checkout Flow", "Barcode Integration", "Stock Notifications"],
    },
    {
      title: "Restaurant & F&B Operations",
      desc: "Perfect for coffee shops, cafes, and dining spaces. Includes kitchen ticket printing (KDS), interactive table mapping, dynamic menu configuration, and ingredient recipe cost analysis.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
      benefits: ["Interactive KDS Mode", "Recipe costing & batch control", "Table Layout Management"],
    },
    {
      title: "Wholesale & Inventory Control",
      desc: "Streamline bulk operations. Track supplier purchase logs, batch expiry management, cross-branch transfers, raw ingredient stock logs, and multi-location warehouses.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      ),
      benefits: ["Expiry Batch Control", "Multi-warehouse Routing", "Supplier Purchase Logs"],
    },
    {
      title: "Corporate & Enterprise SaaS",
      desc: "Built to support heavy organizational structures. Scalable multi-branch permissions, SOC 2 compliance standards, custom dashboard exports, and white-glove data migrations.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
          <line x1="9" y1="22" x2="9" y2="16" />
          <line x1="15" y1="22" x2="15" y2="16" />
        </svg>
      ),
      benefits: ["SOC 2 Compliance Standards", "Multi-Role Granular Setup", "White-Glove Support Desk"],
    },
  ];

  return (
    <MarketingLayout>
      {/* Hero Solutions */}
      <section style={{ padding: "80px 6% 60px", textAlign: "center", position: "relative" }}>
        <div className="pl-hero-badge" style={{ margin: "0 auto 16px" }}>
          <span className="pl-hero-badge-dot" />
          GrowMe Platform Solutions
        </div>
        <h1 className="pl-hero-title" style={{ fontSize: 44, maxWidth: 800, margin: "0 auto 20px" }}>
          Tailored business solutions for <span className="green-word" style={{ color: "var(--green)" }}>every industry</span>
        </h1>
        <p className="pl-hero-desc" style={{ margin: "0 auto 40px", maxWidth: 600 }}>
          Discover features custom-built to help you scale operations, decrease overhead, and keep customers coming back.
        </p>
      </section>

      {/* Solutions Grid */}
      <section style={{ padding: "0 6% 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 30 }}>
          {SOLUTIONS.map((s) => (
            <div key={s.title} className="pl-card" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: "rgba(10,92,54,0.08)", color: "var(--green)",
                display: "flex", alignItems: "center", justifyOrigin: "center", justifyContent: "center",
                marginBottom: 20
              }}>
                {s.icon}
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12, color: "var(--text)" }}>{s.title}</h3>
              <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6, marginBottom: 20, flex: 1 }}>{s.desc}</p>
              
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", color: "var(--dim)", marginBottom: 10 }}>Key Benefits</div>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                  {s.benefits.map((b) => (
                    <li key={b} style={{ fontSize: 13, color: "var(--text)", display: "flex", alignItems: "center", gap: 8 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>
    </MarketingLayout>
  );
}
