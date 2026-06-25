import React from "react";
import { CoffeeOutlined, ShopOutlined, ShoppingOutlined, MedicineBoxOutlined, AppstoreOutlined } from "@ant-design/icons";
import { message } from "antd";

const StepSelectService = ({ packages, selectedPackage, onSelect, lang }) => {
  const getIcon = (industryCode) => {
    switch (industryCode) {
      case "coffee_cafe":
        return <CoffeeOutlined style={{ fontSize: 24 }} />;
      case "restaurant":
        return <ShopOutlined style={{ fontSize: 24 }} />;
      case "retail":
      case "mart":
        return <ShoppingOutlined style={{ fontSize: 24 }} />;
      case "pharmacy":
        return <MedicineBoxOutlined style={{ fontSize: 24 }} />;
      default:
        return <AppstoreOutlined style={{ fontSize: 24 }} />;
    }
  };

  const getColor = (industryCode) => {
    switch (industryCode) {
      case "coffee_cafe":
        return { primary: "#c0a060", bg: "rgba(192, 160, 96, 0.08)" };
      case "restaurant":
        return { primary: "#eb5757", bg: "rgba(235, 87, 87, 0.08)" };
      case "retail":
      case "mart":
        return { primary: "#27ae60", bg: "rgba(39, 174, 96, 0.08)" };
      case "pharmacy":
        return { primary: "#2d9cdb", bg: "rgba(45, 156, 219, 0.08)" };
      default:
        return { primary: "#9b51e0", bg: "rgba(155, 81, 224, 0.08)" };
    }
  };

  return (
    <div style={{ animation: "fadeIn 0.3s ease-in-out" }}>
      <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, marginBottom: 16, textAlign: "center" }}>
        {lang === 'kh' 
          ? "សូមជ្រើសរើសប្រភេទសេវាកម្មអាជីវកម្មរបស់អ្នក" 
          : "Please select your primary industry vertical / service package"}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {packages.map((pkg) => {
          const isActive = pkg.status === "active";
          const isSelected = isActive && selectedPackage?.id === pkg.id;
          const colors = getColor(pkg.industry_code);

          return (
            <div
              key={pkg.id}
              onClick={() => {
                if (isActive) {
                  onSelect(pkg);
                } else {
                  message.info(
                    lang === 'kh' 
                      ? `សេវាកម្ម ${pkg.name} ជិតមកដល់ហើយ!` 
                      : `${pkg.name} service is coming soon!`
                  );
                }
              }}
              style={{
                background: isSelected ? "rgba(255, 255, 255, 0.03)" : "rgba(255,255,255,0.01)",
                border: `2px solid ${isSelected ? colors.primary : "rgba(255, 255, 255, 0.05)"}`,
                borderRadius: 16,
                padding: "16px 14px",
                cursor: "pointer",
                opacity: 1,
                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                boxShadow: isSelected ? `0 8px 24px ${colors.primary}15` : "none",
                position: "relative"
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: isSelected ? colors.bg : "rgba(255,255,255,0.03)",
                  color: isSelected ? colors.primary : "rgba(255,255,255,0.6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 10,
                  transition: "all 0.2s"
                }}
              >
                {getIcon(pkg.industry_code)}
              </div>

              <h4 style={{ color: "white", fontSize: 14, fontWeight: 700, margin: "0 0 6px 0" }}>
                {pkg.name}
              </h4>
              
              {!isActive ? (
                <span style={{
                  fontSize: 9,
                  fontWeight: 800,
                  color: "#c0a060",
                  background: "rgba(192, 160, 96, 0.1)",
                  padding: "2px 6px",
                  borderRadius: 4,
                  textTransform: "uppercase",
                  marginBottom: 6
                }}>
                  {lang === 'kh' ? "ជិតមកដល់" : "Coming Soon"}
                </span>
              ) : null}

              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, margin: 0, lineHeight: "1.4" }}>
                {pkg.description || (lang === 'kh' ? "ប្រព័ន្ធគ្រប់គ្រងអាជីវកម្មឆ្លាតវៃ" : "Smart business management system")}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StepSelectService;
