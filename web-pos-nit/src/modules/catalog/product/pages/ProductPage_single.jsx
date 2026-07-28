import React, { useEffect, useState } from "react";
import * as Lucide from "lucide-react";
import { useNavigate } from "react-router-dom";
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
  AutoComplete,
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
  Alert,
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
    form.setFieldValue('moods', [...currentMoods]);
  };

  const handleMoodPriceChange = (value, price) => {
    let currentMoods = form.getFieldValue('moods');
    currentMoods = Array.isArray(currentMoods) ? currentMoods : [];
    currentMoods = currentMoods.map(m => typeof m === 'object' ? m : { value: m, label: m, price: 0 });

    const target = currentMoods.find(m => m.value === value);
    if (target) {
      target.price = price === null ? 0 : price;
    }
    form.setFieldValue('moods', [...currentMoods]);
  };

  const hasConfig = defaultMoods?.length > 0 || defaultSizes?.length > 0 || defaultAddons?.length > 0;
  if (!selectedCategory || !hasConfig) return null;

  return (
    <div style={{
      background: isPharmacy ? "#f0f7ff" : "#ffffff",
      padding: "12px 16px",
      borderRadius: "16px",
      marginBottom: "12px",
      border: `1px solid ${isPharmacy ? "#d6e4ff" : "#f0f0f0"}`,
      boxShadow: "0 2px 12px rgba(0,0,0,0.02)"
    }}>
      <div style={{
        fontWeight: 800,
        marginBottom: 12,
        color: isPharmacy ? "#0958d9" : COLORS.darkGreen,
        fontSize: 14,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        borderBottom: `2px solid ${isPharmacy ? "#e6f4ff" : "#f6fbf8"}`,
        paddingBottom: 8
      }}>
        <div style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          background: isPharmacy ? "#e6f4ff" : "#e6f0e9",
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isPharmacy ? "#096dd9" : COLORS.darkGreen,
          flexShrink: 0
        }}>
          {isPharmacy ? <Lucide.PlusCircle size={16} /> : <Lucide.Coffee size={16} />}
        </div>
        <div>
          <div style={{ fontSize: 13, lineHeight: 1.1 }}>{selectedCategory?.name || selectedCategory?.label}</div>
          <div style={{ fontSize: 9, fontWeight: 500, color: COLORS.textSecondary, marginTop: 2 }}>
            {isPharmacy ? "MEDICAL BLUEPRINT" : t.cooking_options_title}
          </div>
        </div>
      </div>

      {/* Moods Section */}
      {defaultMoods && defaultMoods.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 800, marginBottom: 8, color: COLORS.textPrimary, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {isPharmacy ? t.dosage_instructions_label : (isRestaurant ? t.taste_instructions_label : t.mood || "Temperature Options")}
          </div>
          <Form.Item name="moods" noStyle>
            <Row gutter={[8, 8]}>
              {defaultMoods.map((m, idx) => {
                const label = typeof m === 'object' ? (m.label || m.value) : m;
                const value = typeof m === 'object' ? (m.value || m.label) : m;

                const matchedMood = moods.find(x => typeof x === 'object' ? x.value === value : x === value);
                const isChecked = !!matchedMood;
                const priceValue = typeof matchedMood === 'object' ? matchedMood.price : 0;

                let IconComponent = Lucide.Check;
                let iconColor = COLORS.textSecondary;

                if (label.toLowerCase().includes("hot")) {
                  IconComponent = Lucide.Flame;
                  iconColor = "#ef4444";
                } else if (label.toLowerCase().includes("ice")) {
                  IconComponent = Lucide.Snowflake;
                  iconColor = "#3b82f6";
                } else if (label.toLowerCase().includes("frap")) {
                  IconComponent = Lucide.GlassWater;
                  iconColor = "#ec4899";
                } else if (label.toLowerCase().includes("sweet")) {
                  IconComponent = Lucide.Candy;
                  iconColor = "#eab308";
                } else if (label.toLowerCase().includes("spicy")) {
                  IconComponent = Lucide.Flame;
                  iconColor = "#f97316";
                }

                return (
                  <Col span={24} key={idx}>
                    <div style={{
                      padding: '6px 12px',
                      border: isChecked ? `1px solid ${COLORS.midGreen}` : '1px solid #e2e8f0',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: isChecked ? '#f0fdf4' : '#fafafa',
                      width: '100%',
                      transition: 'all 0.2s ease',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Checkbox
                          checked={isChecked}
                          onChange={(e) => handleMoodCheckboxChange(value, label, e.target.checked)}
                        />
                        <div style={{
                          width: 22, height: 22, borderRadius: 4,
                          background: isChecked ? `${iconColor}15` : '#f3f4f6',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                          <IconComponent size={12} color={isChecked ? iconColor : '#94a3b8'} />
                        </div>
                        <span style={{ fontWeight: 700, fontSize: 12, color: isChecked ? COLORS.darkGreen : COLORS.textPrimary }}>{label}</span>
                      </div>

                      {isChecked && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.textSecondary }}>{t.price || "Price ($)"}:</span>
                          <InputNumber
                            size="small"
                            placeholder="0.00"
                            value={priceValue}
                            onChange={(val) => handleMoodPriceChange(value, val)}
                            min={0}
                            step={0.1}
                            precision={2}
                            style={{ width: 90, fontWeight: 800 }}
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

      {/* Sizes Section */}
      {defaultSizes && defaultSizes.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ margin: '12px 0', borderTop: `1px dashed ${isPharmacy ? "#d6e4ff" : "#eee"}` }} />
          <Form.List name="sizes">
            {(fields, { add, remove }) => (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {isPharmacy ? t.packaging_units_label : (isRestaurant ? t.portions_sizes_label : t.sizes || "Pricing by Size")}
                  </div>
                  <Button
                    type="text"
                    size="middle"
                    onClick={() => add()}
                    icon={<Lucide.Plus size={14} />}
                    style={{ 
                      borderRadius: '8px', 
                      background: '#f0fdf4', 
                      border: '1px solid #bbf7d0', 
                      color: '#166534',
                      fontSize: '12px',
                      fontWeight: 700,
                      display: 'flex', 
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 12px',
                      height: '32px'
                    }}
                  >
                    {t.add_size || 'Add Size'}
                  </Button>
                </div>

                {fields.length === 0 && (
                  <div style={{ padding: '12px', textAlign: 'center', background: '#f9f9f9', borderRadius: 8, border: '1px dashed #ddd', marginBottom: 8 }}>
                    <Text type="secondary" style={{ fontSize: 11 }}>{t.price_per_size_msg || "No size-specific prices defined yet."}</Text>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {fields.map(({ key, name, ...restField }) => (
                    <div 
                      key={key} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px', 
                        background: '#f8fafc', 
                        padding: '8px 12px', 
                        borderRadius: '12px', 
                        border: '1px solid #e2e8f0',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ flex: 2 }}>
                        <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase' }}>
                          {t.size || 'Size'}
                        </div>
                        <Form.Item
                          {...restField}
                          name={[name, 'label']}
                          rules={[{ required: true, message: '' }]}
                          style={{ marginBottom: 0 }}
                        >
                          <AutoComplete
                            size="middle"
                            placeholder="Select or type..."
                            options={defaultSizes.map(s => {
                              const val = typeof s === 'object' ? (s.label || s.value) : s;
                              return { label: val, value: val };
                            })}
                            filterOption={(inputValue, option) =>
                              option.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                            }
                            style={{ width: '100%' }}
                          />
                        </Form.Item>
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase' }}>
                          {t.price || 'Price ($)'}
                        </div>
                        <Form.Item
                          {...restField}
                          name={[name, 'price']}
                          rules={[{ required: true, message: '' }]}
                          style={{ marginBottom: 0 }}
                        >
                          <InputNumber
                            size="middle"
                            placeholder="0.00"
                            style={{ width: '100%', fontWeight: 800, color: COLORS.darkGreen, borderRadius: '8px' }}
                            min={0}
                            step={0.1}
                            precision={2}
                          />
                        </Form.Item>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%', paddingTop: '16px' }}>
                        <Button
                          danger
                          type="text"
                          onClick={() => remove(name)}
                          icon={<Lucide.Trash2 size={16} />}
                          style={{ 
                            width: '36px', 
                            height: '36px', 
                            borderRadius: '8px', 
                            background: '#fef2f2', 
                            border: '1px solid #fee2e2',
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            padding: 0
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Form.List>
        </div>
      )}

      {/* Add-ons Section */}
      {defaultAddons && defaultAddons.length > 0 && (
        <div>
          <div style={{ margin: '12px 0', borderTop: `1px dashed ${isPharmacy ? "#d6e4ff" : "#eee"}` }} />
          <Form.List name="addons">
            {(fields, { add, remove }) => (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {isPharmacy ? "Notes/Warnings" : t.addons || "Extra Options"}
                  </div>
                  <Button
                    type="text"
                    size="middle"
                    onClick={() => add()}
                    icon={<Lucide.Plus size={14} />}
                    style={{ 
                      borderRadius: '8px', 
                      background: '#f0fdf4', 
                      border: '1px solid #bbf7d0', 
                      color: '#166534',
                      fontSize: '12px',
                      fontWeight: 700,
                      display: 'flex', 
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 12px',
                      height: '32px'
                    }}
                  >
                    {t.add_addon || 'Add Option'}
                  </Button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                  {fields.map(({ key, name, ...restField }) => (
                    <div 
                      key={key} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px', 
                        background: '#f8fafc', 
                        padding: '8px 12px', 
                        borderRadius: '12px', 
                        border: '1px solid #e2e8f0',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ flex: 2 }}>
                        <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase' }}>
                          {t.option || 'Option'}
                        </div>
                        <Form.Item
                          {...restField}
                          name={[name, 'label']}
                          rules={[{ required: true, message: '' }]}
                          style={{ marginBottom: 0 }}
                        >
                          <AutoComplete
                            size="middle"
                            placeholder="Select or type..."
                            options={defaultAddons.map(a => {
                              const val = typeof a === 'object' ? (a.label || a.value) : a;
                              return { label: val, value: val };
                            })}
                            filterOption={(inputValue, option) =>
                              option.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                            }
                            style={{ width: '100%' }}
                          />
                        </Form.Item>
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase' }}>
                          {t.price || 'Price ($)'}
                        </div>
                        {!isPharmacy ? (
                          <Form.Item
                            {...restField}
                            name={[name, 'price']}
                            rules={[{ required: true, message: '' }]}
                            style={{ marginBottom: 0 }}
                          >
                            <InputNumber
                              size="middle"
                              placeholder="0.00"
                              style={{ width: '100%', fontWeight: 800, color: COLORS.darkGreen, borderRadius: '8px' }}
                              min={0}
                              step={0.1}
                              precision={2}
                            />
                          </Form.Item>
                        ) : (
                          <div style={{ height: '32px', display: 'flex', alignItems: 'center', color: '#94a3b8', fontSize: '12px', fontWeight: 600 }}>
                            N/A
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%', paddingTop: '16px' }}>
                        <Button
                          danger
                          type="text"
                          onClick={() => remove(name)}
                          icon={<Lucide.Trash2 size={16} />}
                          style={{ 
                            width: '36px', 
                            height: '36px', 
                            borderRadius: '8px', 
                            background: '#fef2f2', 
                            border: '1px solid #fee2e2',
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            padding: 0
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
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
  const navigate = useNavigate();
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
  const [showGuide, setShowGuide] = useState(false);
  const [viewState, setViewState] = useState('list');
  const [viewingProduct, setViewingProduct] = useState(null);
  const [, forceUpdate] = useState({});
  const sizes = Form.useWatch('sizes', form);
  const hasSizes = sizes && sizes.length > 0;
  const watchProductType = Form.useWatch('product_type', form);

  const watchName = Form.useWatch('name', form);
  const watchSubCategory = Form.useWatch('sub_category', form);
  const watchBarcode = Form.useWatch('barcode', form);
  const watchBrand = Form.useWatch('brand', form);
  const watchPrice = Form.useWatch('price', form);
  const watchDescription = Form.useWatch('description', form);
  const watchQty = Form.useWatch('qty', form);
  const watchCostPrice = Form.useWatch('cost_price', form);
  const watchMoods = Form.useWatch('moods', form);
  const watchReorderLevel = Form.useWatch('reorder_level', form);

  const initializeCategoryDefaults = (cat) => {
    if (!cat) return;
    try {
      const defaultSizes = cat.default_sizes ? (typeof cat.default_sizes === 'string' ? JSON.parse(cat.default_sizes) : cat.default_sizes) : [];
      const defaultMoods = cat.default_moods ? (typeof cat.default_moods === 'string' ? JSON.parse(cat.default_moods) : cat.default_moods) : [];
      const defaultAddons = cat.default_addons ? (typeof cat.default_addons === 'string' ? JSON.parse(cat.default_addons) : cat.default_addons) : [];

      const formSizes = defaultSizes.map(s => ({
        label: s.label || s.value || "",
        price: s.price !== undefined ? Number(s.price) : 0
      }));

      const formMoods = defaultMoods.map(m => ({
        value: m.value || m.label || "",
        label: m.label || m.value || "",
        price: m.price !== undefined ? Number(m.price) : 0
      }));

      const formAddons = defaultAddons.map(a => ({
        label: a.label || a.value || "",
        price: a.price !== undefined ? Number(a.price) : 0
      }));

      form.setFieldsValue({
        sizes: formSizes,
        moods: formMoods,
        addons: formAddons
      });

      forceUpdate({});
    } catch (e) {
      console.error("Failed to initialize category defaults:", e);
    }
  };

  const userId = useProfileStore(s => s.profile?.id || s.profile?.user_id);
  useEffect(() => {
    if (userId) {
      getList();
      getFullCategories();
    }
  }, [userId]);
  useEffect(() => {
    if (watchProductType === 'Simple Product' && activeTab === 'variants') {
      setActiveTab('basic');
    }
  }, [watchProductType, activeTab]);
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
    console.log("Submitting product form items:", items);
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
      product_type: items.product_type || "Variant Product",
      sub_category: items.sub_category || "",
      preparation: items.preparation || "",
      ingredients: items.ingredients || "",
      notes: items.notes || ""
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
      if (res && !res.error && res.data) {
        message.success(t.product_saved || "Product Saved Successfully");
        const isUpdate = !!form.getFieldValue("id");
        if (isUpdate) {
          setState((prev) => ({
            ...prev,
            list: prev.list.map((p) => (p.id === form.getFieldValue("id") ? res.data : p)),
          }));
        } else {
          setState((prev) => ({
            ...prev,
            list: [res.data, ...prev.list],
            total: prev.total + 1
          }));
        }
        onCloseModal();
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
    if (!state.categoryList || state.categoryList.length === 0) {
      Modal.warning({
        title: "No Active Categories Found",
        content: (
          <div>
            <p>You must activate at least one category before you can register products.</p>
            <p>Please go to the Categories page to select and enable your business categories.</p>
          </div>
        ),
        okText: "Go to Categories",
        centered: true,
        onOk: () => {
          navigate("/category");
        }
      });
      return;
    }
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
        initializeCategoryDefaults(firstCat);
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
    console.log("Editing product item details:", item);
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
    let subCategory = "";
    let preparation = "";
    let ingredients = "";
    let notes = "";

    try {
      const descStr = (item.description || "").trim();
      if (descStr.startsWith("{")) {
        const descObj = JSON.parse(descStr);
        descriptionText = descObj.text || "";
        prepTime = descObj.prep_time !== undefined ? descObj.prep_time : 5;
        shelfLife = descObj.shelf_life !== undefined ? descObj.shelf_life : 2;
        storageCondition = descObj.storage_condition || "Refrigerated (2-5°C)";
        allergens = descObj.allergens || [];
        tags = descObj.tags || [];
        costPrice = descObj.cost_price !== undefined ? descObj.cost_price : 0.45;
        taxRate = descObj.tax_rate || "10%";
        productType = descObj.product_type || "Variant Product";
        subCategory = descObj.sub_category || "";
        preparation = descObj.preparation || "";
        ingredients = descObj.ingredients || "";
        notes = descObj.notes || "";
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
      sub_category: subCategory,
      preparation: preparation,
      ingredients: ingredients,
      notes: notes,
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
          setState((prev) => ({
            ...prev,
            list: prev.list.filter((p) => p.id !== item.id),
            total: prev.total - 1
          }));
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
      } catch (e) { }
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
              <Title level={2} style={{ margin: 0, color: COLORS.darkGreen, display: 'flex', alignItems: 'center', gap: '16px', fontWeight: 800, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <MdRestaurantMenu style={{ fontSize: '32px' }} /> {(typeof t?.products === 'string' ? t.products : "Inventory Master")}
                </div>
                <Button
                  type="text"
                  icon={<Lucide.HelpCircle size={15} style={{ color: COLORS.darkGreen, marginRight: 4 }} />}
                  onClick={() => setShowGuide(!showGuide)}
                  style={{
                    background: showGuide ? "rgba(30, 74, 45, 0.15)" : "rgba(30, 74, 45, 0.08)",
                    color: COLORS.darkGreen,
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: 12,
                    display: "inline-flex",
                    alignItems: "center",
                    height: 32,
                    marginLeft: 12
                  }}
                >
                  {showGuide ? "លាក់ការណែនាំ" : "របៀបប្រើប្រាស់"}
                </Button>
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
                className="tour-product-add-btn"
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

          {showGuide && (
            <Alert
              message={<strong>💡 របៀបគ្រប់គ្រងទំនិញ/ផលិតផល (Product Quick Guide)</strong>}
              description={
                <div style={{ fontSize: 13, marginTop: 4, color: '#333' }}>
                  <p style={{ margin: '3px 0' }}>1. <strong>បង្កើតថ្មី៖</strong> ចុចលើប៊ូតុង <strong>New Asset</strong> ឬ <strong>បង្កើតថ្មី</strong> ដើម្បីបន្ថែមទំនិញថ្មី លោកអ្នកអាចកំណត់តម្លៃ ឯកតា ទម្ងន់ ឬរូបភាពផលិតផលបាន។</p>
                  <p style={{ margin: '3px 0' }}>2. <strong>ការកំណត់លម្អិត (Variants/Options)៖</strong> ក្នុងពេលបង្កើតផលិតផល បងអាចជ្រើសរើស <em>ម៉ាស៊ីនឆុង ជម្រើសសីតុណ្ហភាព (ក្តៅ/ត្រជាក់)</em> ឬ <em>ទំហំកែវ</em> តាមតម្រូវការអាជីវកម្ម។</p>
                  <p style={{ margin: '3px 0' }}>3. <strong>ពិនិត្យស្តុក៖</strong> ទិន្នន័យស្តុកនឹងធ្វើបច្ចុប្បន្នភាពស្វ័យប្រវត្តិតាមការលក់ជាក់ស្តែងនៅទំព័រលក់ (POS)។</p>
                </div>
              }
              type="info"
              closable
              onClose={() => {
                setShowGuide(false);
              }}
              style={{ borderRadius: 16, marginBottom: 24, border: '1px solid #bae7ff', background: '#e6f7ff' }}
            />
          )}

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
                        const min = Math.min(...prices);
                        const max = Math.max(...prices);
                        priceDisplay = (
                          <div>
                            <div style={{ fontSize: '18px', fontWeight: 900, color: COLORS.darkGreen }}>
                              {min === max ? `$${min.toFixed(2)}` : `$${min.toFixed(2)} - $${max.toFixed(2)}`}
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
    let prepTime = null;
    let shelfLife = null;
    let storageCondition = "";
    let allergens = [];
    let tags = [];
    let costPrice = viewingProduct.cost_price !== undefined ? Number(viewingProduct.cost_price) : 0;
    let taxRate = viewingProduct.tax_rate || "";
    let productType = viewingProduct.product_type || "Simple Product";
    let preparation = "";
    let ingredients = "";
    let notes = "";

    try {
      if (viewingProduct.description && viewingProduct.description.startsWith("{")) {
        const parsed = JSON.parse(viewingProduct.description);
        descText = parsed.text || "";
        prepTime = parsed.prep_time !== undefined ? parsed.prep_time : null;
        shelfLife = parsed.shelf_life !== undefined ? parsed.shelf_life : null;
        storageCondition = parsed.storage_condition || "";
        allergens = parsed.allergens || [];
        tags = parsed.tags || [];
        if (parsed.cost_price !== undefined) {
          costPrice = Number(parsed.cost_price);
        }
        if (parsed.tax_rate !== undefined) {
          taxRate = parsed.tax_rate;
        }
        if (parsed.product_type !== undefined) {
          productType = parsed.product_type;
        }
        preparation = parsed.preparation || "";
        ingredients = parsed.ingredients || "";
        notes = parsed.notes || "";
      }
    } catch (e) { }

    // Calculate actual selling price (handling variant products)
    let sellingPrice = Number(viewingProduct.price || 0);
    try {
      const sizesList = viewingProduct.sizes ? (typeof viewingProduct.sizes === 'string' ? JSON.parse(viewingProduct.sizes) : viewingProduct.sizes) : [];
      if (viewingProduct.product_type === 'Variant Product' || productType === 'Variant Product') {
        if (Array.isArray(sizesList) && sizesList.length > 0) {
          const prices = sizesList.map(s => Number(s.price || 0));
          sellingPrice = Math.min(...prices);
        }
      }
    } catch (e) { }

    const profit = sellingPrice - costPrice;
    const profitPercent = sellingPrice > 0 ? ((profit / sellingPrice) * 100).toFixed(0) : 0;

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
                <div style={{
                  width: '100%',
                  height: '260px',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  border: '1px solid #e2e8f0',
                  position: 'relative',
                  background: '#f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {/* Blurred background layer */}
                  {viewingProduct.image && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundImage: `url(${Config.getFullImagePath(viewingProduct.image)})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      filter: 'blur(20px) saturate(150%)',
                      opacity: 0.15,
                      zIndex: 1
                    }} />
                  )}

                  {/* Centered Image Container */}
                  <div style={{ width: '100%', height: '100%', position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Image
                      src={Config.getFullImagePath(viewingProduct.image)}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      wrapperStyle={{ width: '100%', height: '100%' }}
                      fallback="https://placehold.co/400x400?text=Brew+Coffee"
                    />
                  </div>

                  <div style={{
                    position: 'absolute',
                    bottom: 16,
                    right: 16,
                    background: 'rgba(255,255,255,0.95)',
                    padding: '6px 14px',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '12px',
                    cursor: 'pointer',
                    border: '1px solid #e2e8f0',
                    zIndex: 3,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                  }} onClick={() => onClickEdit(viewingProduct)}>
                    Change Image
                  </div>
                </div>
              </Col>

              {/* Central Information */}
              <Col span={9}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ fontSize: '32px', fontWeight: 900, color: '#1e293b', letterSpacing: '-0.5px' }}>{viewingProduct.name}</div>

                  <Row gutter={[12, 12]} style={{ marginTop: '12px' }}>
                    {[
                      { label: lang === 'kh' ? 'កូដទំនិញ / Barcode' : 'Barcode / SKU', val: viewingProduct.barcode || '-' },
                      { label: lang === 'kh' ? 'ប្រភេទក្រុម' : 'Category', val: selectedCategory?.name || '-' },
                      { label: lang === 'kh' ? 'ឯកតា' : 'Unit', val: viewingProduct.unit || (lang === 'kh' ? 'កែវ' : 'Cup') }
                    ].map((item, idx) => (
                      <Col span={12} key={idx}>
                        <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>{item.label}</div>
                        <div style={{ fontSize: '14px', color: '#334155', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                          {item.val}
                          {item.label.includes('Barcode') && item.val !== '-' && (
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
                    <Col span={24}>
                      <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 800 }}>{lang === 'kh' ? 'ស្ថានភាព' : 'STATUS'}</div>
                        <div style={{ fontSize: '15px', color: String(viewingProduct.status) === '1' ? '#16a34a' : '#ef4444', fontWeight: 900, display: 'flex', alignItems: 'center', gap: 6, marginTop: '4px' }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: String(viewingProduct.status) === '1' ? '#16a34a' : '#ef4444' }} />
                          {String(viewingProduct.status) === '1' ? (lang === 'kh' ? 'កំពុងដំណើរការ' : 'Active') : (lang === 'kh' ? 'ផ្អាកដំណើរការ' : 'Inactive')}
                        </div>
                      </div>
                    </Col>
                  </Row>
                  <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justify: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>Selling Price</span>
                      <span style={{ fontSize: '16px', color: '#1e293b', fontWeight: 900 }}>
                        {(() => {
                          try {
                            const sizesList = viewingProduct.sizes ? (typeof viewingProduct.sizes === 'string' ? JSON.parse(viewingProduct.sizes) : viewingProduct.sizes) : [];
                            if (viewingProduct.product_type === 'Variant Product' || productType === 'Variant Product') {
                              if (Array.isArray(sizesList) && sizesList.length > 0) {
                                const prices = sizesList.map(s => Number(s.price || 0));
                                const min = Math.min(...prices);
                                const max = Math.max(...prices);
                                if (min === max) {
                                  return `$${min.toFixed(2)}`;
                                }
                                return `$${min.toFixed(2)} - $${max.toFixed(2)}`;
                              }
                            }
                          } catch (e) { }
                          return `$${Number(viewingProduct.price || 0).toFixed(2)}`;
                        })()}
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}> / Cup</span>
                      </span>
                    </div>
                    <div style={{ display: 'flex', justify: 'space-between', marginBottom: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '8px' }}>
                      <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>Cost Price</span>
                      <span style={{ fontSize: '16px', color: '#1e293b', fontWeight: 900 }}>${costPrice.toFixed(2)} <span style={{ fontSize: '11px', color: '#94a3b8' }}>/ Cup</span></span>
                    </div>
                    <div style={{ display: 'flex', justify: 'space-between', borderTop: '1.5px solid #e2e8f0', paddingTop: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', color: '#1e293b', fontWeight: 800 }}>Net Profit</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '20px', color: profit >= 0 ? '#16a34a' : '#ef4444', fontWeight: 900 }}>
                          {profit >= 0 ? `$${profit.toFixed(2)}` : `-$${Math.abs(profit).toFixed(2)}`}
                        </span>
                        <span style={{
                          background: profit >= 0 ? '#dcfce7' : '#fef2f2',
                          color: profit >= 0 ? '#166534' : '#991b1b',
                          padding: '2px 8px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: 800
                        }}>
                          {profitPercent}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </Card>


        </div>
      </MainPage>
    );
  };

  const renderEdit = () => {
    const planId = Number(profile?.plan_id || 1);

    const tabsList = [
      { key: 'basic', label: t.basic_info || 'Basic Information' },
      { key: 'inventory', label: t.inventory_pricing || 'Inventory & Pricing' }
    ];

    return (
      <MainPage>
        <Form layout="vertical" onFinish={onFinish} form={form} onValuesChange={() => forceUpdate({})}>
          <Form.Item name="id" hidden><Input /></Form.Item>

          <div style={{ padding: '0 8px 24px 8px' }}>
            {/* Breadcrumbs */}
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '12px' }}>
              Products <span style={{ margin: '0 4px' }}>/</span> <span style={{ color: '#1e293b' }}>Edit Product</span>
            </div>

            {/* Warning if no categories are active */}
            {(!state.categoryList || state.categoryList.length === 0) && (
              <div style={{ marginBottom: '16px' }}>
                <Alert
                  message={<span style={{ fontWeight: 800 }}>No Active Categories Found</span>}
                  description={
                    <span>
                      You must activate at least one category before you can register products.{" "}
                      <a onClick={() => navigate("/category")} style={{ fontWeight: 800, color: COLORS.darkGreen, textDecoration: 'underline', cursor: 'pointer' }}>
                        Go to Categories page to select and enable them.
                      </a>
                    </span>
                  }
                  type="warning"
                  showIcon
                  style={{ borderRadius: '12px' }}
                />
              </div>
            )}

            {/* Header Actions Block */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <Title level={3} style={{ margin: 0, fontWeight: 900, color: '#1e293b', letterSpacing: '-0.5px' }}>
                  {form.getFieldValue("id") ? "Product Details" : "Register New Product"}
                </Title>
                <Text type="secondary" style={{ fontSize: '12px', fontWeight: 500 }}>Update product information and manage inventory</Text>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button onClick={onCloseModal} style={{ borderRadius: '10px', height: '36px', fontWeight: 700, padding: '0 16px' }}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    form.setFieldValue('status', '0');
                    form.submit();
                  }}
                  style={{ borderRadius: '10px', height: '36px', fontWeight: 700, padding: '0 16px' }}
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
                  style={{ borderRadius: '10px', height: '36px', fontWeight: 800, background: COLORS.darkGreen, borderColor: COLORS.darkGreen, padding: '0 16px' }}
                >
                  Save Product
                </Button>
              </div>
            </div>

            <Row gutter={16}>
              {/* Left Column: Form Fields and Tabs */}
              <Col span={16}>
                {/* Form Segment Tabs */}
                <div style={{
                  display: 'flex',
                  gap: '24px',
                  borderBottom: '1px solid #e2e8f0',
                  marginBottom: '20px',
                  paddingBottom: '0',
                  marginTop: '4px'
                }}>
                  {tabsList.map(tab => {
                    const isActive = activeTab === tab.key;
                    return (
                      <div
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        style={{
                          fontSize: '14px',
                          fontWeight: isActive ? 800 : 600,
                          color: isActive ? COLORS.darkGreen : '#64748b',
                          paddingBottom: '10px',
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

                {/* Tab 1: Basic Information */}
                <div style={{ display: activeTab === 'basic' ? 'block' : 'none' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Product Identity Card */}
                    <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '24px' }}>
                      <div style={{ fontWeight: 800, marginBottom: '16px', color: '#1e293b', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Lucide.FileText size={16} color={COLORS.darkGreen} /> Product Identity
                      </div>

                      <Row gutter={16}>
                        {/* Image Upload Area */}
                        <Col span={4} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <Form.Item name="image_default" noStyle>
                            <Upload
                              customRequest={(options) => options.onSuccess()}
                              maxCount={1}
                              listType="picture-card"
                              fileList={imageDefault}
                              onPreview={handlePreview}
                              onChange={handleChangeImageDefault}
                              className="premium-upload-control-small"
                              style={{ width: 84, height: 84, margin: 0 }}
                            >
                              {imageDefault.length === 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                  <MdAdd size={20} color={COLORS.darkGreen} />
                                  <div style={{ marginTop: '2px', fontSize: '9px', fontWeight: 800, color: COLORS.darkGreen }}>PHOTO</div>
                                </div>
                              )}
                            </Upload>
                          </Form.Item>
                        </Col>

                        {/* Name & Category */}
                        <Col span={10}>
                          <Form.Item
                            name="name"
                            label={<Text strong style={{ color: '#64748b', fontSize: '11px' }}>{(t.product_name || 'PRODUCT NAME').toUpperCase()} *</Text>}
                            rules={[{ required: true, message: t.product_name }]}
                            style={{ marginBottom: 12 }}
                          >
                            <Input size="middle" placeholder="Latte Coffee" style={{ fontWeight: 700, borderRadius: '10px' }} />
                          </Form.Item>

                          <Form.Item
                            name="category_id"
                            label={<Text strong style={{ color: '#64748b', fontSize: '11px' }}>{(t.category || 'CATEGORY').toUpperCase()} *</Text>}
                            rules={[{ required: true, message: t.category_required }]}
                            style={{ marginBottom: 0 }}
                          >
                            <Select
                              size="middle"
                              options={state.categoryList.map(c => ({ label: c.name, value: String(c.id) }))}
                              placeholder="Select Category"
                              style={{ borderRadius: '10px' }}
                              onChange={(value) => {
                                const cat = state.categoryList.find(c => String(c.id) === String(value));
                                setSelectedCategory(cat || null);
                                initializeCategoryDefaults(cat);
                              }}
                            />
                          </Form.Item>
                        </Col>

                        {/* Sub Category & Brand */}
                        <Col span={10}>
                          <Form.Item
                            name="sub_category"
                            label={<Text strong style={{ color: '#64748b', fontSize: '11px' }}>{(t.sub_category || 'SUB CATEGORY').toUpperCase()}</Text>}
                            style={{ marginBottom: 12 }}
                          >
                            <Select
                              size="middle"
                              options={[
                                { label: 'Hot Coffee', value: 'Hot Coffee' },
                                { label: 'Iced Coffee', value: 'Iced Coffee' },
                                { label: 'Blended Coffee', value: 'Blended Coffee' },
                                { label: 'Specialty Tea', value: 'Specialty Tea' }
                              ]}
                              placeholder="Select"
                              style={{ borderRadius: '10px' }}
                            />
                          </Form.Item>

                          <Form.Item name="brand" label={<Text strong style={{ color: '#64748b', fontSize: '11px' }}>{(t.brand_label || 'BRAND').toUpperCase()}</Text>} style={{ marginBottom: 0 }}>
                            <Select
                              size="middle"
                              options={[
                                { label: 'Cafe Manager', value: 'Cafe Manager' },
                                { label: 'Starbucks Roast', value: 'Starbucks Roast' },
                                { label: 'Local Premium', value: 'Local Premium' }
                              ]}
                              placeholder="Select"
                              style={{ borderRadius: '10px' }}
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      <div style={{ borderTop: '1px dashed #e2e8f0', margin: '14px 0' }} />

                      <Row gutter={16}>
                        {/* Barcode & SKU */}
                        <Col span={10}>
                          <Row gutter={8}>
                            <Col span={17}>
                              <Form.Item name="barcode" label={<Text strong style={{ color: '#64748b', fontSize: '11px' }}>{(t.barcode || 'BARCODE / SKU').toUpperCase()}</Text>} style={{ marginBottom: 0 }}>
                                <Input size="middle" placeholder="SKU Code" style={{ borderRadius: '10px' }} />
                              </Form.Item>
                            </Col>
                            <Col span={7} style={{ display: 'flex', alignItems: 'flex-end' }}>
                              <Button size="middle" onClick={onBtnNew} style={{ width: '100%', borderRadius: '10px', fontWeight: 800, background: '#f1f5f9', border: '1px solid #cbd5e1' }}>
                                Gen
                              </Button>
                            </Col>
                          </Row>
                        </Col>

                        {/* Status Toggle */}
                        <Col span={6}>
                          <Form.Item name="status" valuePropName="checked" getValueProps={(v) => ({ checked: String(v) === '1' })} getValueFromEvent={(c) => c ? '1' : '0'} label={<Text strong style={{ color: '#64748b', fontSize: '11px' }}>{(t.status || 'STATUS').toUpperCase()}</Text>} style={{ marginBottom: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '6px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', height: '32px' }}>
                              <span style={{ fontWeight: 700, fontSize: '12px' }}>{(t.active || 'Active')}</span>
                              <Switch size="small" defaultChecked />
                            </div>
                          </Form.Item>
                        </Col>

                        {/* Description */}
                        <Col span={8}>
                          <Form.Item name="description" label={<Text strong style={{ color: '#64748b', fontSize: '11px' }}>{(t.description_label || 'DESCRIPTION').toUpperCase()}</Text>} style={{ marginBottom: 0 }}>
                            <Input size="middle" placeholder="Short description..." style={{ borderRadius: '10px' }} />
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>

                    {/* Pricing, Classification & Taxation Card */}
                    <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '24px' }}>
                      <Row gutter={16} align="middle">
                        <Col span={8}>
                          <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>
                            {(t.product_classification || 'PRODUCT CLASSIFICATION').toUpperCase()}
                          </div>
                          <Form.Item name="product_type" noStyle>
                            <Radio.Group buttonStyle="solid" style={{ width: '100%' }}>
                              <Radio.Button value="Simple Product" style={{ width: '50%', textAlign: 'center', fontSize: '12px', fontWeight: 700, borderTopLeftRadius: '10px', borderBottomLeftRadius: '10px' }}>
                                {t.simple_product || 'Simple'}
                              </Radio.Button>
                              <Radio.Button value="Variant Product" style={{ width: '50%', textAlign: 'center', fontSize: '12px', fontWeight: 700, borderTopRightRadius: '10px', borderBottomRightRadius: '10px' }}>
                                {t.variant_product || 'Variant'}
                              </Radio.Button>
                            </Radio.Group>
                          </Form.Item>
                        </Col>

                        <Col span={16}>
                          {watchProductType !== 'Variant Product' ? (
                            <Row gutter={12}>
                              <Col span={8}>
                                <Form.Item name="price" label={<Text strong style={{ color: '#64748b', fontSize: '11px' }}>{(t.base_price_label || 'BASE UNIT PRICE').toUpperCase()} *</Text>} style={{ marginBottom: 0 }} rules={[{ required: watchProductType !== 'Variant Product', message: '' }]}>
                                  <InputNumber
                                    size="middle"
                                    min={0}
                                    step={0.01}
                                    prefix="$"
                                    style={{ width: '100%', fontWeight: 900, borderRadius: '10px' }}
                                  />
                                </Form.Item>
                              </Col>
                              <Col span={8}>
                                <Form.Item name="cost_price" label={<Text strong style={{ color: '#64748b', fontSize: '11px' }}>{(t.cost_price || 'COST PRICE').toUpperCase()}</Text>} style={{ marginBottom: 0 }}>
                                  <InputNumber
                                    size="middle"
                                    min={0}
                                    step={0.01}
                                    prefix="$"
                                    style={{ width: '100%', fontWeight: 900, borderRadius: '10px' }}
                                  />
                                </Form.Item>
                              </Col>
                              <Col span={8}>
                                <Form.Item name="tax_rate" label={<Text strong style={{ color: '#64748b', fontSize: '11px' }}>{(t.tax || 'TAX RATE').toUpperCase()}</Text>} style={{ marginBottom: 0 }}>
                                  <Select
                                    size="middle"
                                    options={[
                                      { label: '10%', value: '10%' },
                                      { label: '5%', value: '5%' },
                                      { label: '0%', value: '0%' }
                                    ]}
                                    style={{ borderRadius: '10px' }}
                                  />
                                </Form.Item>
                              </Col>
                            </Row>
                          ) : (
                            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '8px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', height: '38px' }}>
                              <Lucide.Sparkles size={14} color="#16a34a" />
                              <span style={{ color: '#166534', fontSize: '11px', fontWeight: 700 }}>
                                {t.configure_variants_below || 'Configure variant options and sizes below.'}
                              </span>
                            </div>
                          )}
                        </Col>
                      </Row>

                      {/* Inline Variant Options Checklist */}
                      {watchProductType === 'Variant Product' && (
                        <div style={{ marginTop: '20px', borderTop: '1px dashed #e2e8f0', paddingTop: '20px' }}>
                          {selectedCategory ? (
                            (() => {
                              const defaultMoods = selectedCategory.default_moods ? (typeof selectedCategory.default_moods === 'string' ? JSON.parse(selectedCategory.default_moods) : selectedCategory.default_moods) : [];
                              const defaultSizes = selectedCategory.default_sizes ? (typeof selectedCategory.default_sizes === 'string' ? JSON.parse(selectedCategory.default_sizes) : selectedCategory.default_sizes) : [];
                              const defaultAddons = selectedCategory.default_addons ? (typeof selectedCategory.default_addons === 'string' ? JSON.parse(selectedCategory.default_addons) : selectedCategory.default_addons) : [];
                              const hasConfig = defaultMoods?.length > 0 || defaultSizes?.length > 0 || defaultAddons?.length > 0;

                              if (!hasConfig) {
                                return (
                                  <div style={{ padding: '24px 16px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1.5px dashed #cbd5e1' }}>
                                    <Lucide.AlertCircle size={24} color="#94a3b8" style={{ marginBottom: 8 }} />
                                    <div style={{ fontWeight: 800, color: '#475569', fontSize: '13px' }}>No customization options required</div>
                                    <div style={{ color: '#64748b', fontSize: '11px', marginTop: 4 }}>
                                      The selected category "{selectedCategory.name}" has no sizes, moods, or add-ons configured by the platform.
                                    </div>
                                  </div>
                                );
                              }
                              return <CategoryOptions selectedCategory={selectedCategory} t={t} form={form} />;
                            })()
                          ) : (
                            <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8' }}>Please select a Category first</div>
                          )}
                        </div>
                      )}
                    </div>


                  </div>
                </div>

                {/* Tab 3: Inventory & Pricing Tab */}
                <div style={{ display: activeTab === 'inventory' ? 'block' : 'none' }}>
                  <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '24px', borderRadius: '24px', minHeight: '380px' }}>
                    <div style={{ fontWeight: 800, marginBottom: '20px', color: COLORS.darkGreen, fontSize: '16px', borderBottom: '2px solid #f6fbf8', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Lucide.Package size={18} /> {t.inventory_asset_control || 'Inventory & Asset Control'}
                    </div>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item name="qty" label={<Text strong style={{ color: COLORS.textSecondary, fontSize: '11px' }}>{(t.on_hand_qty || 'ON-HAND QUANTITY').toUpperCase()}</Text>} style={{ marginBottom: 12 }}>
                          <InputNumber size="middle" style={{ width: '100%', fontWeight: 900, borderRadius: '10px' }} />
                        </Form.Item>
                        <Form.Item name="reorder_level" label={<Text strong style={{ color: COLORS.textSecondary, fontSize: '11px' }}>{(t.reorder_level || 'REORDER LEVEL').toUpperCase()}</Text>} style={{ marginBottom: 0 }}>
                          <InputNumber size="middle" style={{ width: '100%', fontWeight: 900, borderRadius: '10px' }} defaultValue={5} />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        {selectedCategory?.industry_code === 'pharmacy' && (
                          <>
                            <Form.Item name="generic_name" label={<Text strong style={{ color: COLORS.textSecondary, fontSize: '11px' }}>{(t.generic_name || 'GENERIC NAME').toUpperCase()}</Text>} style={{ marginBottom: 12 }}>
                              <Input size="middle" style={{ borderRadius: '10px' }} />
                            </Form.Item>
                            <Form.Item name="strength" label={<Text strong style={{ color: COLORS.textSecondary, fontSize: '11px' }}>{(t.strength || 'STRENGTH').toUpperCase()}</Text>} style={{ marginBottom: 12 }}>
                              <Input size="middle" style={{ borderRadius: '10px' }} />
                            </Form.Item>
                            <Form.Item name="expiry_date" label={<Text strong style={{ color: COLORS.textSecondary, fontSize: '11px' }}>{(t.expiry_date || 'EXPIRY DATE').toUpperCase()}</Text>} style={{ marginBottom: 0 }}>
                              <DatePicker size="middle" style={{ width: '100%', borderRadius: '10px' }} format="DD/MM/YYYY" />
                            </Form.Item>
                          </>
                        )}
                      </Col>
                    </Row>
                  </div>
                </div>
              </Col>

              {/* Right Column: Sticky Live Preview */}
              <Col span={8}>
                <div style={{ position: 'sticky', top: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Product Preview Card */}
                  <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '16px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                    <div style={{ fontWeight: 800, marginBottom: '12px', color: '#64748b', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t.product_preview || 'Product Preview'}</div>

                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <div style={{ width: '72px', height: '72px', borderRadius: '14px', overflow: 'hidden', border: '1px solid #f1f5f9', position: 'relative', flexShrink: 0, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {imageDefault.length > 0 && imageDefault[0].url ? (
                          <img src={imageDefault[0].url} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Lucide.Image size={24} color="#94a3b8" strokeWidth={1.5} />
                          </div>
                        )}
                        <div style={{ position: 'absolute', top: 4, right: 4, background: '#f0fdf4', color: '#166534', padding: '1px 6px', borderRadius: '10px', fontSize: '9px', fontWeight: 900, border: '1px solid #bbf7d0' }}>
                          {t.active_status || 'Active'}
                        </div>
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: '15px', color: '#1e293b', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{watchName || t.product_name || 'Product Name'}</div>
                        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>
                          {selectedCategory?.name || t.category || 'Category'} {watchSubCategory ? `• ${watchSubCategory}` : ''}
                        </div>
                        <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600, marginTop: '1px' }}>
                          {watchBarcode ? `SKU: ${watchBarcode}` : t.no_sku || 'No SKU'}
                        </div>
                        <div style={{ fontWeight: 900, fontSize: '16px', color: COLORS.darkGreen, marginTop: '3px' }}>
                          {(() => {
                            if (watchProductType === 'Variant Product' && Array.isArray(sizes) && sizes.length > 0) {
                              const prices = sizes.map(s => Number(s.price || 0));
                              const min = Math.min(...prices);
                              const max = Math.max(...prices);
                              if (min === max) {
                                return `$${min.toFixed(2)}`;
                              }
                              return `$${min.toFixed(2)} - $${max.toFixed(2)}`;
                            }
                            return `$${(watchPrice || 0).toFixed(2)}`;
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Inventory Summary Card */}
                  <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '16px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                    <div style={{ fontWeight: 800, marginBottom: '12px', color: '#1e293b', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Lucide.Package size={14} color={COLORS.darkGreen} /> {t.inventory_summary || 'Inventory Summary'}
                    </div>

                    <Row gutter={[8, 8]}>
                      {[
                        { label: t.current_stock || 'Current Stock', val: watchQty || 0, color: '#16a34a', bg: '#f0fdf4' },
                        { label: t.reorder_level || 'Reorder Level', val: watchReorderLevel || 5, color: '#dc2626', bg: '#fef2f2' }
                      ].map((item, idx) => (
                        <Col span={12} key={idx}>
                          <div style={{ padding: '6px 10px', borderRadius: '10px', background: item.bg, border: '1px solid rgba(0,0,0,0.01)', height: '44px' }}>
                            <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', lineHeight: 1 }}>{item.label}</div>
                            <div style={{ fontWeight: 900, fontSize: '12px', color: item.color, marginTop: '4px' }}>{item.val} {lang === 'kh' ? 'កែវ' : 'unit'}</div>
                          </div>
                        </Col>
                      ))}
                    </Row>
                  </div>

                  {/* Variants Summary Card */}
                  {watchProductType === 'Variant Product' && (
                    <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '16px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontWeight: 800, color: '#1e293b', fontSize: '13px' }}>
                          {t.variants_title || 'Variants'} ({(() => {
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
                        <Button size="small" type="link" onClick={() => setActiveTab('basic')} style={{ fontWeight: 800, padding: 0, fontSize: '11px' }}>
                          {t.configure || 'Configure'}
                        </Button>
                      </div>

                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', maxHeight: '100px', overflowY: 'auto' }}>
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
                              <div style={{ padding: '8px', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: '10px', width: '100%', fontSize: '11px' }}>
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
                              <Tag key={idx} style={{
                                margin: 0,
                                borderRadius: '6px',
                                padding: '2px 6px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                fontWeight: 700,
                                fontSize: '10px',
                                color: '#334155'
                              }}>
                                <span>{icon} {labelStr}</span>
                                <span style={{ color: COLORS.darkGreen, marginLeft: '2px' }}>${Number(price).toFixed(2)}</span>
                              </Tag>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </Col>
            </Row>

          </div>
        </Form>
      </MainPage>
    );
  };

  // ─── Conditional View Router ──────────────────────────────────────────────

  if (viewState === 'view') return renderEdit();
  if (viewState === 'edit') return renderEdit();
  return renderList();
}

export default ProductPage;