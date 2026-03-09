import React, { useCallback, useEffect, useState, useRef } from "react";
import {
  Button,
  Empty,
  Input,
  InputNumber,
  message,
  notification,
  Select,
  Modal,
  Form,
  Tag,
  Typography,
  Spin,
  Divider,
  Radio,
  Checkbox,
  Badge,
  Drawer,
  List,
} from "antd";
import { request } from "../../util/helper";
import { configStore } from "../../store/configStore";
import { getIconForCategory, getColorForCategory } from "../../util/helper";
import { Config } from "../../util/config";
import { getProfile } from "../../store/profile.store";
import { useReactToPrint } from "react-to-print";
import PrintInvoice from "../../component/pos/PrintInvoice";
import QRPaymentModal from "../../QRPaymentModal/QRPaymentModal";
import { PriceDisplay } from "../../component/pos/ExchangeRateContext";
import {
  SearchOutlined,
  BellOutlined,
  FileTextOutlined,
  UserOutlined,
  DeleteOutlined,
  MinusOutlined,
  PlusOutlined,
  CreditCardOutlined,
  ClockCircleOutlined,
  ShoppingOutlined,
} from "@ant-design/icons";
import { FiSettings } from "react-icons/fi";
import ImgUser from "../../assets/profile.png";
import useSound from "use-sound";
import { useLanguage, translations } from "../../store/language.store";

// Public notification sound URL (stable mirror)
const BELL_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2857/2857-preview.mp3";

const { Text } = Typography;

// ─── Color Palette ──────────────────────────────────────────────────────────
const COLORS = {
  bg: "#f4f1eb",          // warm cream background
  darkGreen: "#1e4a2d",   // primary dark green
  midGreen: "#2d6a42",    // medium green
  accentGreen: "#3a7d52", // accent green
  white: "#ffffff",
  cardBg: "#ffffff",
  textPrimary: "#1a2e1a",
  textSecondary: "#6b7c6b",
  softBorder: "#e8e3d8",
  redBadge: "#e85d5d",
  softGold: "#f7c06a",
};

