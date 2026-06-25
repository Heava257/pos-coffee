import React, { useState, useEffect } from "react";
import { message, Spin } from "antd";
import { request } from "@/shared/utils/helper";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useLanguage, translations } from "@/app/store/language.store";

// Import Wizard Steps
import StepAccountInfo from "../components/registration/StepAccountInfo";
import StepSelectService from "../components/registration/StepSelectService";
import StepShopDetails from "../components/registration/StepShopDetails";
import StepSelectPlan from "../components/registration/StepSelectPlan";
import StepReview from "../components/registration/StepReview";

const CoffeeIllustration = ({ size = 180 }) => (
  <svg viewBox="0 0 280 320" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: size, height: "auto" }}>
    <path d="M95 60 Q90 45 95 30 Q100 15 95 5" stroke="#2a2a2a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    <path d="M115 65 Q108 48 113 32 Q118 16 113 4" stroke="#2a2a2a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    <path d="M135 60 Q130 44 135 28 Q140 14 135 3" stroke="#2a2a2a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    <path d="M68 105 L78 215 Q80 225 90 225 L178 225 Q188 225 190 215 L200 105 Z" fill="#2a2a2a" rx="4" />
    <rect x="62" y="93" width="144" height="18" rx="9" fill="#1a1a1a" />
    <ellipse cx="134" cy="165" rx="22" ry="28" fill="#3a2a1a" opacity="0.9" />
    <path d="M200 120 Q228 120 228 148 Q228 176 200 176" stroke="#2a2a2a" strokeWidth="9" strokeLinecap="round" fill="none" />
  </svg>
);

const WaveDivider = () => (
  <svg viewBox="0 0 120 700" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" className="wave-divider" style={{ position: "absolute", left: "calc(40% - 60px)", top: 0, bottom: 0, height: "100%", width: 120, zIndex: 2, filter: "drop-shadow(4px 0 12px rgba(0,0,0,0.18))" }}>
    <path d="M60 0 C80 70, 30 140, 60 210 C90 280, 25 350, 55 420 C85 490, 30 560, 60 630 C90 700, 60 700, 60 700 L120 700 L120 0 Z" fill="#1a1a1a" />
  </svg>
);

