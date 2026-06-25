import React from "react";
import { CheckOutlined, CrownOutlined, RocketOutlined, SmileOutlined } from "@ant-design/icons";

const StepSelectPlan = ({ plans, selectedPlan, onSelect, lang }) => {
  const getPlanDetails = (planName) => {
    const nameLower = planName.toLowerCase();
    if (nameLower.includes("free") || nameLower.includes("trial")) {
      return {
        icon: <SmileOutlined style={{ fontSize: 20, color: "#10b981" }} />,
        color: "#10b981",
        popular: false
      };
    } else if (nameLower.includes("pro") || nameLower.includes("standard") || nameLower.includes("growth")) {
      return {
        icon: <CrownOutlined style={{ fontSize: 20, color: "#c0a060" }} />,
        color: "#c0a060",
        popular: true
      };
    } else {
      return {
        icon: <RocketOutlined style={{ fontSize: 20, color: "#3b82f6" }} />,
        color: "#3b82f6",
        popular: false
      };
    }
  };

  return (
    <div style={{ animation: "fadeIn 0.3s ease-in-out" }}>
      <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, marginBottom: 16, textAlign: "center" }}>
        {lang === 'kh' 
          ? "ជ្រើសរើសគម្រោងតម្លៃសេវាកម្ម (អាចផ្លាស់ប្តូរពេលណាក៏បាន)" 
          : "Select a billing plan (you can upgrade/downgrade anytime)"}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {plans.map((plan) => {
          const isSelected = selectedPlan?.id === plan.id;
          const details = getPlanDetails(plan.name);

          return (
            <div
              key={plan.id}
              onClick={() => onSelect(plan)}
              style={{
                background: isSelected ? "rgba(255, 255, 255, 0.03)" : "rgba(255,255,255,0.01)",
                border: `2px solid ${isSelected ? details.color : "rgba(255,255,255,0.05)"}`,
                borderRadius: 16,
                padding: "16px",
                cursor: "pointer",
                transition: "all 0.2s",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                gap: 10
              }}
            >
              {details.popular && (
                <span
                  style={{
                    position: "absolute",
                    top: -10,
                    right: 20,
                    background: details.color,
                    color: "#1a1a1a",
                    fontSize: 9,
                    fontWeight: 800,
                    padding: "3px 8px",
                    borderRadius: 20,
                    textTransform: "uppercase"
                  }}
                >
                  {lang === 'kh' ? "ពេញនិយម" : "Most Popular"}
                </span>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {details.icon}
                  <h4 style={{ color: "white", fontSize: 15, fontWeight: 700, margin: 0 }}>
                    {plan.name}
                  </h4>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ color: "white", fontSize: 18, fontWeight: 800 }}>
                    ${parseFloat(plan.price).toFixed(0)}
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>
                    /{plan.billing_cycle === 'lifetime' ? (lang === 'kh' ? 'មួយជីវិត' : 'lifetime') : (lang === 'kh' ? 'ខែ' : 'mo')}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 12px", borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
                  <CheckOutlined style={{ color: details.color }} />
                  <span>{lang === 'kh' ? "សាខា៖ " : "Branches: "}<strong>{plan.max_branches === 999 ? "Unlimited" : plan.max_branches}</strong></span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
                  <CheckOutlined style={{ color: details.color }} />
                  <span>{lang === 'kh' ? "បុគ្គលិក៖ " : "Staff: "}<strong>{plan.max_staff === 999 ? "Unlimited" : plan.max_staff}</strong></span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
                  <CheckOutlined style={{ color: details.color }} />
                  <span>{lang === 'kh' ? "ទំនិញ៖ " : "Products: "}<strong>{plan.max_products === 9999 ? "Unlimited" : plan.max_products}</strong></span>
                </div>
                {plan.max_categories && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
                    <CheckOutlined style={{ color: details.color }} />
                    <span>{lang === 'kh' ? "ក្រុមទំនិញ៖ " : "Categories: "}<strong>{plan.max_categories === 999 ? "Unlimited" : plan.max_categories}</strong></span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StepSelectPlan;
