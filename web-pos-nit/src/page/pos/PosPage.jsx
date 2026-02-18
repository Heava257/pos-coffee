import React, { useCallback, useEffect, useState } from "react";
import {
  Button,
  Col,
  Empty,
  Input,
  InputNumber,
  message,
  notification,
  Row,
  Select,
  Space,
  Modal,
  Form,
  Tag,
  Card,
  Typography,
  Badge,
  Tabs,
  Divider,
  Avatar,
} from "antd";
import { request } from "../../util/helper";
import MainPage from "../../component/layout/MainPage";
import { configStore } from "../../store/configStore";
import BillItem from "../../component/pos/BillItem";
import ProductItem from "../../component/pos/ProductItem";
import styles from "./PosPage.module.css";
import { useReactToPrint } from "react-to-print";
import PrintInvoice from "../../component/pos/PrintInvoice";
import { getProfile } from "../../store/profile.store";
import { getIconForCategory, getColorForCategory } from "../../util/helper";

import {
  MdAddToPhotos,
  MdLocalCafe,
  MdRestaurant,
  MdIcecream,
  MdBakeryDining
} from "react-icons/md";
import { FiSearch, FiShoppingCart, FiTrash2 } from "react-icons/fi";
import {
  CoffeeOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  CreditCardOutlined,
  EnvironmentOutlined
} from "@ant-design/icons";
import { Config } from "../../util/config";
import QRPaymentModal from "../../QRPaymentModal/QRPaymentModal";

const { Text, Title } = Typography;
const { TabPane } = Tabs;

const defaultParentCategories = [
  { id: 51, name: "Coffee", icon: "☕", color: "#8B4513" },
  { id: 52, name: "Juice", icon: "🧃", color: "#4CAF50" },
  { id: 53, name: "Milk Based", icon: "🥛", color: "#2196F3" },
  { id: 54, name: "Snack", icon: "🍪", color: "#FF9800" },
  { id: 55, name: "Rice", icon: "🍚", color: "#E91E63" },
  { id: 56, name: "Dessert", icon: "🍰", color: "#9C27B0" },
];

