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
} from "antd";
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

const { Text } = Typography;

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
  const { config } = configStore();
  const [form] = Form.useForm();
  const [state, setState] = useState({
    list: [],
    visibleModal: false,
    categoryList: [], // Local categories with full data
  });
  const [filter, setFilter] = useState({
    txt_search: "",
    category_id: "",
    brand: "",
  });
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [imageDefault, setImageDefault] = useState([]);
  const [imageOptional, setImageOptional] = useState([]);
  const [visibleRecipeModal, setVisibleRecipeModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Track the full category object (with its default configs) for the selected category
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
      page: 1, // Force first page
      is_list_all: 1, // Ensure fetching all
    };

    setState((pre) => ({ ...pre, loading: true }));
    const res = await request(`product`, "get", param);
    if (res && !res.error) {
      const totals = res.list.reduce((acc, item) => {
        if (!acc[item.category_name]) {
          acc[item.category_name] = 0;
        }
        acc[item.category_name] += item.qty;
        return acc;
      }, {});

      setState((pre) => ({
        ...pre,
        list: res.list,
        total: refPage.current == 1 ? res.total : pre.total,
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
    // Reset coffee specific fields explicitly if needed
    form.setFieldsValue({ moods: ['hot', 'iced'], sizes: [], addons: [] });
  };
  const onFinish = async (items) => {
    var params = new FormData();
    params.append("name", items.name);
    params.append("category_id", items.category_id);
    params.append("barcode", items.barcode);
    params.append("brand", items.brand);
    params.append("description", items.description);
    params.append("qty", items.qty);
    params.append("price", items.price);
    params.append("discount", items.discount);
    params.append("status", items.status);
    params.append("image", form.getFieldValue("image"));
    params.append("id", form.getFieldValue("id"));
    // 🛡️ Extra Safety: Ensure these are always handled as arrays before stringifying
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
          // 🚀 Compress image before upload to solve 10s delay
          const compressedFile = await compressImage(file);
          params.append("upload_image", compressedFile, file.name || "image.jpg");
        }
      }
    }
    var method = "post";
    if (form.getFieldValue("id")) {
      method = "put";
    }
    setIsSubmitting(true);
    const res = await request("product", method, params);
    setIsSubmitting(false);
    if (res && !res.error) {
      message.success(t.product_saved);
      onCloseModal();
      getList();
    } else {
      res.error?.barcode && message.error(res.error?.barcode);
    }
  };
  const onBtnNew = async () => {
    try {
      // 🚀 Optimized: Single request to get a checked/unique barcode
      const res = await request("new_barcode", "post");
      if (res && res.barcode) {
        form.setFieldValue("barcode", res.barcode);
      }
      // Set default status to Active (1)
      form.setFieldValue("status", "1");

      // Select first category by default if available
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
  const handleChangeImageOptional = ({ fileList: newFileList }) =>
    setImageOptional(newFileList);
  const onFilter = () => {
    getList();
  };

  const SAMPLE_SIZES = [
    { label: "Small (S)", value: "S" },
    { label: "Medium (M)", value: "M" },
    { label: "Large (L)", value: "L" },
  ];

  const SAMPLE_ADDONS = [
    { label: "Milk Foam", value: "Milk Foam" },
    { label: "Whipped Cream", value: "Whipped Cream" },
    { label: "Chocolate Syrup", value: "Chocolate Syrup" },
    { label: "Extra Shot", value: "Extra Shot" },
  ];


  const onClickEdit = (item, index) => {
    // Safe parse helper
    const safeParse = (val) => {
      if (!val) return [];
      if (Array.isArray(val)) return val;
      try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        // If not valid JSON, split by comma or return as is in array
        return typeof val === 'string' ? val.split(',').map(s => s.trim()).filter(Boolean) : [val];
      }
    };

    const sizes = safeParse(item.sizes);
    const addons = safeParse(item.addons);
    const moods = safeParse(item.moods);

    // Map moods to labels if they are objects, to match Checkbox.Group values
    // Use a clean array of strings
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

    // Handle expiry_date for the form (convert string to dayjs)
    if (item.expiry_date) {
      form.setFieldValue("expiry_date", dayjs(item.expiry_date));
    }

    // Set the selected category object from our COMPLETE list to get default_moods, etc.
    const cat = (state.categoryList || []).find(c => String(c.id) === String(item.category_id));
    setSelectedCategory(cat || null);

    setState((pre) => ({ ...pre, visibleModal: true, selectedParentId: item.category_id }));
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
      title: t.remove_data,
      content: t.confirm_remove_product,
      okText: t.delete,
      okType: "danger",
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

  return (
    <MainPage loading={state.loading}>
      <div className="pageHeader">

        <Space>
          <div>{(typeof t?.products === 'string' ? t.products : "Products")} {state.list.length}</div>
          <Input.Search
            onChange={(event) =>
              setFilter((p) => ({ ...p, txt_search: event.target.value }))
            }
            allowClear
            placeholder={t.search}
            onSearch={onFilter}
          />
          <Select
            allowClear
            style={{ width: 130 }}
            placeholder={t.category}
            options={state.categoryList.map(c => ({ label: c.name, value: String(c.id) }))}
            onChange={(id) => {
              setFilter((pre) => ({ ...pre, category_id: id }));
            }}
          />
          <Select
            allowClear
            style={{ width: 130 }}
            placeholder={t.brand}
            options={config.brand}
            onChange={(id) => {
              setFilter((pre) => ({ ...pre, brand: id }));
            }}
          />
          <Button onClick={onFilter} type="primary">
            {t.filter}
          </Button>
        </Space>
        <Button type="primary" onClick={onBtnNew}>
          {t.add_new}
        </Button>
      </div>
      <Modal
        open={state.visibleModal}
        title={
          <div style={{ fontSize: 18, color: COLORS.darkGreen, fontWeight: 700 }}>
            {form.getFieldValue("id") ? (typeof t?.edit_product === 'string' ? t.edit_product : "Edit Product") : (typeof t?.add_new_product === 'string' ? t.add_new_product : "Add New Product")}
          </div>
        }
        footer={null}
        onCancel={onCloseModal}
        width={1350}
        centered
        destroyOnClose
        styles={{
          mask: { backdropFilter: 'blur(4px)' },
          content: { borderRadius: 24, padding: '32px 28px' }
        }}
      >
        <Form layout="vertical" onFinish={onFinish} form={form}>
          <Form.Item name="id" hidden><Input /></Form.Item>
          <Row gutter={20}>
            {/* Column 1: Core Product Info (SPAN 7) */}
            <Col span={7}>
              <div className="form-section-premium" style={{ height: '100%', minHeight: 500 }}>
                <div style={{ fontWeight: 700, marginBottom: 24, color: COLORS.darkGreen, display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #f0f0f0', paddingBottom: 12 }}>
                  <span style={{ background: '#e6f0e9', padding: '8px', borderRadius: '10px', fontSize: 18 }}>📦</span>
                  <span style={{ fontSize: 15 }}>{t.basic_details_title}</span>
                </div>

                <Form.Item
                  name={"category_id"}
                  label={t.category}
                  rules={[{ required: true, message: t.category_required }]}
                >
                  <Select
                    size="large"
                    options={state.categoryList.map(c => ({ label: c.name, value: String(c.id) }))}
                    placeholder={t.category_name}
                    onChange={(value) => {
                      setState(prev => ({ ...prev, selectedParentId: value }));
                      const cat = (state.categoryList || []).find(c => String(c.id) === String(value));
                      setSelectedCategory(cat || null);
                      form.setFieldsValue({ moods: [], sizes: [], addons: [] });

                      if (cat) {
                        const parseMoods = (val) => { try { return val ? (typeof val === 'string' ? JSON.parse(val) : val) : []; } catch { return []; } };
                        const defaultMoods = parseMoods(cat.default_moods);
                        if (defaultMoods.length > 0) {
                          const defaultValues = defaultMoods.map(m => typeof m === 'object' ? (m.value || m.label) : m);
                          form.setFieldValue('moods', defaultValues);
                        }
                      }
                    }}
                  />
                </Form.Item>

                <Form.Item
                  name={"name"}
                  label={t.product_name}
                  rules={[{ required: true, message: t.product_name }]}
                >
                  <Input size="large" placeholder={t.product_name} style={{ fontWeight: 600 }} />
                </Form.Item>

                <Form.Item name={"barcode"} label={t.barcode}>
                  <Input size="large" placeholder={t.barcode} />
                </Form.Item>

                <Form.Item
                  label={`${t.price || "Price"} (${t.base_price_label})`}
                  name="price"
                  rules={[{ required: !hasSizes, message: t.price_required }]}
                  tooltip={hasSizes ? "Disabled because multiple sizes are defined" : "Default price for this product"}
                  style={{ marginBottom: 24 }}
                >
                  <InputNumber 
                    size="large" 
                    min={0} 
                    step={0.01} 
                    style={{ width: '100%', fontWeight: 700 }} 
                    placeholder={hasSizes ? "Sizes override this" : "2.50"} 
                    disabled={hasSizes}
                    value={hasSizes ? 0 : undefined}
                  />
                  {hasSizes && (
                    <div style={{ 
                      background: '#fff7e6', 
                      padding: '8px 12px', 
                      borderRadius: '8px', 
                      border: '1px solid #ffe7ba',
                      color: '#d46b08', 
                      fontSize: 11, 
                      marginTop: 8, 
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}>
                      <span>⚠️</span> ប្រើតម្លៃតាមទំហំ (Sizes) ជំនួសវិញ
                    </div>
                  )}
                </Form.Item>

                <Form.Item label={t.status} name="status">
                  <Select
                    size="large"
                    options={[{ label: t.active, value: 1 }, { label: t.inactive, value: 0 }]}
                    placeholder={t.status}
                  />
                </Form.Item>
              </div>
            </Col>

            {/* Column 2: Blueprint Customization (SPAN 9) */}
            <Col span={selectedCategory ? 9 : 0}>
              <CategoryOptions selectedCategory={selectedCategory} t={t} />
            </Col>

            {/* Column 3: Medical Specifications (SPAN 8 - Pharmacy Only) */}
            {selectedCategory?.industry_code === 'pharmacy' && (
              <Col span={8}>
                <div className="form-section-premium" style={{ height: '100%', minHeight: 500 }}>
                  <div style={{ fontWeight: 700, marginBottom: 24, color: '#0958d9', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #e6f4ff', paddingBottom: 12 }}>
                    <span style={{ background: '#e6f4ff', padding: '8px', borderRadius: '10px', fontSize: 18 }}>💊</span>
                    <span style={{ fontSize: 15 }}>{t.medical_specs_title}</span>
                  </div>

                  <Form.Item name="generic_name" label={t.generic_name_label}>
                    <Input size="large" placeholder="e.g. Paracetamol" />
                  </Form.Item>

                  <Form.Item name="strength" label={t.strength_label}>
                    <Input size="large" placeholder="500mg" />
                  </Form.Item>

                  <Form.Item name="expiry_date" label={t.expiry_column_label}>
                    <DatePicker size="large" style={{ width: '100%' }} format="DD/MM/YYYY" />
                  </Form.Item>

                  <div style={{ background: '#f0f7ff', padding: 20, borderRadius: 16, marginTop: 24, border: '1px solid #d6e4ff' }}>
                    <Text type="secondary" style={{ fontSize: 12, lineHeight: 1.6 }}>
                      💡 <strong>{t.note}:</strong> {t.medical_note}
                    </Text>
                  </div>
                </div>
              </Col>
            )}

            {/* Column 4: Inventory & Media (SPAN Dynamic) */}
            <Col span={selectedCategory?.industry_code === 'pharmacy' ? 0 : (selectedCategory ? 8 : 17)}>
              <div className="form-section-premium" style={{ height: '100%', minHeight: 500 }}>
                <div style={{ fontWeight: 700, marginBottom: 24, color: COLORS.darkGreen, display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #f0f0f0', paddingBottom: 12 }}>
                  <span style={{ background: '#e6f0e9', padding: '8px', borderRadius: '10px', fontSize: 18 }}>📊</span>
                  <span style={{ fontSize: 15 }}>{t.inventory_media_title}</span>
                </div>

                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item name={"qty"} label={t.quantity}>
                      <InputNumber size="large" placeholder={t.quantity} style={{ width: "100%", fontWeight: 700 }} />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item name={"description"} label={t.description}>
                  <Input.TextArea size="large" rows={4} placeholder={t.enter_description} style={{ borderRadius: 12 }} />
                </Form.Item>

                <Form.Item name={"image_default"} label={t.image}>
                  <Upload
                    customRequest={(options) => options.onSuccess()}
                    maxCount={1}
                    listType="picture-card"
                    fileList={imageDefault}
                    onPreview={handlePreview}
                    onChange={handleChangeImageDefault}
                    className="premium-upload"
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <MdAdd size={24} />
                      <div style={{ marginTop: 8, fontSize: 12, fontWeight: 600 }}>{t.upload}</div>
                    </div>
                  </Upload>
                </Form.Item>
              </div>
            </Col>
          </Row>

          <div style={{ textAlign: "right", marginTop: 32, borderTop: `1px solid ${COLORS.softBorder}`, paddingTop: 24 }}>
            <Space size="large">
              <Button size="large" onClick={onCloseModal} style={{ borderRadius: 12, padding: '0 32px', height: 48, fontWeight: 600 }}>
                {t.cancel}
              </Button>
              <Button
                type="primary"
                size="large"
                htmlType="submit"
                loading={isSubmitting}
                style={{
                  background: COLORS.darkGreen,
                  borderRadius: 12,
                  padding: '0 48px',
                  fontWeight: 700,
                  height: 48,
                  boxShadow: '0 4px 12px rgba(30, 74, 45, 0.2)'
                }}
              >
                {form.getFieldValue("id") ? t.update_item : t.save_item}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      <Table
        dataSource={state.list}
        rowKey="id"
        className="premium-table"
        pagination={{ 
          pageSize: 10, 
          showTotal: (total) => `${t.total} ${total} ${t.products}`,
          style: { marginTop: 20 }
        }}
        columns={[
          {
            key: "product",
            title: t.product_label || "Product",
            width: 380,
            render: (_, r) => (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ position: 'relative' }}>
                  <Image
                    src={Config.getFullImagePath(r.image)}
                    width={65}
                    height={65}
                    style={{ borderRadius: 16, objectFit: 'cover', border: `1px solid ${COLORS.softBorder}`, boxShadow: '0 4px 8px rgba(0,0,0,0.05)' }}
                    fallback="https://placehold.co/100x100?text=No+Image"
                  />
                  {(() => {
                    const cat = state.categoryList.find(c => String(c.id) === String(r.category_id));
                    const isService = cat?.industry_code === 'restaurant' || cat?.industry_code === 'coffee_cafe';
                    if (r.qty <= 0 && !isService) {
                      return (
                        <div style={{ 
                          position: 'absolute', 
                          top: -5, 
                          right: -5, 
                          background: COLORS.redBadge, 
                          color: '#fff', 
                          fontSize: 10, 
                          padding: '2px 6px', 
                          borderRadius: 10,
                          fontWeight: 800,
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }}>
                          OUT
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
                <div>
                  <div style={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: 16, lineHeight: 1.2 }}>{r.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                    <Tag color="default" style={{ margin: 0, fontSize: 10, borderRadius: 4, fontWeight: 700, background: '#f1f5f9', border: 'none' }}>{r.barcode}</Tag>
                    {r.brand && <Tag color="blue" style={{ margin: 0, fontSize: 10, borderRadius: 4, fontWeight: 700, border: 'none' }}>{r.brand}</Tag>}
                  </div>
                </div>
              </div>
            )
          },
          {
            key: "category",
            title: t.category,
            width: 160,
            render: (_, r) => (
              <Tag style={{ 
                borderRadius: 20, 
                padding: '4px 14px', 
                fontWeight: 700, 
                border: 'none',
                background: COLORS.accentGreen + '30',
                color: COLORS.darkGreen,
                fontSize: 12
              }}>
                {r.category_name}
              </Tag>
            )
          },
          {
            key: "inventory",
            title: t.value_stock_label || "Value & Stock",
            width: 200,
            render: (_, r) => {
              const isLow = r.qty > 0 && r.qty <= 10;
              const isOut = r.qty <= 0;
              
              let priceDisplay = <span style={{ fontSize: 18, fontWeight: 900, color: COLORS.darkGreen }}>${Number(r.price || 0).toFixed(2)}</span>;
              try {
                const sizes = r.sizes ? (typeof r.sizes === 'string' ? JSON.parse(r.sizes) : r.sizes) : [];
                if (Array.isArray(sizes) && sizes.length > 0) {
                  const prices = sizes.map(s => Number(s.price || 0));
                  priceDisplay = (
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 900, color: COLORS.darkGreen }}>
                        ${Math.min(...prices).toFixed(2)} - ${Math.max(...prices).toFixed(2)}
                      </div>
                      <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>({sizes.length} Sizes)</div>
                    </div>
                  );
                }
              } catch(e) {}

              return (
                <div>
                  {priceDisplay}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                    {(() => {
                      const cat = state.categoryList.find(c => String(c.id) === String(r.category_id));
                      const isService = cat?.industry_code === 'restaurant' || cat?.industry_code === 'coffee_cafe';
                      
                      if (isService) {
                        return (
                          <>
                            <div style={{ 
                              width: 10, 
                              height: 10, 
                              borderRadius: '50%', 
                              background: '#3b82f6',
                              boxShadow: '0 0 8px #dbeafe'
                            }} />
                            <span style={{ fontSize: 13, fontWeight: 800, color: '#3b82f6' }}>
                              {t.ready_to_serve_label || "Ready"}
                            </span>
                          </>
                        );
                      }

                      return (
                        <>
                          <div style={{ 
                            width: 10, 
                            height: 10, 
                            borderRadius: '50%', 
                            background: isOut ? '#ef4444' : (isLow ? '#f59e0b' : '#22c55e'),
                            boxShadow: `0 0 8px ${isOut ? '#fecaca' : (isLow ? '#fef3c7' : '#dcfce7')}`
                          }} />
                          <span style={{ 
                            fontSize: 13, 
                            fontWeight: 800, 
                            color: isOut ? '#ef4444' : (isLow ? '#f59e0b' : '#334155') 
                          }}>
                            {r.qty.toLocaleString()} {t.in_stock_label || "in stock"}
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
            key: "medical",
            title: t.medical_info_label,
            render: (_, r) => r.generic_name ? (
              <div style={{ background: '#f0f7ff', padding: '8px 12px', borderRadius: 10, border: '1px solid #d6e4ff' }}>
                <div style={{ fontWeight: 800, color: '#0958d9', fontSize: 13 }}>{r.generic_name}</div>
                <div style={{ color: '#64748b', fontSize: 11, fontWeight: 600 }}>{r.strength}</div>
                {r.expiry_date && (
                  <div style={{ 
                    marginTop: 4,
                    color: dayjs().isAfter(dayjs(r.expiry_date)) ? '#ef4444' : '#64748b', 
                    fontSize: 10, 
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}>
                    🗓️ EXP: {dayjs(r.expiry_date).format("DD/MM/YYYY")}
                  </div>
                )}
              </div>
            ) : "-"
          },
          {
            key: "status",
            title: t.status,
            width: 100,
            align: 'center',
            render: (v) => (
              <Tag color={v == 1 ? "success" : "error"} style={{ borderRadius: 6, fontWeight: 800, border: 'none', padding: '2px 8px' }}>
                {v == 1 ? t.active : t.inactive}
              </Tag>
            )
          },
          {
            key: "action",
            title: t.action,
            width: 180,
            align: 'right',
            render: (_, r, index) => (
              <Space>
                <Tooltip title={t.recipe_tooltip || "Recipe / Ingredients"}>
                  <Button
                    type="text"
                    icon={<MdRestaurantMenu style={{ fontSize: 22, color: COLORS.midGreen }} />}
                    onClick={() => onClickRecipe(r)}
                    style={{ background: COLORS.accentGreen + '15', borderRadius: 10, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  />
                </Tooltip>
                <Button
                  type="text"
                  icon={<MdEdit style={{ fontSize: 20, color: '#3b82f6' }} />}
                  onClick={() => onClickEdit(r, index)}
                  style={{ background: '#eff6ff', borderRadius: 10, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                />
                <Button
                  type="text"
                  danger
                  icon={<MdDelete style={{ fontSize: 20 }} />}
                  onClick={() => onClickDelete(r, index)}
                  style={{ background: '#fef2f2', borderRadius: 10, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                />
              </Space>
            ),
          },
        ]}
      />
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