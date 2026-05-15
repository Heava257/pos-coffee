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
} from "antd";
import { SearchOutlined, PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { request, compressImage } from "../../util/helper";
import { MdAdd, MdDelete, MdEdit, MdRestaurantMenu } from "react-icons/md";
import MainPage from "../../component/layout/MainPage";
import { configStore } from "../../store/configStore";
import { Config } from "../../util/config";
import { useProfileStore } from "../../store/profileStore";
import "./Product.css"
import RecipeModal from "./RecipeModal";
import { useLanguage, translations } from "../../store/language.store";

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
const CategoryOptions = ({ selectedCategory, t }) => {
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

      {/* Moods Section - Enhanced UI */}
      {defaultMoods && defaultMoods.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontWeight: 800, marginBottom: 12, color: COLORS.textPrimary, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {isPharmacy ? t.dosage_instructions_label : (isRestaurant ? t.taste_instructions_label : t.mood || "Temperature Options")}
          </div>
          <Form.Item name="moods" noStyle>
            <Checkbox.Group style={{ width: '100%' }}>
              <Row gutter={[12, 12]}>
                {defaultMoods.map((m, idx) => {
                  const label = typeof m === 'object' ? (m.label || m.value) : m;
                  const value = typeof m === 'object' ? (m.value || m.label) : m;
                  
                  // Simple icon logic based on common labels
                  let icon = "🔘";
                  if (label.toLowerCase().includes("hot")) icon = "🔥";
                  if (label.toLowerCase().includes("ice")) icon = "❄️";
                  if (label.toLowerCase().includes("frap")) icon = "🥤";
                  if (label.toLowerCase().includes("sweet")) icon = "🍯";
                  if (label.toLowerCase().includes("spicy")) icon = "🌶️";

                  return (
                    <Col span={12} key={idx}>
                      <Checkbox value={value} className="custom-mood-checkbox">
                        <div style={{
                          padding: '10px 12px',
                          border: '1px solid #eee',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          background: '#fafafa',
                          width: '100%',
                          minWidth: 120
                        }}>
                          <span style={{ fontSize: 18 }}>{icon}</span>
                          <span style={{ fontWeight: 600, fontSize: 14 }}>{label}</span>
                        </div>
                      </Checkbox>
                    </Col>
                  );
                })}
              </Row>
            </Checkbox.Group>
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
  const sizes = Form.useWatch('sizes', form);
  const hasSizes = sizes && sizes.length > 0;

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
        loading: false,
        totals,
      }));
    }
  };

  const onCloseModal = () => {
    setState((p) => ({
      ...p,
      visibleModal: false,
    }));
    setImageDefault([]);
    form.resetFields();
    form.setFieldsValue({ moods: [], sizes: [], addons: [] });
  };

  const onFinish = async (items) => {
    var params = new FormData();
    params.append("name", items.name);
    params.append("category_id", items.category_id);
    params.append("barcode", items.barcode || "");
    params.append("brand", items.brand || "");
    params.append("description", items.description || "");
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
    const res = await request("product", method, params);
    setIsSubmitting(false);
    if (res && !res.error) {
      message.success(t.product_saved || "Product Saved Successfully");
      onCloseModal();
      getList();
    } else {
      res.error?.barcode && message.error(res.error?.barcode);
    }
  };

  const onBtnNew = async () => {
    try {
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
    } catch (err) {
      console.error("Barcode generation failed:", err);
    } finally {
      setState((p) => ({
        ...p,
        visibleModal: true,
      }));
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
        if (m && typeof m === 'object') return String(m.value || m.label || "");
        return String(m || "");
      })
      : [];

    form.setFieldsValue({
      ...item,
      category_id: item.category_id ? String(item.category_id) : undefined,
      sizes: Array.isArray(sizes) ? sizes : [],
      addons: Array.isArray(addons) ? addons : [],
      moods: finalMoods.filter(Boolean),
      status: String(item.status || "1"),
    });

    if (item.expiry_date) {
      form.setFieldValue("expiry_date", dayjs(item.expiry_date));
    }

    const cat = (state.categoryList || []).find(c => String(c.id) === String(item.category_id));
    setSelectedCategory(cat || null);

    setState((pre) => ({ ...pre, visibleModal: true }));
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

  return (
    <MainPage loading={state.loading}>
      <div style={{ padding: '0 4px' }}>
        {/* Executive Glass Header */}
        <div style={{
          marginBottom: '32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(10px)',
          padding: '24px 32px',
          borderRadius: '24px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
          border: '1px solid rgba(255,255,255,0.4)',
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
              onChange={(id) => setFilter((pre) => ({ ...pre, category_id: id }))}
              className="executive-select"
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={onBtnNew}
              style={{
                background: COLORS.darkGreen,
                borderColor: COLORS.darkGreen,
                height: '45px',
                borderRadius: '12px',
                fontWeight: 700,
                padding: '0 24px',
                boxShadow: '0 4px 12px rgba(30, 74, 45, 0.2)'
              }}
            >
              {t.add_new}
            </Button>
          </div>
        </div>

        {/* Executive Insights Dashboard */}
        <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
          <Col xs={24} sm={12} md={6}>
            <Card className="executive-card-stat" bodyStyle={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <Text type="secondary" strong style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Items</Text>
                  <div style={{ fontSize: '28px', fontWeight: 900, color: COLORS.darkGreen, marginTop: '4px' }}>{totalProducts}</div>
                </div>
                <div style={{ background: '#e6f0e9', padding: '10px', borderRadius: '12px', color: COLORS.darkGreen }}>📦</div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="executive-card-stat" bodyStyle={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <Text type="secondary" strong style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Low Stock</Text>
                  <div style={{ fontSize: '28px', fontWeight: 900, color: '#f59e0b', marginTop: '4px' }}>{lowStockItems}</div>
                </div>
                <div style={{ background: '#fffbeb', padding: '10px', borderRadius: '12px', color: '#f59e0b' }}>⚠️</div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="executive-card-stat" bodyStyle={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <Text type="secondary" strong style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Out of Stock</Text>
                  <div style={{ fontSize: '28px', fontWeight: 900, color: '#ef4444', marginTop: '4px' }}>{outOfStockItems}</div>
                </div>
                <div style={{ background: '#fef2f2', padding: '10px', borderRadius: '12px', color: '#ef4444' }}>🚨</div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="executive-card-stat" bodyStyle={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <Text type="secondary" strong style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Asset Value</Text>
                  <div style={{ fontSize: '28px', fontWeight: 900, color: COLORS.midGreen, marginTop: '4px' }}>${totalStockValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
                <div style={{ background: '#e6f0e9', padding: '10px', borderRadius: '12px', color: COLORS.midGreen }}>💰</div>
              </div>
            </Card>
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
                title: <Text strong style={{ color: COLORS.darkGreen, fontSize: '12px', letterSpacing: '0.5px' }}>PRODUCT IDENTITY</Text>,
                width: 400,
                render: (_, r) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ position: 'relative' }}>
                      <Image
                        src={Config.getFullImagePath(r.image)}
                        width={75}
                        height={75}
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
                      <div style={{ fontWeight: 900, color: COLORS.darkGreen, fontSize: '17px', lineHeight: 1.2, marginBottom: '6px' }}>{r.name}</div>
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
                title: <Text strong style={{ color: COLORS.darkGreen, fontSize: '12px', letterSpacing: '0.5px' }}>CLASSIFICATION</Text>,
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
                title: <Text strong style={{ color: COLORS.darkGreen, fontSize: '12px', letterSpacing: '0.5px' }}>VALUATION & ASSETS</Text>,
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
                      {priceDisplay}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
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
                title: <Text strong style={{ color: COLORS.darkGreen, fontSize: '12px', letterSpacing: '0.5px' }}>CONTROL</Text>,
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

      {/* Modernized Add/Edit Modal */}
      <Modal
        open={state.visibleModal}
        title={
          <div style={{ fontSize: '22px', color: COLORS.darkGreen, fontWeight: 900, letterSpacing: '-0.5px', marginBottom: '8px' }}>
            {form.getFieldValue("id") ? (t.edit_product || "Refine Product Profile") : (t.add_new_product || "Register New Asset")}
          </div>
        }
        footer={null}
        onCancel={onCloseModal}
        width={1300}
        centered
        destroyOnClose
        styles={{
          mask: { backdropFilter: 'blur(8px)', background: 'rgba(30, 74, 45, 0.1)' },
          content: { borderRadius: '32px', padding: '40px' }
        }}
      >
        <Form layout="vertical" onFinish={onFinish} form={form}>
          <Form.Item name="id" hidden><Input /></Form.Item>
          <Row gutter={32}>
            {/* Column 1: Identity & Pricing */}
            <Col span={7}>
              <div style={{ background: '#f8f9fa', padding: '32px', borderRadius: '24px', height: '100%', border: '1px solid #f1f5f9' }}>
                <div style={{ fontWeight: 800, marginBottom: '28px', color: COLORS.darkGreen, display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ background: '#e6f0e9', padding: '10px', borderRadius: '12px' }}>📦</div>
                  <span style={{ fontSize: '16px', letterSpacing: '0.5px' }}>IDENTITY & CORE</span>
                </div>

                <Form.Item
                  name="category_id"
                  label={<Text strong style={{ color: COLORS.textSecondary }}>CLASSIFICATION</Text>}
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
                      form.setFieldsValue({ moods: [], sizes: [], addons: [] });
                      if (cat) {
                        const parseMoods = (val) => { try { return val ? (typeof val === 'string' ? JSON.parse(val) : val) : []; } catch { return []; } };
                        const defaultMoods = parseMoods(cat.default_moods);
                        if (defaultMoods.length > 0) {
                          form.setFieldValue('moods', defaultMoods.map(m => typeof m === 'object' ? (m.value || m.label) : m));
                        }
                      }
                    }}
                  />
                </Form.Item>

                <Form.Item
                  name="name"
                  label={<Text strong style={{ color: COLORS.textSecondary }}>PRODUCT NAME</Text>}
                  rules={[{ required: true, message: t.product_name }]}
                >
                  <Input size="large" placeholder="Enter name" style={{ fontWeight: 800, borderRadius: '12px' }} />
                </Form.Item>

                <Form.Item name="barcode" label={<Text strong style={{ color: COLORS.textSecondary }}>BARCODE / SERIAL</Text>}>
                  <Input size="large" placeholder="Barcode" style={{ borderRadius: '12px' }} />
                </Form.Item>

                <Form.Item
                  label={<Text strong style={{ color: COLORS.textSecondary }}>BASE UNIT PRICE ($)</Text>}
                  name="price"
                  rules={[{ required: !hasSizes, message: t.price_required }]}
                >
                  <InputNumber
                    size="large"
                    min={0}
                    step={0.01}
                    style={{ width: '100%', fontWeight: 900, borderRadius: '12px' }}
                    placeholder={hasSizes ? "SIZES OVERRIDE PRICE" : "0.00"}
                    disabled={hasSizes}
                  />
                  {hasSizes && <div style={{ fontSize: '11px', color: '#f59e0b', marginTop: '8px', fontWeight: 700 }}>⚠️ UNIT PRICES ARE CONTROLLED BY SIZE CONFIGURATION</div>}
                </Form.Item>

                <Form.Item label={<Text strong style={{ color: COLORS.textSecondary }}>OPERATIONAL STATUS</Text>} name="status">
                  <Select
                    size="large"
                    options={[{ label: 'ACTIVE / TRADING', value: 1 }, { label: 'INACTIVE / HIDDEN', value: 0 }]}
                    style={{ borderRadius: '12px' }}
                  />
                </Form.Item>
              </div>
            </Col>

            {/* Column 2: Advanced Configuration (Blueprint) */}
            <Col span={selectedCategory ? 9 : 0}>
              <div style={{ background: '#fff', border: '1px solid #f1f5f9', padding: '32px', borderRadius: '24px', height: '100%' }}>
                <CategoryOptions selectedCategory={selectedCategory} t={t} />
              </div>
            </Col>

            {/* Column 3: Medical Specs / Inventory & Media */}
            <Col span={selectedCategory?.industry_code === 'pharmacy' ? 8 : (selectedCategory ? 8 : 17)}>
              <div style={{ background: '#f8f9fa', padding: '32px', borderRadius: '24px', height: '100%', border: '1px solid #f1f5f9' }}>
                <div style={{ fontWeight: 800, marginBottom: '28px', color: COLORS.darkGreen, display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ background: '#e6f0e9', padding: '10px', borderRadius: '12px' }}>📈</div>
                  <span style={{ fontSize: '16px', letterSpacing: '0.5px' }}>INVENTORY & ASSETS</span>
                </div>

                {selectedCategory?.industry_code === 'pharmacy' && (
                  <div style={{ marginBottom: '24px' }}>
                    <Form.Item name="generic_name" label={<Text strong style={{ color: COLORS.textSecondary }}>GENERIC NAME</Text>}>
                      <Input size="large" style={{ borderRadius: '12px' }} />
                    </Form.Item>
                    <Form.Item name="strength" label={<Text strong style={{ color: COLORS.textSecondary }}>STRENGTH (e.g. 500mg)</Text>}>
                      <Input size="large" style={{ borderRadius: '12px' }} />
                    </Form.Item>
                    <Form.Item name="expiry_date" label={<Text strong style={{ color: COLORS.textSecondary }}>EXPIRY DATE</Text>}>
                      <DatePicker size="large" style={{ width: '100%', borderRadius: '12px' }} format="DD/MM/YYYY" />
                    </Form.Item>
                  </div>
                )}

                <Form.Item name="qty" label={<Text strong style={{ color: COLORS.textSecondary }}>ON-HAND QUANTITY</Text>}>
                  <InputNumber size="large" placeholder="0" style={{ width: "100%", fontWeight: 900, borderRadius: '12px' }} />
                </Form.Item>

                <Form.Item name="description" label={<Text strong style={{ color: COLORS.textSecondary }}>REMARKS / DESCRIPTION</Text>}>
                  <Input.TextArea size="large" rows={4} style={{ borderRadius: '16px' }} />
                </Form.Item>

                <Form.Item name="image_default" label={<Text strong style={{ color: COLORS.textSecondary }}>PRODUCT VISUAL</Text>}>
                  <Upload
                    customRequest={(options) => options.onSuccess()}
                    maxCount={1}
                    listType="picture-card"
                    fileList={imageDefault}
                    onPreview={handlePreview}
                    onChange={handleChangeImageDefault}
                    className="premium-upload-control"
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <MdAdd size={28} color={COLORS.darkGreen} />
                      <div style={{ marginTop: '8px', fontSize: '12px', fontWeight: 800, color: COLORS.darkGreen }}>UPLOAD</div>
                    </div>
                  </Upload>
                </Form.Item>
              </div>
            </Col>
          </Row>

          <div style={{ textAlign: "right", marginTop: '40px', borderTop: '1px solid #f1f5f9', paddingTop: '32px' }}>
            <Space size="large">
              <Button size="large" onClick={onCloseModal} style={{ borderRadius: '14px', padding: '0 32px', height: '52px', fontWeight: 700, border: '1.5px solid #e2e8f0' }}>
                {t.cancel}
              </Button>
              <Button
                type="primary"
                size="large"
                htmlType="submit"
                loading={isSubmitting}
                style={{
                  background: COLORS.darkGreen,
                  borderColor: COLORS.darkGreen,
                  borderRadius: '14px',
                  padding: '0 52px',
                  fontWeight: 900,
                  height: '52px',
                  fontSize: '16px',
                  boxShadow: '0 8px 24px rgba(30, 74, 45, 0.25)'
                }}
              >
                {form.getFieldValue("id") ? (t.update_item || "AUTHORIZE UPDATE") : (t.save_item || "COMPLETE REGISTRATION")}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

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
}

export default ProductPage;