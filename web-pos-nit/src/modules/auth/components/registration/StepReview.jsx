import React from "react";
import { UserOutlined, ShopOutlined, CreditCardOutlined, InfoCircleOutlined } from "@ant-design/icons";

const StepReview = ({ formData, selectedPackage, selectedPlan, lang }) => {
  const getShopSizeLabel = (val) => {
    switch (val) {
      case "small": return lang === 'kh' ? "តូច / បញ្ជរលក់" : "Small / Kiosk";
      case "medium": return lang === 'kh' ? "មធ្យម" : "Medium Shop";
      case "large": return lang === 'kh' ? "ធំ / អាជីវកម្មកញ្ចប់សាខា" : "Large / Chain";
      default: return val || "N/A";
    }
  };

  const getBusinessNatureLabel = (val) => {
    switch (val) {
      case "coffee_only": return lang === 'kh' ? "លក់តែកាហ្វេ និងភេសជ្ជៈ" : "Coffee & Drinks Only";
      case "coffee_dessert": return lang === 'kh' ? "កាហ្វេ ភេសជ្ជៈ និងនំ/បង្អែម" : "Coffee, Drinks & Desserts";
      case "full_menu": return lang === 'kh' ? "មុខម្ហូបពេញលេញ" : "Full Menu";
      case "dine_in_takeaway": return lang === 'kh' ? "ញ៉ាំនៅហាង និងខ្ចប់" : "Dine-in & Takeaway";
      case "fine_dining": return lang === 'kh' ? "បម្រើដល់តុ / ភោជនីយដ្ឋានប្រណិត" : "Fine Dining Focus";
      case "fast_food": return lang === 'kh' ? "អាហាររហ័សទាន់ចិត្ត" : "Fast Food";
      case "general_grocery": return lang === 'kh' ? "គ្រឿងទេស និងទំនិញប្រើប្រាស់ទូទៅ" : "General Grocery";
      case "fashion_cosmetics": return lang === 'kh' ? "សំលៀកបំពាក់ និងគ្រឿងសំអាង" : "Fashion & Cosmetics";
      case "electronics_hardware": return lang === 'kh' ? "ឧបករណ៍អេឡិចត្រូនិក" : "Electronics";
      case "otc_prescription": return lang === 'kh' ? "ថ្នាំទូទៅ និងថ្នាំតាមវេជ្ជបញ្ជា" : "OTC & Prescription Drugs";
      case "supplements_beauty": return lang === 'kh' ? "អាហារបំប៉ន និងសម្រស់" : "Supplements & Beauty";
      case "medical_devices": return lang === 'kh' ? "បរិក្ខារពេទ្យ" : "Medical Devices";
      default: return val || "N/A";
    }
  };

  const ReviewSection = ({ title, icon, children }) => (
    <div style={{
      background: "rgba(255, 255, 255, 0.02)",
      border: "1px solid rgba(255, 255, 255, 0.05)",
      borderRadius: 16,
      padding: "16px",
      marginBottom: 12
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, borderBottom: "1px solid rgba(255, 255, 255, 0.04)", paddingBottom: 8 }}>
        <span style={{ color: "#c0a060" }}>{icon}</span>
        <h4 style={{ color: "white", fontSize: 13, fontWeight: 700, margin: 0 }}>{title}</h4>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {children}
      </div>
    </div>
  );

  const ReviewRow = ({ label, value }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
      <span style={{ color: "rgba(255, 255, 255, 0.4)" }}>{label}</span>
      <span style={{ color: "white", fontWeight: 600 }}>{value}</span>
    </div>
  );

  return (
    <div style={{ animation: "fadeIn 0.3s ease-in-out" }}>
      <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, marginBottom: 18, textAlign: "center" }}>
        {lang === 'kh' 
          ? "សូមពិនិត្យឡើងវិញនូវរាល់ព័ត៌មានរបស់អ្នក មុននឹងចុះឈ្មោះ" 
          : "Please review your registration summary below"}
      </p>

      {/* Account Info */}
      <ReviewSection title={lang === 'kh' ? "គណនីម្ចាស់ហាង" : "Owner & Account Info"} icon={<UserOutlined />}>
        <ReviewRow label={lang === 'kh' ? "ឈ្មោះម្ចាស់" : "Owner Name"} value={formData.owner_name} />
        <ReviewRow label={lang === 'kh' ? "អ៊ីមែល" : "Email Address"} value={formData.email} />
        <ReviewRow label={lang === 'kh' ? "លេខទូរស័ព្ទ" : "Phone Number"} value={formData.phone} />
      </ReviewSection>

      {/* Shop Info */}
      <ReviewSection title={lang === 'kh' ? "ព័ត៌មានហាង" : "Shop Config"} icon={<ShopOutlined />}>
        <ReviewRow label={lang === 'kh' ? "ឈ្មោះអាជីវកម្ម" : "Business Name"} value={formData.business_name} />
        <ReviewRow label={lang === 'kh' ? "សេវាកម្ម/ប្រភេទ" : "Service Package"} value={selectedPackage?.name} />
        <ReviewRow label={lang === 'kh' ? "ទំហំហាង" : "Shop Size"} value={getShopSizeLabel(formData.shop_size)} />
        <ReviewRow label={lang === 'kh' ? "ប្រភេទផលិតផល" : "Focus / Products"} value={getBusinessNatureLabel(formData.business_nature)} />
        <ReviewRow label={lang === 'kh' ? "ខេត្ត/ក្រុង" : "Province"} value={formData.province} />
        <ReviewRow label={lang === 'kh' ? "ស្រុក/ខណ្ឌ" : "District"} value={formData.district} />
      </ReviewSection>

      {/* Plan */}
      <ReviewSection title={lang === 'kh' ? "គម្រោងតម្លៃសេវាកម្ម" : "Subscription Plan"} icon={<CreditCardOutlined />}>
        <ReviewRow label={lang === 'kh' ? "ឈ្មោះគម្រោង" : "Plan Name"} value={selectedPlan?.name} />
        <ReviewRow 
          label={lang === 'kh' ? "តម្លៃត្រូវបង់" : "Amount Due"} 
          value={
            <span style={{ color: "#c0a060", fontWeight: 700 }}>
              ${parseFloat(selectedPlan?.price || 0).toFixed(2)} / {selectedPlan?.billing_cycle === 'lifetime' ? (lang === 'kh' ? 'មួយជីវិត' : 'lifetime') : (lang === 'kh' ? 'ខែ' : 'mo')}
            </span>
          } 
        />
      </ReviewSection>

      <div style={{ 
        display: "flex", 
        gap: 8, 
        padding: 12, 
        background: "rgba(192, 160, 96, 0.05)", 
        border: "1px solid rgba(192, 160, 96, 0.15)", 
        borderRadius: 12, 
        marginTop: 16 
      }}>
        <InfoCircleOutlined style={{ color: "#c0a060", marginTop: 2 }} />
        <p style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 11, margin: 0, lineHeight: 1.4 }}>
          {lang === 'kh'
            ? "ដោយការចុះឈ្មោះនេះ អ្នកយល់ព្រមតាមលក្ខខណ្ឌប្រើប្រាស់សេវាកម្មរបស់យើង។ គណនីរបស់អ្នកនឹងត្រូវបានបង្កើតឡើងភ្លាមៗ។"
            : "By clicking establish, you agree to our terms of service. Your tenant dashboard will be initialized instantly."}
        </p>
      </div>
    </div>
  );
};

export default StepReview;