function PosPage() {
  const [isDisabled, setIsDisabled] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [selectedMood, setSelectedMood] = useState('hot');
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedSugar, setSelectedSugar] = useState(50);
  const [selectedIce, setSelectedIce] = useState(50);
  const [customQuantity, setCustomQuantity] = useState(1);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [showOutOfStock, setShowOutOfStock] = useState(false);

  const [paymentData, setPaymentData] = useState({
    paymentLink: '',
    orderNo: '',
    total: 0
  });

  const [parentCategories, setParentCategories] = useState(defaultParentCategories);
  const [selectedCategory, setSelectedCategory] = useState(51); // Changed from "all" to 51 (Coffee)

  const { config } = configStore();
  const refInvoice = React.useRef(null);
  const [state, setState] = useState({
    list: [],
    customers: [],
    total: 0,
    loading: false,
    visibleModal: false,
    cart_list: [],
  });
  const { id } = getProfile();

  useEffect(() => {
    setObjSummary((prev) => ({
      ...prev,
      user_id: id,
    }));
  }, [id]);

  const fetchCustomers = async () => {
    try {
      const { id } = getProfile();
      if (!id) {
        console.error("User ID is missing.");
        return;
      }

      const param = {
        ...filter,
        page: refPage.current,
        is_list_all: 1,
      };

      setState((prev) => ({ ...prev, loading: true }));
      const res = await request(`customer/${id}`, "get", param);

      if (res && !res.error) {
        const customers = (res.list || []).map((customer) => ({
          label: `${customer.name} - ${customer.tel}`,
          value: customer.id,
        }));

        setState((prev) => ({ ...prev, customers, loading: false }));
      } else {
        console.error("Failed to fetch customers:", res?.error);
        setState((prev) => ({ ...prev, loading: false }));
      }

    } catch (error) {
      console.error("Failed to fetch customers:", error);
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  const getParentCategories = async () => {
    try {

      const res = await request("category", "get");

      let allCategories = [];

      if (res?.all_parent_categories?.length > 0) {
        allCategories = res.all_parent_categories.map(cat => ({
          id: cat.id,
          name: cat.name,
          icon: getIconForCategory(cat.name),
          color: getColorForCategory(cat.name),
        }));
      } else if (res?.list?.length > 0) {
        const parentMap = new Map();
        res.list.forEach(item => {
          if (item.parent_id && item.parent_category_name) {
            parentMap.set(item.parent_id, {
              id: item.parent_id,
              name: item.parent_category_name,
              icon: getIconForCategory(item.parent_category_name),
              color: getColorForCategory(item.parent_category_name),
            });
          }
        });
        const parents = Array.from(parentMap.values());
        allCategories = parents;
      }

      if (allCategories.length === 0) {
        console.warn("⚠️ No dynamic categories found. Falling back to defaults.");
        setParentCategories(defaultParentCategories);
      } else {
        setParentCategories(allCategories);

        const coffeeCategory = allCategories.find(cat =>
          cat.name.toLowerCase().includes('coffee') || cat.id === 51
        );
        if (coffeeCategory && selectedCategory !== coffeeCategory.id) {
          setSelectedCategory(coffeeCategory.id);
        } else if (allCategories.length > 0 && !allCategories.find(cat => cat.id === selectedCategory)) {
          setSelectedCategory(allCategories[0].id);
        }
      }

    } catch (error) {
      console.error("❌ Failed to fetch categories:", error);
      setParentCategories(defaultParentCategories);
    }
  };

  const [objSummary, setObjSummary] = useState({
    sub_total: 0,
    total_qty: 0,
    save_discount: 0,
    tax: 0,
    total: 0,
    total_paid: 0,
    customers: null,
    customer_id: null,
    user_id: null,
    payment_method: null,
    remark: null,
    order_no: null,
    order_date: null,
  });

  const refPage = React.useRef(1);
  const [filter, setFilter] = useState({
    txt_search: "",
    category_id: "", 
    brand: "",
  });
  const [form] = Form.useForm();
  const filteredProducts = showOutOfStock
    ? state.list
    : state.list.filter((product) => product.qty > 0);

  const allProducts = state.list;
  const inStockProducts = state.list.filter((product) => product.qty > 0);
  const outOfStockProducts = state.list.filter((product) => product.qty <= 0);

  useEffect(() => {
  }, [parentCategories]);

  useEffect(() => {
  }, [selectedCategory]);

  useEffect(() => {
    const initializeData = async () => {
      try {
        await getParentCategories();

        await fetchCustomers();
        await getList();

      } catch (error) {
      }
    };

    initializeData();
  }, []); 

  useEffect(() => {
    setSelectedMood('hot');
    setSelectedSize('M');
    setSelectedSugar(50);
    setSelectedIce(50);
    setCustomQuantity(1);
  }, [resetTrigger]);

  useEffect(() => {
    handleCalSummary();
  }, [state.cart_list]);

  useEffect(() => {
    fetchCustomers();
    getParentCategories(); 
    getList();
  }, []);

  useEffect(() => {
    getList();
  }, [selectedCategory]);

  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      setIsDisabled(hours === 0 && minutes === 0);
    };
    checkTime();
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const getList = async () => {
    let param = {
      ...filter,
      page: refPage.current,
      is_list_all: 1,
    };

    param.parent_id = selectedCategory;

    const { id } = getProfile();
    if (!id) return;

    try {
      setState(pre => ({ ...pre, loading: true }));

      const res = await request(`product/${id}`, "get", param);

      if (res && !res.error) {
        let filteredList = res.list || [];


        if (filteredList.length > 0) {
        }

        const beforeFilter = filteredList.length;
        filteredList = filteredList.filter(product => product.parent_id === selectedCategory);


        setState(pre => ({
          ...pre,
          list: filteredList,
          total: filteredList.length,
          loading: false,
        }));

      }
    } catch (error) {
      console.error("❌ Error fetching products:", error);
      setState(pre => ({ ...pre, loading: false }));
    }
  };

  const onFilter = () => {
    getList();
  };

  const handleAdd = (item, customizations = {}) => {
    let cart_tmp = [...state.cart_list];

    const customKey = `${item.id}-${customizations.size || 'M'}-${customizations.temperature || 'Cold'}-${customizations.sugarLevel || '25%'}-${(customizations.addons || []).map(a => a.name || a).join(',')}`;

    const findIndex = cart_tmp.findIndex(row => row.customKey === customKey);
    let isNoStock = false;

    if (findIndex === -1) {
      if (item.qty > 0) {
        const final_price = Number(item.unit_price) ||
          Number(item.price) ||
          Number(item.selling_price) ||
          Number(item.actual_price) || 0;

        if (final_price === 0) {
          console.warn(`⚠️ Warning: No valid price found for product ${item.id} - ${item.name}`);
          message.warning(`Price not set for ${item.name}. Please check product configuration.`);
          return;
        }

        let sizeMultiplier = 1;
        const size = customizations.size?.name || customizations.size || "M";
        if (size === 'L' || size === 'Large') sizeMultiplier = 1.3;
        else if (size === 'S' || size === 'Small') sizeMultiplier = 0.8;

        const addonsPrice = (customizations.addons || []).reduce((sum, addon) => sum + Number(addon.price || 0), 0);

        const quantity = item.cart_qty || 1;
        const finalPrice = Number(item.discountedPrice || item.unit_price || item.price || 0);

        cart_tmp.push({
          ...item,
          cart_qty: quantity,
          totalPrice: finalPrice * quantity,
          price: finalPrice,
          unit_price: finalPrice,
          actual_price: item.actual_price || item.unit_price || item.price,
        });

      } else {
        isNoStock = true;
      }
    } else {
      const current = cart_tmp[findIndex];
      current.cart_qty += 1;
      current.quantity += 1;
      current.totalPrice = current.discountedPrice * current.quantity;

      if (item.qty < current.cart_qty) {
        isNoStock = true;
      }
    }

    if (isNoStock) {
      notification.error({
        message: "Out of Stock",
        description: `Only ${item.qty} item(s) available`,
      });
      return;
    }

    setState(pre => ({ ...pre, cart_list: cart_tmp }));
    handleCalSummary();
  };

  const handleClearCart = () => {
    setState((p) => ({
      ...p,
      cart_list: [],
      customers: [],
    }));

    setObjSummary((p) => ({
      ...p,
      sub_total: 0,
      total_qty: 0,
      save_discount: 0,
      tax: 0,
      total: 0,
      total_paid: 0,
      customer_id: null,
      payment_method: null,
      user_id: null,
      remark: null,
    }));

    form.resetFields();
    fetchCustomers();
  };

  const debugProductPrices = () => {
    state.list.forEach(product => {

    });
  };

  const handleCalSummary = useCallback(() => {
    let total_qty = 0;
    let sub_total = 0;

    state.cart_list.forEach((item) => {
      const qty = Number(item.cart_qty) || Number(item.quantity) || 0;
      const item_price = Number(item.discountedPrice) || Number(item.price) || Number(item.unit_price) || 0;

      const item_total = item_price * qty;

      total_qty += qty;
      sub_total += item_total;
    });

    const tax = 0; 
    const total = sub_total + tax;

    setObjSummary((prev) => ({
      ...prev,
      total_qty,
      sub_total: Number(sub_total.toFixed(2)),
      tax,
      total: Number(total.toFixed(2)),
      save_discount: 0, 
    }));
  }, [state.cart_list]);

  const handleCloseQRModal = () => {
    setQrModalVisible(false);
    setPaymentData({
      paymentLink: '',
      orderNo: '',
      total: 0
    });
  };

  const handleClickOut = async () => {
    if (!state.cart_list.length) {
      message.error("Your cart is empty! Please add some items first.");
      return;
    }

    if (!objSummary.payment_method) {
      message.error("Please select a payment method!");
      return;
    }

    const items = state.cart_list.map((item) => {
      const quantity = Number(item.cart_qty) || Number(item.quantity) || 1;
      const unitPrice = Number(item.unit_price) || Number(item.price) || 0;
      const discountedPrice = Number(item.discountedPrice) || unitPrice;
      const discount_percent = Number(item.discount) || 0;
      const totalPrice = discountedPrice * quantity;

      const original_total = unitPrice * quantity;
      const discount_amount = discount_percent > 0 ? (original_total * discount_percent / 100) : 0;

      return {
        product_id: item.id,
        name: item.name || item.product_name || `Product ${item.id}`,
        quantity,

        originalPrice: unitPrice,
        discountedPrice: discountedPrice,
        totalPrice: totalPrice,
        discount_percent: discount_percent,     
        discount_amount: discount_amount,      

        price: unitPrice,
        unit_price: unitPrice,
        discount: discount_percent,

        size: item.size,
        temperature: item.temperature || item.mood,
        sugarLevel: item.sugarLevel || item.sugar,
        addons: item.addons || [],
      };
    });

    const { id: user_id } = getProfile();

    const param = {
      ...objSummary,
      user_id,
      items,
      sub_total: Number(objSummary.sub_total) || 0,
      total: Number(objSummary.total) || 0,
      total_qty: Number(objSummary.total_qty) || 0,
      tax: Number(objSummary.tax) || 0,
      save_discount: Number(objSummary.save_discount) || 0,
    };

    try {
      const res = await request("orders/create_byCashie", "post", param);

      if (res && !res.error) {
        message.success("Order created successfully!");

        if (res.payment_link) {
          setPaymentData({
            paymentLink: res.payment_link,
            orderNo: res.order_no,
            total: param.total
          });
          setQrModalVisible(true);
        }

        setObjSummary((p) => ({
          ...p,
          order_no: res.order_id,
          order_date: new Date().toISOString(),
        }));

        setTimeout(() => {
          handlePrintInvoice();
        }, 2000);

        setResetTrigger(prev => prev + 1);
      } else {
        console.error("❌ Error response:", res);
        message.error(`Order failed! ${res?.message || res?.error || ''}`);
      }
    } catch (error) {
      console.error("❌ Error creating order:", error);
      message.error("Failed to create order. Please try again.");
    }
  };

  const onBeforePrint = React.useCallback(() => {
    return Promise.resolve();
  }, []);

  const onAfterPrint = React.useCallback((event) => {
    handleClearCart();
  }, []);

  const onPrintError = React.useCallback(() => {
  }, []);

  const handlePrintInvoice = useReactToPrint({
    contentRef: refInvoice,
    onBeforePrint: onBeforePrint,
    onAfterPrint: onAfterPrint,
    onPrintError: onPrintError,
  });

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      setState((p) => ({ ...p, visibleModal: false }));
    });
  };

  const handleModalCancel = () => {
    setState((p) => ({ ...p, visibleModal: false }));
  };

  const handleQuantityChange = (value, index) => {
    if (!value || isNaN(value) || value <= 0) return;

    const newCartList = [...state.cart_list];
    newCartList[index].cart_qty = Number(value);
    newCartList[index].quantity = Number(value);

    newCartList[index].totalPrice = newCartList[index].discountedPrice * Number(value);

    setState((prev) => ({ ...prev, cart_list: newCartList }));
  };

  const handlePriceChange = (value, index) => {
    if (value < 0) return;

    const newCartList = [...state.cart_list];
    newCartList[index] = {
      ...newCartList[index],
      unit_price: value,
      discountedPrice: value,
      totalPrice: value * newCartList[index].quantity
    };

    setState((prev) => ({ ...prev, cart_list: newCartList }));
  };

  const handleActualPriceChange = (value, index) => {
    if (value < 0) return;

    const newCartList = [...state.cart_list];
    newCartList[index] = { ...newCartList[index], actual_price: value };

    setState((prev) => ({ ...prev, cart_list: newCartList }));
  };

  const orderTypes = [
    { key: 'delivery', label: 'Delivery', icon: '🚗', active: true },
    { key: 'dine_in', label: 'Dine In', icon: '🍽️', active: false },
    { key: 'takeaway', label: 'Take Away', icon: '🥤', active: false }
  ];

  const CategoryCard = ({ category, isSelected, onClick }) => (
    <div
      onClick={() => onClick(category.id)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 80,
        height: 80,
        borderRadius: 12,
        background: isSelected ? category.color : 'white',
        boxShadow: isSelected
          ? `0 4px 12px ${category.color}40`
          : '0 2px 8px rgba(0, 0, 0, 0.1)',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        border: isSelected ? 'none' : '1px solid #e8e9ea',
        transform: isSelected ? 'translateY(-2px)' : 'none'
      }}
    >
      <div style={{
        fontSize: 24,
        marginBottom: 4,
        filter: isSelected ? 'brightness(1.2)' : 'none'
      }}>
        {category.icon}
      </div>
      <Text style={{
        fontSize: 12,
        color: isSelected ? 'white' : '#666',
        fontWeight: isSelected ? 600 : 400,
        textAlign: 'center',
        lineHeight: 1.2
      }}>
        {category.name}
      </Text>
    </div>
  );

  return (
    <MainPage loading={state.loading}>
      <div style={{ display: "none" }}>
        <PrintInvoice
          ref={refInvoice}
          cart_list={state.cart_list}
          objSummary={objSummary}
        />
      </div>

      <div style={{
        minHeight: '100vh',
        padding: '20px'
      }}>
        <Row gutter={24} style={{ height: '100vh', overflow: 'hidden' }}>
          <Col span={16} style={{ height: '100%', overflowY: 'auto', paddingRight: 8 }}>
            <Card style={{ height: '100%', borderRadius: 20, border: 'none' }}>
              <div style={{ marginBottom: 32 }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 24
                }}>
                  <div>
                    <Title level={2} style={{ margin: 0, color: '#2c3e50' }}>
                      Menu
                    </Title>
                    <Text type="secondary" style={{ fontSize: 16 }}>
                      {state.list.length} items available
                    </Text>
                  </div>
                  <Badge count={state.cart_list.length} style={{ backgroundColor: '#ff6b35' }}>
                    <Avatar
                      size={48}
                      icon={<ShoppingCartOutlined />}
                      style={{ backgroundColor: '#f0f0f0', color: '#666' }}
                    />
                  </Badge>
                </div>

                <div style={{
                  background: '#f8f9fa',
                  borderRadius: 16,
                  padding: '16px 20px',
                  marginBottom: 24
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 8,
                    overflowX: 'auto',
                    paddingBottom: 4
                  }}>
                    {parentCategories.map(category => (
                      <CategoryCard
                        key={category.id}
                        category={category}
                        isSelected={selectedCategory === category.id}
                        onClick={setSelectedCategory}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div style={{
                height: 'calc(100% - 280px)',
                overflow: 'auto',
                paddingRight: 8,
                scrollbarWidth: 'thin',
                scrollbarColor: '#ff6b35 #f5f5f5'
              }}>
                <Row gutter={[24, 24]}>
                  {inStockProducts.map((product) => (
                    <Col key={product.id} xs={24} sm={12} md={12} lg={8}>
                      <ProductItem
                        {...product}
                        handleAdd={handleAdd}
                        resetTrigger={resetTrigger}
                      />
                    </Col>
                  ))}

                  {outOfStockProducts.map((product) => (
                    <Col key={product.id} xs={24} sm={12} md={12} lg={8}>
                      <ProductItem
                        {...product}
                        handleAdd={handleAdd}
                        resetTrigger={resetTrigger}
                        isOutOfStock={true} 
                      />
                    </Col>
                  ))}
                </Row>

                {filteredProducts.length === 0 && (
                  <Empty
                    description={
                      <div>
                        <Text style={{ fontSize: 16, color: '#999' }}>
                          No products in {parentCategories.find(c => c.id === selectedCategory)?.name || 'this category'}
                        </Text>
                        <br />
                        <Text type="secondary">
                          Try selecting a different category
                        </Text>
                      </div>
                    }
                    style={{ marginTop: 100 }}
                  />
                )}
              </div>
            </Card>
          </Col>

          <Col span={8}>
            <div style={{ position: 'sticky', top: 0 }}>
              <Card style={{ height: '100vh', borderRadius: 20, border: 'none', overflowY: 'auto' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 20,
                  paddingBottom: 16,
                  borderBottom: '2px solid #f0f0f0'
                }}>
                  <div>
                    <Title level={3} style={{ margin: 0, color: '#2c3e50' }}>
                      🛒 Your Order
                    </Title>
                    <Text type="secondary">
                      {state.cart_list.length} items in cart
                    </Text>
                  </div>
                  <Button
                    onClick={handleClearCart}
                    icon={<FiTrash2 />}
                    danger
                    type="text"
                    style={{ borderRadius: 8 }}
                  >
                    Clear All
                  </Button>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <Text strong style={{ display: 'block', marginBottom: 12, color: '#555' }}>
                    Order Type
                  </Text>
                  <Space>
                    {orderTypes.map(type => (
                      <Button
                        key={type.key}
                        type={type.active ? "primary" : "default"}
                        style={{
                          borderRadius: 20,
                          background: type.active ? '#ff6b35' : 'white',
                          border: type.active ? 'none' : '1px solid #e0e0e0',
                          color: type.active ? 'white' : '#666'
                        }}
                      >
                        {type.icon} {type.label}
                      </Button>
                    ))}
                  </Space>
                </div>

                <div style={{
                  height: 'calc(100% - 500px)',
                  overflow: 'auto',
                  marginBottom: 20,
                  paddingRight: 8
                }}>
                  {state.cart_list?.map((item, index) => (
                    <BillItem
                      key={`${item.customKey || item.id}-${index}`}
                      {...item}
                      handleQuantityChange={(value) => handleQuantityChange(value, index)}
                      handlePriceChange={(value) => handlePriceChange(value, index)}
                      handleActualPriceChange={(value) => handleActualPriceChange(value, index)}
                      showDiscountBadge={true}
                    />
                  ))}

                  {!state.cart_list.length && (
                    <Empty
                      description={
                        <div style={{ textAlign: 'center', padding: 40 }}>
                          <div style={{ fontSize: 48, marginBottom: 16 }}>🛒</div>
                          <Text style={{ fontSize: 16, color: '#999' }}>
                            Your cart is empty
                          </Text>
                          <br />
                          <Text type="secondary">
                            Add some delicious items from the menu
                          </Text>
                        </div>
                      }
                    />
                  )}
                </div>

                {state.cart_list.length > 0 && (
                  <div style={{
                    borderTop: '2px solid #f0f0f0',
                    paddingTop: 20,
                    background: '#fafafa',
                    margin: '-24px -24px -24px -24px',
                    padding: '20px 24px 24px 24px',
                    borderBottomLeftRadius: 20,
                    borderBottomRightRadius: 20
                  }}>
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text>Subtotal ({objSummary.total_qty} items)</Text>
                        <Text>${Number(objSummary.sub_total).toFixed(2)}</Text>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text>Tax & Fees</Text>
                        <Text>${Number(objSummary.tax || 0).toFixed(2)}</Text>
                      </div>
                      {objSummary.save_discount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <Text style={{ color: '#52c41a' }}>💰 You Save</Text>
                          <Text style={{ color: '#52c41a', fontWeight: 'bold' }}>
                            -${Number(objSummary.save_discount).toFixed(2)}
                          </Text>
                        </div>
                      )}

                      <Divider style={{ margin: '12px 0' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                        <Text strong style={{ fontSize: 18, color: '#2c3e50' }}>Total</Text>
                        <Text strong style={{ fontSize: 20, color: '#ff6b35' }}>
                          ${Number(objSummary.total || 0).toFixed(2)}
                        </Text>
                      </div>

                    </div>

                    <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
                      <Col span={12}>
                        <Text strong style={{ display: 'block', marginBottom: 8 }}>
                          <CreditCardOutlined /> Payment
                        </Text>
                        <Select
                          allowClear
                          size="large"
                          style={{ width: "100%", borderRadius: 8 }}
                          placeholder="Payment method"
                          options={[
                            { label: "❤️ Other", value: "Other" },
                            { label: "💵 Cash", value: "Cash" },
                            { label: "📱 Wing", value: "Wing" },
                            { label: "🏦 ABA", value: "ABA" },
                            { label: "💳 Card", value: "Card" },
                          ]}
                          value={objSummary.payment_method}
                          onSelect={(value) => {
                            setObjSummary((p) => ({
                              ...p,
                              payment_method: value,
                            }));
                          }}
                        />
                      </Col>
                    </Row>

                    {/* Place Order Button */}
                    <Button
                      disabled={isDisabled || state.cart_list.length == 0}
                      block
                      type="primary"
                      size="large"
                      style={{
                        background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
                        border: 'none',
                        borderRadius: 15,
                        height: 56,
                        fontSize: 18,
                        fontWeight: 'bold',
                        boxShadow: '0 6px 20px rgba(255, 107, 53, 0.4)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}
                      onClick={handleClickOut}
                    >
                      🚀 Place Order Now
                    </Button>
                  </div>
                )}
              </Card>
            </div>
          </Col>
        </Row>
        <QRPaymentModal
          visible={qrModalVisible}
          onClose={handleCloseQRModal}
          paymentLink={paymentData.paymentLink}
          orderNo={paymentData.orderNo}
          total={paymentData.total}
        />
      </div>
    </MainPage>
  );
}

export default PosPage;