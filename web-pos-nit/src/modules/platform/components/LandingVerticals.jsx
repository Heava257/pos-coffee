import React from "react";
import { Link } from "react-router-dom";
import { Layers, Coffee, UtensilsCrossed, Pill, ShoppingBag, ArrowRight } from "lucide-react";

const LandingVerticals = ({ packages, loading, lang }) => {
  const getIcon = (industryCode) => {
    switch (industryCode) {
      case "coffee_cafe":
        return <Coffee size={24} />;
      case "restaurant":
        return <UtensilsCrossed size={24} />;
      case "retail":
      case "mart":
        return <ShoppingBag size={24} />;
      case "pharmacy":
        return <Pill size={24} />;
      default:
        return <Layers size={24} />;
    }
  };

  const getColor = (industryCode) => {
    switch (industryCode) {
      case "coffee_cafe":
        return { primary: "#c0a060", bg: "rgba(192, 160, 96, 0.1)" };
      case "restaurant":
        return { primary: "#eb5757", bg: "rgba(235, 87, 87, 0.1)" };
      case "retail":
      case "mart":
        return { primary: "#27ae60", bg: "rgba(39, 174, 96, 0.1)" };
      case "pharmacy":
        return { primary: "#2d9cdb", bg: "rgba(45, 156, 219, 0.1)" };
      default:
        return { primary: "#9b51e0", bg: "rgba(155, 81, 224, 0.1)" };
    }
  };

  return (
    <section id="verticals" className="verticals-section">
      <div className="section-header">
        <div className="section-badge">
          <Layers size={12} />
          Platform Verticals
        </div>
        <h2 className="section-title">Built for SaaS Expansion</h2>
        <p className="section-desc">
          Green Grounds is designed to power multiple industries. Select your service package below and configure your customized point-of-sale workspace.
        </p>
      </div>

      <div className="verticals-grid">
        {loading ? (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.4)" }}>
            Loading Industry Verticals...
          </div>
        ) : packages.length === 0 ? (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.4)" }}>
            No active services found.
          </div>
        ) : (
          packages.map((pkg) => {
            const colors = getColor(pkg.industry_code);
            const isLive = pkg.status === "active";

            return (
              <div 
                key={pkg.id} 
                className={`vertical-card ${isLive ? "active" : ""}`}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}
              >
                <div>
                  <div 
                    className="vertical-icon-wrapper" 
                    style={{ background: colors.bg, color: colors.primary }}
                  >
                    {getIcon(pkg.industry_code)}
                  </div>
                  
                  <span 
                    className="vertical-status" 
                    style={{ 
                      background: isLive ? "rgba(46, 125, 50, 0.15)" : "rgba(255, 255, 255, 0.08)", 
                      color: isLive ? "#81c784" : "rgba(255,255,255,0.4)" 
                    }}
                  >
                    {isLive ? "LIVE NOW" : "COMING SOON"}
                  </span>
                  
                  <h3 className="vertical-title" style={{ marginTop: 12 }}>{pkg.name}</h3>
                  <p className="vertical-desc">
                    {pkg.description || "Fully customizable platform workspace config including tailored menus, inventory control, and checkout operations."}
                  </p>
                </div>

                <div style={{ marginTop: 20 }}>
                  {isLive ? (
                    <Link 
                      to={`/register?service_code=${pkg.code || pkg.industry_code}`}
                      className="btn-primary"
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        padding: "10px 14px",
                        background: colors.primary,
                        borderColor: colors.primary,
                        color: "#0b0f19"
                      }}
                    >
                      <span>{lang === "kh" ? "រៀបចំសេវាកម្មនេះ" : "Setup Service"}</span>
                      <ArrowRight size={14} style={{ marginLeft: 6 }} />
                    </Link>
                  ) : (
                    <button 
                      type="button"
                      onClick={() => {
                        import("antd").then(({ message }) => {
                          message.info(
                            lang === "kh" 
                              ? `សេវាកម្ម ${pkg.name} ជិតមកដល់ហើយ!` 
                              : `${pkg.name} service is coming soon!`
                          );
                        });
                      }}
                      className="btn-primary"
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        padding: "10px 14px",
                        background: "rgba(255, 255, 255, 0.05)",
                        borderColor: "rgba(255, 255, 255, 0.1)",
                        color: "rgba(255, 255, 255, 0.4)",
                        cursor: "pointer",
                        borderRadius: "8px",
                        transition: "all 0.2s"
                      }}
                    >
                      <span>{lang === "kh" ? "ជិតមកដល់" : "Coming Soon"}</span>
                      <ArrowRight size={14} style={{ marginLeft: 6 }} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};

export default LandingVerticals;
