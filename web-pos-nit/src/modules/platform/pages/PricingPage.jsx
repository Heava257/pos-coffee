import React, { useState } from "react";
import { Link } from "react-router-dom";
import MarketingLayout from "./MarketingLayout";

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState("monthly"); // "monthly" or "yearly"

  const PLANS = [
    {
      name: "Free Plan",
      desc: "For small startups and single-location shops testing out operations.",
      prices: { monthly: 0, yearly: 0 },
      features: ["1 Active Branch", "2 Staff Users", "Basic POS Sales", "Email Ticket Support"],
      btnText: "Get Started Free",
      popular: false,
    },
    {
      name: "Pro Plan",
      desc: "For growing businesses scaling across branches with advanced workflows.",
      prices: { monthly: 30, yearly: 25 }, // $25 when billed yearly ($300/yr)
      features: [
        "5 Active Branches",
        "10 Staff Users",
        "Advanced Modules (KDS, Forecast)",
        "Raw Material Batch Tracking",
        "Priority Chat Support (24/7)",
      ],
      btnText: "Start 30-Day Free Trial",
      popular: true,
    },
    {
      name: "Enterprise Plan",
      desc: "For large retail chains, franchises, and white-label setups.",
      prices: { monthly: 800, yearly: 650 },
      features: [
        "Unlimited Branches",
        "Unlimited Staff Users",
        "White Label Branding",
        "Dedicated Account Manager",
        "Full API Access",
        "Custom KHQR Integrations",
      ],
      btnText: "Contact Corporate Sales",
      popular: false,
    },
  ];

  return (
    <MarketingLayout>
      {/* Hero Section */}
      <section style={{ padding: "80px 6% 40px", textAlign: "center" }}>
        <div className="pl-hero-badge" style={{ margin: "0 auto 16px" }}>
          <span className="pl-hero-badge-dot" />
          Simple & Clear Pricing
        </div>
        <h1 className="pl-hero-title" style={{ fontSize: 44, maxWidth: 800, margin: "0 auto 20px" }}>
          Plans that grow <span className="green-word" style={{ color: "var(--green)" }}>with your team</span>
        </h1>
        <p className="pl-hero-desc" style={{ margin: "0 auto 30px", maxWidth: 600 }}>
          No hidden fees. Choose a plan that fits your business goals. Upgrade or cancel at any time.
        </p>

        {/* Toggle */}
        <div className="ap-plan-toggle" style={{ marginBottom: 20 }}>
          <button
            className={`ap-plan-toggle-btn${billingCycle === "monthly" ? " active" : ""}`}
            onClick={() => setBillingCycle("monthly")}
          >
            Monthly
          </button>
          <button
            className={`ap-plan-toggle-btn${billingCycle === "yearly" ? " active" : ""}`}
            onClick={() => setBillingCycle("yearly")}
          >
            Yearly (Save 15%)
          </button>
        </div>
      </section>

      {/* Pricing Grid */}
      <section style={{ padding: "0 6% 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: 30, maxWidth: 1100, margin: "0 auto" }}>
          {PLANS.map((p) => {
            const price = billingCycle === "monthly" ? p.prices.monthly : p.prices.yearly;
            return (
              <div
                key={p.name}
                className="pl-card"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  position: "relative",
                  border: p.popular ? "2px solid var(--green)" : "1px solid var(--border)",
                  boxShadow: p.popular ? "0 12px 32px rgba(10,92,54,0.08)" : "var(--shadow)"
                }}
              >
                {p.popular && (
                  <div className="ap-plan-badge" style={{ top: -10 }}>
                    POPULAR CHOICE
                  </div>
                )}
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 20, fontWeight: 900, marginBottom: 8, color: "var(--text)" }}>{p.name}</h3>
                  <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>{p.desc}</p>
                </div>

                <div style={{ marginBottom: 28 }}>
                  <span style={{ fontSize: 38, fontWeight: 900, color: "var(--text)" }}>${price}</span>
                  <span style={{ fontSize: 13, color: "var(--muted)" }}> / month</span>
                  {billingCycle === "yearly" && price > 0 && (
                    <div style={{ fontSize: 11, color: "var(--green)", fontWeight: 600, marginTop: 4 }}>Billed annually (${price * 12}/yr)</div>
                  )}
                </div>

                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12, marginBottom: 36, flex: 1 }}>
                  {p.features.map((f) => (
                    <li key={f} style={{ fontSize: 13, color: "var(--text)", display: "flex", alignItems: "center", gap: 8 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  to="/register"
                  className={`pl-btn ${p.popular ? "pl-btn-green" : "pl-btn-outline"}`}
                  style={{ width: "100%", justifyContent: "center", textDecoration: "none", padding: "12px 20px", borderRadius: 10 }}
                >
                  {p.btnText}
                </Link>
              </div>
            );
          })}
        </div>
      </section>
    </MarketingLayout>
  );
}
