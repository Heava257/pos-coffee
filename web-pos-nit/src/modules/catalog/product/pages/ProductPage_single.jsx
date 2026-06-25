import React, { useEffect, useState } from "react";
import {
  Button,
  Checkbox,
  Col,
  Form,
  Image,
  Input,
  InputNumber,
  message,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Upload,
  Tooltip,
  DatePicker,
  Typography,
  Card,
  Switch,
  Radio,
} from "antd";
import { SearchOutlined, PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { request, compressImage } from "@/shared/utils/helper";
import { MdAdd, MdDelete, MdEdit, MdRestaurantMenu } from "react-icons/md";
import MainPage from "@/app/layouts/MainPage";
import { configStore } from "@/app/store/configStore";
import { Config } from "@/shared/utils/config";
import { useProfileStore } from "@/app/store/profileStore";
import "@/modules/catalog/product/styles/Product.css"
import RecipeModal from "@/modules/catalog/product/components/RecipeModal";
import { useLanguage, translations } from "@/app/store/language.store";

const { Text, Title } = Typography;

// ─── Color Palette (Matches POS) ─────────────────────────────────────────────
const COLORS = {
  bg: "#f4f1eb",
  darkGreen: "#1e4a2d",
  midGreen: "#2d6a42",
  accentGreen: "#3a7d52",
  white: "#ffffff",
  textPrimary: "#1a2e1a",
  textSecondary: "#6b7c6b",
  softBorder: "#e8e3d8",
  redBadge: "#e85d5d",
};

// ─── Dynamic Category Options (Data-Driven, Not Hardcoded) ─────────────────
// ─── Dynamic Category Options (Data-Driven, Not Hardcoded) ─────────────────
const CategoryOptions = ({ selectedCategory, t, form }) => {
  const parseBlueprint = (val) => {
    if (!val) return null;
    if (Array.isArray(val)) return val;
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return val.split(',').map(s => s.trim()).filter(Boolean);
    }
  };

  const defaultMoods = parseBlueprint(selectedCategory?.default_moods);
  const defaultSizes = parseBlueprint(selectedCategory?.default_sizes);
  const defaultAddons = parseBlueprint(selectedCategory?.default_addons);

  const isPharmacy = selectedCategory?.industry_code === 'pharmacy';
  const isRestaurant = selectedCategory?.industry_code === 'restaurant' || selectedCategory?.industry_code === 'coffee_cafe';

  // Watch the moods field safely
  const watchedMoods = Form.useWatch('moods', form);
  const moods = Array.isArray(watchedMoods) ? watchedMoods : [];

  const handleMoodCheckboxChange = (value, label, checked) => {
    let currentMoods = form.getFieldValue('moods');
    currentMoods = Array.isArray(currentMoods) ? currentMoods : [];
    currentMoods = currentMoods.map(m => typeof m === 'object' ? m : { value: m, label: m, price: 0 });
    
    if (checked) {
      if (!currentMoods.some(m => m.value === value)) {
        const basePrice = form.getFieldValue('price') || 0;
        currentMoods.push({ value, label, price: Number(basePrice) });
      }
    } else {
      currentMoods = currentMoods.filter(m => m.value !== value);
    }
    form.setFieldValue('moods', currentMoods);
  };

  const handleMoodPriceChange = (value, price) => {
    let currentMoods = form.getFieldValue('moods');
    currentMoods = Array.isArray(currentMoods) ? currentMoods : [];
    currentMoods = currentMoods.map(m => typeof m === 'object' ? m : { value: m, label: m, price: 0 });
    
    const target = currentMoods.find(m => m.value === value);
    if (target) {
      target.price = price === null ? 0 : price;
    }
    form.setFieldValue('moods', currentMoods);
  };

  const hasConfig = defaultMoods?.length > 0 || defaultSizes?.length > 0 || defaultAddons?.length > 0;
  if (!selectedCategory || !hasConfig) return null;

  return (
    <div style={{
      background: isPharmacy ? "#f0f7ff" : "#ffffff",
      padding: "24px",
      borderRadius: "20px",
      marginBottom: "20px",
      border: `1px solid ${isPharmacy ? "#d6e4ff" : "#f0f0f0"}`,
      boxShadow: "0 4px 20px rgba(0,0,0,0.03)"
    }}>
      <div style={{
        fontWeight: 800,
        marginBottom: 24,
        color: isPharmacy ? "#0958d9" : COLORS.darkGreen,
        fontSize: 18,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        borderBottom: `2px solid ${isPharmacy ? "#e6f4ff" : "#f6fbf8"}`,
        paddingBottom: 12
      }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: isPharmacy ? "#e6f4ff" : "#e6f0e9",
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20
        }}>
          {isPharmacy ? "💊" : "☕"}
        </div>
        <div>
          <div style={{ fontSize: 16, lineHeight: 1 }}>{selectedCategory?.name || selectedCategory?.label}</div>
          <div style={{ fontSize: 11, fontWeight: 500, color: COLORS.textSecondary, marginTop: 4 }}>
            {isPharmacy ? "MEDICAL BLUEPRINT" : t.cooking_options_title}
          </div>
        </div>
      </div>

      {/* Moods Section - Custom Surcharges! */}
      {defaultMoods && defaultMoods.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontWeight: 800, marginBottom: 16, color: COLORS.textPrimary, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {isPharmacy ? t.dosage_instructions_label : (isRestaurant ? t.taste_instructions_label : t.mood || "Temperature Options")}
          </div>
          <Form.Item name="moods" noStyle>
            <Row gutter={[12, 12]}>
              {defaultMoods.map((m, idx) => {
                const label = typeof m === 'object' ? (m.label || m.value) : m;
                const value = typeof m === 'object' ? (m.value || m.label) : m;
                
                const matchedMood = moods.find(x => typeof x === 'object' ? x.value === value : x === value);
                const isChecked = !!matchedMood;
                const priceValue = typeof matchedMood === 'object' ? matchedMood.price : 0;

                let icon = "🔘";
                if (label.toLowerCase().includes("hot")) icon = "🔥";
                if (label.toLowerCase().includes("ice")) icon = "❄️";
                if (label.toLowerCase().includes("frap")) icon = "🥤";
                if (label.toLowerCase().includes("sweet")) icon = "🍯";
                if (label.toLowerCase().includes("spicy")) icon = "🌶️";

                return (
                  <Col span={24} key={idx}>
                    <div style={{
                      padding: '10px 16px',
                      border: isChecked ? `1.5px solid ${COLORS.midGreen}` : '1.5px solid #eee',
                      borderRadius: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: isChecked ? '#f0fdf4' : '#fafafa',
                      width: '100%',
                      transition: 'all 0.3s ease',
                      boxShadow: isChecked ? '0 4px 12px rgba(45, 106, 66, 0.08)' : 'none'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Checkbox 
                          checked={isChecked} 
                          onChange={(e) => handleMoodCheckboxChange(value, label, e.target.checked)}
                          style={{ transform: 'scale(1.1)' }}
                        />
                        <span style={{ fontSize: 18 }}>{icon}</span>
                        <span style={{ fontWeight: 700, fontSize: 14, color: isChecked ? COLORS.darkGreen : COLORS.textPrimary }}>{label}</span>
                      </div>
                      
                      {isChecked && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary }}>{t.price || "Price ($)"}:</span>
                          <InputNumber
                            size="middle"
                            placeholder="0.00"
                            value={priceValue}
                            onChange={(val) => handleMoodPriceChange(value, val)}
                            min={0}
                            step={0.1}
                            precision={2}
                            style={{ width: 110, fontWeight: 800 }}
                          />
                        </div>
                      )}
                    </div>
                  </Col>
                );
              })}
            </Row>
          </Form.Item>
        </div>
      )}

      {/* Sizes Section - Much Wider Price Inputs */}
      {defaultSizes && defaultSizes.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ margin: '24px 0', borderTop: `1px dashed ${isPharmacy ? "#d6e4ff" : "#eee"}` }} />
          <Form.List name="sizes">
            {(fields, { add, remove }) => (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {isPharmacy ? t.packaging_units_label : (isRestaurant ? t.portions_sizes_label : t.sizes || "Pricing by Size")}
                  </div>
                  <Button
                    type="primary"
                    size="small"
                    onClick={() => add()}
                    icon={<MdAdd />}
                    style={{ borderRadius: 8, background: COLORS.midGreen }}
                  >
                    {t.add}
                  </Button>
                </div>
                
                {fields.length === 0 && (
                  <div style={{ padding: '20px', textAlign: 'center', background: '#f9f9f9', borderRadius: 12, border: '1px dashed #ddd', marginBottom: 16 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>{t.price_per_size_msg || "No size-specific prices defined yet."}</Text>
                  </div>
                )}

                {fields.map(({ key, name, ...restField }) => (
                  <div key={key} style={{ 
                    background: '#fcfcfc', 
                    padding: '16px', 
                    borderRadius: '16px', 
                    border: '1px solid #f0f0f0', 
                    marginBottom: 12,
                    position: 'relative',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.01)'
                  }}>
                    <Row gutter={12} align="middle">
                      <Col span={12}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.textSecondary, marginBottom: 4, textTransform: 'uppercase' }}>
                          {isPharmacy ? "Unit Type" : "Size"}
                        </div>
                        <Form.Item
                          {...restField}
                          name={[name, 'label']}
                          rules={[{ required: true, message: '' }]}
                          style={{ marginBottom: 0 }}
                        >
                          <Select
                            size="large"
                            placeholder="Select"
                            options={defaultSizes.map(s => ({
                              label: typeof s === 'object' ? (s.label || s.value) : s,
                              value: typeof s === 'object' ? (s.value || s.label) : s
                            }))}
                            style={{ width: '100%' }}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={9}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.textSecondary, marginBottom: 4, textTransform: 'uppercase' }}>
                          {t.price} ($)
                        </div>
                        <Form.Item
                          {...restField}
                          name={[name, 'price']}
                          rules={[{ required: true, message: '' }]}
                          style={{ marginBottom: 0 }}
                        >
                          <InputNumber
                            size="large"
                            placeholder="0.00"
                            style={{ width: '100%', fontWeight: 800, color: COLORS.darkGreen }}
                            min={0}
                            step={0.1}
                            precision={2}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={3}>
                        <div style={{ height: 20 }} /> {/* Spacer */}
                        <Button
                          danger
                          type="text"
                          onClick={() => remove(name)}
                          icon={<MdDelete style={{ fontSize: 20 }} />}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}
                        />
                      </Col>
                    </Row>
                  </div>
                ))}
              </>
            )}
          </Form.List>
        </div>
      )}

      {/* Add-ons Section - Enhanced List */}
      {defaultAddons && defaultAddons.length > 0 && (
        <div>
          <div style={{ margin: '24px 0', borderTop: `1px dashed ${isPharmacy ? "#d6e4ff" : "#eee"}` }} />
          <Form.List name="addons">
            {(fields, { add, remove }) => (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {isPharmacy ? "Notes/Warnings" : t.addons || "Extra Options"}
                  </div>
                  <Button
                    type="primary"
                    size="small"
                    onClick={() => add()}
                    icon={<MdAdd />}
                    style={{ borderRadius: 8, background: COLORS.midGreen }}
                  >
                    {t.add}
                  </Button>
                </div>

                {fields.map(({ key, name, ...restField }) => (
                  <div key={key} style={{ 
                    background: '#fff', 
                    padding: '12px', 
                    borderRadius: '12px', 
                    border: '1px solid #f0f0f0', 
                    marginBottom: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10
                  }}>
                    <Form.Item
                      {...restField}
                      name={[name, 'label']}
                      rules={[{ required: true, message: '' }]}
                      style={{ marginBottom: 0, flex: 2 }}
                    >
                      <Select
                        size="large"
                        placeholder="Select Option"
                        options={defaultAddons.map(a => ({
                          label: typeof a === 'object' ? (a.label || a.value) : a,
                          value: typeof a === 'object' ? (a.value || a.label) : a
                        }))}
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                    {!isPharmacy && (
                      <Form.Item
                        {...restField}
                        name={[name, 'price']}
                        rules={[{ required: true, message: '' }]}
                        style={{ marginBottom: 0, width: 100 }}
                      >
                        <InputNumber
                          size="large"
                          placeholder="Price"
                          style={{ width: '100%', fontWeight: 700 }}
                          min={0}
                          step={0.1}
                          precision={2}
                        />
                      </Form.Item>
                    )}
                    <Button
                      danger
                      type="text"
                      onClick={() => remove(name)}
                      icon={<MdDelete style={{ fontSize: 18 }} />}
                      style={{ padding: 0 }}
                    />
                  </div>
                ))}
              </>
            )}
          </Form.List>
        </div>
      )}
    </div>
  );
};

const getBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

function ProductPage() {
  const { lang } = useLanguage();
  const t = translations[lang];
  const { profile, permissions } = useProfileStore(); 
  const hasRecipePerm = permissions?.some(p => p.route_key?.toLowerCase().replace(/^\/+|\/+$/g, '') === 'recipe');
  const { config } = configStore();
  const [form] = Form.useForm();
  const [state, setState] = useState({
    list: [],
    visibleModal: false,
    categoryList: [], 
    loading: false,
    total: 0,
    totals: {}
  });
  const [filter, setFilter] = useState({
    txt_search: "",
    category_id: "",
    brand: "",
  });
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [imageDefault, setImageDefault] = useState([]);
  const [visibleRecipeModal, setVisibleRecipeModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [viewState, setViewState] = useState('list');
  const [viewingProduct, setViewingProduct] = useState(null);
  const sizes = Form.useWatch('sizes', form);
  const hasSizes = sizes && sizes.length > 0;

  const watchName = Form.useWatch('name', form);
  const watchSubCategory = Form.useWatch('sub_category', form);
  const watchBarcode = Form.useWatch('barcode', form);
  const watchBrand = Form.useWatch('brand', form);
  const watchPrice = Form.useWatch('price', form);
  const watchDescription = Form.useWatch('description', form);
  const watchQty = Form.useWatch('qty', form);
  const watchCostPrice = Form.useWatch('cost_price', form);
  const watchMoods = Form.useWatch('moods', form);

  const userId = useProfileStore(s => s.profile?.id || s.profile?.user_id);
  useEffect(() => {
    if (userId) {
      getList();
      getFullCategories();
    }
  }, [userId]);

  const getFullCategories = async () => {
    const res = await request("category", "get");
    if (res && !res.error) {
      setState(pre => ({ ...pre, categoryList: res.list || [] }));
    }
  };
  const refPage = React.useRef(1);

  const getList = async () => {
    var param = {
      ...filter,
      page: 1, 
      is_list_all: 1, 
    };

    setState((pre) => ({ ...pre, loading: true }));
    try {
      const res = await request(`product`, "get", param);
      if (res && !res.error) {
        const totals = res.list.reduce((acc, item) => {
          const catName = item.category_name || "Uncategorized";
          if (!acc[catName]) {
            acc[catName] = 0;
          }
          acc[catName] += item.qty;
          return acc;
        }, {});

        setState((pre) => ({
          ...pre,
          list: res.list,
          total: res.list.length,
          totals,
        }));
      }
    } catch (e) {
      console.error("Error fetching products:", e);
    } finally {
      setState((pre) => ({ ...pre, loading: false }));
    }
  };

  const onCloseModal = () => {
    setViewState('list');
    setViewingProduct(null);
    setImageDefault([]);
    setActiveTab('basic');
    form.resetFields();
    form.setFieldsValue({ moods: [], sizes: [], addons: [] });
  };

  const onFinish = async (items) => {
    var params = new FormData();
    params.append("name", items.name);
    params.append("category_id", items.category_id);
    params.append("barcode", items.barcode || "");
    params.append("brand", items.brand || "");
    
    // Serialize advanced metadata inside description column as JSON for full persistence
    const descObj = {
      text: items.description || "",
      prep_time: items.prep_time !== undefined ? items.prep_time : 5,
      shelf_life: items.shelf_life !== undefined ? items.shelf_life : 2,
      storage_condition: items.storage_condition || "Refrigerated (2-5°C)",
      allergens: items.allergens || [],
      tags: items.tags || [],
      cost_price: items.cost_price !== undefined ? items.cost_price : 0.45,
      tax_rate: items.tax_rate || "10%",
      product_type: items.product_type || "Variant Product"
    };
    params.append("description", JSON.stringify(descObj));

    params.append("qty", items.qty || 0);
    params.append("price", items.price || 0);
    params.append("discount", items.discount || 0);
    params.append("status", items.status || "1");
    params.append("id", form.getFieldValue("id") || "");
    
    const cleanToArr = (val) => {
      if (!val) return [];
      if (Array.isArray(val)) return val;
      return [val];
    };

    params.append("sizes", JSON.stringify(cleanToArr(items.sizes)));
    params.append("addons", JSON.stringify(cleanToArr(items.addons)));
    params.append("moods", JSON.stringify(cleanToArr(items.moods)));
    params.append("expiry_date", items.expiry_date ? dayjs(items.expiry_date).format("YYYY-MM-DD") : "");
    params.append("strength", items.strength || "");
    params.append("generic_name", items.generic_name || "");

    if (items.image_default && items.image_default.file) {
      if (items.image_default.file.status === "removed") {
        params.append("image_remove", "1");
      } else {
        const file = items.image_default.file.originFileObj;
        if (file) {
          const compressedFile = await compressImage(file);
          params.append("upload_image", compressedFile, file.name || "image.jpg");
        }
      }
    }
    var method = form.getFieldValue("id") ? "put" : "post";
    setIsSubmitting(true);
    try {
      const res = await request("product", method, params);
      if (res && !res.error) {
        message.success(t.product_saved || "Product Saved Successfully");
        getList();
        if (viewingProduct) {
          // If we were editing, return to the gorgeous view screen for that product
          setViewingProduct(prev => ({ ...prev, ...items }));
          setViewState('view');
        } else {
          onCloseModal();
        }
      } else {
        res.error?.barcode && message.error(res.error?.barcode);
      }
    } catch (err) {
      console.error("Error saving product:", err);
      message.error("Failed to save product");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onBtnNew = async () => {
    try {
      form.resetFields();
      form.setFieldsValue({ moods: [], sizes: [], addons: [] });
      setImageDefault([]);
      
      const res = await request("new_barcode", "post");
      if (res && res.barcode) {
        form.setFieldValue("barcode", res.barcode);
      }
      form.setFieldValue("status", "1");
      const firstCat = state.categoryList?.[0];
      if (firstCat) {
        form.setFieldValue("category_id", String(firstCat.id));
        setSelectedCategory(firstCat);
      }
      
      setViewingProduct(null);
      setViewState('edit');
      setActiveTab('basic');
    } catch (err) {
      console.error("Barcode generation failed:", err);
    }
  };

  const handlePreview = async (file) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }
    setPreviewImage(file.url || file.preview);
    setPreviewOpen(true);
  };

  const handleChangeImageDefault = ({ fileList: newFileList }) =>
    setImageDefault(newFileList);

  const onFilter = () => {
    getList();
  };

  const onClickEdit = (item, index) => {
    const safeParse = (val) => {
      if (!val) return [];
      if (Array.isArray(val)) return val;
      try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        return typeof val === 'string' ? val.split(',').map(s => s.trim()).filter(Boolean) : [val];
      }
    };

    const sizes = safeParse(item.sizes);
    const addons = safeParse(item.addons);
    const moods = safeParse(item.moods);

    const finalMoods = Array.isArray(moods)
      ? moods.map(m => {
        if (m && typeof m === 'object') {
          return {
            value: String(m.value || m.label || ""),
            label: String(m.label || m.value || ""),
            price: m.price !== undefined ? Number(m.price) : 0
          };
        }
        return {
          value: String(m || ""),
          label: String(m || ""),
          price: 0
        };
      })
      : [];

    let descriptionText = item.description || "";
    let prepTime = 5;
    let shelfLife = 2;
    let storageCondition = "Refrigerated (2-5°C)";
    let allergens = ["Milk"];
    let tags = ["coffee", "latte", "hot", "bestseller"];
    let costPrice = 0.45;
    let taxRate = "10%";
    let productType = "Variant Product";

    try {
      if (item.description && item.description.startsWith("{")) {
        const descObj = JSON.parse(item.description);
        descriptionText = descObj.text || "";
        prepTime = descObj.prep_time !== undefined ? descObj.prep_time : 5;
        shelfLife = descObj.shelf_life !== undefined ? descObj.shelf_life : 2;
        storageCondition = descObj.storage_condition || "Refrigerated (2-5°C)";
        allergens = descObj.allergens || [];
        tags = descObj.tags || [];
        costPrice = descObj.cost_price !== undefined ? descObj.cost_price : 0.45;
        taxRate = descObj.tax_rate || "10%";
        productType = descObj.product_type || "Variant Product";
      }
    } catch (e) {
      // fallback
    }

    form.setFieldsValue({
      ...item,
      category_id: item.category_id ? String(item.category_id) : undefined,
      description: descriptionText,
      prep_time: prepTime,
      shelf_life: shelfLife,
      storage_condition: storageCondition,
      allergens: allergens,
      tags: tags,
      cost_price: costPrice,
      tax_rate: taxRate,
      product_type: productType,
      sizes: Array.isArray(sizes) ? sizes : [],
      addons: Array.isArray(addons) ? addons : [],
      moods: finalMoods.filter(x => x.value),
      status: String(item.status || "1"),
    });

    if (item.expiry_date) {
      form.setFieldValue("expiry_date", dayjs(item.expiry_date));
    }

    const cat = (state.categoryList || []).find(c => String(c.id) === String(item.category_id));
    setSelectedCategory(cat || null);

    setViewingProduct(item);
    setViewState('edit');
    setActiveTab('basic');

    if (item.image != "" && item.image != null) {
      const imageProduct = [
        {
          uid: "-1",
          name: item.image,
          status: "done",
          url: Config.getFullImagePath(item.image),
        },
      ];
      setImageDefault(imageProduct);
    }
  };

  const onClickDelete = (item, index) => {
    Modal.confirm({
      title: <span style={{ color: '#ff4d4f' }}>{t.remove_data}?</span>,
      content: t.confirm_remove_product,
      okText: t.delete,
      okType: "danger",
      centered: true,
      onOk: async () => {
        const res = await request("product", "delete", item);
        if (res && !res.error) {
          message.success(t.product_deleted);
          getList();
        }
      },
    });
  };

  const onClickRecipe = (item) => {
    setSelectedProduct(item);
    setVisibleRecipeModal(true);
  };

  // ─── Executive Insights ───────────────────────────────────────────────────
  const lowStockThreshold = 10;
  const totalProducts = state.list.length;
  const lowStockItems = state.list.filter(i => {
    const cat = state.categoryList.find(c => String(c.id) === String(i.category_id));
    const isService = cat?.industry_code === 'restaurant' || cat?.industry_code === 'coffee_cafe';
    return !isService && Number(i.qty || 0) > 0 && Number(i.qty || 0) <= lowStockThreshold;
  }).length;
  const outOfStockItems = state.list.filter(i => {
    const cat = state.categoryList.find(c => String(c.id) === String(i.category_id));
    const isService = cat?.industry_code === 'restaurant' || cat?.industry_code === 'coffee_cafe';
    return !isService && Number(i.qty || 0) <= 0;
  }).length;

  const totalStockValue = state.list.reduce((acc, i) => {
    let itemPrice = Number(i.price || 0);
    // If base price is 0, try to get price from sizes
    if (itemPrice === 0 && i.sizes) {
      try {
        const sizesArr = typeof i.sizes === 'string' ? JSON.parse(i.sizes) : i.sizes;
        if (Array.isArray(sizesArr) && sizesArr.length > 0) {
          // Use average or first size price as a fallback for valuation
          itemPrice = Number(sizesArr[0]?.price || 0);
        }
      } catch (e) {}
    }
    return acc + (itemPrice * Number(i.qty || 0));
  }, 0);

  // ─── SPA Master-Detail-Edit Layouts ────────────────────────────────────────

  const [viewSubTab, setViewSubTab] = useState('info');

  const handleCopy = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    message.success(`${label} copied to clipboard!`);
  };

  const renderList = () => {
    return (
      <MainPage loading={state.loading}>
        <div style={{ padding: '0 4px' }}>
          {/* Executive Glass Header */}
          <div style={{
            marginBottom: '32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            padding: '24px 32px',
            borderRadius: '24px',
            boxShadow: '0 4px 30px rgba(0,0,0,0.03)',
            border: '1px solid rgba(226,232,240,0.8)',
            flexWrap: 'wrap',
            gap: '24px'
          }}>
            <div>
              <Title level={2} style={{ margin: 0, color: COLORS.darkGreen, display: 'flex', alignItems: 'center', gap: '16px', fontWeight: 800 }}>
                <MdRestaurantMenu style={{ fontSize: '32px' }} /> {(typeof t?.products === 'string' ? t.products : "Inventory Master")}
              </Title>
              <Text type="secondary" style={{ fontSize: '14px', letterSpacing: '0.5px' }}>
                {t.manage_all_products || "Administrative Product Control Center"}
              </Text>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Input
                prefix={<SearchOutlined style={{ color: COLORS.textSecondary }} />}
                placeholder={t.search}
                onChange={(e) => setFilter((p) => ({ ...p, txt_search: e.target.value }))}
                style={{ width: 220, borderRadius: '12px', height: '45px' }}
                onPressEnter={onFilter}
              />
              <Select
                allowClear
                style={{ width: 160, height: '45px' }}
                placeholder={t.category}
                options={state.categoryList.map(c => ({ label: c.name, value: String(c.id) }))}
                onChange={(value) => setFilter((p) => ({ ...p, category_id: value || "" }))}
              />
              <Button
                type="primary"
                onClick={onBtnNew}
                icon={<PlusOutlined />}
                style={{
                  background: COLORS.darkGreen,
                  borderColor: COLORS.darkGreen,
                  borderRadius: '12px',
                  height: '45px',
                  fontWeight: 800,
                  boxShadow: '0 4px 14px rgba(30, 74, 45, 0.2)'
                }}
              >
                {t.add_new_product || "New Asset"}
              </Button>
            </div>
          </div>

          {/* Quick Insights Bar */}
          <Row gutter={24} style={{ marginBottom: '32px' }}>
            <Col span={6}>
              <div style={{ background: '#fff', padding: '24px', borderRadius: '24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: COLORS.textSecondary, marginBottom: '8px', letterSpacing: '0.5px' }}>TOTAL ASSETS</div>
                <div style={{ fontSize: '28px', fontWeight: 900, color: COLORS.darkGreen }}>{totalProducts}</div>
              </div>
            </Col>
            <Col span={6}>
              <div style={{ background: '#fff', padding: '24px', borderRadius: '24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#ef4444', marginBottom: '8px', letterSpacing: '0.5px' }}>OUT OF STOCK</div>
                <div style={{ fontSize: '28px', fontWeight: 900, color: '#ef4444' }}>{outOfStockItems}</div>
              </div>
            </Col>
            <Col span={6}>
              <div style={{ background: '#fff', padding: '24px', borderRadius: '24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#ea580c', marginBottom: '8px', letterSpacing: '0.5px' }}>LOW INVENTORY</div>
                <div style={{ fontSize: '28px', fontWeight: 900, color: '#ea580c' }}>{lowStockItems}</div>
              </div>
            </Col>
            <Col span={6}>
              <div style={{ background: '#fff', padding: '24px', borderRadius: '24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#2563eb', marginBottom: '8px', letterSpacing: '0.5px' }}>STOCK VALUATION</div>
                <div style={{ fontSize: '28px', fontWeight: 900, color: '#2563eb' }}>${totalStockValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
            </Col>
          </Row>

          {/* Premium Table Container */}
          <Card
            style={{ borderRadius: '24px', border: 'none', boxShadow: '0 4px 30px rgba(0,0,0,0.04)', overflow: 'hidden' }}
            bodyStyle={{ padding: 0 }}
          >
            <Table
              dataSource={state.list}
              rowKey="id"
              loading={state.loading}
              className="executive-table"
              pagination={{
                pageSize: 8,
                showTotal: (total) => <Text strong style={{ color: COLORS.textSecondary }}>{t.total} {total} {t.products}</Text>,
                style: { padding: '20px' }
              }}
              columns={[
                {
                  key: "product",
                  title: "PRODUCT IDENTITY",
                  width: 400,
                  render: (_, r) => (
                    <div 
                      style={{ display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer' }}
                      onClick={() => {
                        onClickEdit(r);
                        setViewState('view');
                      }}
                    >
                      <div style={{ position: 'relative' }}>
                        <Image
                          src={Config.getFullImagePath(r.image)}
                          width={75}
                          height={75}
                          preview={false}
                          style={{ borderRadius: '18px', objectFit: 'cover', border: `2px solid #f8f9fa`, boxShadow: '0 8px 16px rgba(0,0,0,0.08)' }}
                          fallback="https://placehold.co/150x150?text=Product"
                        />
                        {(() => {
                          const cat = state.categoryList.find(c => String(c.id) === String(r.category_id));
                          const isService = cat?.industry_code === 'restaurant' || cat?.industry_code === 'coffee_cafe';
                          if (r.qty <= 0 && !isService) {
                            return (
                              <div style={{
                                position: 'absolute',
                                top: -8,
                                right: -8,
                                background: '#ef4444',
                                color: '#fff',
                                fontSize: '9px',
                                padding: '2px 8px',
                                borderRadius: '8px',
                                fontWeight: 900,
                                boxShadow: '0 4px 8px rgba(239, 68, 68, 0.4)',
                                border: '2px solid #fff'
                              }}>STOCK OUT</div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                      <div>
                        <div className="product-name-link" style={{ fontWeight: 900, color: COLORS.darkGreen, fontSize: '17px', lineHeight: 1.2, marginBottom: '6px', textDecoration: 'underline' }}>{r.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Tag style={{ margin: 0, fontSize: '10px', borderRadius: '6px', fontWeight: 800, background: '#f4f1eb', border: 'none', color: COLORS.darkGreen }}>{r.barcode}</Tag>
                          {r.brand && <Tag style={{ margin: 0, fontSize: '10px', borderRadius: '6px', fontWeight: 800, background: '#e0f2fe', border: 'none', color: '#0369a1' }}>{r.brand.toUpperCase()}</Tag>}
                        </div>
                      </div>
                    </div>
                  )
                },
                {
                  key: "category",
                  title: "CLASSIFICATION",
                  width: 180,
                  render: (_, r) => (
                    <Tag style={{
                      borderRadius: '10px',
                      padding: '6px 16px',
                      fontWeight: 800,
                      border: 'none',
                      background: '#f1f5f9',
                      color: '#475569',
                      fontSize: '12px',
                      textTransform: 'uppercase'
                    }}>
                      {r.category_name}
                    </Tag>
                  )
                },
                {
                  key: "inventory",
                  title: "VALUATION & ASSETS",
                  width: 250,
                  render: (_, r) => {
                    const isLow = r.qty > 0 && r.qty <= lowStockThreshold;
                    const isOut = r.qty <= 0;

                    let priceDisplay = <span style={{ fontSize: '20px', fontWeight: 900, color: COLORS.darkGreen }}>${Number(r.price || 0).toFixed(2)}</span>;
                    try {
                      const sizes = r.sizes ? (typeof r.sizes === 'string' ? JSON.parse(r.sizes) : r.sizes) : [];
                      if (Array.isArray(sizes) && sizes.length > 0) {
                        const prices = sizes.map(s => Number(s.price || 0));
                        priceDisplay = (
                          <div>
                            <div style={{ fontSize: '18px', fontWeight: 900, color: COLORS.darkGreen }}>
                              ${Math.min(...prices).toFixed(2)} - ${Math.max(...prices).toFixed(2)}
                            </div>
                            <div style={{ fontSize: '11px', color: COLORS.textSecondary, fontWeight: 700 }}>({sizes.length} SIZES CONFIGURED)</div>
                          </div>
                        );
                      }
                    } catch (e) { }

                    return (
                      <div>
                        <div style={{ marginBottom: '6px' }}>
                          {priceDisplay}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {(() => {
                            const cat = state.categoryList.find(c => String(c.id) === String(r.category_id));
                            const isService = cat?.industry_code === 'restaurant' || cat?.industry_code === 'coffee_cafe';
                            if (isService) {
                              return (
                                <>
                                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)' }} />
                                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#3b82f6', letterSpacing: '0.5px' }}>READY TO SERVE</span>
                                </>
                              );
                            }

                            return (
                              <>
                                <div style={{
                                  width: '8px',
                                  height: '8px',
                                  borderRadius: '50%',
                                  background: isOut ? '#ef4444' : (isLow ? '#f59e0b' : '#22c55e'),
                                  boxShadow: `0 0 10px ${isOut ? 'rgba(239, 68, 68, 0.5)' : (isLow ? 'rgba(245, 158, 11, 0.5)' : 'rgba(34, 197, 94, 0.5)')}`
                                }} />
                                <span style={{
                                  fontSize: '12px',
                                  fontWeight: 800,
                                  color: isOut ? '#ef4444' : (isLow ? '#f59e0b' : '#334155'),
                                  letterSpacing: '0.5px'
                                }}>
                                  {r.qty.toLocaleString()} {t.in_stock_label || "UNITS IN STOCK"}
                                </span>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  }
                },
                {
                  key: "action",
                  title: "CONTROL",
                  width: 200,
                  align: 'right',
                  render: (_, r, index) => (
                    <Space size="middle">
                      {hasRecipePerm && (
                        <Tooltip title={t.recipe_tooltip || "Recipe / Ingredients"}>
                          <Button
                            type="text"
                            icon={<MdRestaurantMenu style={{ fontSize: '24px', color: COLORS.midGreen }} />}
                            onClick={() => onClickRecipe(r)}
                            style={{ background: '#f0fdf4', borderRadius: '12px', width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #dcfce7' }}
                          />
                        </Tooltip>
                      )}
                      <Button
                        type="text"
                        icon={<MdEdit style={{ fontSize: '20px', color: '#2563eb' }} />}
                        onClick={() => onClickEdit(r, index)}
                        style={{ background: '#eff6ff', borderRadius: '12px', width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #dbeafe' }}
                      />
                      <Button
                        type="text"
                        danger
                        icon={<MdDelete style={{ fontSize: '20px' }} />}
                        onClick={() => onClickDelete(r, index)}
                        style={{ background: '#fef2f2', borderRadius: '12px', width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #fee2e2' }}
                      />
                    </Space>
                  ),
                },
              ]}
            />
          </Card>
        </div>

        <RecipeModal
          open={visibleRecipeModal}
          onCancel={() => {
            setVisibleRecipeModal(false);
            setSelectedProduct(null);
          }}
          product={selectedProduct}
        />
      </MainPage>
    );
  };

  const renderView = () => {
    if (!viewingProduct) return null;

    // Parse the advanced JSON metadata from description
    let descText = viewingProduct.description || "";
    let prepTime = 5;
    let shelfLife = 2;
    let storageCondition = "Refrigerated (2-5°C)";
    let allergens = ["Milk"];
    let tags = ["coffee", "latte", "hot", "bestseller"];
    let costPrice = 0.45;
    let taxRate = "10%";
    let productType = "Variant Product";

    try {
      if (viewingProduct.description && viewingProduct.description.startsWith("{")) {
        const parsed = JSON.parse(viewingProduct.description);
        descText = parsed.text || "";
        prepTime = parsed.prep_time !== undefined ? parsed.prep_time : 5;
        shelfLife = parsed.shelf_life !== undefined ? parsed.shelf_life : 2;
        storageCondition = parsed.storage_condition || "Refrigerated (2-5°C)";
        allergens = parsed.allergens || [];
        tags = parsed.tags || [];
        costPrice = parsed.cost_price !== undefined ? parsed.cost_price : 0.45;
        taxRate = parsed.tax_rate || "10%";
        productType = parsed.product_type || "Variant Product";
      }
    } catch (e) {}

    const profit = Number(viewingProduct.price || 0) - costPrice;
    const profitPercent = viewingProduct.price > 0 ? ((profit / Number(viewingProduct.price)) * 100).toFixed(0) : 0;

    return (
      <MainPage>
        <div style={{ padding: '0 12px 40px 12px' }}>
          {/* Breadcrumbs */}
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, marginBottom: '16px' }}>
            Products <span style={{ margin: '0 6px' }}>/</span> <span style={{ color: '#1e293b' }}>Product Details</span>
          </div>

          {/* Header Actions Block */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <Title level={2} style={{ margin: 0, fontWeight: 900, color: '#1e293b', letterSpacing: '-0.5px' }}>Product Details</Title>
              <Text type="secondary" style={{ fontSize: '14px', fontWeight: 500 }}>View and manage product information</Text>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Button onClick={onCloseModal} style={{ borderRadius: '12px', height: '42px', fontWeight: 700, border: '1.5px solid #e2e8f0' }}>
                Back to List
              </Button>
              <Button 
                onClick={() => handleCopy(viewingProduct.barcode, "Barcode")}
                style={{ borderRadius: '12px', height: '42px', fontWeight: 700, border: '1.5px solid #e2e8f0' }}
              >
                Duplicate
              </Button>
              <Button 
                type="primary" 
                onClick={() => onClickEdit(viewingProduct)}
                style={{ borderRadius: '12px', height: '42px', fontWeight: 800, background: COLORS.darkGreen, borderColor: COLORS.darkGreen }}
              >
                Edit Product
              </Button>
            </div>
          </div>

          {/* Top Panel: Product Identity Card (Screenshot 2 style) */}
          <Card style={{ borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 30px rgba(0,0,0,0.03)', marginBottom: '24px' }} bodyStyle={{ padding: '32px' }}>
            <Row gutter={32} align="middle">
              {/* Product Visual */}
              <Col span={7}>
                <div style={{ width: '100%', height: '260px', borderRadius: '20px', overflow: 'hidden', border: '1px solid #e2e8f0', position: 'relative' }}>
                  <Image
                    src={Config.getFullImagePath(viewingProduct.image)}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    fallback="https://placehold.co/400x400?text=Brew+Coffee"
                  />
                  <div style={{ position: 'absolute', bottom: 16, right: 16, background: 'rgba(255,255,255,0.9)', padding: '6px 14px', borderRadius: '12px', fontWeight: 800, fontSize: '12px', cursor: 'pointer', border: '1px solid #e2e8f0' }} onClick={() => onClickEdit(viewingProduct)}>
                    Change Image
                  </div>
                </div>
              </Col>

              {/* Central Information */}
              <Col span={9}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ background: '#f0fdf4', color: '#166534', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 800, border: '1px solid #bbf7d0' }}>
                      ✓ Bestseller
                    </span>
                    <span style={{ background: '#eff6ff', color: '#1e40af', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 800 }}>
                      ☕ Coffee
                    </span>
                  </div>

                  <div style={{ fontSize: '32px', fontWeight: 900, color: '#1e293b', letterSpacing: '-0.5px' }}>{viewingProduct.name}</div>

                  <Row gutter={[12, 12]} style={{ marginTop: '12px' }}>
                    {[
                      { label: 'SKU', val: `COF-LAT-001` },
                      { label: 'Barcode', val: viewingProduct.barcode },
                      { label: 'Category', val: selectedCategory?.name || 'Coffee' },
                      { label: 'Unit', val: 'Cup' },
                      { label: 'Created At', val: '24 May 2024 10:30 AM' },
                      { label: 'Created By', val: 'Chiva Pong' }
                    ].map((item, idx) => (
                      <Col span={12} key={idx}>
                        <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>{item.label}</div>
                        <div style={{ fontSize: '14px', color: '#334155', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                          {item.val}
                          {(item.label === 'SKU' || item.label === 'Barcode') && (
                            <span style={{ cursor: 'pointer', fontSize: '11px', color: COLORS.darkGreen }} onClick={() => handleCopy(item.val, item.label)}>📋</span>
                          )}
                        </div>
                      </Col>
                    ))}
                  </Row>
                </div>
              </Col>

              {/* Status and Pricing cards */}
              <Col span={8} style={{ borderLeft: '1.5px dashed #e2e8f0', paddingLeft: '32px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <Row gutter={12}>
                    <Col span={12}>
                      <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 800 }}>STATUS</div>
                        <div style={{ fontSize: '15px', color: '#16a34a', fontWeight: 900, display: 'flex', alignItems: 'center', gap: 6, marginTop: '4px' }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a' }} /> Active
                        </div>
                      </div>
                    </Col>
                    <Col span={12}>
                      <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 800 }}>OPERATIONAL STATUS</div>
                        <div style={{ fontSize: '15px', color: '#16a34a', fontWeight: 900, display: 'flex', alignItems: 'center', gap: 6, marginTop: '4px' }}>
                          Available
                        </div>
                      </div>
                    </Col>
                  </Row>

                  <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justify: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>Selling Price</span>
                      <span style={{ fontSize: '16px', color: '#1e293b', fontWeight: 900 }}>${Number(viewingProduct.price || 0).toFixed(2)} <span style={{ fontSize: '11px', color: '#94a3b8' }}>/ Cup</span></span>
                    </div>
                    <div style={{ display: 'flex', justify: 'space-between', marginBottom: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '8px' }}>
                      <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>Cost Price</span>
                      <span style={{ fontSize: '16px', color: '#1e293b', fontWeight: 900 }}>${costPrice.toFixed(2)} <span style={{ fontSize: '11px', color: '#94a3b8' }}>/ Cup</span></span>
                    </div>
                    <div style={{ display: 'flex', justify: 'space-between', borderTop: '1.5px solid #e2e8f0', paddingTop: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', color: '#1e293b', fontWeight: 800 }}>Net Profit</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '20px', color: '#16a34a', fontWeight: 900 }}>${profit.toFixed(2)}</span>
                        <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: 800 }}>{profitPercent}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </Card>

          {/* Lower Panel: Tabs & Inventory Grid */}
          <Row gutter={24}>
            {/* Left Card: Dynamic Spec details */}
            <Col span={15}>
              <Card style={{ borderRadius: '24px', border: '1px solid #e2e8f0', minHeight: '400px' }} bodyStyle={{ padding: '32px' }}>
                {/* Custom Sub Tabs */}
                <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid #e2e8f0', marginBottom: '24px', paddingBottom: '0' }}>
                  {[
                    { key: 'info', label: 'Information' },
                    { key: 'inventory', label: 'Inventory details' },
                    { key: 'pricing', label: 'Pricing blueprints' },
                    { key: 'suppliers', label: 'Suppliers' }
                  ].map(tab => {
                    const isActive = viewSubTab === tab.key;
                    return (
                      <div 
                        key={tab.key} 
                        onClick={() => setViewSubTab(tab.key)}
                        style={{ fontSize: '14px', fontWeight: isActive ? 800 : 600, color: isActive ? COLORS.darkGreen : '#64748b', paddingBottom: '12px', borderBottom: isActive ? `3px solid ${COLORS.darkGreen}` : '3px solid transparent', cursor: 'pointer' }}
                      >
                        {tab.label}
                      </div>
                    );
                  })}
                </div>

                {/* Sub Tab Contents */}
                {viewSubTab === 'info' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {[
                      { label: 'Description', val: descText || viewingProduct.description || 'Smooth and creamy latte made with 100% Arabica beans.' },
                      { label: 'Preparation', val: '1 shot of espresso + Steamed milk' },
                      { label: 'Ingredients', val: 'Espresso, Fresh Milk' },
                      { label: 'Allergens', val: allergens.join(', ') || 'Milk' },
                      { label: 'Shelf Life', val: `${shelfLife} Day` },
                      { label: 'Tax Profile', val: `VAT ${taxRate}` },
                      { label: 'Notes', val: 'Best served in the morning.' }
                    ].map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                        <div style={{ width: '150px', fontSize: '13px', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>{item.label}</div>
                        <div style={{ fontSize: '14px', color: '#334155', fontWeight: 700 }}>{item.val}</div>
                      </div>
                    ))}
                  </div>
                )}

                {viewSubTab === 'inventory' && (
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#334155', marginBottom: '16px' }}>Asset Tracking Details</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ color: '#64748b', fontWeight: 600 }}>Warehouse Code</span>
                        <span style={{ fontWeight: 800, color: '#1e293b' }}>WH-MAIN-01</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ color: '#64748b', fontWeight: 600 }}>Reorder Status</span>
                        <span style={{ fontWeight: 800, color: '#16a34a' }}>Sufficient Stock</span>
                      </div>
                    </div>
                  </div>
                )}

                {viewSubTab === 'pricing' && (
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#334155', marginBottom: '16px' }}>Active Variations & Mood Prices</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {(() => {
                        const moods = viewingProduct.moods ? (typeof viewingProduct.moods === 'string' ? JSON.parse(viewingProduct.moods) : viewingProduct.moods) : [];
                        if (moods.length === 0) return <div style={{ color: '#94a3b8' }}>No variations configured.</div>;
                        return moods.map((m, idx) => {
                          const label = typeof m === 'object' ? (m.label || m.value) : m;
                          const price = typeof m === 'object' ? m.price : 0;
                          return (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #f1f5f9' }}>
                              <span style={{ color: '#64748b', fontWeight: 700 }}>{label} Mode</span>
                              <span style={{ fontWeight: 900, color: COLORS.darkGreen }}>${Number(price).toFixed(2)}</span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}

                {viewSubTab === 'suppliers' && (
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#334155', marginBottom: '16px' }}>Associated Supplier Registry</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ color: '#64748b', fontWeight: 600 }}>Primary Supplier</span>
                      <span style={{ fontWeight: 800, color: '#1e293b' }}>Cafe Manager Wholesale</span>
                    </div>
                  </div>
                )}
              </Card>
            </Col>

            {/* Right Card: Inventory & Stock Location */}
            <Col span={9}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Inventory Overview */}
                <Card style={{ borderRadius: '24px', border: '1px solid #e2e8f0' }} bodyStyle={{ padding: '28px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <span style={{ fontWeight: 800, color: '#1e293b', fontSize: '15px' }}>Inventory Overview</span>
                    <span style={{ fontSize: '12px', color: COLORS.darkGreen, fontWeight: 800, cursor: 'pointer' }}>View Stock History</span>
                  </div>

                  <Row gutter={12} style={{ marginBottom: '24px' }}>
                    {[
                      { label: 'On Hand', val: viewingProduct.qty || 0, color: '#16a34a' },
                      { label: 'Reserved', val: 2, color: '#ea580c' },
                      { label: 'Available', val: Math.max(0, (viewingProduct.qty || 0) - 2), color: '#2563eb' },
                      { label: 'Reorder Level', val: 5, color: '#dc2626' }
                    ].map((item, idx) => (
                      <Col span={6} key={idx} style={{ textAlign: 'center' }}>
                        <div style={{ background: '#f8fafc', padding: '12px 8px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                          <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>{item.label}</div>
                          <div style={{ fontSize: '16px', fontWeight: 900, color: item.color, marginTop: '6px' }}>{item.val}</div>
                          <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600, marginTop: '2px' }}>Cup</div>
                        </div>
                      </Col>
                    ))}
                  </Row>

                  <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b', marginBottom: '14px' }}>Stock by Location</div>
                    {[
                      { branch: 'Main Branch', qty: Math.max(0, (viewingProduct.qty || 0) - 4), total: viewingProduct.qty, pct: 60 },
                      { branch: 'BKK Branch', qty: 3, total: viewingProduct.qty, pct: 30 },
                      { branch: 'Airport Branch', qty: 1, total: viewingProduct.qty, pct: 10 }
                    ].map((loc, idx) => (
                      <div key={idx} style={{ marginBottom: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                          <span>{loc.branch}</span>
                          <span style={{ fontWeight: 800, color: '#1e293b' }}>{loc.qty} Cup</span>
                        </div>
                        <div style={{ width: '100%', height: '6px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
                          <div style={{ width: `${loc.pct}%`, height: '100%', background: COLORS.darkGreen, borderRadius: '10px' }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                    <Button type="primary" style={{ flex: 1, height: '42px', borderRadius: '12px', background: COLORS.darkGreen, borderColor: COLORS.darkGreen, fontWeight: 800 }} onClick={() => onClickEdit(viewingProduct)}>
                      + Adjust Stock
                    </Button>
                    <Button style={{ flex: 1, height: '42px', borderRadius: '12px', fontWeight: 700, border: '1.5px solid #e2e8f0' }} onClick={() => onClickEdit(viewingProduct)}>
                      ⇄ Stock Transfer
                    </Button>
                  </div>
                </Card>
              </div>
            </Col>
          </Row>

          {/* Footer Metadata */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px', borderTop: '1.5px solid #e2e8f0', paddingTop: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '28px' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>LAST UPDATED</span>
                <div style={{ fontSize: '13px', color: '#475569', fontWeight: 800, marginTop: '2px' }}>24 May 2024 02:15 PM</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>UPDATED BY</span>
                <div style={{ fontSize: '13px', color: '#475569', fontWeight: 800, marginTop: '2px' }}>Chiva Pong</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>PRODUCT ID</span>
                <div style={{ fontSize: '13px', color: '#475569', fontWeight: 800, marginTop: '2px' }}>#PRD-000145</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '28px' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>TOTAL SOLD</span>
                <div style={{ fontSize: '13px', color: COLORS.darkGreen, fontWeight: 900, marginTop: '2px' }}>1,248 Cup</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>RATING</span>
                <div style={{ fontSize: '13px', color: '#eab308', fontWeight: 900, marginTop: '2px' }}>⭐⭐⭐⭐⭐ <span style={{ color: '#475569', fontWeight: 700 }}>4.8 (126)</span></div>
              </div>
            </div>
          </div>
        </div>
      </MainPage>
    );
  };

  const renderEdit = () => {
    return (
      <MainPage>
        <Form layout="vertical" onFinish={onFinish} form={form}>
          <Form.Item name="id" hidden><Input /></Form.Item>
          
          <div style={{ padding: '0 12px 40px 12px' }}>
            {/* Breadcrumbs */}
            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, marginBottom: '16px' }}>
              Products <span style={{ margin: '0 6px' }}>/</span> <span style={{ color: '#1e293b' }}>Edit Product</span>
            </div>

            {/* Header Actions Block (Screenshot 1 style) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <Title level={2} style={{ margin: 0, fontWeight: 900, color: '#1e293b', letterSpacing: '-0.5px' }}>
                  {form.getFieldValue("id") ? "Product Details" : "Register New Product"}
                </Title>
                <Text type="secondary" style={{ fontSize: '14px', fontWeight: 500 }}>Update product information and manage inventory</Text>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <Button onClick={onCloseModal} style={{ borderRadius: '12px', height: '42px', fontWeight: 700, border: '1.5px solid #e2e8f0' }}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    form.setFieldValue('status', '0');
                    form.submit();
                  }}
                  style={{ borderRadius: '12px', height: '42px', fontWeight: 700, border: '1.5px solid #e2e8f0' }}
                >
                  Save Draft
                </Button>
                <Button 
                  type="primary" 
                  onClick={() => {
                    form.setFieldValue('status', '1');
                    form.submit();
                  }}
                  loading={isSubmitting}
                  style={{ borderRadius: '12px', height: '42px', fontWeight: 800, background: COLORS.darkGreen, borderColor: COLORS.darkGreen }}
                >
                  Save Product
                </Button>
              </div>
            </div>

            {/* Form Segment Tabs */}
            <div style={{ 
              display: 'flex', 
              gap: '28px', 
              borderBottom: '1px solid #e2e8f0', 
              marginBottom: '32px', 
              paddingBottom: '0', 
              marginTop: '12px' 
            }}>
              {[
                { key: 'basic', label: 'Basic Information' },
                { key: 'variants', label: 'Variants & Customizations' },
                { key: 'inventory', label: 'Inventory & Pricing' },
                { key: 'media', label: 'Product Visuals' }
              ].map(tab => {
                const isActive = activeTab === tab.key;
                return (
                  <div 
                    key={tab.key} 
                    onClick={() => setActiveTab(tab.key)}
                    style={{ 
                      fontSize: '15px', 
                      fontWeight: isActive ? 800 : 600, 
                      color: isActive ? COLORS.darkGreen : '#64748b', 
                      paddingBottom: '14px', 
                      borderBottom: isActive ? `3px solid ${COLORS.darkGreen}` : '3px solid transparent', 
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      transform: isActive ? 'translateY(1.5px)' : 'none'
                    }}
                  >
                    {tab.label}
                  </div>
                );
              })}
            </div>

            {/* Tab 1: Basic Information (Screenshot 1 4-column layout) */}
            {activeTab === 'basic' && (
              <Row gutter={24}>
                {/* Column 1: Basic Details */}
                <Col span={7}>
                  <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '24px', borderRadius: '24px', minHeight: '520px' }}>
                    <div style={{ fontWeight: 800, marginBottom: '20px', color: '#1e293b', fontSize: '15px' }}>
                      📝 Basic Details
                    </div>
                    
                    <Form.Item
                      name="name"
                      label={<Text strong style={{ color: '#64748b', fontSize: '12px' }}>PRODUCT NAME *</Text>}
                      rules={[{ required: true, message: t.product_name }]}
                    >
                      <Input size="large" placeholder="Latte Coffee" style={{ fontWeight: 700, borderRadius: '12px' }} />
                    </Form.Item>

                    <Form.Item
                      name="category_id"
                      label={<Text strong style={{ color: '#64748b', fontSize: '12px' }}>CATEGORY *</Text>}
                      rules={[{ required: true, message: t.category_required }]}
                    >
                      <Select
                        size="large"
                        options={state.categoryList.map(c => ({ label: c.name, value: String(c.id) }))}
                        placeholder="Select Category"
                        style={{ borderRadius: '12px' }}
                        onChange={(value) => {
                          const cat = state.categoryList.find(c => String(c.id) === String(value));
                          setSelectedCategory(cat || null);
                        }}
                      />
                    </Form.Item>

                    <Form.Item
                      name="sub_category"
                      label={<Text strong style={{ color: '#64748b', fontSize: '12px' }}>SUB CATEGORY</Text>}
                    >
                      <Select
                        size="large"
                        options={[
                          { label: 'Hot Coffee', value: 'Hot Coffee' },
                          { label: 'Iced Coffee', value: 'Iced Coffee' },
                          { label: 'Blended Coffee', value: 'Blended Coffee' },
                          { label: 'Specialty Tea', value: 'Specialty Tea' }
                        ]}
                        placeholder="Select Sub Category"
                        style={{ borderRadius: '12px' }}
                      />
                    </Form.Item>

                    <Row gutter={12}>
                      <Col span={18}>
                        <Form.Item name="barcode" label={<Text strong style={{ color: '#64748b', fontSize: '12px' }}>BARCODE / SKU</Text>}>
                          <Input size="large" placeholder="73620303" style={{ borderRadius: '12px' }} />
                        </Form.Item>
                      </Col>
                      <Col span={6} style={{ display: 'flex', alignItems: 'flex-end', marginBottom: '24px' }}>
                        <Button size="large" onClick={onBtnNew} style={{ width: '100%', borderRadius: '12px', fontWeight: 800, background: '#f1f5f9', border: '1.5px dashed #cbd5e1' }}>
                          Gen
                        </Button>
                      </Col>
                    </Row>

                    <Form.Item name="brand" label={<Text strong style={{ color: '#64748b', fontSize: '12px' }}>BRAND</Text>}>
                      <Select
                        size="large"
                        options={[
                          { label: 'Cafe Manager', value: 'Cafe Manager' },
                          { label: 'Starbucks Roast', value: 'Starbucks Roast' },
                          { label: 'Local Premium', value: 'Local Premium' }
                        ]}
                        placeholder="Select Brand"
                        style={{ borderRadius: '12px' }}
                      />
                    </Form.Item>

                    <Form.Item name="description" label={<Text strong style={{ color: '#64748b', fontSize: '12px' }}>DESCRIPTION</Text>}>
                      <Input.TextArea size="large" rows={4} placeholder="Smooth and creamy latte..." style={{ borderRadius: '16px' }} />
                    </Form.Item>
                  </div>
                </Col>

                {/* Column 2: Product Type & Preparation */}
                <Col span={5}>
                  <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '24px', borderRadius: '24px', minHeight: '520px' }}>
                    <Form.Item name="product_type" label={<Text strong style={{ color: '#64748b', fontSize: '12px' }}>PRODUCT TYPE</Text>} style={{ marginBottom: '24px' }}>
                      <Radio.Group style={{ width: '100%' }}>
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <Radio value="Simple Product" style={{ display: 'flex', alignItems: 'flex-start', margin: '8px 0' }}>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '14px', color: '#1e293b' }}>Simple Product</div>
                              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>Single SKU product</div>
                            </div>
                          </Radio>
                          <Radio value="Variant Product" style={{ display: 'flex', alignItems: 'flex-start', margin: '8px 0' }}>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '14px', color: '#1e293b' }}>Variant Product</div>
                              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>Multiple variations (size, flavor)</div>
                            </div>
                          </Radio>
                        </Space>
                      </Radio.Group>
                    </Form.Item>

                    <div style={{ borderTop: '1px dashed #e2e8f0', margin: '20px 0' }} />

                    <div style={{ fontWeight: 800, marginBottom: '16px', color: '#1e293b', fontSize: '14px' }}>⚙️ Preparation Info</div>
                    
                    <Form.Item name="prep_time" label={<Text strong style={{ color: '#64748b', fontSize: '11px' }}>PREPARATION TIME</Text>}>
                      <InputNumber size="large" min={1} addonAfter="mins" style={{ width: '100%', borderRadius: '12px' }} />
                    </Form.Item>

                    <Form.Item name="shelf_life" label={<Text strong style={{ color: '#64748b', fontSize: '11px' }}>SHELF LIFE</Text>}>
                      <InputNumber size="large" min={1} addonAfter="days" style={{ width: '100%', borderRadius: '12px' }} />
                    </Form.Item>

                    <Form.Item name="storage_condition" label={<Text strong style={{ color: '#64748b', fontSize: '11px' }}>STORAGE CONDITION</Text>}>
                      <Select
                        size="large"
                        options={[
                          { label: 'Refrigerated (2-5°C)', value: 'Refrigerated (2-5°C)' },
                          { label: 'Frozen (-18°C)', value: 'Frozen (-18°C)' },
                          { label: 'Dry & Ambient', value: 'Dry & Ambient' }
                        ]}
                        style={{ borderRadius: '12px' }}
                      />
                    </Form.Item>

                    <div style={{ borderTop: '1px dashed #e2e8f0', margin: '20px 0' }} />

                    <Form.Item name="allergens" label={<Text strong style={{ color: '#64748b', fontSize: '11px' }}>ALLERGENS</Text>}>
                      <Checkbox.Group style={{ width: '100%' }}>
                        <Row gutter={[8, 8]}>
                          {['Milk', 'Nuts', 'Soy', 'Gluten', 'Other'].map(allergen => (
                            <Col span={12} key={allergen}>
                              <Checkbox value={allergen} style={{ fontWeight: 600, fontSize: '13px' }}>{allergen}</Checkbox>
                            </Col>
                          ))}
                        </Row>
                      </Checkbox.Group>
                    </Form.Item>

                    <div style={{ borderTop: '1px dashed #e2e8f0', margin: '20px 0' }} />

                    <Form.Item name="status" valuePropName="checked" getValueProps={(v) => ({ checked: String(v) === '1' })} getValueFromEvent={(c) => c ? '1' : '0'} label={<Text strong style={{ color: '#64748b', fontSize: '11px' }}>OPERATIONAL STATUS</Text>}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <span style={{ fontWeight: 700, fontSize: '13px', color: '#1e293b' }}>Active / Trading</span>
                        <Switch defaultChecked />
                      </div>
                    </Form.Item>
                  </div>
                </Col>

                {/* Column 3: Product Preview & Inventory Summary */}
                <Col span={6}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Product Preview Card */}
                    <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '24px', borderRadius: '24px' }}>
                      <div style={{ fontWeight: 800, marginBottom: '16px', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Product Preview</div>
                      
                      <div style={{ width: '100%', height: '160px', borderRadius: '20px', overflow: 'hidden', marginBottom: '16px', position: 'relative', border: '1px solid #f1f5f9' }}>
                        {imageDefault.length > 0 && imageDefault[0].url ? (
                          <img src={imageDefault[0].url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', background: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '32px' }}>☕</span>
                            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>No Image Uploaded</span>
                          </div>
                        )}
                        <div style={{ position: 'absolute', top: 12, right: 12, background: '#f0fdf4', color: '#166534', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 800, border: '1px solid #bbf7d0' }}>
                          Active
                        </div>
                      </div>

                      <div style={{ fontWeight: 800, fontSize: '18px', color: '#1e293b', lineHeight: 1.2 }}>{watchName || 'Latte Coffee'}</div>
                      <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>
                        {selectedCategory?.name || 'Coffee'} • {watchSubCategory || 'Hot Coffee'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginTop: '4px' }}>
                        SKU: {watchBarcode || '73620303'} | Brand: {watchBrand || 'Cafe Manager'}
                      </div>

                      <div style={{ fontWeight: 900, fontSize: '22px', color: COLORS.darkGreen, marginTop: '14px' }}>
                        ${(watchPrice || 0).toFixed(2)}
                      </div>
                      
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px', fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {watchDescription || 'Smooth and creamy latte made with espresso and steamed milk. Perfect balance of coffee flavor.'}
                      </div>
                    </div>

                    {/* Inventory Summary Card */}
                    <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '24px', borderRadius: '24px' }}>
                      <div style={{ fontWeight: 800, marginBottom: '16px', color: '#1e293b', fontSize: '14px' }}>📈 Inventory Summary</div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {[
                          { label: 'Current Stock', val: watchQty || 0, color: '#16a34a', bg: '#f0fdf4' },
                          { label: 'Reserved', val: 2, color: '#ea580c', bg: '#fff7ed' },
                          { label: 'Available', val: Math.max(0, (watchQty || 0) - 2), color: '#2563eb', bg: '#eff6ff' },
                          { label: 'Reorder Level', val: 5, color: '#dc2626', bg: '#fef2f2' }
                        ].map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: '12px', background: item.bg }}>
                            <span style={{ fontWeight: 700, fontSize: '13px', color: '#475569' }}>{item.label}</span>
                            <span style={{ fontWeight: 900, fontSize: '14px', color: item.color }}>{item.val} unit</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Col>

                {/* Column 4: Pricing & Stock + Variants */}
                <Col span={6}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Pricing & Stock Card */}
                    <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '24px', borderRadius: '24px' }}>
                      <div style={{ fontWeight: 800, marginBottom: '16px', color: '#1e293b', fontSize: '14px' }}>💰 Pricing & Stock</div>

                      <Form.Item name="price" label={<Text strong style={{ color: '#64748b', fontSize: '12px' }}>BASE UNIT PRICE *</Text>}>
                        <InputNumber
                          size="large"
                          min={0}
                          step={0.01}
                          prefix="$"
                          style={{ width: '100%', fontWeight: 900, borderRadius: '12px' }}
                        />
                      </Form.Item>

                      <Form.Item name="cost_price" label={<Text strong style={{ color: '#64748b', fontSize: '12px' }}>COST PRICE</Text>}>
                        <InputNumber
                          size="large"
                          min={0}
                          step={0.01}
                          prefix="$"
                          style={{ width: '100%', fontWeight: 900, borderRadius: '12px' }}
                        />
                      </Form.Item>

                      <Form.Item name="tax_rate" label={<Text strong style={{ color: '#64748b', fontSize: '12px' }}>TAX RATE</Text>}>
                        <Select
                          size="large"
                          options={[
                            { label: '10%', value: '10%' },
                            { label: '5%', value: '5%' },
                            { label: '0%', value: '0%' }
                          ]}
                          style={{ borderRadius: '12px' }}
                        />
                      </Form.Item>

                      <div style={{ marginTop: '16px', background: '#f8fafc', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>PROFIT MARGIN</div>
                        {(() => {
                          const base = watchPrice || 0;
                          const cost = watchCostPrice || 0;
                          let margin = 0;
                          if (base > 0) {
                            margin = ((base - cost) / base) * 100;
                          }
                          return (
                            <div style={{ fontSize: '18px', fontWeight: 900, color: margin >= 30 ? '#16a34a' : '#ea580c', marginTop: '4px' }}>
                              {margin.toFixed(2)}%
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Variants Summary Card */}
                    <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '24px', borderRadius: '24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <span style={{ fontWeight: 800, color: '#1e293b', fontSize: '14px' }}>
                          Variants ({(() => {
                            let list = watchMoods;
                            if (typeof list === 'string') {
                              try {
                                if (list.startsWith('[')) {
                                  list = JSON.parse(list);
                                } else {
                                  list = list.split(',').map(s => s.trim()).filter(Boolean);
                                }
                              } catch (e) {
                                list = [];
                              }
                            }
                            return Array.isArray(list) ? list.length : 0;
                          })()})
                        </span>
                        <Button size="small" type="link" onClick={() => setActiveTab('variants')} style={{ fontWeight: 800, padding: 0 }}>
                          + Configure
                        </Button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '180px', overflowY: 'auto' }}>
                        {(() => {
                          let moodsList = watchMoods;
                          if (typeof moodsList === 'string') {
                            try {
                              if (moodsList.startsWith('[')) {
                                moodsList = JSON.parse(moodsList);
                              } else {
                                moodsList = moodsList.split(',').map(s => s.trim()).filter(Boolean);
                              }
                            } catch (e) {
                              moodsList = [];
                            }
                          }
                          const finalMoods = Array.isArray(moodsList) ? moodsList : [];

                          if (finalMoods.length === 0) {
                            return (
                              <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: '12px', border: '1.5px dashed #cbd5e1' }}>
                                No variants configured
                              </div>
                            );
                          }
                          return finalMoods.map((m, idx) => {
                            const label = typeof m === 'object' ? (m.label || m.value) : m;
                            const price = typeof m === 'object' ? m.price : 0;
                            
                            const labelStr = String(label || "");
                            let icon = "🔘";
                            if (labelStr.toLowerCase().includes("hot")) icon = "🔥";
                            if (labelStr.toLowerCase().includes("ice")) icon = "❄️";
                            if (labelStr.toLowerCase().includes("frap")) icon = "🥤";

                            return (
                              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', border: '1px solid #f1f5f9', borderRadius: '12px', background: '#fafafa' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{ fontSize: '14px' }}>{icon}</span>
                                  <span style={{ fontWeight: 700, fontSize: '13px', color: '#334155' }}>{labelStr}</span>
                                </div>
                                <span style={{ fontWeight: 800, fontSize: '13px', color: COLORS.darkGreen }}>${Number(price).toFixed(2)}</span>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>
            )}

            {/* Tab 2: Variants Configuration */}
            {activeTab === 'variants' && (
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '32px', borderRadius: '24px', minHeight: '520px' }}>
                <div style={{ fontWeight: 800, marginBottom: '24px', color: COLORS.darkGreen, fontSize: '18px', borderBottom: '2px solid #f6fbf8', paddingBottom: '12px' }}>
                  🛡️ Variants & Customization Blueprint
                </div>
                <CategoryOptions selectedCategory={selectedCategory} t={t} form={form} />
              </div>
            )}

            {/* Tab 3: Inventory & Pricing Tab */}
            {activeTab === 'inventory' && (
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '32px', borderRadius: '24px', minHeight: '520px' }}>
                <div style={{ fontWeight: 800, marginBottom: '24px', color: COLORS.darkGreen, fontSize: '18px', borderBottom: '2px solid #f6fbf8', paddingBottom: '12px' }}>
                  📈 Inventory & Asset Control
                </div>
                <Row gutter={32}>
                  <Col span={12}>
                    <Form.Item name="qty" label={<Text strong style={{ color: COLORS.textSecondary }}>ON-HAND QUANTITY</Text>}>
                      <InputNumber size="large" style={{ width: '100%', fontWeight: 900, borderRadius: '12px' }} />
                    </Form.Item>
                    <Form.Item name="reorder_level" label={<Text strong style={{ color: COLORS.textSecondary }}>REORDER LEVEL</Text>}>
                      <InputNumber size="large" style={{ width: '100%', fontWeight: 900, borderRadius: '12px' }} defaultValue={5} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    {selectedCategory?.industry_code === 'pharmacy' && (
                      <>
                        <Form.Item name="generic_name" label={<Text strong style={{ color: COLORS.textSecondary }}>GENERIC NAME</Text>}>
                          <Input size="large" style={{ borderRadius: '12px' }} />
                        </Form.Item>
                        <Form.Item name="strength" label={<Text strong style={{ color: COLORS.textSecondary }}>STRENGTH</Text>}>
                          <Input size="large" style={{ borderRadius: '12px' }} />
                        </Form.Item>
                        <Form.Item name="expiry_date" label={<Text strong style={{ color: COLORS.textSecondary }}>EXPIRY DATE</Text>}>
                          <DatePicker size="large" style={{ width: '100%', borderRadius: '12px' }} format="DD/MM/YYYY" />
                        </Form.Item>
                      </>
                    )}
                  </Col>
                </Row>
              </div>
            )}

            {/* Tab 4: Media Upload Tab */}
            {activeTab === 'media' && (
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '32px', borderRadius: '24px', minHeight: '520px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontWeight: 800, marginBottom: '24px', color: COLORS.darkGreen, fontSize: '18px', textAlign: 'center' }}>
                  📸 Product Image & Branding Visuals
                </div>
                <Form.Item name="image_default" noStyle>
                  <Upload
                    customRequest={(options) => options.onSuccess()}
                    maxCount={1}
                    listType="picture-card"
                    fileList={imageDefault}
                    onPreview={handlePreview}
                    onChange={handleChangeImageDefault}
                    className="premium-upload-control"
                    style={{ transform: 'scale(1.2)' }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
                      <MdAdd size={36} color={COLORS.darkGreen} />
                      <div style={{ marginTop: '12px', fontSize: '14px', fontWeight: 800, color: COLORS.darkGreen }}>UPLOAD PHOTO</div>
                    </div>
                  </Upload>
                </Form.Item>
              </div>
            )}

          </div>
        </Form>
      </MainPage>
    );
  };

  // ─── Conditional View Router ──────────────────────────────────────────────

  if (viewState === 'view') return renderView();
  if (viewState === 'edit') return renderEdit();
  return renderList();
}

export default ProductPage;