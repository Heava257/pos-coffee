import React from "react";
import MarketingLayout from "./MarketingLayout";

export default function ModulesPage() {
  const MODULES = [
    {
      name: "Point of Sale (POS)",
      desc: "Fast responsive checkout terminal optimized for retail shops and cafes. Supports offline sync, split billing, hold carts, discount overrides, and custom receipt layouts.",
      features: ["Custom Receipt Template Editor", "Multi-Method Payment Splits", "Loyalty Point Accumulations"],
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="M10 8h4M10 12h4M10 16h4M6 8h.01M6 12h.01M6 16h.01M18 8h.01M18 12h.01M18 16h.01" />
        </svg>
      )
    },
    {
      name: "Smart Inventory Control",
      desc: "Comprehensive warehouse management. Track raw material ingredients, set low stock alert thresholds, organize expiry batches, and request cross-branch stock transfers.",
      features: ["Low-stock Auto Alerts", "Expiry Date Batch Trackers", "Branch Transfer Approvals"],
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      )
    },
    {
      name: "HRM & Team Payroll",
      desc: "Manage your workforce efficiently. Plan employee shift rosters, track live clock-in times, set role permissions, and automate payroll/commission computations.",
      features: ["Shift Scheduling Calendars", "Commission Ratio Computations", "Granular Access Permissions"],
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    },
    {
      name: "Accounting & Expenses",
      desc: "Maintain clean financial records. Log branch utility expenses, track supplier cash flows, generate profit-loss tables, and manage cash register opening/closing reconciliations.",
      features: ["Utility Expense Tracking", "Cash Drawer Reconciliations", "Real-time Profit/Loss Logs"],
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      )
    },
    {
      name: "CRM & Marketing Campaigns",
      desc: "Turn first-time buyers into loyal clients. Build customizable discount triggers, create customer profiles, organize reward levels, and run target SMS promotions.",
      features: ["Dynamic Discount Builders", "Loyalty Reward Tierings", "Customer Purchase Profiles"],
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      )
    },
    {
      name: "Kitchen Display (KDS)",
      desc: "Ditch paper slips in the kitchen. Orders placed at the register display instantly on screen, helping chefs track order ages, toggle order states, and decrease prep delays.",
      features: ["Visual Age-alert Overlays", "Single-tap Done Actions", "Prep Performance Reports"],
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      )
    }
  ];

  return (
    <MarketingLayout>
      {/* Hero Modules */}
      <section style={{ padding: "80px 6% 60px", textAlign: "center" }}>
        <div className="pl-hero-badge" style={{ margin: "0 auto 16px" }}>
          <span className="pl-hero-badge-dot" />
          All-in-One Modules
        </div>
        <h1 className="pl-hero-title" style={{ fontSize: 44, maxWidth: 800, margin: "0 auto 20px" }}>
          Modular tools to run <span className="green-word" style={{ color: "var(--green)" }}>your enterprise</span>
        </h1>
        <p className="pl-hero-desc" style={{ margin: "0 auto 40px", maxWidth: 600 }}>
          Pick and configure only the modules your business needs. Fully integrated, zero latency.
        </p>
      </section>

      {/* Modules Grid */}
      <section style={{ padding: "0 6% 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 30 }}>
          {MODULES.map((m) => (
            <div key={m.name} className="pl-card" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: "rgba(10,92,54,0.08)", color: "var(--green)",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 20
              }}>
                {m.icon}
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12, color: "var(--text)" }}>{m.name}</h3>
              <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, marginBottom: 20, flex: 1 }}>{m.desc}</p>
              
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", color: "var(--dim)", marginBottom: 10 }}>Special Features</div>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                  {m.features.map((f) => (
                    <li key={f} style={{ fontSize: 12, color: "var(--text)", display: "flex", alignItems: "center", gap: 8 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {f}
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