// ─── Default categories ──────────────────────────────────────────────────────
const defaultParentCategories = [
  { id: 51, name: "Coffee", icon: "☕", color: COLORS.darkGreen },
  { id: 52, name: "Juice", icon: "🧃", color: "#4a8a3a" },
  { id: 53, name: "Milk", icon: "🥛", color: "#3a6a9a" },
  { id: 54, name: "Snack", icon: "🍪", color: "#9a5a2a" },
  { id: 55, name: "Rice", icon: "🍚", color: "#7a4a8a" },
  { id: 56, name: "Dessert", icon: "🍰", color: "#c0543a" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getDayLabel() {
  const d = new Date();
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function getCategoryEmoji(catId) {
  const map = { 51: "☕", 52: "🧃", 53: "🥛", 54: "🍪", 55: "🍚", 56: "🍰" };
  return map[catId] || "🍽️";
}

// ─── Mini ProductCard ─────────────────────────────────────────────────────────
function ProductCard({ product, onAdd, cartQty }) {
  const [hovered, setHovered] = useState(false);
  const price = Number(
    product.unit_price || product.price || product.actual_price || 0
  );
  const isOOS = product.qty <= 0;
  const imgUrl = product.image ? Config.getFullImagePath(product.image) : null;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: COLORS.white,
        borderRadius: 18,
        padding: "14px 14px 12px",
        boxShadow: hovered
          ? "0 8px 28px rgba(30,74,45,0.15)"
          : "0 2px 10px rgba(0,0,0,0.06)",
        transform: hovered ? "translateY(-3px)" : "none",
        transition: "all 0.25s ease",
        cursor: isOOS ? "default" : "pointer",
        opacity: isOOS ? 0.55 : 1,
        position: "relative",
        border: `1px solid ${COLORS.softBorder}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
      }}
    >
      {/* discount badge */}
      {product.discount > 0 && (
        <div
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            background: "#e85d5d",
            color: "#fff",
            borderRadius: "6px",
            padding: "2px 6px",
            fontSize: "10px",
            fontWeight: 800,
            zIndex: 2,
          }}
        >
          -{product.discount}%
        </div>
      )}

      {/* cart badge */}
      {cartQty > 0 && (
        <div
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            background: COLORS.darkGreen,
            color: "#fff",
            borderRadius: "50%",
            width: 24,
            height: 24,
            fontSize: 12,
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 8px rgba(30,74,45,0.3)",
            zIndex: 2,
          }}
        >
          {cartQty}
        </div>
      )}

      {/* product image */}
      <div
        style={{
          width: "100%",
          aspectRatio: "1/1",
          borderRadius: 14,
          overflow: "hidden",
          background: "#f8f7f2",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginBottom: 4,
        }}
      >
        {imgUrl ? (
          <img
            src={imgUrl}
            alt={product.name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: hovered ? "scale(1.1)" : "scale(1)",
              transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)"
            }}
          />
        ) : (
          <span style={{ fontSize: 44 }}>
            {getIconForCategory(product.category_name)}
          </span>
        )}
      </div>

      {/* name + price */}
      <div style={{ width: "100%", textAlign: "left" }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: 14,
            color: COLORS.textPrimary,
            marginBottom: 2,
            maxWidth: "100%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {product.name}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: COLORS.darkGreen }}>
            ${(price - (price * (parseFloat(product.discount) || 0) / 100)).toFixed(2)}
          </span>
          {product.discount > 0 && (
            <span style={{ fontSize: 11, color: COLORS.textSecondary, textDecoration: "line-through", fontWeight: 500 }}>
              ${price.toFixed(2)}
            </span>
          )}
        </div>
      </div>

      {/* add button */}
      <button
        onClick={() => !isOOS && onAdd(product)}
        disabled={isOOS}
        style={{
          position: "absolute",
          bottom: 12,
          right: 12,
          width: 30,
          height: 30,
          borderRadius: "50%",
          background:
            cartQty > 0
              ? COLORS.darkGreen
              : isOOS
                ? "#ccc"
                : COLORS.white,
          border: `2px solid ${isOOS ? "#ccc" : COLORS.darkGreen}`,
          color: cartQty > 0 ? "#fff" : COLORS.darkGreen,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: isOOS ? "not-allowed" : "pointer",
          fontSize: 18,
          fontWeight: 700,
          transition: "all 0.2s ease",
          boxShadow: cartQty > 0 ? "0 4px 12px rgba(30,74,45,0.3)" : "none",
          lineHeight: 1,
          padding: 0,
        }}
      >
        +
      </button>
    </div>
  );
}

// ─── Bill Cart Item ───────────────────────────────────────────────────────────
function BillCartItem({ item, onIncrease, onDecrease, onRemove }) {
  const price =
    Number(item.unit_price || item.price || 0) * Number(item.cart_qty || 1);
  const imgUrl = item.image ? Config.getFullImagePath(item.image) : null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 0",
        borderBottom: `1px solid ${COLORS.softBorder}`,
      }}
    >
      {/* image */}
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 10,
          overflow: "hidden",
          background: "#f0ede6",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {imgUrl ? (
          <img
            src={imgUrl}
            alt={item.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <span style={{ fontSize: 22 }}>
            {getIconForCategory(item.category_name)}
          </span>
        )}
      </div>

      {/* info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: 13,
            color: COLORS.textPrimary,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {item.display_name || item.name}
        </div>
        {item.note && (
          <div style={{ fontSize: 11, color: COLORS.midGreen, fontWeight: 500 }}>
            {item.note}
          </div>
        )}
        {item.mood && (
          <div style={{ fontSize: 11, color: COLORS.textSecondary }}>
            {item.mood === "hot" ? "🔥 Hot" : "❄️ Cold"}
            {item.size ? ` • ${item.size}` : ""}
          </div>
        )}
        <div style={{ fontSize: 11, color: COLORS.textSecondary, display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontWeight: 700, color: COLORS.darkGreen }}>
            ${(Number(item.unit_price || item.price || 0) * (1 - (parseFloat(item.discount || 0) / 100))).toFixed(2)}
          </span>
          {item.discount > 0 && (
            <span style={{ textDecoration: "line-through", fontSize: "10px", opacity: 0.6 }}>
              ${Number(item.unit_price || item.price || 0).toFixed(2)}
            </span>
          )}
          <span>x {item.cart_qty}</span>
        </div>
      </div>

      {/* qty controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <button
          onClick={() => onDecrease(item)}
          style={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            border: `1px solid ${COLORS.softBorder}`,
            background: "#fff",
            cursor: "pointer",
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: COLORS.textSecondary,
            padding: 0,
          }}
        >
          −
        </button>
        <span style={{ fontSize: 13, fontWeight: 600, minWidth: 16, textAlign: "center" }}>
          {item.cart_qty}
        </span>
        <button
          onClick={() => onIncrease(item)}
          style={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            border: `none`,
            background: COLORS.darkGreen,
            cursor: "pointer",
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            padding: 0,
          }}
        >
          +
        </button>
      </div>

      {/* total price */}
      <div
        style={{
          fontSize: 13,
          fontWeight: 800,
          color: COLORS.darkGreen,
          minWidth: 50,
          textAlign: "right",
          padding: "2px 6px",
          background: "#f8f7f2",
          borderRadius: 8,
          border: `1px solid ${COLORS.softBorder}`,
        }}
      >
        ${(Number(item.unit_price || item.price || 0) * (1 - (parseFloat(item.discount || 0) / 100)) * Number(item.cart_qty || 1)).toFixed(2)}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function PosPage() {
  const { lang } = useLanguage();
  const t = translations[lang];
  const [isDisabled, setIsDisabled] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(51);
  const [parentCategories, setParentCategories] = useState(defaultParentCategories);
  const [searchText, setSearchText] = useState("");
  const [orderType, setOrderType] = useState("dine_in");
  const [customerName, setCustomerName] = useState("");
  const [tableNo, setTableNo] = useState("");
  const [playBell] = useSound(BELL_SOUND_URL);
  const [isSoundEnabled, setIsSoundEnabled] = useState(false);
  const prevPendingCountRef = useRef(0);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [selectedProductForOptions, setSelectedProductForOptions] = useState(null);
  const [tempOptions, setTempOptions] = useState({ mood: "hot", size: "M", sugar: "100%", addons: [] });
  const [paymentData, setPaymentData] = useState({ paymentLink: "", orderNo: "", total: 0 });
  const [pendingOrdersVisible, setPendingOrdersVisible] = useState(false);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [branchInfo, setBranchInfo] = useState(null);

  const [currentOrderId, setCurrentOrderId] = useState(null);

  const { config } = configStore();
  const refInvoice = useRef(null);
  const [form] = Form.useForm();

  const [state, setState] = useState({
    list: [],
    customers: [],
    total: 0,
    loading: false,
    cart_list: [],
  });

  const [objSummary, setObjSummary] = useState({
    sub_total: 0,
    total_qty: 0,
    save_discount: 0,
    tax: 0,
    total: 0,
    total_paid: 0,
    customer_id: null,
    user_id: null,
    payment_method: null,
    remark: null,
    order_no: null,
    order_date: null,
  });

  const profile = getProfile();
  const userId = profile?.user_id;

  // ── time disable ──
  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      setIsDisabled(now.getHours() === 0 && now.getMinutes() === 0);
    };
    checkTime();
    const iv = setInterval(checkTime, 60000);
    return () => clearInterval(iv);
  }, []);

  // ── set user id ──
  useEffect(() => {
    setObjSummary((p) => ({ ...p, user_id: userId }));
  }, [userId]);

  // ── initial data ──
  useEffect(() => {
    getParentCategories();
    getBranchInfo();
    getList();
    getPendingOrders();
    const iv = setInterval(getPendingOrders, 30000); // Check every 30s
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    getList();
  }, [selectedCategory]);

  useEffect(() => {
    handleCalSummary();
  }, [state.cart_list]);

  const getPendingOrders = async () => {
    try {
      const res = await request("order-pending", "get");
      if (res && res.list) {
        setPendingOrders(res.list);
        setPendingCount(res.list.length);

        // Sound Notification and Message
        if (res.list.length > prevPendingCountRef.current) {
          if (isSoundEnabled) {
            playBell();
          }
          message.info({
            content: `🔔 ${t.new_order_received}`,
            icon: <BellOutlined style={{ color: COLORS.darkGreen }} />,
            duration: 5,
          });
        }
        prevPendingCountRef.current = res.list.length;

        // Auto-fetch details for each pending order to show summary
        res.list.forEach(async (order) => {
          if (!order.details) {
            const detailRes = await request(`order/${order.id}`, "get");
            if (detailRes && detailRes.details) {
              setPendingOrders(prev => prev.map(o =>
                o.id === order.id ? { ...o, details: detailRes.details } : o
              ));
            }
          }
        });
      }
    } catch (error) {
      console.error("Error fetching pending orders:", error);
    }
  };

  // ── fetch categories ──
  const getParentCategories = async () => {
    try {
      const res = await request("category", "get");
      if (res && res.list) {
        const cats = res.list.map((c) => ({
          id: c.id,
          name: c.name,
          icon: getIconForCategory(c.name),
          color: getColorForCategory(c.name) || COLORS.darkGreen,
        }));
        setParentCategories(cats.length > 0 ? cats : defaultParentCategories);
        if (cats.length > 0 && !cats.find(c => c.id === selectedCategory)) {
          setSelectedCategory(cats[0].id);
        }
      } else {
        setParentCategories(defaultParentCategories);
      }
    } catch {
      setParentCategories(defaultParentCategories);
    }
  };

  const getBranchInfo = async () => {
    try {
      const res = await request("branch", "get");
      if (res && res.list) {
        const currentBranch = res.list.find(b => b.id === profile?.branch_id) || res.list[0];
        setBranchInfo(currentBranch);
      }
    } catch (error) {
      console.error("Error fetching branch info:", error);
    }
  };

  // ── fetch products ──
  const getList = async () => {
    if (!userId) return;
    setState((p) => ({ ...p, loading: true }));
    try {
      const res = await request(`product`, "get", {
        category_id: selectedCategory,
      });
      if (res && !res.error) {
        // API already filters by parent_id — no need to filter client-side
        const products = res.list || [];
        setState((p) => ({ ...p, list: products, total: products.length, loading: false }));
      } else {
        setState((p) => ({ ...p, loading: false }));
      }
    } catch {
      setState((p) => ({ ...p, loading: false }));
    }
  };

  // ── calculate summary ──
  const handleCalSummary = useCallback(() => {
    let total_qty = 0;
    let sub_total = 0;
    let save_discount = 0;

    state.cart_list.forEach((item) => {
      const qty = Number(item.cart_qty) || 0;
      const originalPrice = Number(item.unit_price || item.price || 0);
      const discountPercent = parseFloat(item.discount) || 0;
      const discountedPrice = originalPrice * (1 - (discountPercent / 100));

      total_qty += qty;
      sub_total += originalPrice * qty;
      save_discount += (originalPrice - discountedPrice) * qty;
    });

    const total = sub_total - save_discount;

    setObjSummary((p) => ({
      ...p,
      total_qty,
      sub_total: +sub_total.toFixed(2),
      save_discount: +save_discount.toFixed(2),
      total: +total.toFixed(2),
      tax: 0,
    }));
  }, [state.cart_list]);

  // ── cart helpers ──
  const handleAdd = (product) => {
    setState((prev) => {
      const cart = [...prev.cart_list];
      const idx = cart.findIndex((c) => c.id === product.id);
      if (idx === -1) {
        if (product.qty <= 0) {
          notification.error({ message: "Out of Stock" });
          return prev;
        }

        const isCoffee = product.category_name?.toLowerCase().includes("coffee");
        const hasOptions = (product.sizes && JSON.parse(product.sizes).length > 0) || (product.addons && JSON.parse(product.addons).length > 0);

        if (isCoffee || hasOptions) {
          setSelectedProductForOptions(product);
          // Default options
          setTempOptions({
            mood: "ice",
            size: product.sizes ? JSON.parse(product.sizes)[0]?.label : "M",
            sugar: "100%",
            addons: []
          });
          setOptionsModalVisible(true);
          return prev;
        }

        cart.push({ ...product, cart_qty: 1 });
      } else {
        if (cart[idx].cart_qty >= product.qty) {
          notification.warning({ message: `Only ${product.qty} available` });
          return prev;
        }
        cart[idx] = { ...cart[idx], cart_qty: cart[idx].cart_qty + 1 };
      }
      return { ...prev, cart_list: cart };
    });
  };

  const handleConfirmOptions = () => {
    const product = selectedProductForOptions;
    setState((prev) => {
      const cart = [...prev.cart_list];

      let adjustedPrice = Number(product.price || product.unit_price || 0);
      if (product.sizes) {
        const sizes = JSON.parse(product.sizes);
        const selectedSizeObj = sizes.find(s => s.label === tempOptions.size);
        if (selectedSizeObj && selectedSizeObj.price) {
          adjustedPrice = Number(selectedSizeObj.price);
        }
      }

      if (product.addons && tempOptions.addons.length > 0) {
        const addonsList = JSON.parse(product.addons);
        tempOptions.addons.forEach(addonLabel => {
          const addonObj = addonsList.find(a => a.label === addonLabel);
          if (addonObj && addonObj.price) {
            adjustedPrice += Number(addonObj.price);
          }
        });
      }

      const addonStr = tempOptions.addons.length > 0 ? ` + ${tempOptions.addons.join(", ")}` : "";
      const optionNote = `${tempOptions.mood === "hot" ? "🔥 Hot" : "❄️ Ice"} (${tempOptions.size}, ${tempOptions.sugar} Sugar)${addonStr}`;

      const uniqueName = `${product.name} [${optionNote}]`;
      const uniqueId = `${product.id}-${optionNote}`;
      const idx = cart.findIndex((c) => c.unique_id === uniqueId);

      if (idx === -1) {
        cart.push({
          ...product,
          unique_id: uniqueId,
          display_name: uniqueName,
          unit_price: adjustedPrice,
          price: adjustedPrice,
          cart_qty: 1,
          mood: tempOptions.mood,
          size: tempOptions.size,
          sugar: tempOptions.sugar,
          addons_selected: tempOptions.addons,
          note: optionNote
        });
      } else {
        cart[idx] = { ...cart[idx], cart_qty: cart[idx].cart_qty + 1 };
      }
      return { ...prev, cart_list: cart };
    });
    setOptionsModalVisible(false);
    setSelectedProductForOptions(null);
  };

  const handleIncrease = (item) => {
    setState((prev) => {
      const cart = prev.cart_list.map((c) =>
        c.id === item.id && c.name === item.name
          ? { ...c, cart_qty: Math.min(c.cart_qty + 1, item.qty || 999) }
          : c
      );
      return { ...prev, cart_list: cart };
    });
  };

  const handleDecrease = (item) => {
    setState((prev) => {
      const cart = prev.cart_list
        .map((c) =>
          c.id === item.id && c.name === item.name
            ? { ...c, cart_qty: c.cart_qty - 1 }
            : c
        )
        .filter((c) => c.cart_qty > 0);
      return { ...prev, cart_list: cart };
    });
  };

  const handleRemoveItem = (item) => {
    setState((prev) => ({
      ...prev,
      cart_list: prev.cart_list.filter(
        (c) => !(c.id === item.id && c.name === item.name)
      ),
    }));
  };

  const handleClearCart = () => {
    setState((p) => ({ ...p, cart_list: [] }));
    setObjSummary((p) => ({
      ...p,
      sub_total: 0, total_qty: 0, save_discount: 0,
      tax: 0, total: 0, total_paid: 0,
      customer_id: null, payment_method: null,
    }));
    setCustomerName("");
    setTableNo("");
    setCurrentOrderId(null);
    form.resetFields();
  };

  const handleSelectPendingOrder = async (order) => {
    setState((p) => ({ ...p, loading: true }));
    try {
      const res = await request(`order/${order.id}`, "get");
      if (res && res.details) {
        // Map details back to cart format
        const cart = res.details.map((d) => ({
          id: d.product_id,
          name: d.product_name,
          unit_price: d.price,
          cart_qty: d.qty,
          image: d.image,
          note: d.note || "",
        }));

        setState((p) => ({
          ...p,
          cart_list: cart,
          loading: false,
        }));
        setCustomerName(order.customer_name || "");
        setTableNo(order.table_no || "");
        setOrderType(order.order_type || "dine_in");
        setCurrentOrderId(order.id);
        setPendingOrdersVisible(false);
        message.info(`Loaded order for ${order.table_no ? "Table " + order.table_no : "Guest"}`);
      }
    } catch (error) {
      console.error("Error loading pending order:", error);
      setState((p) => ({ ...p, loading: false }));
    }
  };

  // ── place order ──
  const handleClickOut = async () => {
    if (!state.cart_list.length) {
      message.error("Cart is empty!");
      return;
    }
    if (!objSummary.payment_method) {
      message.error("Please select a payment method!");
      return;
    }
    const items = state.cart_list.map((item) => {
      const qty = Number(item.cart_qty) || 1;
      const unitPrice = Number(item.unit_price || item.price || 0);
      return {
        product_id: item.id,
        qty: qty,
        price: unitPrice,
        note: item.note || ""
      };
    });
    const param = {
      ...objSummary,
      cart_items: items, // renamed from items to cart_items for SaaS API
      customer_name: customerName,
      table_no: tableNo,
      order_type: orderType,
      sub_total: +objSummary.sub_total,
      total_amount: +objSummary.total, // renamed from total to total_amount
      total_qty: +objSummary.total_qty,
      tax: 0,
      discount: 0,
      payment_method: objSummary.payment_method
    };
    try {
      let res;
      if (currentOrderId) {
        res = await request("order-status", "put", {
          order_id: currentOrderId,
          status: "completed",
          payment_method: objSummary.payment_method
        });
        if (res && !res.error) res.order_id = currentOrderId;
      } else {
        res = await request("order", "post", param);
      }

      if (res && !res.error) {
        message.success(currentOrderId ? t.order_completed : t.order_placed);
        if (res.payment_link) {
          setPaymentData({ paymentLink: res.payment_link, orderNo: res.order_no, total: param.total });
          setQrModalVisible(true);
        }
        setObjSummary((p) => ({
          ...p,
          order_no: res.order_id,
          order_date: new Date().toISOString(),
        }));
        setTimeout(() => handlePrintInvoice(), 2000);
      } else {
        message.error(`Order failed! ${res?.message || res?.error || ""}`);
      }
    } catch {
      message.error(t.order_failed || "Order failed!");
    }
  };

  // ── print ──
  const handlePrintInvoice = useReactToPrint({
    contentRef: refInvoice,
    onAfterPrint: () => handleClearCart(),
  });

  // ── filtered products ──
  const filteredProducts = state.list.filter((p) =>
    p.name?.toLowerCase().includes(searchText.toLowerCase())
  );
  const inStock = filteredProducts.filter((p) => p.qty > 0);
  const outOfStock = filteredProducts.filter((p) => p.qty <= 0);
  const allVisible = [...inStock, ...outOfStock];

  const getCartQty = (productId) => {
    const item = state.cart_list.find((c) => c.id === productId);
    return item ? item.cart_qty : 0;
  };

  // ── category availability ──
  const getCategoryStock = (catId) => {
    // placeholder: we just say "Available" for selected, add logic if needed
    return "Available";
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        background: COLORS.bg,
        minHeight: "100vh",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Hidden print invoice */}
      <div style={{ display: "none" }}>
        <PrintInvoice ref={refInvoice} cart_list={state.cart_list} objSummary={objSummary} />
      </div>

      {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
      {/* ══ BODY ════════════════════════════════════════════════════════════ */}
      <div
        style={{
          display: "flex",
          flex: 1,
          gap: 0,
          overflow: "hidden",
          height: "calc(100vh - 180px)", // Adjusted for MainLayout padding/header
        }}
      >
        {/* ── LEFT PANEL ── */}
        <div
          style={{
            flex: 1,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            padding: "20px 20px 0 20px",
            gap: 16,
          }}
        >
          {/* Search bar */}
          <div
            style={{
              background: COLORS.white,
              borderRadius: 14,
              padding: "10px 16px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              border: `1px solid ${COLORS.softBorder}`,
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
          >
            <SearchOutlined style={{ fontSize: 16, color: COLORS.textSecondary }} />
            <input
              placeholder={t.search_product}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: 14,
                color: COLORS.textPrimary,
                fontFamily: "inherit",
              }}
            />
            <div
              style={{
                fontSize: 11,
                color: COLORS.textSecondary,
                background: "#f5f5f5",
                borderRadius: 6,
                padding: "2px 6px",
                fontWeight: 600,
                letterSpacing: 0.5,
              }}
            >
              ⌘K
            </div>

            <Divider type="vertical" />

            <div style={{ fontSize: 13, color: COLORS.textSecondary, fontWeight: 500, whiteSpace: "nowrap" }}>
              {t.total}: <span style={{ fontWeight: 700, color: COLORS.darkGreen }}>{state.cart_list.length}</span>
            </div>

            <Divider type="vertical" />

            {/* Table Orders Button */}
            <Badge count={pendingCount} size="small" offset={[-2, 2]} overflowCount={99}>
              <button
                onClick={() => setPendingOrdersVisible(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: pendingCount > 0 ? COLORS.darkGreen : COLORS.white,
                  border: `1px solid ${pendingCount > 0 ? COLORS.darkGreen : COLORS.softBorder}`,
                  borderRadius: 8,
                  padding: "6px 14px",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 700,
                  color: pendingCount > 0 ? "#fff" : COLORS.textPrimary,
                  transition: "all 0.25s",
                  whiteSpace: "nowrap",
                  boxShadow: pendingCount > 0 ? "0 4px 12px rgba(30,74,45,0.2)" : "none"
                }}
              >
                <ClockCircleOutlined style={{ fontSize: 16 }} />
                <span>{t.pending_table}</span>
              </button>
            </Badge>

            <button
              onClick={() => {
                setIsSoundEnabled(!isSoundEnabled);
                if (!isSoundEnabled) {
                  playBell(); // Play once to "unlock" audio in browser
                  message.success("Audio notifications enabled!");
                }
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: isSoundEnabled ? COLORS.darkGreen : COLORS.white,
                border: `1px solid ${isSoundEnabled ? COLORS.darkGreen : COLORS.softBorder}`,
                borderRadius: 8,
                padding: "6px 14px",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 700,
                color: isSoundEnabled ? "#fff" : COLORS.textPrimary,
                transition: "all 0.25s",
                whiteSpace: "nowrap",
                boxShadow: isSoundEnabled ? "0 4px 12px rgba(30,74,45,0.2)" : "none"
              }}
            >
              <BellOutlined style={{ fontSize: 16 }} />
              <span>{isSoundEnabled ? t.sound_on : t.sound_off}</span>
            </button>

            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: COLORS.white,
                border: `1px solid ${COLORS.softBorder}`,
                borderRadius: 8,
                padding: "4px 10px",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
                color: COLORS.textPrimary,
                transition: "all 0.2s",
                whiteSpace: "nowrap"
              }}
              onMouseEnter={(e) =>
              ((e.currentTarget.style.borderColor = COLORS.darkGreen),
                (e.currentTarget.style.color = COLORS.darkGreen))
              }
              onMouseLeave={(e) =>
              ((e.currentTarget.style.borderColor = COLORS.softBorder),
                (e.currentTarget.style.color = COLORS.textPrimary))
              }
            >
              <FileTextOutlined /> {t.report}
            </button>
          </div>

          {/* Category cards */}
          <div
            style={{
              display: "flex",
              gap: 12,
              overflowX: "auto",
              paddingBottom: 4,
              scrollbarWidth: "none",
            }}
          >
            {parentCategories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              // Estimate items in this category
              const total = state.list.filter(
                (p) => p.category_id === cat.id
              ).length;
              const inStockCount = state.list.filter(
                (p) => p.category_id === cat.id && p.qty > 0
              ).length;
              const needsRestock =
                selectedCategory === cat.id
                  ? outOfStock.length > 0 && inStock.length === 0
                  : false;

              return (
                <div
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    minWidth: 150,
                    borderRadius: 18,
                    padding: "14px 16px",
                    background: isSelected ? COLORS.darkGreen : COLORS.white,
                    border: `1px solid ${isSelected ? COLORS.darkGreen : COLORS.softBorder}`,
                    cursor: "pointer",
                    position: "relative",
                    overflow: "hidden",
                    transition: "all 0.25s ease",
                    boxShadow: isSelected
                      ? "0 6px 20px rgba(30,74,45,0.3)"
                      : "0 2px 8px rgba(0,0,0,0.05)",
                    flexShrink: 0,
                  }}
                >
                  {/* Stock badge */}
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      background: needsRestock
                        ? "rgba(232,93,93,0.15)"
                        : isSelected
                          ? "rgba(255,255,255,0.15)"
                          : "rgba(30,74,45,0.08)",
                      borderRadius: 20,
                      padding: "3px 10px",
                      fontSize: 11,
                      fontWeight: 600,
                      color: needsRestock
                        ? COLORS.redBadge
                        : isSelected
                          ? "#fff"
                          : COLORS.darkGreen,
                      border: needsRestock ? `1px solid ${COLORS.redBadge}` : "none",
                      marginBottom: 10,
                    }}
                  >
                    {needsRestock && (
                      <span style={{ width: 6, height: 6, background: COLORS.redBadge, borderRadius: "50%", display: "inline-block" }} />
                    )}
                    {needsRestock ? t.need_restock : t.available}
                  </div>

                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: isSelected ? COLORS.white : COLORS.textPrimary,
                      marginBottom: 2,
                    }}
                  >
                    {cat.name}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: isSelected ? "rgba(255,255,255,0.7)" : COLORS.textSecondary,
                    }}
                  >
                    {selectedCategory == cat.id
                      ? `${state.list.length} ${t.items}`
                      : "..."}
                  </div>

                  {/* Decorative circle for selected */}
                  {isSelected && (
                    <div
                      style={{
                        position: "absolute",
                        right: -20,
                        bottom: -20,
                        width: 80,
                        height: 80,
                        borderRadius: "50%",
                        background: "rgba(255,255,255,0.08)",
                      }}
                    />
                  )}
                  <div
                    style={{
                      position: "absolute",
                      right: 8,
                      bottom: 6,
                      fontSize: 36,
                      opacity: isSelected ? 0.18 : 0.06,
                    }}
                  >
                    {cat.icon}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Product Grid */}
          <Spin spinning={state.loading}>
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                paddingBottom: 20,
                scrollbarWidth: "thin",
                scrollbarColor: `${COLORS.darkGreen} #f0ede6`,
              }}
            >
              {allVisible.length === 0 && !state.loading ? (
                <Empty
                  style={{ marginTop: 60 }}
                  description={
                    <span style={{ color: COLORS.textSecondary, fontSize: 14 }}>
                      {t.no_data}
                    </span>
                  }
                />
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                    gap: 14,
                  }}
                >
                  {allVisible.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAdd={handleAdd}
                      cartQty={getCartQty(product.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </Spin>
        </div>

        {/* ── RIGHT PANEL / RECEIPT ── */}
        <div
          style={{
            width: 320,
            flexShrink: 0,
            background: COLORS.white,
            borderLeft: `1px solid ${COLORS.softBorder}`,
            display: "flex",
            flexDirection: "column",
            height: "100%",
            overflowY: "auto",
          }}
        >
          {/* Receipt header */}
          <div
            style={{
              padding: "18px 18px 14px",
              borderBottom: `1px solid ${COLORS.softBorder}`,
            }}
          >
            <div style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 2 }}>
              {t.purchase_receipt}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary }}>
              #{String(objSummary.order_no || Math.floor(Math.random() * 90000) + 10000).padStart(5, "0")}
            </div>
          </div>

          {/* Order type tabs */}
          <div style={{ padding: "14px 18px 0" }}>
            <div
              style={{
                display: "flex",
                background: "#f5f3ee",
                borderRadius: 12,
                padding: 4,
                gap: 4,
                marginBottom: 16,
              }}
            >
              {[
                { key: "dine_in", label: t.dine_in },
                { key: "take_away", label: t.take_away },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setOrderType(t.key)}
                  style={{
                    flex: 1,
                    padding: "8px 0",
                    borderRadius: 9,
                    border: "none",
                    background:
                      orderType === t.key ? COLORS.darkGreen : "transparent",
                    color: orderType === t.key ? "#fff" : COLORS.textSecondary,
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    fontFamily: "inherit",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Customer name + table */}
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: COLORS.textSecondary, marginBottom: 4, fontWeight: 500 }}>
                  {t.customer_name}
                </div>
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Name..."
                  style={{
                    width: "100%",
                    border: `1px solid ${COLORS.softBorder}`,
                    borderRadius: 8,
                    padding: "7px 10px",
                    fontSize: 13,
                    outline: "none",
                    fontFamily: "inherit",
                    background: "#fafaf8",
                    color: COLORS.textPrimary,
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div style={{ width: 70 }}>
                <div style={{ fontSize: 11, color: COLORS.textSecondary, marginBottom: 4, fontWeight: 500 }}>
                  {t.table_label}
                </div>
                <input
                  value={tableNo}
                  onChange={(e) => setTableNo(e.target.value)}
                  placeholder="T1"
                  style={{
                    width: "100%",
                    border: `1px solid ${COLORS.softBorder}`,
                    borderRadius: 8,
                    padding: "7px 8px",
                    fontSize: 13,
                    outline: "none",
                    fontFamily: "inherit",
                    background: "#fafaf8",
                    color: COLORS.textPrimary,
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            {/* Order list label */}
            <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 6 }}>
              {t.order_list}
            </div>
          </div>

          {/* Cart items */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "0 18px",
              scrollbarWidth: "thin",
              scrollbarColor: `${COLORS.softBorder} transparent`,
            }}
          >
            {state.cart_list.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px 0",
                  color: COLORS.textSecondary,
                }}
              >
                <div style={{ fontSize: 36, marginBottom: 10 }}>🛒</div>
                <div style={{ fontSize: 13 }}>{t.cart_empty}</div>
                <div style={{ fontSize: 11, marginTop: 4 }}>
                  {t.add_from_menu}
                </div>
              </div>
            ) : (
              state.cart_list.map((item, idx) => (
                <BillCartItem
                  key={`${item.id}-${idx}`}
                  item={item}
                  onIncrease={handleIncrease}
                  onDecrease={handleDecrease}
                  onRemove={handleRemoveItem}
                />
              ))
            )}
          </div>

          {/* Payment section */}
          <div
            style={{
              padding: "14px 18px 18px",
              borderTop: `1px solid ${COLORS.softBorder}`,
              background: COLORS.white,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: COLORS.textPrimary,
                marginBottom: 10,
              }}
            >
              {t.payment_details}
            </div>

            {/* Subtotal */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 6,
                fontSize: 13,
              }}
            >
              <span style={{ color: COLORS.textSecondary }}>
                {t.subtotal} ({objSummary.total_qty} {t.items})
              </span>
              <span style={{ color: COLORS.textPrimary, fontWeight: 500 }}>
                ${objSummary.sub_total.toFixed(2)}
              </span>
            </div>

            {/* Discount Summary */}
            {objSummary.save_discount > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 6,
                  fontSize: 13,
                  color: "#e85d5d",
                }}
              >
                <span style={{ fontWeight: 500 }}>{t.total_savings}</span>
                <span style={{ fontWeight: 700 }}>
                  -${objSummary.save_discount.toFixed(2)}
                </span>
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 12,
                fontSize: 13,
              }}
            >
              <span style={{ color: COLORS.textSecondary }}>{t.tax_fees}</span>
              <span style={{ color: COLORS.textPrimary, fontWeight: 500 }}>$0.00</span>
            </div>

            <div
              style={{
                borderTop: `1px dashed ${COLORS.softBorder}`,
                paddingTop: 10,
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 14,
              }}
            >
              <div style={{ textAlign: "right", marginTop: 4 }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: COLORS.textPrimary, marginRight: 8 }}>
                  {t.total}
                </span>
                <span style={{ fontWeight: 900, fontSize: 22, color: COLORS.darkGreen }}>
                  ${objSummary.total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Payment method */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: COLORS.textSecondary, marginBottom: 6, fontWeight: 500 }}>
                {t.payment_method}
              </div>
              <Select
                size="large"
                style={{ width: "100%", borderRadius: 10 }}
                placeholder={t.select_payment}
                value={objSummary.payment_method}
                onChange={(v) =>
                  setObjSummary((p) => ({ ...p, payment_method: v }))
                }
                options={[
                  { label: "💵 Cash", value: "Cash" },
                  { label: "📱 Wing", value: "Wing" },
                  { label: "🏦 ABA", value: "ABA" },
                  { label: "💳 Card", value: "Card" },
                  { label: `❤️ ${t.all}`, value: "Other" },
                ]}
              />
            </div>

            {/* Clear Cart link */}
            {state.cart_list.length > 0 && (
              <button
                onClick={handleClearCart}
                style={{
                  background: "none",
                  border: "none",
                  color: COLORS.textSecondary,
                  fontSize: 12,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  marginBottom: 10,
                  fontFamily: "inherit",
                  padding: 0,
                }}
              >
                <DeleteOutlined /> {t.purge}
              </button>
            )}

            {/* Place Order button */}
            <button
              disabled={isDisabled || state.cart_list.length === 0 || !objSummary.payment_method}
              onClick={handleClickOut}
              style={{
                width: "100%",
                padding: "14px 0",
                borderRadius: 14,
                border: "none",
                background:
                  isDisabled || state.cart_list.length === 0 || !objSummary.payment_method
                    ? "#c5c5c5"
                    : COLORS.darkGreen,
                color: "#fff",
                fontWeight: 700,
                fontSize: 15,
                cursor:
                  isDisabled || state.cart_list.length === 0 || !objSummary.payment_method
                    ? "not-allowed"
                    : "pointer",
                transition: "all 0.25s ease",
                boxShadow:
                  state.cart_list.length > 0 && objSummary.payment_method
                    ? "0 6px 20px rgba(30,74,45,0.35)"
                    : "none",
                fontFamily: "inherit",
                letterSpacing: 0.3,
              }}
            >
              {t.place_order}
            </button>
          </div>
        </div>
      </div>

      {/* QR Modal */}
      <QRPaymentModal
        visible={qrModalVisible}
        onClose={() => {
          setQrModalVisible(false);
          setPaymentData({ paymentLink: "", orderNo: "", total: 0 });
        }}
        paymentLink={paymentData.paymentLink}
        orderNo={paymentData.orderNo}
        total={paymentData.total}
        branchInfo={branchInfo}
      />

      <Modal
        title={
          <div style={{ textAlign: 'center', fontSize: 18, color: COLORS.darkGreen }}>
            {t.customize_coffee}
          </div>
        }
        open={optionsModalVisible}
        onCancel={() => setOptionsModalVisible(false)}
        onOk={handleConfirmOptions}
        okText="Add to Order"
        cancelText="Cancel"
        okButtonProps={{ style: { background: COLORS.darkGreen, borderRadius: 8 } }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '10px 0' }}>
          {/* Mood Selector */}
          <div>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>{t.mood}</div>
            <Radio.Group
              value={tempOptions.mood}
              onChange={e => setTempOptions(p => ({ ...p, mood: e.target.value }))}
              buttonStyle="solid"
            >
              <Radio.Button value="hot">{t.hot}</Radio.Button>
              <Radio.Button value="ice">{t.ice}</Radio.Button>
            </Radio.Group>
          </div>

          {/* Size Selector */}
          <div>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>{t.size}</div>
            <Radio.Group
              value={tempOptions.size}
              onChange={e => setTempOptions(p => ({ ...p, size: e.target.value }))}
            >
              {(selectedProductForOptions?.sizes ? JSON.parse(selectedProductForOptions.sizes) : [
                { label: 'S', price: selectedProductForOptions?.price },
                { label: 'M', price: selectedProductForOptions?.price },
                { label: 'L', price: selectedProductForOptions?.price }
              ]).map(s => (
                <Radio key={s.label} value={s.label}>
                  {s.label} {s.price && s.price != selectedProductForOptions?.price ? `($${Number(s.price).toFixed(2)})` : ""}
                </Radio>
              ))}
            </Radio.Group>
          </div>

          {/* Sugar Selector */}
          <div>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>{t.sugar_level}</div>
            <Radio.Group
              value={tempOptions.sugar}
              onChange={e => setTempOptions(p => ({ ...p, sugar: e.target.value }))}
            >
              <Radio value="0%">0%</Radio>
              <Radio value="25%">25%</Radio>
              <Radio value="50%">50%</Radio>
              <Radio value="100%">100%</Radio>
            </Radio.Group>
          </div>

          {/* Add-ons Selector */}
          {(selectedProductForOptions?.addons && JSON.parse(selectedProductForOptions.addons).length > 0) && (
            <div>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>{t.addons}</div>
              <Checkbox.Group
                value={tempOptions.addons}
                onChange={v => setTempOptions(p => ({ ...p, addons: v }))}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {JSON.parse(selectedProductForOptions.addons).map(a => (
                    <Checkbox key={a.label} value={a.label}>
                      {a.label} (+${Number(a.price).toFixed(2)})
                    </Checkbox>
                  ))}
                </div>
              </Checkbox.Group>
            </div>
          )}
        </div>
      </Modal>

      {/* Pending Orders Drawer */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: COLORS.darkGreen }}>
            <ClockCircleOutlined />
            <span>{t.pending_orders}</span>
          </div>
        }
        placement="right"
        onClose={() => setPendingOrdersVisible(false)}
        open={pendingOrdersVisible}
        width={400}
        styles={{
          header: { borderBottom: `1px solid ${COLORS.softBorder}`, padding: '16px 24px' },
          body: { padding: 0 }
        }}
      >
        <List
          dataSource={pendingOrders}
          locale={{ emptyText: <Empty description={t.no_pending} /> }}
          renderItem={(order) => (
            <List.Item
              onClick={() => handleSelectPendingOrder(order)}
              style={{
                cursor: 'pointer',
                padding: '16px 24px',
                borderBottom: `1px solid ${COLORS.softBorder}`,
                transition: 'all 0.2s',
              }}
              className="pending-order-item"
            >
              <div style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text strong style={{ fontSize: 15 }}>
                    {order.table_no ? `${t.table_label} ${order.table_no}` : t.walk_in}
                  </Text>
                  <Tag color={order.status === 'unpaid' ? 'volcano' : 'blue'}>
                    {order.status.toUpperCase()}
                  </Tag>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {order.customer_name || t.guest}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </div>
                  <Text strong style={{ color: COLORS.darkGreen, fontSize: 16 }}>
                    ${Number(order.total_amount).toFixed(2)}
                  </Text>
                </div>

                {/* Show Order Items Summary */}
                {order.details && (
                  <div style={{ marginTop: 8, padding: '8px', background: '#f9f9f9', borderRadius: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, marginBottom: 4 }}>{t.items.toUpperCase()}:</div>
                    {order.details.map((d, i) => (
                      <div key={i} style={{ fontSize: 11, display: 'flex', justifyContent: 'space-between' }}>
                        <span>• {d.product_name} x {d.qty}</span>
                        {d.note && <span style={{ color: COLORS.midGreen, fontSize: 10, marginLeft: 10 }}>({d.note})</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </List.Item>
          )}
        />
        <div style={{ padding: 20 }}>
          <Button block onClick={getPendingOrders} icon={<ClockCircleOutlined />}>{t.refresh_list}</Button>
        </div>
      </Drawer>
    </div>
  );
}

export default PosPage;