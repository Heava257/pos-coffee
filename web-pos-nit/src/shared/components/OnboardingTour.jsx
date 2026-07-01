import React, { useState, useEffect, useRef } from "react";
import { Button, Steps, Space, Typography, Modal, Alert, Tag } from "antd";
import * as Lucide from "lucide-react";
const { Title, Text } = Typography;

export default function OnboardingTour({ visible, profile, navigate, onClose }) {
  const [current, setCurrent] = useState(() => {
    const planId = Number(profile?.plan_id || 1);

    if (planId === 2) {
      // Smart Jump directly to Supplier step (index 4) for Pro Plan
      return 4;
    }
    if (planId >= 3) {
      // Smart Jump directly to Raw Material step (index 3) for Enterprise Plan
      return 3;
    }
    return 0;
  });
  const [isMobileScreen, setIsMobileScreen] = useState(window.innerWidth < 768);
  const [spotlightRect, setSpotlightRect] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [hasTarget, setHasTarget] = useState(false);
  const [showCongradModal, setShowCongradModal] = useState(false);
  const lastLoggedRef = useRef(null);
  const lastClickedStepRef = useRef(-1);

  const lastVisibleRef = useRef(false);
  const lastPlanIdRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Reset steps and congratulations modal state on visibility changes or plan upgrades
  useEffect(() => {
    if (profile) {
      const planId = Number(profile.plan_id || 1);
      const isBecomingVisible = visible && !lastVisibleRef.current;
      const isPlanChanged = lastPlanIdRef.current !== null && lastPlanIdRef.current !== planId;

      if (isBecomingVisible || isPlanChanged) {
        setShowCongradModal(false);
        if (planId === 2) {
          // Pro Plan starting index (Supplier)
          setCurrent(4);
        } else if (planId >= 3) {
          // Enterprise Plan starting index (Raw Materials)
          setCurrent(3);
        } else {
          // Free Plan starting index (Welcome)
          setCurrent(0);
        }
      }

      lastVisibleRef.current = visible;
      lastPlanIdRef.current = planId;
    }
  }, [visible, profile]);

  // Dynamic steps based on plan_id
  const getSteps = () => {
    const planId = Number(profile?.plan_id || 1);
    const userId = profile?.id || profile?.user_id;

    // Welcome step (all plans)
    const welcomeStep = {
      title: "សូមស្វាគមន៍ / Welcome!",
      icon: Lucide.Sparkles,
      color: "#10b981",
      path: "/dashboard",
      selector: null,
      description: "សូមស្វាគមន៍មកកាន់ GrowMePlatform! នេះជាការណែនាំជំហានដំបូងដើម្បីជួយបងកំណត់រៀបចំអាជីវកម្មឱ្យបានលឿន និងត្រឹមត្រូវបំផុត។",
      subDescription: "Welcome to GrowMePlatform! Here is a step-by-step tour to help you configure your business layout smoothly and correctly."
    };

    // Category step (all plans)
    const categoryStep = {
      title: "១. បើកប្រភេទផលិតផល / 1. Activate Categories",
      icon: Lucide.Sliders,
      color: "#3b82f6",
      path: "/category",
      selector: ".ant-switch, text:categories, h2",
      description: "ដំបូងបង្អស់៖ បងត្រូវចូលមកទំព័រ [Category] រួចបើកដំណើរការ (Switch Active) លើប្រភេទផលិតផលដែលហាងបងត្រូវលក់ ដើម្បីឱ្យវាបង្ហាញនៅលើទំព័រលក់។",
      subDescription: "Step 1: Go to [Category] page and enable the category toggles you want to sell so they appear on the POS screen."
    };

    // Product step (all plans)
    const productStep = {
      title: "២. បញ្ចូលផលិតផល / 2. Register Products",
      icon: Lucide.PlusCircle,
      color: "#f59e0b",
      path: "/product",
      selector: ".tour-product-add-btn, .ant-btn-primary, text:add new product, h2",
      description: "ជំហានទីពីរ៖ បងត្រូវចូលមកទំព័រ [Product] ដើម្បីបង្កើតទំនិញលក់ កំណត់តម្លៃ ឯកតា រូបភាពផលិតផល និងជម្រើសបន្ថែម (ទំហំ និងប្រភេទក្តៅ/ត្រជាក់)។",
      subDescription: "Step 2: Go to [Product] page to register items, set prices, and configure size or variant options."
    };

    // Shop step (all plans)
    const shopStep = {
      title: "៣. កំណត់ធនាគារ & QR Code / 3. Bank & QR Setup",
      icon: Lucide.QrCode,
      color: "#ec4899",
      path: "/shop_managment",
      selector: ".tour-branch-edit-btn, .ant-table-row, h2",
      description: "ជំហានទីបី៖ ចូលមកទំព័រ [Shop Management] រួចចុច Edit លើសាខារបស់បង ដើម្បីបញ្ចូលព័ត៌មានគណនីធនាគារ និងរូបភាព QR Code សម្រាប់ឱ្យអតិថិជនស្កេនទូទាត់ប្រាក់នៅ POS។",
      subDescription: "Step 3: Go to [Shop Management], click Edit on your branch, and configure bank account info and payment QR Code image for POS scans."
    };

    // POS step (all plans)
    const posStep = {
      title: "៤. ចាប់ផ្តើមលក់ / 4. Start Selling (POS)",
      icon: Lucide.Monitor,
      color: "#10b981",
      path: "/invoices",
      selector: ".tour-pos-open-shift, text:open new shift, .op-mini-card, h2",
      description: "ជំហានទីបួន៖ ចូលទៅកាន់ទំព័រ [POS / Sales] រួចចុច [Open New Shift] (បើកវេនលក់ដំបូង) ដើម្បីចាប់ផ្តើមលក់ទំនិញ ជ្រើសរើសការទូទាត់ និងបោះពុម្ពវិក្កយបត្រ។",
      subDescription: "Step 4: Go to [POS / Sales] page, click [Open New Shift] to start selling, choose payment methods, and print receipts."
    };

    // Settings step (all plans)
    const settingsStep = {
      title: "៥. ការកំណត់ម៉ាកសញ្ញា & ម៉ាស៊ីនព្រីន / 5. Brand & Printer Settings",
      icon: Lucide.Settings,
      color: "#6366f1",
      path: "/settings",
      selector: ".tour-settings-printer-tab, .ant-card, form, text:settings, h2",
      description: "ជំហានចុងក្រោយ៖ ប្រព័ន្ធបានចុចបើកផ្ទាំង [Printer] ជូនបងដោយស្វ័យប្រវត្តិ។ សូមបងកំណត់រៀបចំម៉ាស៊ីនបោះពុម្ពវិក្កយបត្រ៖\n\n" +
        "១. Auto Print (ព្រីនស្វ័យប្រវត្ត)៖ បើកដំណើរការដើម្បីឱ្យប្រព័ន្ធព្រីនវិក្កយបត្រដោយស្វ័យប្រវត្តភ្លាមៗពេលលក់រួច។\n" +
        "២. Print Priority (លំដាប់លំដៅព្រីន)៖ កំណត់ព្រីនវិក្កយបត្រ (Invoice) ឬស្លាកស្ទីគ័រ (Stickers) មុន។\n" +
        "៣. Document Availability (ការបើកដំណើរការព្រីន)៖ បើក/បិទ ព្រីនវិក្កយបត្រ, ស្ទីគ័រ និងសន្លឹកកុម្ម៉ង់ផ្ទះបាយ (Kitchen Ticket)។",
      subDescription: "Final Step: System has auto-opened [Printer] tab for you. Please configure settings:\n\n" +
        "1. Auto Print: Enable automatic receipt printing after transactions.\n" +
        "2. Print Priority: Choose whether to print invoices or stickers first.\n" +
        "3. Document Availability: Toggle invoice, stickers, or kitchen ticket print workflow."
    };

    // Supplier step (Pro & Enterprise plans)
    const supplierStep = {
      title: "៥. បង្កើតអ្នកផ្គត់ផ្គង់ / 5. Register Suppliers",
      icon: Lucide.Users,
      color: "#f59e0b",
      path: "/supplier",
      selector: ".tour-supplier-add-btn, .ant-btn-primary, text:create supplier, h2",
      description: "ជំហានទីប្រាំ៖ ចូលមកទំព័រ [Supplier] រួចចុច [+ Create New] ដើម្បីបង្កើតបញ្ជីអ្នកផ្គត់ផ្គង់ទំនិញ ឬគ្រឿងផ្សំ។ ព័ត៌មាននេះនឹងបង្ហាញឱ្យជ្រើសរើសពេលបង្កើតប័ណ្ណទិញទំនិញ។",
      subDescription: "Step 5: Go to [Supplier] page, click [+ Create New] to register suppliers. This supplier list is linked during purchase ordering."
    };

    // Free Plan Steps
    if (planId === 1) {
      return [
        welcomeStep,
        categoryStep,
        productStep,
        shopStep,
        posStep,
        settingsStep
      ];
    }

    // Pro Plan Steps
    if (planId === 2) {
      return [
        welcomeStep,
        categoryStep,
        {
          ...productStep,
          description: "ជំហានទីពីរ៖ ចូលមកទំព័រ [Product] ដើម្បីបង្កើតទំនិញលក់ និងភ្ជាប់រូបមន្តកាត់ស្តុកគ្រឿងផ្សំ (Recipes)។",
          subDescription: "Step 2: Go to [Product] page to register items and link raw ingredients/recipes."
        },
        shopStep,
        {
          ...supplierStep,
          title: "៥. បង្កើតអ្នកផ្គត់ផ្គង់ / 5. Register Suppliers"
        },
        {
          title: "៦. ការបញ្ជាទិញចូលស្តុក / 6. Purchase & Stock",
          icon: Lucide.Truck,
          color: "#8b5cf6",
          path: "/purchase",
          selector: ".tour-purchase-add-btn, .ant-btn-primary, text:purchase, h2",
          description: "ជំហានទីប្រាំមួយ៖ ចូលមកទំព័រ [Purchase] ដើម្បីកត់ត្រាការទិញទំនិញ និងគ្រឿងផ្សំចូលស្តុកពីអ្នកផ្គត់ផ្គង់ (Supplier) ដោយប្រព័ន្ធនឹងកាត់កើនស្តុកដោយស្វ័យប្រវត្តិ។",
          subDescription: "Step 6: Go to [Purchase] page to manage suppliers and log purchase orders to auto-increase your stock."
        },
        {
          ...settingsStep,
          title: "៧. កម្មវិធីផ្សព្វផ្សាយ & BOGO / 7. Mobile App & BOGO",
          selector: ".tour-settings-promo-tab, .ant-card, form, text:settings, h2",
          description: "ជំហានចុងក្រោយ៖ ប្រព័ន្ធបានបើកផ្ទាំង [Mobile App & Promo] ជូនបងដោយស្វ័យប្រវត្តិ។ គម្រោង Pro Plan អនុញ្ញាតឱ្យបង៖\n\n" +
            "១. Promo Banner: បង្ហាញផ្ទាំងផ្សព្វផ្សាយផលិតផលពិសេសៗនៅលើទូរស័ព្ទដៃអតិថិជន។\n" +
            "២. Global Discount: កំណត់បញ្ចុះតម្លៃ % ទូទាំងហាង ឬតាមប្រភេទផលិតផល។\n" +
            "៣. Buy X Get Y (BOGO)៖ បង្កើតប្រូម៉ូសិន ទិញ ១ ថែម ១ ឬ ទិញ ២ ថែម ១ ស្វ័យប្រវត្ត។",
          subDescription: "Final Step: System has auto-opened [Mobile App & Promo] tab for you. Pro plan allows you to:\n\n" +
            "1. Promo Banner: Setup marketing banners on guest mobile apps.\n" +
            "2. Global Discount: Apply percentage discounts storewide or on categories.\n" +
            "3. Buy X Get Y (BOGO): Configure Buy 1 Get 1 or Buy 2 Get 1 campaigns."
        }
      ];
    }

    // Enterprise Plan Steps (planId >= 3)
    return [
      welcomeStep,
      categoryStep,
      productStep,
      {
        title: "៣. គ្រប់គ្រងគ្រឿងផ្សំ / 3. Raw Materials UOM",
        icon: Lucide.Leaf,
        color: "#ec4899",
        path: "/raw_material",
        selector: ".tour-raw-material-add-btn, .ant-btn-primary, text:raw material, h2",
        description: "ជំហានទីបី៖ ចូលមកទំព័រ [Raw Material] ដើម្បីបង្កើតគ្រឿងផ្សំ/វត្ថុធាតុដើម និងកំណត់ឯកតាទិញ/ប្រើប្រាស់ (UOM)។",
        subDescription: "Step 3: Go to [Raw Material] page to register ingredients and setup purchase-to-usage unit conversions."
      }
    ];
  };

  const steps = getSteps();

  const isElementVisible = (el) => {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 2 || rect.height <= 2) return false;

    // Check computed styles
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
      return false;
    }

    // Check if it is off-screen (e.g. closed drawer elements)
    if (rect.right < 0 || rect.bottom < 0 || rect.left > window.innerWidth || rect.top > window.innerHeight) {
      return false;
    }

    return true;
  };

  // Update spotlight coordinates
  const updateSpotlight = () => {
    const step = steps[current];
    if (step && step.selector) {
      const selectors = step.selector.split(",");
      for (const sel of selectors) {
        const query = sel.trim();
        try {
          let elements = [];

          if (query.startsWith("text:")) {
            const targetText = query.replace("text:", "").trim().toLowerCase();
            // Search headers, buttons, spans, anchor tags and divs for direct matching text
            const allElements = document.querySelectorAll("button, span, h1, h2, h3, h4, div, a");
            for (const el of allElements) {
              // Check direct child nodes for text type
              let hasDirectText = false;
              for (let i = 0; i < el.childNodes.length; i++) {
                const node = el.childNodes[i];
                if (node && node.nodeType === 3) { // TEXT_NODE
                  const txt = (node.nodeValue || "").trim().toLowerCase();
                  if (txt.includes(targetText)) {
                    hasDirectText = true;
                    break;
                  }
                }
              }
              if (hasDirectText) {
                elements.push(el);
              }
            }
          } else {
            elements = document.querySelectorAll(query);
          }

          for (const el of elements) {
            const rect = el.getBoundingClientRect();
            // Check if element is visible and has layout size in viewport
            if (isElementVisible(el)) {
              const logKey = `${query}-${rect.left}-${rect.top}-${rect.width}-${rect.height}`;
              if (lastLoggedRef.current !== logKey) {
                console.log(`[OnboardingTour] Matched selector "${query}" to visible element:`, el, "rect:", rect);
                lastLoggedRef.current = logKey;
              }

              // Auto-click target once when entering this step
              if (lastClickedStepRef.current !== current) {
                if (
                  el.classList.contains("tour-settings-printer-tab") ||
                  query.includes("tour-settings-printer-tab") ||
                  el.classList.contains("tour-settings-promo-tab") ||
                  query.includes("tour-settings-promo-tab")
                ) {
                  console.log("[OnboardingTour] Auto-clicking Tab:", el);
                  el.click();
                  lastClickedStepRef.current = current;
                }
              }

              setSpotlightRect({
                x: rect.left - 10,
                y: rect.top - 10,
                width: rect.width + 20,
                height: rect.height + 20
              });
              setHasTarget(true);
              return;
            }
          }
        } catch (err) {
          console.error(`[OnboardingTour] Error querying selector "${query}":`, err);
        }
      }
    }

    // No visible target element found
    if (lastLoggedRef.current !== "no-target") {
      console.log(`[OnboardingTour] No visible target matched for step:`, step);
      lastLoggedRef.current = "no-target";
    }
    setHasTarget(false);

    // Centered fallback coordinates (unused for display when hasTarget is false, but kept as backup)
    const w = window.innerWidth;
    const h = window.innerHeight;
    setSpotlightRect({
      x: w / 2 - 180,
      y: h / 2 - 180,
      width: 360,
      height: 360
    });
  };

  // Redirect on mount/step change
  useEffect(() => {
    const isPlatformOwner = profile?.business_id === 1 || ["PlatForm Owner", "Platform Owner"].includes(profile?.role_name);
    if (visible && !isPlatformOwner && steps[current] && navigate) {
      navigate(steps[current].path);
      lastClickedStepRef.current = -1;
    }
  }, [current, visible, profile]);

  // Recalculate spotlight after redirection and layout changes
  useEffect(() => {
    const isPlatformOwner = profile?.business_id === 1 || ["PlatForm Owner", "Platform Owner"].includes(profile?.role_name);
    if (!visible || isPlatformOwner) return;
    updateSpotlight();

    // Snaps spotlight continuously to handle rendering lag & lazy loading
    const interval = setInterval(updateSpotlight, 250);

    return () => {
      clearInterval(interval);
    };
  }, [current, visible, steps[current]?.path, profile]);

  useEffect(() => {
    const isPlatformOwner = profile?.business_id === 1 || ["PlatForm Owner", "Platform Owner"].includes(profile?.role_name);
    if (!visible || isPlatformOwner) return;
    window.addEventListener("resize", updateSpotlight);
    return () => window.removeEventListener("resize", updateSpotlight);
  }, [current, visible, profile]);

  const isPlatformOwner = profile?.business_id === 1 || ["PlatForm Owner", "Platform Owner"].includes(profile?.role_name);
  if (!visible || isPlatformOwner) return null;

  const planId = Number(profile?.plan_id || 1);
  const stepInfo = steps[current] || steps[0];
  const IconComponent = stepInfo.icon;
  const isFirstTime = !localStorage.getItem(`has_completed_tour_v1_${profile?.id}`);

  const handleNext = () => {
    if (current < steps.length - 1) {
      setCurrent(current + 1);
    } else {
      setShowCongradModal(true);
    }
  };

  const handlePrev = () => {
    if (current > 0) {
      setCurrent(current - 1);
    }
  };

  if (showCongradModal) {
    return (
      <Modal
        open={showCongradModal}
        footer={null}
        closable={false}
        centered
        width={440}
        bodyStyle={{ padding: "32px 24px" }}
        style={{ borderRadius: "24px", overflow: "hidden" }}
      >
        <div style={{ textAlign: "center" }}>
          {/* Top Checkmark Circle Icon with Glowing Shadow */}
          <div style={{
            width: 100, height: 100,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #1e4a2d, #2d6a3e)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 24px",
            boxShadow: "0 8px 32px rgba(30,74,45,0.35)",
            animation: "popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
          }}>
            <Lucide.CheckCircle size={48} style={{ color: "#fff" }} />
          </div>

          {/* Title */}
          <Title level={2} style={{ color: "#1e4a2d", fontWeight: 800, margin: "0 0 8px", fontSize: "22px" }}>
            អបអរសាទរ! / Congratulations! 🎉
          </Title>

          <Text type="secondary" style={{ fontSize: "15px", display: "block", marginBottom: 12 }}>
            បងបានកំណត់រៀបចំអាជីវកម្មជាមូលដ្ឋានរួចរាល់ហើយ
          </Text>

          {/* Plan Tag Pill */}
          <div style={{ margin: "16px 0" }}>
            <Tag
              color="green"
              icon={<Lucide.Crown size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />}
              style={{ fontSize: "14px", padding: "6px 16px", borderRadius: "20px", fontWeight: 700 }}
            >
              {planId === 2 ? "Pro Plan" : planId >= 3 ? "Enterprise" : "Free Plan"}
            </Tag>
          </div>

          {/* Setup details */}
          <div style={{
            background: "#f8fdf9",
            borderRadius: "12px",
            padding: "16px 20px",
            marginBottom: "24px",
            border: "1px solid #d9f7be",
            textAlign: "left"
          }}>
            <Space direction="vertical" style={{ width: "100%" }} size={8}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text type="secondary">ស្ថានភាពរៀបចំ / Status</Text>
                <Text strong style={{ color: "#1e4a2d" }}>
                  រួចរាល់ / Completed
                </Text>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text type="secondary">គម្រោងសកម្ម / Plan</Text>
                <Text strong>
                  {planId === 2 ? "Pro Plan" : planId >= 3 ? "Enterprise" : "Free Plan"}
                </Text>
              </div>
            </Space>
          </div>

          {/* Ready to sell tip box */}
          <Alert
            type="warning"
            showIcon={false}
            message={
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <Lucide.Sparkles size={16} style={{ color: '#854d0e', marginTop: 3, flexShrink: 0 }} />
                <div>
                  <Text strong style={{ color: '#854d0e' }}>រួចរាល់ក្នុងការលក់! / Ready to Sell!</Text>
                  <div style={{ fontSize: "12px", marginTop: 2, color: '#854d0e' }}>
                    បងអាចចាប់ផ្តើមបើកវេនលក់ និងបញ្ចូលការបញ្ជាទិញនៅលើទំព័រ POS បានភ្លាមៗ។
                    <br />
                    <span style={{ fontStyle: 'italic', opacity: 0.8 }}>
                      You can now open a sales shift and log orders on the POS page immediately.
                    </span>
                  </div>
                </div>
              </div>
            }
            style={{ marginBottom: 20, borderRadius: "10px", textAlign: "left", background: "#fefce8", border: "1px solid #fef08a" }}
          />

          {/* Main action button */}
          <Button
            type="primary"
            size="large"
            block
            icon={<Lucide.CheckCircle size={18} style={{ marginRight: 6 }} />}
            style={{
              background: "linear-gradient(135deg, #1e4a2d, #2d6a3e)",
              border: "none",
              borderRadius: "12px",
              height: "48px",
              fontWeight: 700,
              fontSize: "16px",
            }}
            onClick={() => {
              setShowCongradModal(false);
              onClose();
            }}
          >
            យល់ព្រម / Got it! 🚀
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <>
      {/* 🌟 Professional Spotlight Cutout Overlay */}
      <svg
        key={`svg-${current}`}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 99999,
          pointerEvents: "auto", // Blocks all background clicks!
          transition: "all 0.3s ease",
        }}
      >
        <defs>
          <mask id={`spotlight-mask-${current}`}>
            {/* White covers (hides underlying page) */}
            <rect width="100%" height="100%" fill="white" />
            {/* Black cutouts (reveals target element) */}
            {hasTarget && (
              <rect
                x={spotlightRect.x}
                y={spotlightRect.y}
                width={spotlightRect.width}
                height={spotlightRect.height}
                rx="16"
                ry="16"
                fill="black"
                style={{ transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)" }}
              />
            )}
          </mask>
        </defs>
        {/* Darkened backdrop with blur mask */}
        <rect
          width="100%"
          height="100%"
          fill="rgba(15, 23, 42, 0.7)"
          mask={`url(#spotlight-mask-${current})`}
          style={{
            backdropFilter: "blur(3px)",
            WebkitBackdropFilter: "blur(3px)",
            transition: "all 0.3s ease",
          }}
        />
      </svg>

      {/* Spotlight highlight outline (glowing border) */}
      {hasTarget && (
        <div
          key={`outline-${current}`}
          style={{
            position: "fixed",
            top: spotlightRect.y,
            left: spotlightRect.x,
            width: spotlightRect.width,
            height: spotlightRect.height,
            border: "3px solid #10b981",
            boxShadow: "0 0 15px rgba(16, 185, 129, 0.5)",
            borderRadius: 16,
            pointerEvents: "none",
            zIndex: 99999,
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      )}

      {/* 🧭 Onboarding Tour Floating Guide Card */}
      <div
        style={{
          position: "fixed",
          bottom: 24,
          right: isMobileScreen ? 12 : 24,
          left: isMobileScreen ? 12 : "auto",
          width: isMobileScreen ? "calc(100% - 24px)" : 420,
          backgroundColor: "#ffffff",
          borderRadius: 20,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          border: "2px solid #bae7ff",
          padding: "20px",
          zIndex: 100000,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          boxSizing: "border-box",
        }}
      >
        {/* Header of Assistant card */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: `${stepInfo.color}15`,
              color: stepInfo.color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <IconComponent size={20} strokeWidth={1.5} />
            </div>
            <span style={{ fontWeight: 800, color: "#1e293b", fontSize: 13, letterSpacing: "0.5px" }}>
              GROWME ASSISTANT
            </span>
          </div>
          {!isFirstTime && (
            <Button
              type="text"
              icon={<Lucide.X size={16} />}
              onClick={onClose}
              style={{ color: "#94a3b8" }}
            />
          )}
        </div>

        {/* Step Title */}
        <div style={{ fontWeight: 800, fontSize: 16, color: "#0f172a", marginTop: 4 }}>
          {stepInfo.title}
        </div>

        {/* Description */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, margin: "4px 0" }}>
          <Text style={{ fontSize: "14px", color: "#334155", fontWeight: 650, lineHeight: 1.5, whiteSpace: "pre-line" }}>
            {stepInfo.description}
          </Text>
          <Text type="secondary" style={{ fontSize: "12px", fontStyle: "italic", lineHeight: 1.4, whiteSpace: "pre-line" }}>
            {stepInfo.subDescription}
          </Text>
        </div>



        {/* Steps dots */}
        <Steps
          current={current}
          size="small"
          items={steps.map((_, i) => ({ title: "" }))}
          onChange={(val) => {
            if (!isFirstTime) {
              setCurrent(val);
            }
          }}
          style={{ margin: "8px 0" }}
        />

        {/* Actions */}
        <div style={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
          {isFirstTime ? (
            <div />
          ) : (
            <Button type="text" onClick={onClose} style={{ fontWeight: 700, color: "#94a3b8", padding: 0 }}>
              Skip (រំលង)
            </Button>
          )}

          <Space size="small">
            {current > 0 && (
              <Button onClick={handlePrev} style={{ borderRadius: 10, fontWeight: 700 }}>
                Back (ថយក្រោយ)
              </Button>
            )}
            <Button
              type="primary"
              onClick={handleNext}
              style={{
                borderRadius: 10,
                fontWeight: 850,
                background: current === steps.length - 1 ? "#10b981" : "var(--theme-dark-green, #1e4a2d)",
                borderColor: current === steps.length - 1 ? "#10b981" : "var(--theme-dark-green, #1e4a2d)",
              }}
            >
              {current === steps.length - 1 ? "Finish (រួចរាល់)" : "Next (បន្ទាប់)"}
            </Button>
          </Space>
        </div>
      </div>

      {/* 🎉 Onboarding Completion Congratulations Modal */}
      <Modal
        open={showCongradModal}
        footer={null}
        closable={false}
        centered
        width={440}
        bodyStyle={{ padding: "32px 24px" }}
        style={{ borderRadius: "24px", overflow: "hidden" }}
      >
        <div style={{ textAlign: "center" }}>
          {/* Top Checkmark Circle Icon with Glowing Shadow */}
          <div style={{
            width: 100, height: 100,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #1e4a2d, #2d6a3e)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 24px",
            boxShadow: "0 8px 32px rgba(30,74,45,0.35)",
            animation: "popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
          }}>
            <Lucide.CheckCircle size={48} style={{ color: "#fff" }} />
          </div>

          {/* Title */}
          <Title level={2} style={{ color: "#1e4a2d", fontWeight: 800, margin: "0 0 8px", fontSize: "22px" }}>
            អបអរសាទរ! / Congratulations! 🎉
          </Title>

          <Text type="secondary" style={{ fontSize: "15px", display: "block", marginBottom: 12 }}>
            បងបានកំណត់រៀបចំអាជីវកម្មជាមូលដ្ឋានរួចរាល់ហើយ
          </Text>

          {/* Plan Tag Pill */}
          <div style={{ margin: "16px 0" }}>
            <Tag
              color="green"
              icon={<Lucide.Crown size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />}
              style={{ fontSize: "14px", padding: "6px 16px", borderRadius: "20px", fontWeight: 700 }}
            >
              {planId === 2 ? "Pro Plan" : planId >= 3 ? "Enterprise" : "Free Plan"}
            </Tag>
          </div>

          {/* Setup details */}
          <div style={{
            background: "#f8fdf9",
            borderRadius: "12px",
            padding: "16px 20px",
            marginBottom: "24px",
            border: "1px solid #d9f7be",
            textAlign: "left"
          }}>
            <Space direction="vertical" style={{ width: "100%" }} size={8}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text type="secondary">ស្ថានភាពរៀបចំ / Status</Text>
                <Text strong style={{ color: "#1e4a2d" }}>
                  រួចរាល់ / Completed
                </Text>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text type="secondary">គម្រោងសកម្ម / Plan</Text>
                <Text strong>
                  {planId === 2 ? "Pro Plan" : planId >= 3 ? "Enterprise" : "Free Plan"}
                </Text>
              </div>
            </Space>
          </div>

          {/* Ready to sell tip box */}
          <Alert
            type="warning"
            showIcon={false}
            message={
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <Lucide.Sparkles size={16} style={{ color: '#854d0e', marginTop: 3, flexShrink: 0 }} />
                <div>
                  <Text strong style={{ color: '#854d0e' }}>រួចរាល់ក្នុងការលក់! / Ready to Sell!</Text>
                  <div style={{ fontSize: "12px", marginTop: 2, color: '#854d0e' }}>
                    បងអាចចាប់ផ្តើមបើកវេនលក់ និងបញ្ចូលការបញ្ជាទិញនៅលើទំព័រ POS បានភ្លាមៗ។
                    <br />
                    <span style={{ fontStyle: 'italic', opacity: 0.8 }}>
                      You can now open a sales shift and log orders on the POS page immediately.
                    </span>
                  </div>
                </div>
              </div>
            }
            style={{ marginBottom: 20, borderRadius: "10px", textAlign: "left", background: "#fefce8", border: "1px solid #fef08a" }}
          />

          {/* Main action button */}
          <Button
            type="primary"
            size="large"
            block
            icon={<Lucide.CheckCircle size={18} style={{ marginRight: 6 }} />}
            style={{
              background: "linear-gradient(135deg, #1e4a2d, #2d6a3e)",
              border: "none",
              borderRadius: "12px",
              height: "48px",
              fontWeight: 700,
              fontSize: "16px",
            }}
            onClick={() => {
              setShowCongradModal(false);
              onClose();
            }}
          >
            យល់ព្រម / Got it! 🚀
          </Button>
        </div>
      </Modal>
    </>
  );
}
