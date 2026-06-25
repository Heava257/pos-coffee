import React from "react";
import { CAMBODIA_GEO } from "@/shared/utils/cambodia_geo";

const StepShopDetails = ({ selectedPackage, formData, setFormData, lang }) => {
  const industry = selectedPackage?.industry_code || "coffee_cafe";

  const getDetailsConfig = () => {
    switch (industry) {
      case "coffee_cafe":
        return {
          sizes: [
            { value: "small", labelEn: "Small / Kiosk", labelKh: "តូច / បញ្ជរលក់" },
            { value: "medium", labelEn: "Medium Coffee Shop", labelKh: "ហាងកាហ្វេមធ្យម" },
            { value: "large", labelEn: "Large / Multi-branch Chain", labelKh: "ហាងធំ / អាជីវកម្មកញ្ចប់សាខា" }
          ],
          natures: [
            { value: "coffee_only", labelEn: "Coffee & Drinks Only", labelKh: "លក់តែកាហ្វេ និងភេសជ្ជៈ" },
            { value: "coffee_dessert", labelEn: "Coffee, Drinks & Desserts/Pastries", labelKh: "កាហ្វេ ភេសជ្ជៈ និងនំ/បង្អែម" },
            { value: "full_menu", labelEn: "Full Menu (Drinks, Food, Desserts)", labelKh: "មុខម្ហូបពេញលេញ (អាហារ ភេសជ្ជៈ និងបង្អែម)" }
          ],
          sizeLabelEn: "Shop Size",
          sizeLabelKh: "ទំហំហាង",
          natureLabelEn: "Product Range",
          natureLabelKh: "ប្រភេទផលិតផលលក់"
        };
      case "restaurant":
        return {
          sizes: [
            { value: "small", labelEn: "Small Bistro / Cafe-Restaurant", labelKh: "ប៊ីស្ត្រូតូច / ហាងអាហារសម្រន់" },
            { value: "medium", labelEn: "Standard Restaurant", labelKh: "ភោជនីយដ្ឋានមធ្យម" },
            { value: "large", labelEn: "Fine Dining / Large Banquet", labelKh: "ភោជនីយដ្ឋានលំដាប់ខ្ពស់ / ហាងធំ" }
          ],
          natures: [
            { value: "dine_in_takeaway", labelEn: "Dine-in & Takeaway", labelKh: "ញ៉ាំនៅហាង និងខ្ចប់" },
            { value: "fine_dining", labelEn: "Table Service / Fine Dining Focus", labelKh: "បម្រើដល់តុ / ភោជនីយដ្ឋានប្រណិត" },
            { value: "fast_food", labelEn: "Fast Food / Counter Service Only", labelKh: "អាហាររហ័សទាន់ចិត្ត / បញ្ជាទិញនៅបញ្ជរ" }
          ],
          sizeLabelEn: "Restaurant Size",
          sizeLabelKh: "ទំហំភោជនីយដ្ឋាន",
          natureLabelEn: "Service Focus",
          natureLabelKh: "ទម្រង់នៃការបម្រើសេវាកម្ម"
        };
      case "retail":
      case "mart":
        return {
          sizes: [
            { value: "small", labelEn: "Local Mini-Mart / Boutique", labelKh: "ម៉ាតខ្នាតតូច / ហាងលក់រាយតូច" },
            { value: "medium", labelEn: "Supermarket / Standard Retailer", labelKh: "ហាងលក់រាយធំ / ផ្សារទំនើបមធ្យម" },
            { value: "large", labelEn: "Enterprise Warehouse / Chain Store", labelKh: "ឃ្លាំងចែកចាយ / ហាងលក់រាយសាខាច្រើន" }
          ],
          natures: [
            { value: "general_grocery", labelEn: "General Grocery & Sundries", labelKh: "គ្រឿងទេស និងទំនិញប្រើប្រាស់ទូទៅ" },
            { value: "fashion_cosmetics", labelEn: "Fashion, Clothes & Cosmetics", labelKh: "សំលៀកបំពាក់ ម៉ូដ និងគ្រឿងសំអាង" },
            { value: "electronics_hardware", labelEn: "Electronics & Tech Hardware", labelKh: "ឧបករណ៍អេឡិចត្រូនិក និងគ្រឿងបន្លាស់" }
          ],
          sizeLabelEn: "Store Type & Size",
          sizeLabelKh: "ប្រភេទ និងទំហំហាង",
          natureLabelEn: "Niche Focus",
          natureLabelKh: "មុខទំនិញចម្បង"
        };
      case "pharmacy":
        return {
          sizes: [
            { value: "small", labelEn: "Community Pharmacy", labelKh: "ឱសថស្ថានសហគមន៍/ក្នុងភូមិ" },
            { value: "medium", labelEn: "Large Pharmacy & Clinic", labelKh: "ឱសថស្ថានធំ និងគ្លីនិក" },
            { value: "large", labelEn: "Pharmaceutical Wholesale Chain", labelKh: "ដេប៉ូចែកចាយថ្នាំ / សាខាឱសថស្ថានធំៗ" }
          ],
          natures: [
            { value: "otc_prescription", labelEn: "OTC & Prescription Drugs Focus", labelKh: "ថ្នាំពេទ្យទូទៅ និងថ្នាំតាមវេជ្ជបញ្ជា" },
            { value: "supplements_beauty", labelEn: "Supplements, Organic & Beauty Care", labelKh: "អាហារបំប៉ន និងផលិតផលថែរក្សាសម្រស់" },
            { value: "medical_devices", labelEn: "Medical Devices & Health Supplies", labelKh: "បរិក្ខារពេទ្យ និងឧបករណ៍សុខភាព" }
          ],
          sizeLabelEn: "Clinic / Pharmacy Scale",
          sizeLabelKh: "ទំហំឱសថស្ថាន",
          natureLabelEn: "Drugstore Type",
          natureLabelKh: "ប្រភេទឯកទេសឱសថ"
        };
      default:
        return {
          sizes: [
            { value: "small", labelEn: "Small", labelKh: "ខ្នាតតូច" },
            { value: "medium", labelEn: "Medium", labelKh: "ខ្នាតមធ្យម" },
            { value: "large", labelEn: "Large", labelKh: "ខ្នាតធំ" }
          ],
          natures: [
            { value: "standard", labelEn: "Standard Setup", labelKh: "ការរៀបចំទូទៅ" }
          ],
          sizeLabelEn: "Business Size",
          sizeLabelKh: "ទំហំអាជីវកម្ម",
          natureLabelEn: "Business Focus",
          natureLabelKh: "ទម្រង់អាជីវកម្ម"
        };
    }
  };

  const config = getDetailsConfig();

  // Set default values if not set
  React.useEffect(() => {
    if (!formData.shop_size && config.sizes.length > 0) {
      setFormData(prev => ({ ...prev, shop_size: config.sizes[0].value }));
    }
    if (!formData.business_nature && config.natures.length > 0) {
      setFormData(prev => ({ ...prev, business_nature: config.natures[0].value }));
    }
  }, [industry]);

  const selectStyle = {
    width: "100%",
    height: 46,
    borderRadius: 12,
    border: "1.5px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    color: "white",
    fontSize: 13,
    padding: "0 12px",
    outline: "none",
    boxSizing: "border-box"
  };

  const provinces = Object.keys(CAMBODIA_GEO);
  const districts = formData.province ? CAMBODIA_GEO[formData.province] : [];

  return (
    <div style={{ animation: "fadeIn 0.3s ease-in-out" }}>
      <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, marginBottom: 18, textAlign: "center" }}>
        {lang === 'kh' 
          ? `សូមបំពេញព័ត៌មានលម្អិតបន្ថែមសម្រាប់សេវាកម្ម ${selectedPackage?.name || ""}` 
          : `Provide additional parameters for your ${selectedPackage?.name || ""} service`}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <div>
          <label style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 6, display: "block" }}>
            {lang === 'kh' ? config.sizeLabelKh : config.sizeLabelEn} <span style={{ color: "#c0a060" }}>*</span>
          </label>
          <select
            value={formData.shop_size || ""}
            onChange={(e) => setFormData({ ...formData, shop_size: e.target.value })}
            style={selectStyle}
          >
            {config.sizes.map((s) => (
              <option key={s.value} value={s.value} style={{ background: "#222", color: "white" }}>
                {lang === 'kh' ? s.labelKh : s.labelEn}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 6, display: "block" }}>
            {lang === 'kh' ? config.natureLabelKh : config.natureLabelEn} <span style={{ color: "#c0a060" }}>*</span>
          </label>
          <select
            value={formData.business_nature || ""}
            onChange={(e) => setFormData({ ...formData, business_nature: e.target.value })}
            style={selectStyle}
          >
            {config.natures.map((n) => (
              <option key={n.value} value={n.value} style={{ background: "#222", color: "white" }}>
                {lang === 'kh' ? n.labelKh : n.labelEn}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <div>
          <label style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 6, display: "block" }}>
            {lang === 'kh' ? "ខេត្ត/ក្រុង" : "Province"} <span style={{ color: "#c0a060" }}>*</span>
          </label>
          <select
            value={formData.province || ""}
            onChange={(e) => setFormData({ ...formData, province: e.target.value, district: "" })}
            style={selectStyle}
          >
            <option value="" style={{ background: "#222", color: "rgba(255,255,255,0.4)" }}>
              {lang === 'kh' ? "-- ជ្រើសរើសខេត្ត/ក្រុង --" : "-- Select Province --"}
            </option>
            {provinces.map((prov) => (
              <option key={prov} value={prov} style={{ background: "#222", color: "white" }}>
                {prov}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 6, display: "block" }}>
            {lang === 'kh' ? "ស្រុក/ខណ្ឌ" : "District"} <span style={{ color: "#c0a060" }}>*</span>
          </label>
          <select
            value={formData.district || ""}
            onChange={(e) => setFormData({ ...formData, district: e.target.value })}
            style={selectStyle}
            disabled={!formData.province}
          >
            <option value="" style={{ background: "#222", color: "rgba(255,255,255,0.4)" }}>
              {lang === 'kh' ? "-- ជ្រើសរើសស្រុក/ខណ្ឌ --" : "-- Select District --"}
            </option>
            {districts.map((dist) => (
              <option key={dist} value={dist} style={{ background: "#222", color: "white" }}>
                {dist}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default StepShopDetails;
