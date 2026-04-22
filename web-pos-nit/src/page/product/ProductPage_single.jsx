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
  // Parse the default config if it exists on the selected category
  // Supports both JSON array and comma-separated strings
  const parseBlueprint = (val) => {
    if (!val) return null;
    if (Array.isArray(val)) return val;
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      // Handle comma-separated string
      return val.split(',').map(s => s.trim()).filter(Boolean);
    }
  };

  const defaultMoods = parseBlueprint(selectedCategory?.default_moods);
  const defaultSizes = parseBlueprint(selectedCategory?.default_sizes);
  const defaultAddons = parseBlueprint(selectedCategory?.default_addons);

  const isPharmacy = selectedCategory?.industry_code === 'pharmacy';
  const isRestaurant = selectedCategory?.industry_code === 'restaurant' || selectedCategory?.industry_code === 'coffee_cafe';

  // If category has no special configuration, hide this panel
  const hasConfig = defaultMoods?.length > 0 || defaultSizes?.length > 0 || defaultAddons?.length > 0;
  if (!selectedCategory || !hasConfig) return null;

  return (
    <div style={{
      background: isPharmacy ? "#f0f7ff" : "#f0f7f2",
      padding: "24px",
      borderRadius: "16px",
      marginBottom: "20px",
      border: `1px solid ${isPharmacy ? "#d6e4ff" : "#d9e6dc"}`,
      boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)"
    }}>
      <div style={{
        fontWeight: 800,
        marginBottom: 20,
        color: isPharmacy ? "#0958d9" : COLORS.darkGreen,
        fontSize: 17,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        borderBottom: `2px solid ${isPharmacy ? "#d6e4ff" : "#d9e6dc"}`,
        paddingBottom: 10
      }}>
        {isPharmacy ? <span style={{ fontSize: 22 }}>📋</span> : <span style={{ fontSize: 22 }}>🍳</span>}
        {selectedCategory?.name || selectedCategory?.label} {isPharmacy ? "Blueprint" : (isRestaurant ? "Cooking & Options" : (typeof t?.customize_coffee === 'string' ? t.customize_coffee : "Customization"))}
      </div>

      {/* Moods/Instructions Section */}
      {defaultMoods && defaultMoods.length > 0 && (
        <>
          <div style={{ fontWeight: 700, marginBottom: 10, color: COLORS.textPrimary, fontSize: 14 }}>
            {isPharmacy ? "💊 Usage / Dosage Instructions" : (isRestaurant ? "🌶️ Taste / Special Instructions" : `🔥❄️ ${t.mood || "Temperature"}`)}
          </div>
          <Form.Item name="moods" label={false} style={{ marginBottom: 16 }}>
            <Checkbox.Group
              options={defaultMoods.map(m => {
                const label = typeof m === 'object' ? (m.label || m.value) : m;
                const value = typeof m === 'object' ? (m.value || m.label) : m;
                return { label, value };
              })}
            />
          </Form.Item>
        </>
      )}

      {/* Sizes Section */}
      {defaultSizes && defaultSizes.length > 0 && (
        <>
          <div style={{ margin: '20px 0', borderTop: `1px dashed ${isPharmacy ? "#d6e4ff" : "#d9e6dc"}` }} />
          <Form.List name="sizes">
            {(fields, { add, remove }) => (
              <>
                <div style={{ fontWeight: 800, marginBottom: 4, color: isPharmacy ? "#0958d9" : COLORS.darkGreen, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>{isPharmacy ? "📦" : (isRestaurant ? "🍽️" : "☕")}</span> {isPharmacy ? "Packaging / Units" : (isRestaurant ? "Portions / Sizes" : (typeof t?.sizes === 'string' ? t.sizes : "Sizes"))}
                </div>
                <div style={{ fontSize: 11, color: COLORS.textSecondary, marginBottom: 12, fontStyle: 'italic' }}>
                  {isPharmacy ? "Define unit types and their specific pricing" : (t.sizes_override_msg || "Price per size overrides the base price")}
                </div>
                {fields.map(({ key, name, ...restField }) => (
                  <div key={key} style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: 'center' }}>
                    <Form.Item
                      {...restField}
                      name={[name, 'label']}
                      rules={[{ required: true, message: 'Required' }]}
                      style={{ marginBottom: 0, flex: 2 }}
                    >
                      <Select
                        size="large"
                        placeholder={isPharmacy ? "Select Unit" : (isRestaurant ? "Portion" : "Size")}
                        options={defaultSizes.map(s => {
                          const label = typeof s === 'object' ? (s.label || s.value) : s;
                          const value = typeof s === 'object' ? (s.value || s.label) : s;
                          return { label, value };
                        })}
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'price']}
                      rules={[{ required: true, message: 'Required' }]}
                      style={{ marginBottom: 0, flex: 1 }}
                    >
                      <InputNumber
                        size="large"
                        placeholder="Price"
                        style={{ width: '100%' }}
                        min={0}
                        step={0.1}
                        precision={2}
                      />
                    </Form.Item>
                    <Button
                      danger
                      type="text"
                      onClick={() => remove(name)}
                      icon={<MdDelete style={{ fontSize: 20 }} />}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    />
                  </div>
                ))}
                <Button
                  type="dashed"
                  onClick={() => add()}
                  icon={<MdAdd />}
                  block
                  style={{ marginBottom: 20, borderRadius: 10, height: 40, borderColor: isPharmacy ? "#4096ff" : COLORS.midGreen, color: isPharmacy ? "#4096ff" : COLORS.midGreen }}
                >
                  {isPharmacy ? "+ Add Packaging Unit" : (isRestaurant ? "+ Add Portion" : (t.add_size || "+ Add Size"))}
                </Button>
              </>
            )}
          </Form.List>
        </>
      )}

      {/* Add-ons/Warnings Section */}
      {defaultAddons && defaultAddons.length > 0 && (
        <Form.List name="addons">
          {(fields, { add, remove }) => (
            <>
              <div style={{ margin: '20px 0', borderTop: `1px dashed ${isPharmacy ? "#d6e4ff" : "#d9e6dc"}` }} />
              <div style={{ fontWeight: 800, marginBottom: 12, color: isPharmacy ? "#d46b08" : COLORS.darkGreen, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{isPharmacy ? "⚠️" : (isRestaurant ? "🥗" : "➕")}</span> {isPharmacy ? "Warnings / Special Notes" : (isRestaurant ? "Side Dishes / Extras" : (typeof t?.addons === 'string' ? t.addons : "Add-ons"))}
              </div>
              {fields.map(({ key, name, ...restField }) => (
                <div key={key} style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: 'center' }}>
                  <Form.Item
                    {...restField}
                    name={[name, 'label']}
                    rules={[{ required: true, message: 'Required' }]}
                    style={{ marginBottom: 0, flex: 2 }}
                  >
                    <Select
                      size="large"
                      placeholder={isPharmacy ? "Select Warning" : (isRestaurant ? "Select Side" : "Add-on")}
                      options={defaultAddons.map(a => {
                        const label = typeof a === 'object' ? (a.label || a.value) : a;
                        const value = typeof a === 'object' ? (a.value || a.label) : a;
                        return { label, value };
                      })}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, 'price']}
                    rules={[{ required: true, message: 'Required' }]}
                    style={{ marginBottom: 0, flex: 1 }}
                    hidden={isPharmacy}
                  >
                    <InputNumber
                      size="large"
                      placeholder="Price"
                      style={{ width: '100%' }}
                      min={0}
                      step={0.1}
                      precision={2}
                    />
                  </Form.Item>
                  <Button
                    danger
                    type="text"
                    onClick={() => remove(name)}
                    icon={<MdDelete style={{ fontSize: 20 }} />}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  />
                </div>
              ))}
              <Button
                type="dashed"
                onClick={() => add()}
                icon={<MdAdd />}
                block
                style={{ borderRadius: 10, height: 40, borderColor: isPharmacy ? "#ffa940" : COLORS.midGreen, color: isPharmacy ? "#ffa940" : COLORS.midGreen }}
              >
                {isPharmacy ? "+ Add Warning" : (isRestaurant ? "+ Add Side/Extra" : (t.add_addon || "+ Add Addon"))}
              </Button>
            </>
          )}
        </Form.List>
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
            {/* Column 1: Core Product Info (SPAN 6) */}
            <Col span={6}>
              <div className="form-section-premium" style={{ height: '100%', minHeight: 500 }}>
                <div style={{ fontWeight: 700, marginBottom: 20, color: COLORS.darkGreen, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ background: '#e6f0e9', padding: '6px', borderRadius: '8px' }}>📦</span>
                  Basic Details
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
                  <Input size="large" placeholder={t.product_name} />
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
                    style={{ width: '100%' }} 
                    placeholder={hasSizes ? "Sizes override this" : "2.50"} 
                    disabled={hasSizes}
                    value={hasSizes ? 0 : undefined}
                  />
                  {hasSizes && (
                    <div style={{ color: '#fa8c16', fontSize: 11, marginTop: 4, fontWeight: 600 }}>
                      ⚠️ ប្រើតម្លៃតាមទំហំ (Sizes) ជំនួសវិញ
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

            {/* Column 2: Blueprint Customization (SPAN 6) */}
            <Col span={selectedCategory ? 6 : 0}>
              <div className="form-section-premium" style={{ height: '100%', minHeight: 500 }}>
                <CategoryOptions selectedCategory={selectedCategory} t={t} />
              </div>
            </Col>

            {/* Column 3: Medical Specifications (SPAN 6 - Pharmacy Only) */}
            {selectedCategory?.industry_code === 'pharmacy' && (
              <Col span={6}>
                <div className="form-section-premium" style={{ height: '100%', minHeight: 500 }}>
                  <div style={{ fontWeight: 700, marginBottom: 20, color: '#0958d9', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ background: '#e6f4ff', padding: '6px', borderRadius: '8px' }}>💊</span>
                    Medical Specifications
                  </div>

                  <Form.Item name="generic_name" label="Generic Name (Chemical)">
                    <Input size="large" placeholder="e.g. Paracetamol" />
                  </Form.Item>

                  <Form.Item name="strength" label="Strength (mg/ml)">
                    <Input size="large" placeholder="500mg" />
                  </Form.Item>

                  <Form.Item name="expiry_date" label="Expiry Date">
                    <DatePicker size="large" style={{ width: '100%' }} format="DD/MM/YYYY" />
                  </Form.Item>

                  <div style={{ background: '#f0f7ff', padding: 16, borderRadius: 12, marginTop: 20, border: '1px solid #d6e4ff' }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      💡 <strong>Note:</strong> ព័ត៌មានទាំងនេះនឹងបង្ហាញនៅលើប័ណ្ណបញ្ជាទិញ និងសម្រាប់គ្រប់គ្រងថ្ងៃផុតកំណត់។
                    </Text>
                  </div>
                </div>
              </Col>
            )}

            {/* Column 4: Inventory & Media (SPAN Dynamic) */}
            <Col span={selectedCategory?.industry_code === 'pharmacy' ? 6 : (selectedCategory ? 12 : 18)}>
              <div className="form-section-premium" style={{ height: '100%', minHeight: 500 }}>
                <div style={{ fontWeight: 700, marginBottom: 20, color: COLORS.darkGreen, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ background: '#e6f0e9', padding: '6px', borderRadius: '8px' }}>📊</span>
                  Inventory & Media
                </div>

                <Row gutter={12}>
                  <Col span={12}>
                    <Form.Item name={"qty"} label={t.quantity}>
                      <InputNumber size="large" placeholder={t.quantity} style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name={"discount"} label={t.discount}>
                      <InputNumber size="large" placeholder={t.discount} style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item name={"description"} label={t.description}>
                  <Input.TextArea size="large" rows={4} placeholder={t.enter_description} />
                </Form.Item>

                <Form.Item name={"image_default"} label={t.image}>
                  <Upload
                    customRequest={(options) => options.onSuccess()}
                    maxCount={1}
                    listType="picture-card"
                    fileList={imageDefault}
                    onPreview={handlePreview}
                    onChange={handleChangeImageDefault}
                  >
                    <div>+{t.upload}</div>
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
        columns={[
          {
            key: "name",
            title: t.product_name,
            dataIndex: "name",
          },
          {
            key: "barcode",
            title: t.barcode,
            dataIndex: "barcode",
          },
          {
            key: "description",
            title: t.description,
            dataIndex: "description",
          },
          {
            key: "category_name",
            title: t.category,
            dataIndex: "category_name",
          },
          {
            key: "brand",
            title: t.brand,
            dataIndex: "brand",
          },
          {
            key: "qty",
            title: t.quantity,
            dataIndex: "qty",
          },
          {
            key: "price",
            title: t.price,
            dataIndex: "price",
            render: (price, record) => {
              try {
                const sizes = record.sizes ? (typeof record.sizes === 'string' ? JSON.parse(record.sizes) : record.sizes) : [];
                if (Array.isArray(sizes) && sizes.length > 0) {
                  const prices = sizes.map(s => Number(s.price || 0));
                  const min = Math.min(...prices);
                  const max = Math.max(...prices);
                  return (
                    <div style={{ fontWeight: 800, color: COLORS.darkGreen }}>
                      {min === max ? `$${min.toFixed(2)}` : `$${min.toFixed(2)} - $${max.toFixed(2)}`}
                      <div style={{ fontSize: 10, color: COLORS.textSecondary, fontWeight: 400 }}>({sizes.length} Sizes)</div>
                    </div>
                  );
                }
              } catch (e) {
                console.error("Price parse error", e);
              }
              return <span style={{ fontWeight: 700 }}>${Number(price || 0).toFixed(2)}</span>;
            }
          },
          {
            key: "discount",
            title: t.discount,
            dataIndex: "discount",
          },
          {
            key: "medical_info",
            title: "Medical Info",
            render: (record) => {
              if (record.industry_code !== 'pharmacy') return "-";
              return (record.generic_name || record.strength ? (
                <div style={{ fontSize: '12px' }}>
                  <div style={{ color: COLORS.darkGreen, fontWeight: 600 }}>{record.generic_name}</div>
                  <div style={{ color: COLORS.textSecondary }}>{record.strength}</div>
                </div>
              ) : "-");
            }
          },
          {
            key: "expiry_date",
            title: "Expiry",
            dataIndex: "expiry_date",
            render: (date, record) => {
              if (!date || date.startsWith("1899") || date.startsWith("0000") || record.industry_code !== 'pharmacy') return "-";
              const isExpired = dayjs().isAfter(dayjs(date));
              const isNear = dayjs().add(3, 'month').isAfter(dayjs(date));
              return (
                <Tag color={isExpired ? "error" : isNear ? "warning" : "success"} style={{ borderRadius: 6 }}>
                  {isExpired && <span style={{ marginRight: 4 }}>⚠️</span>}
                  {dayjs(date).format("DD/MM/YYYY")}
                </Tag>
              );
            }
          },

          {
            key: "status",
            title: t.status,
            dataIndex: "status",
            render: (status) =>
              status == 1 ? (
                <Tag color="green">{t.active}</Tag>
              ) : (
                <Tag color="red">{t.inactive}</Tag>
              ),
          },
          {
            key: "image",
            title: t.image,
            dataIndex: "image",
            render: (value) => (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "2px solid #e0e0e0",
                  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                  transition: "transform 0.3s, box-shadow 0.3s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.1)";
                  e.currentTarget.style.boxShadow = "0 6px 12px rgba(0, 0, 0, 0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)";
                }}
              >
                {value ? (
                  <Image
                    src={Config.optimizeCloudinary(Config.getFullImagePath(value), "w_120,c_fill,f_auto,q_auto")}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                    preview={{
                      mask: (
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            width: "100%",
                            height: "100%",
                            backgroundColor: "rgba(0, 0, 0, 0.5)",
                            color: "#fff",
                            fontSize: 16,
                          }}
                        >
                          {t.view_details}
                        </div>
                      ),
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      backgroundColor: "#EEE",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      fontSize: 10,
                      color: "#999",
                      textAlign: "center",
                      padding: 2
                    }}
                  >
                    {t.no_data}
                  </div>
                )}
              </div>
            ),
          },
          {
            key: "Action",
            title: t.action,
            align: "center",
            render: (item, data, index) => (
              <Space>
                <Button
                  title={t.recipe || "Recipe"}
                  style={{ borderColor: "#faad14", color: "#faad14" }}
                  icon={<MdRestaurantMenu />}
                  onClick={() => onClickRecipe(item)}
                />
                <Button
                  type="primary"
                  icon={<MdEdit />}
                  onClick={() => onClickEdit(data, index)}
                />
                <Button
                  type="primary"
                  danger
                  icon={<MdDelete />}
                  onClick={() => onClickDelete(data, index)}
                />
              </Space>
            ),
          },
          {
            key: "created_by",
            title: t.staff,
            render: (text, record) => (
              <div>
                <strong>{record.created_by_name}</strong>
                {record.created_by_username && (
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    @{record.created_by_username}
                  </div>
                )}
              </div>
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