function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const initialPlanId = searchParams.get("plan_id");
  const initialServiceCode = searchParams.get("service_code") || searchParams.get("service");

  const { lang, setLang } = useLanguage();
  const t = translations[lang] || translations.en;

  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [packages, setPackages] = useState([]);
  const [plans, setPlans] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    business_name: "",
    owner_name: "",
    email: "",
    password: "",
    phone: "",
    shop_size: "",
    business_nature: "",
    province: "",
    district: ""
  });

  const [selectedPackage, setSelectedPackage] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    fetchSaaSData();
  }, []);

  const fetchSaaSData = async () => {
    setFetchingData(true);
    try {
      // 1. Fetch dynamic active packages
      const pkgRes = await request("subscription/packages/public", "get");
      let activePkgs = [];
      if (pkgRes && pkgRes.success && pkgRes.list) {
        activePkgs = pkgRes.list;
        setPackages(activePkgs);
      }

      // 2. Fetch dynamic active plans
      const planRes = await request("plans/public", "get");
      let activePlans = [];
      if (planRes && planRes.success && planRes.plans) {
        activePlans = planRes.plans.filter(p => p.is_active !== 0);
        setPlans(activePlans);
      }

      // Pre-select plan if plan_id passed in URL
      if (initialPlanId && activePlans.length > 0) {
        const matchedPlan = activePlans.find(p => String(p.id) === String(initialPlanId));
        if (matchedPlan) setSelectedPlan(matchedPlan);
      } else if (activePlans.length > 0) {
        // Default to Free Plan (id 1 or first one)
        const defaultPlan = activePlans.find(p => p.id === 1) || activePlans[0];
        setSelectedPlan(defaultPlan);
      }

      // Pre-select package/service if passed in URL
      if (initialServiceCode && activePkgs.length > 0) {
        const matchedPkg = activePkgs.find(p => p.code === initialServiceCode || p.industry_code === initialServiceCode);
        if (matchedPkg) setSelectedPackage(matchedPkg);
      } else if (activePkgs.length > 0) {
        // Default to first package (usually Coffee shop)
        setSelectedPackage(activePkgs[0]);
      }

    } catch (err) {
      console.error("Failed to load registration configurations:", err);
      message.error("Failed to initialize registration services.");
    } finally {
      setFetchingData(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.business_name || !formData.owner_name || !formData.phone || !formData.email || !formData.password) {
        message.warning(lang === 'kh' ? "សូមបំពេញព័ត៌មានដែលចាំបាច់ទាំងអស់" : "Please fill in all mandatory fields");
        return;
      }
      // Simple email validation
      if (!/\S+@\S+\.\S+/.test(formData.email)) {
        message.warning(lang === 'kh' ? "សូមបញ្ចូលអាសយដ្ឋានអ៊ីមែលត្រឹមត្រូវ" : "Please enter a valid email address");
        return;
      }
      if (formData.password.length < 6) {
        message.warning(lang === 'kh' ? "លេខសម្ងាត់ត្រូវមានយ៉ាងតិច ៦ ខ្ទង់" : "Password must be at least 6 characters");
        return;
      }
      if (initialServiceCode && selectedPackage) {
        setCurrentStep(3);
        return;
      }
    }

    if (currentStep === 2) {
      if (!selectedPackage || selectedPackage.status !== 'active') {
        message.warning(lang === 'kh' ? "សូមជ្រើសរើសប្រភេទសេវាកម្មអាជីវកម្មដែលសកម្ម" : "Please select an active industry service package");
        return;
      }
    }

    if (currentStep === 3) {
      if (!formData.shop_size || !formData.business_nature || !formData.province || !formData.district) {
        message.warning(lang === 'kh' ? "សូមបំពេញព័ត៌មានលម្អិត និងទីតាំងអាសយដ្ឋានហាងរបស់អ្នក" : "Please complete all shop details and select location address");
        return;
      }
    }

    if (currentStep === 4 && !selectedPlan) {
      message.warning(lang === 'kh' ? "សូមជ្រើសរើសគម្រោងបង់ប្រាក់" : "Please select a pricing plan");
      return;
    }

    setCurrentStep(currentStep + 1);
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      if (currentStep === 3 && initialServiceCode && selectedPackage) {
        setCurrentStep(1);
      } else {
        setCurrentStep(currentStep - 1);
      }
    }
  };

  const onSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        business_name: formData.business_name,
        owner_name: formData.owner_name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        package_id: selectedPackage?.id,
        shop_size: formData.shop_size,
        business_nature: formData.business_nature,
        plan_id: selectedPlan?.id,
        plan_type: selectedPlan?.id === 1 ? 'basic' : selectedPlan?.id === 2 ? 'standard' : 'premium',
        active_modules: selectedPackage?.code === 'coffee_cafe' ? 'POS' : selectedPackage?.code,
        province: formData.province,
        district: formData.district
      };
      
      const res = await request("auth/register", "post", payload);
      if (res && res.success) {
        message.success(lang === 'kh' ? "ការចុះឈ្មោះអាជីវកម្មបានជោគជ័យ! សូមចូលប្រព័ន្ធ។" : "Business Registered Successfully! Please Login.");
        navigate("/login");
      } else {
        message.error(res.message || "Registration failed. Try again.");
      }
    } catch (err) {
      // Handled globally
    } finally {
      setLoading(false);
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return lang === 'kh' ? "គណនីម្ចាស់" : "Account Info";
      case 2: return lang === 'kh' ? "រើសសេវាកម្ម" : "Select Service";
      case 3: return lang === 'kh' ? "ព័ត៌មានហាង" : "Shop Details";
      case 4: return lang === 'kh' ? "រើសគម្រោង" : "Choose Plan";
      case 5: return lang === 'kh' ? "ពិនិត្យឡើងវិញ" : "Review";
      default: return "";
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800&display=swap');
        *,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }
        body { overflow-x: hidden; background: #2a2a2a; font-family: 'DM Sans', sans-serif; }
        
        .login-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; position: relative; }
        .main-card { position: relative; z-index: 10; width: 960px; max-width: 95vw; min-height: 620px; border-radius: 28px; overflow: hidden; box-shadow: 0 40px 100px rgba(0,0,0,0.6); display: flex; background: #1a1a1a; }
        .left-panel { width: 40%; background: #F0EAD8; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; position: relative; z-index: 1; flex-shrink: 0; }
        .right-panel { flex: 1; background: #1a1a1a; display: flex; flex-direction: column; justify-content: space-between; padding: 36px 44px 36px 76px; position: relative; z-index: 1; }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .step-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          transition: all 0.3s;
        }
        .step-dot.active {
          background: #c0a060;
          box-shadow: 0 0 8px #c0a060;
          transform: scale(1.3);
        }
        .step-dot.completed {
          background: #10b981;
        }

        @media (max-width: 850px) {
          .main-card { width: 100% !important; max-width: 100% !important; min-height: 100vh !important; border-radius: 0 !important; flex-direction: column !important; margin: 0 !important; box-shadow: none !important; }
          .left-panel { width: 100% !important; padding: 15px 20px !important; min-height: 80px !important; flex-direction: row !important; justify-content: flex-start !important; gap: 15px !important; }
          .left-panel h2, .left-panel p { display: none !important; }
          .right-panel { width: 100% !important; padding: 25px 20px !important; flex: 1 !important; border-top: 1px solid rgba(255,255,255,0.05); }
          .wave-divider, .bg-blobs { display: none !important; }
        }

        .lang-switcher { position: fixed; top: 15px; right: 15px; z-index: 100; display: flex; gap: 4px; background: rgba(0,0,0,0.3); padding: 4px; border-radius: 100px; backdrop-filter: blur(10px); }
        .lang-btn { padding: 5px 10px; border-radius: 100px; border: none; font-size: 10px; font-weight: 700; cursor: pointer; transition: 0.2s; }
      `}</style>

      <div className="login-container">
        <div className="bg-blobs">
          <div style={{ position: "absolute", top: "-10%", left: "-5%", width: "40vw", height: "40vw", borderRadius: "50%", background: "#222", zIndex: 0 }} />
          <div style={{ position: "absolute", bottom: "-10%", right: "-5%", width: "45vw", height: "45vw", borderRadius: "50%", background: "#1f1f1f", zIndex: 0 }} />
        </div>

        <div className="lang-switcher">
          <button className="lang-btn" onClick={() => setLang("en")} style={{ background: lang === "en" ? "#c0a060" : "transparent", color: lang === "en" ? "#000" : "#fff" }}>EN</button>
          <button className="lang-btn" onClick={() => setLang("kh")} style={{ background: lang === "kh" ? "#c0a060" : "transparent", color: lang === "kh" ? "#000" : "#fff" }}>KH</button>
        </div>

        <div className="main-card">
          <div className="left-panel">
            <div className="mobile-only-svg" style={{ display: "none" }}>
              <CoffeeIllustration size={50} />
            </div>
            <div className="desktop-only-svg">
              <CoffeeIllustration size={180} />
            </div>
            <style>{`
              @media (max-width: 850px) {
                .mobile-only-svg { display: block !important; }
                .desktop-only-svg { display: none !important; }
              }
            `}</style>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1a1a1a", marginTop: 20, textAlign: "center" }}>
              {lang === 'kh' ? "ចុះឈ្មោះសមាជិក" : "SaaS Onboarding"}
            </h2>
            <p style={{ fontSize: 13, color: "#444", textAlign: "center", marginTop: 8, lineHeight: 1.4 }}>
              {lang === 'kh' 
                ? "បង្កើតគណនី និងរៀបចំប្រព័ន្ធគ្រប់គ្រងហាងរបស់អ្នកម្តងមួយជំហានៗ" 
                : "Create your tenant account and configure your business environment step-by-step"}
            </p>
          </div>

          <WaveDivider />

          <div className="right-panel">
            {fetchingData ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
                <Spin size="large" />
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>
                  Initializing Dynamic Service Configurations...
                </p>
              </div>
            ) : (
              <>
                {/* Header of steps */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <div>
                    <span style={{ fontSize: 10, color: "#c0a060", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
                      {(() => {
                        if (initialServiceCode && selectedPackage) {
                          const stepMapping = { 1: 1, 3: 2, 4: 3, 5: 4 };
                          const displayStep = stepMapping[currentStep] || 1;
                          return lang === 'kh' ? `ជំហានទី ${displayStep} នៃ ៤` : `Step ${displayStep} of 4`;
                        }
                        return lang === 'kh' ? `ជំហានទី ${currentStep} នៃ ៥` : `Step ${currentStep} of 5`;
                      })()}
                    </span>
                    <h3 style={{ color: "white", fontSize: 18, fontWeight: 800, marginTop: 2 }}>
                      {getStepTitle()}
                    </h3>
                  </div>
                  {/* Step dots */}
                  <div style={{ display: "flex", gap: 6 }}>
                    {(initialServiceCode && selectedPackage ? [1, 3, 4, 5] : [1, 2, 3, 4, 5]).map((step) => (
                      <div 
                        key={step} 
                        className={`step-dot ${currentStep === step ? 'active' : currentStep > step ? 'completed' : ''}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Form Wrapper */}
                <div style={{ flex: 1, overflowY: "auto", paddingRight: 4, marginBottom: 20 }}>
                  {currentStep === 1 && (
                    <StepAccountInfo 
                      formData={formData} 
                      setFormData={setFormData} 
                      lang={lang} 
                      t={t} 
                    />
                  )}
                  {currentStep === 2 && (
                    <StepSelectService 
                      packages={packages} 
                      selectedPackage={selectedPackage} 
                      onSelect={(pkg) => {
                        setSelectedPackage(pkg);
                        // Reset shop details when package changes
                        setFormData(prev => ({ ...prev, shop_size: "", business_nature: "", province: "", district: "" }));
                      }}
                      lang={lang} 
                    />
                  )}
                  {currentStep === 3 && (
                    <StepShopDetails 
                      selectedPackage={selectedPackage}
                      formData={formData}
                      setFormData={setFormData}
                      lang={lang}
                    />
                  )}
                  {currentStep === 4 && (
                    <StepSelectPlan 
                      plans={plans}
                      selectedPlan={selectedPlan}
                      onSelect={setSelectedPlan}
                      lang={lang}
                    />
                  )}
                  {currentStep === 5 && (
                    <StepReview 
                      formData={formData}
                      selectedPackage={selectedPackage}
                      selectedPlan={selectedPlan}
                      lang={lang}
                    />
                  )}
                </div>

                {/* Footer Buttons */}
                <div style={{ display: "flex", gap: 12, borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 18 }}>
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={handlePrev}
                      style={{
                        flex: 1,
                        height: 44,
                        borderRadius: 12,
                        border: "1px solid rgba(255,255,255,0.15)",
                        background: "transparent",
                        color: "white",
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: "pointer",
                        transition: "0.2s"
                      }}
                    >
                      {lang === 'kh' ? "ថយក្រោយ" : "Back"}
                    </button>
                  )}
                  
                  {currentStep < 5 ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      style={{
                        flex: 2,
                        height: 44,
                        borderRadius: 12,
                        border: "none",
                        background: "#c0a060",
                        color: "#1a1a1a",
                        fontSize: 13,
                        fontWeight: 800,
                        cursor: "pointer",
                        transition: "0.2s"
                      }}
                    >
                      {lang === 'kh' ? "បន្តទៅមុខ" : "Continue"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={onSubmit}
                      disabled={loading}
                      style={{
                        flex: 2,
                        height: 44,
                        borderRadius: 12,
                        border: "none",
                        background: loading ? "#444" : "#10b981",
                        color: "#1a1a1a",
                        fontSize: 13,
                        fontWeight: 800,
                        cursor: "pointer",
                        transition: "0.2s"
                      }}
                    >
                      {loading ? "..." : (lang === 'kh' ? "បង្កើតអាជីវកម្ម" : "Establish Business")}
                    </button>
                  )}
                </div>
              </>
            )}

            {!fetchingData && currentStep === 1 && (
              <p style={{ textAlign: "center", fontSize: "12px", color: "rgba(255,255,255,0.4)", marginTop: 12 }}>
                {lang === 'kh' ? "មានគណនីរួចហើយ?" : "Already have a branch?"}{" "}
                <Link to="/login" style={{ color: "#c0a060", fontWeight: 700, textDecoration: "none" }}>
                  {lang === 'kh' ? "ចូលប្រើប្រាស់" : "Sign In"}
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default RegisterPage;