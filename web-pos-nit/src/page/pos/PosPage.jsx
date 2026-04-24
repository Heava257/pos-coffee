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
  Space,
  Popconfirm,
} from "antd";
import { request, isPermission } from "../../util/helper";
import { configStore } from "../../store/configStore";
import { getIconForCategory, getColorForCategory } from "../../util/helper";
import { Config } from "../../util/config";
import { getPrinterSettings } from "../../store/printer.store";
import { useProfileStore } from "../../store/profileStore";
import { useReactToPrint } from "react-to-print";
import PrintInvoice from "../../component/pos/PrintInvoice";
import PrintKitchenTicket from "../../component/pos/PrintKitchenTicket";
import PrintShiftReport from "../../component/pos/PrintShiftReport";
import PrintLabel from "../../component/pos/PrintLabel";
import QRPaymentModal from "../../QRPaymentModal/QRPaymentModal";
import { PriceDisplay, useExchangeRate } from "../../component/pos/ExchangeRateContext";
import {
  SearchOutlined,
  BellOutlined,
  EnvironmentFilled,
  WarningFilled,
  FileTextOutlined,
  UserOutlined,
  DeleteOutlined,
  MinusOutlined,
  PlusOutlined,
  CreditCardOutlined,
  ClockCircleOutlined,
  ShoppingOutlined,
  ExpandOutlined,
  CompressOutlined,
  PrinterOutlined,
  UnorderedListOutlined,
  TableOutlined,
  PushpinOutlined,
  TagOutlined,
} from "@ant-design/icons";
import { FiSettings } from "react-icons/fi";
import { useUIStore } from "../../store/uiStore";
import ImgUser from "../../assets/profile.png";
import useSound from "use-sound";
import { useLanguage, translations } from "../../store/language.store";
import { useHeldOrdersStore } from "../../store/heldOrdersStore";
import {
  PauseCircleOutlined,
  HistoryOutlined,
  SaveOutlined,
  FolderOpenOutlined,
  PlusCircleOutlined,
} from "@ant-design/icons";


// Public notification sound URL (stable mirror)
const BELL_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2857/2857-preview.mp3";

const { Text } = Typography;

// ─── Utility ────────────────────────────────────────────────────────────────
const safeParse = (str) => {
  if (!str) return [];
  if (Array.isArray(str)) return str;
  try {
    const res = JSON.parse(str);
    return Array.isArray(res) ? res : [res];
  } catch (e) {
    return [];
  }
};

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
const getLocalizedDefaultCategories = (layout) => {
  if (layout === "pharmacy") {
    return [
      { id: 51, name: "Medicine", icon: "💊", color: "#2196f3" },
      { id: 52, name: "Supplements", icon: "🧴", color: "#64b5f6" },
      { id: 53, name: "HealthCare", icon: "🏥", color: "#90caf9" },
      { id: 54, name: "Equipment", icon: "🩹", color: "#1976d2" },
      { id: 55, name: "Personal Care", icon: "🪥", color: "#42a5f5" },
      { id: 56, name: "Others", icon: "📦", color: "#bbdefb" },
    ];
  }
  if (layout === "retail") {
    return [
      { id: 51, name: "Grocery", icon: "🛒", color: "#1e4a2d" },
      { id: 52, name: "Beverage", icon: "🥤", color: "#2d6a42" },
      { id: 53, name: "Ice Cream", icon: "🍦", color: "#3a7d52" },
      { id: 54, name: "Home Care", icon: "🧼", color: "#4a8a3a" },
      { id: 55, name: "Snack", icon: "🍿", color: "#5a9a4a" },
      { id: 56, name: "Others", icon: "📦", color: "#6aa05a" },
    ];
  }
  return [
    { id: 51, name: "Coffee", icon: "☕", color: COLORS.darkGreen },
    { id: 52, name: "Juice", icon: "🧃", color: "#4a8a3a" },
    { id: 53, name: "Milk", icon: "🥛", color: "#3a6a9a" },
    { id: 54, name: "Snack", icon: "🍪", color: "#9a5a2a" },
    { id: 55, name: "Rice", icon: "🍚", color: "#7a4a8a" },
    { id: 56, name: "Dessert", icon: "🍰", color: "#c0543a" },
  ];
};

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

// ─── Mini ProductCard (Memoized for performance) ──────────────────────────────
const ProductCard = React.memo(({ product, onAdd, cartQty }) => {
  const [hovered, setHovered] = useState(false);
  const [isImgLoaded, setIsImgLoaded] = useState(false);
  const productSizes = safeParse(product.sizes) || [];
  const productMoods = safeParse(product.moods) || [];
  const basePrice = Number(product.unit_price || product.price || product.actual_price || 0);
  const price = productSizes.length > 0
    ? Math.min(...productSizes.map(s => Number(s.price || 0)))
    : basePrice;

  const isOOS = product.product_type === 'recipe' ? false : Number(product.qty) <= 0;
  const imgUrl = product.image ? Config.optimizeCloudinary(Config.getFullImagePath(product.image), "w_300,h_300,c_fill,f_auto,q_auto") : null;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => !isOOS && onAdd(product)}
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
      {/* progress shimmer effect placeholder */}
      {!isImgLoaded && imgUrl && (
        <div style={{
          position: "absolute",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "linear-gradient(90deg, #f0ede6 25%, #f8f7f2 50%, #f0ede6 75%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.5s infinite",
          borderRadius: 18,
          zIndex: 1
        }} />
      )}

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
            loading="lazy"
            onLoad={() => setIsImgLoaded(true)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: isImgLoaded ? 1 : 0,
              transform: hovered ? "scale(1.1)" : "scale(1)",
              transition: "opacity 0.4s ease, transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)"
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
          <Tag color={product.product_type === 'recipe' ? "orange" : "blue"} style={{ fontSize: 9, borderRadius: 4, margin: 0, padding: '0 4px' }}>
            {product.product_type === 'recipe'
              ? `RECIPE (${product.estimated_servings ?? 0} Srv)`
              : `STOCK: ${product.qty}`}
          </Tag>
          <span style={{ fontSize: 9, color: COLORS.textSecondary, fontWeight: 700 }}>#{product.barcode || product.id}</span>
        </div>
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
        <div style={{ fontSize: 10, color: COLORS.textSecondary, marginBottom: 4, fontWeight: 600 }}>{product.category_name}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div>
            {productSizes.length > 0 && (
              <div style={{ fontSize: 9, color: COLORS.textSecondary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                from
              </div>
            )}
            <span style={{ fontSize: 15, fontWeight: 800, color: COLORS.darkGreen }}>
              ${(price - (price * (parseFloat(product.discount) || 0) / 100)).toFixed(2)}
            </span>
          </div>
          {productSizes.length > 0 && (
            <span style={{
              fontSize: 9, fontWeight: 700, background: '#e6f0ea',
              color: COLORS.midGreen, borderRadius: 4, padding: '2px 5px'
            }}>
              📏 {productSizes.length} sizes
            </span>
          )}
          {productMoods.length > 0 && (
            <span style={{
              fontSize: 9, fontWeight: 700, background: '#fff7e6',
              color: '#d46b08', borderRadius: 4, padding: '2px 5px'
            }}>
              🔥 {productMoods.length} moods
            </span>
          )}
          {product.discount > 0 && (
            <span style={{ fontSize: 11, color: COLORS.textSecondary, textDecoration: "line-through", fontWeight: 500 }}>
              ${price.toFixed(2)}
            </span>
          )}
        </div>
      </div>

      {/* add button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          !isOOS && onAdd(product);
        }}
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
      {/* styles */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
});

// ─── Compact Product List View (New) ──────────────────────────────
const ProductListView = React.memo(({ products, onAdd, getCartQty, COLORS }) => {
  return (
    <div style={{
      background: COLORS.white,
      borderRadius: 16,
      border: `1px solid ${COLORS.softBorder}`,
      overflow: 'hidden',
      marginTop: 8,
      boxShadow: '0 4px 15px rgba(0,0,0,0.04)'
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ background: '#f8fafc', borderBottom: `2px solid ${COLORS.softBorder}` }}>
          <tr>
            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: COLORS.textSecondary, fontWeight: 800 }}>PRODUCT & CATEGORY / ទំនិញ និងប្រភេទ</th>
            <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, color: COLORS.textSecondary, fontWeight: 800 }}>UNIT PRICE / តម្លៃ</th>
            <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 13, color: COLORS.textSecondary, fontWeight: 800 }}>STOCK / ស្តុក</th>
            <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 13, color: COLORS.textSecondary, fontWeight: 800 }}>ADD</th>
          </tr>
        </thead>
        <tbody>
          {products.map(p => {
            const cartQty = getCartQty(p.id);
            const isOOS = p.product_type === 'recipe' ? false : Number(p.qty) <= 0;
            const productSizes = safeParse(p.sizes) || [];
            const productMoods = safeParse(p.moods) || [];
            const basePrice = Number(p.unit_price || p.price || 0);
            const price = productSizes.length > 0
              ? Math.min(...productSizes.map(s => Number(s.price || 0)))
              : basePrice;
            const finalPrice = price - (price * (parseFloat(p.discount) || 0) / 100);

            return (
              <tr
                key={p.id}
                onClick={() => !isOOS && onAdd(p)}
                style={{ borderBottom: `1px solid ${COLORS.softBorder}`, cursor: isOOS ? 'default' : 'pointer', transition: 'all 0.2s', opacity: isOOS ? 0.6 : 1 }}
                onMouseEnter={e => !isOOS && (e.currentTarget.style.background = '#fcfbf7')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: '#f8f7f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${COLORS.softBorder}` }}>
                      {p.image ? (
                        <img src={Config.getFullImagePath(p.image)} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                      ) : (
                        <span style={{ fontSize: 18 }}>{getIconForCategory(p.category_name)}</span>
                      )}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.textPrimary }}>{p.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 1 }}>
                        <Tag color="blue" style={{ fontSize: 10, borderRadius: 4, margin: 0 }}>{p.category_name}</Tag>
                        {p.generic_name && <span style={{ fontSize: 11, color: COLORS.textSecondary, fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>({p.generic_name})</span>}
                      </div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, color: COLORS.darkGreen, fontSize: 15 }}>
                    {productSizes.length > 0 && (
                      <div style={{ fontSize: 9, color: COLORS.textSecondary, fontWeight: 600, textTransform: 'uppercase' }}>from</div>
                    )}
                    ${finalPrice.toFixed(2)}
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', marginTop: 3 }}>
                      {productSizes.length > 0 && (
                        <span style={{ fontSize: 9, background: '#e6f0ea', color: COLORS.midGreen, borderRadius: 4, padding: '1px 4px', fontWeight: 600 }}>📏 {productSizes.length} sizes</span>
                      )}
                      {productMoods.length > 0 && (
                        <span style={{ fontSize: 9, background: '#fff7e6', color: '#d46b08', borderRadius: 4, padding: '1px 4px', fontWeight: 600 }}>🔥 {productMoods.length} moods</span>
                      )}
                    </div>
                  </div>
                  {p.discount > 0 && <div style={{ fontSize: 10, color: COLORS.textSecondary, textDecoration: 'line-through' }}>${price.toFixed(2)}</div>}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                  <Badge
                    count={p.product_type === 'recipe' ? p.estimated_servings : p.qty}
                    overflowCount={999}
                    showZero
                    style={{ background: isOOS ? COLORS.redBadge : (p.qty < 5 || (p.product_type === 'recipe' && p.estimated_servings < 5)) ? COLORS.softGold : COLORS.darkGreen, boxShadow: 'none' }}
                  />
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                  <Badge count={cartQty} size="small" offset={[5, -5]}>
                    <Button
                      type="primary"
                      shape="circle"
                      icon={<PlusOutlined />}
                      size="small"
                      disabled={isOOS}
                      style={{ background: COLORS.darkGreen, border: 'none' }}
                    />
                  </Badge>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  );
});

// ─── Table Selector Modal (New) ──────────────────────────────
const TableSelectorModal = ({ visible, onCancel, onSelect, branchId, COLORS, t, heldOrders, onResume, guestCount, setGuestCount }) => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && branchId) {
      fetchTables();
    }
  }, [visible, branchId]);

  const fetchTables = async () => {
    setLoading(true);
    try {
      const res = await request("table", "get", { branch_id: branchId });
      if (res && res.list) {
        setTables(res.list);
      }
    } catch (error) {
      console.error("Fetch tables error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: `${COLORS.darkGreen}10`, padding: 8, borderRadius: 10 }}><TableOutlined style={{ color: COLORS.darkGreen }} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: COLORS.darkGreen }}>TABLE DASHBOARD / គ្រប់គ្រងតុ</div>
            <div style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: -2 }}>Select a table and update guest headcount</div>
          </div>
          {/* Compact Guest Select in Header */}
          <div style={{ background: '#f8fafc', padding: '4px 12px', borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary }}>PEOPLE 👥</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={() => setGuestCount(Math.max(1, guestCount - 1))} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, fontWeight: 700, color: COLORS.textSecondary }}>−</button>
              <span style={{ fontSize: 16, fontWeight: 800, minWidth: 20, textAlign: 'center' }}>{guestCount}</span>
              <button onClick={() => setGuestCount(guestCount + 1)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, fontWeight: 700, color: COLORS.darkGreen }}>+</button>
            </div>
          </div>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={720}
      centered
      styles={{ body: { padding: '20px' } }}
    >
      <Spin spinning={loading}>
        {tables.length === 0 && !loading ? (
          <Empty description={t.no_data || "No tables configured"} />
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
            gap: 16
          }}>
            {tables.map(table => {
              // Check if table is occupied in heldOrders
              const activeOrder = heldOrders.find(o => String(o.tableNo) === String(table.table_name));
              const isOccupied = !!activeOrder;

              return (
                <div
                  key={table.id}
                  onClick={() => {
                    if (isOccupied) {
                      onResume(activeOrder);
                    } else {
                      onSelect(table.table_name);
                    }
                  }}
                  style={{
                    background: isOccupied ? `${COLORS.redBadge}08` : (table.status === 'Occupied' ? '#fcfcfc' : COLORS.white),
                    border: `2px solid ${isOccupied ? COLORS.redBadge : COLORS.softBorder}`,
                    borderRadius: 16,
                    padding: '16px 12px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative',
                    boxShadow: isOccupied ? '0 4px 15px rgba(232,93,93,0.1)' : '0 2px 8px rgba(0,0,0,0.04)'
                  }}
                  onMouseEnter={e => {
                    if (!isOccupied) {
                      e.currentTarget.style.borderColor = COLORS.darkGreen;
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isOccupied) {
                      e.currentTarget.style.borderColor = COLORS.softBorder;
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  <div style={{ fontSize: 24, marginBottom: 4 }}>{isOccupied ? '🍱' : '🪑'}</div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: COLORS.textPrimary }}>{table.table_name}</div>

                  {isOccupied ? (
                    <>
                      <div style={{ fontSize: 13, fontWeight: 900, color: COLORS.redBadge, marginTop: 4 }}>${(activeOrder.objSummary?.total || 0).toFixed(2)}</div>
                      <Tag color="volcano" style={{ fontSize: 9, borderRadius: 10, margin: '6px 0 0' }}>OCCUPIED</Tag>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: 4 }}>FREE</div>
                      <Tag color="green" style={{ fontSize: 9, borderRadius: 10, margin: '6px 0 0' }}>AVAILABLE</Tag>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Spin>
    </Modal>
  );
};

// ─── Bill Cart Item (Memoized) ────────────────────────────────────────────────
const BillCartItem = React.memo(({ item, onIncrease, onDecrease, onRemove, onEdit }) => {
  const imgUrl = item.image ? Config.getFullImagePath(item.image) : null;
  const originalPrice = Number(item.unit_price || item.price || 0);
  const discountPercent = parseFloat(item.discount || 0);
  const finalPrice = originalPrice * (1 - (discountPercent / 100));

  return (
    <div
      style={{
        padding: "10px 0",
        borderBottom: `1px solid #f0f0f0`,
        display: "flex",
        alignItems: "center",
        gap: 10,
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      {/* 1. Compact Thumbnail */}
      <div style={{
        width: 42, height: 42, borderRadius: 8, overflow: "hidden",
        background: "#f8f9fa", flexShrink: 0, display: "flex",
        alignItems: "center", justifyContent: "center", border: `1px solid #eee`
      }}>
        {imgUrl ? (
          <img src={imgUrl} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <span style={{ fontSize: 20 }}>{getIconForCategory(item.category_name)}</span>
        )}
      </div>

      {/* 2. Middle Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontWeight: 700, fontSize: 13, color: COLORS.textPrimary,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 1
        }}>
          {item.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 11, color: COLORS.textSecondary, fontWeight: 600 }}>
            ${finalPrice.toFixed(2)}
          </span>
          {discountPercent > 0 && (
            <span style={{ fontSize: 10, color: COLORS.redBadge, opacity: 0.8 }}>(-{discountPercent}%)</span>
          )}
          {item.note && (
            <span style={{
              fontSize: 10,
              color: COLORS.midGreen,
              fontStyle: 'italic',
              background: '#f1f8f4',
              padding: '1px 6px',
              borderRadius: 4
            }}>
              "{item.note}"
            </span>
          )}
          <button onClick={() => onEdit(item)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '0 4px', color: COLORS.midGreen, fontSize: 10, fontWeight: 700 }}>EDIT</button>
          <button onClick={() => onRemove(item)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '0 4px', color: COLORS.redBadge, fontSize: 10 }}><DeleteOutlined /></button>
        </div>
      </div>

      {/* 3. Right: Subtotal & Qty */}
      <div style={{ textAlign: "right", display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: COLORS.textPrimary }}>
          ${(finalPrice * item.cart_qty).toFixed(2)}
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 8, background: '#f8f9fa',
          padding: '2px 6px', borderRadius: 8, border: `1px solid #eee`
        }}>
          <button onClick={() => onDecrease(item)} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 16, color: COLORS.textSecondary, width: 18 }}>−</button>
          <span style={{ fontSize: 12, fontWeight: 800, minWidth: 16, textAlign: "center" }}>{item.cart_qty}</span>
          <button onClick={() => onIncrease(item)} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 16, color: COLORS.darkGreen, width: 18 }}>+</button>
        </div>
      </div>
    </div>
  );
});

// ─── Main Page ────────────────────────────────────────────────────────────────
function PosPage() {
  const safeParse = (str) => {
    if (!str) return null;
    try {
      return JSON.parse(str);
    } catch (e) {
      console.error("JSON parse error:", e);
      return null;
    }
  };
  const { lang } = useLanguage();
  const refShiftReport = useRef(null);
  const refLabel = useRef(null);
  const t = translations[lang];
  const { profile } = useProfileStore(); // Reactive profile
  const { isFullScreen, toggleFullScreen } = useUIStore();
  const [isDisabled, setIsDisabled] = useState(false);

  // ── LAYOUT ENGINE CONFIGURATION ──
  const LAYOUTS = {
    coffee: {
      hasSidebar: false,
      hasHorizontalCats: true,
      hasKitchen: true,
      hasTables: true,
      hasDrafts: true,
      hasOrderTypes: true,
      denseGrid: false,
      primaryColor: COLORS.darkGreen
    },
    retail: {
      hasSidebar: true,
      hasHorizontalCats: false,
      hasKitchen: false,
      hasTables: false,
      hasDrafts: false,
      hasOrderTypes: false,
      denseGrid: true,
      primaryColor: COLORS.darkGreen
    },
    pharmacy: {
      hasSidebar: true,
      hasHorizontalCats: false,
      hasKitchen: false,
      hasTables: false,
      hasDrafts: false,
      hasOrderTypes: false,
      denseGrid: true,
      hasExpiry: true,
      primaryColor: "#2196f3"
    },
    restaurant: {
      hasSidebar: false,
      hasHorizontalCats: true,
      hasKitchen: true,
      hasTables: true,
      hasDrafts: true,
      hasOrderTypes: true,
      hasSplitBill: true,
      denseGrid: false,
      primaryColor: "#e65100"
    }
  };

  const getLayoutType = () => {
    if (profile?.business_layout) return profile.business_layout;
    const bp = profile?.blueprint_name?.toLowerCase() || "";
    if (bp.includes("pharmacy") || bp.includes("medical")) return "pharmacy";
    if (bp.includes("mart") || bp.includes("retail")) return "retail";
    if (bp.includes("restaurant")) return "restaurant";
    return "coffee";
  };

  const layoutType = getLayoutType();
  const layoutConfig = LAYOUTS[layoutType] || LAYOUTS.coffee;
  const isRetail = layoutConfig.hasSidebar;
  const primaryColor = layoutConfig.primaryColor || COLORS.darkGreen;
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isEditingUniqueId, setIsEditingUniqueId] = useState(null);
  const [parentCategories, setParentCategories] = useState([{ id: 'all', name: "All Products", icon: "🌐", color: primaryColor }]);
  const [searchText, setSearchText] = useState("");
  const [branchInfo, setBranchInfo] = useState(null);
  const [tables, setTables] = useState([]);

  useEffect(() => {
    if (branchInfo?.id) {
      fetchTables(branchInfo.id);
    }
  }, [branchInfo]);

  const fetchTables = async (branchId) => {
    try {
      const res = await request("table", "get", { branch_id: branchId });
      if (res && res.list) {
        setTables(res.list);
      }
    } catch (error) {
      console.error("Fetch tables error:", error);
    }
  };
  const [orderType, setOrderType] = useState("dine_in");
  const [customerName, setCustomerName] = useState("");
  const [tableNo, setTableNo] = useState("");
  const [playBell] = useSound(BELL_SOUND_URL);
  const [isSoundEnabled, setIsSoundEnabled] = useState(false);
  const prevPendingCountRef = useRef(0);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [selectedProductForOptions, setSelectedProductForOptions] = useState(null);
  const [tempOptions, setTempOptions] = useState({
    mood: "hot",
    size: "M",
    sugar: "100%",
    addons: [],
    note: ""
  });
  const [paymentData, setPaymentData] = useState({ paymentLink: "", orderNo: "", total: 0 });
  const [pendingOrdersVisible, setPendingOrdersVisible] = useState(false);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [viewMode, setViewMode] = useState("grid"); // grid or list

  const [currentOrderId, setCurrentOrderId] = useState(null);
  const { exchangeRate } = useExchangeRate();
  const [cashReceivedUSD, setCashReceivedUSD] = useState(0);
  const [cashReceivedKHR, setCashReceivedKHR] = useState(0);
  const [cashPaymentModalVisible, setCashPaymentModalVisible] = useState(false);
  const [currentShift, setCurrentShift] = useState(null);
  const [openShiftModalVisible, setOpenShiftModalVisible] = useState(false);

  const { heldOrders, holdOrder, resumeOrder, removeHeldOrder } = useHeldOrdersStore();
  const [heldOrdersVisible, setHeldOrdersVisible] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState(null);
  const [tableModalVisible, setTableModalVisible] = useState(false);
  const [guestCount, setGuestCount] = useState(1); // Restaurant: number of guests
  const [tempUnassignedItems, setTempUnassignedItems] = useState([]); // Items picked in current session but not yet saved/printed

  const { config } = configStore();
  const refInvoice = useRef(null);
  const refKitchen = useRef(null);
  const [form] = Form.useForm();

  const [state, setState] = useState({
    list: [],
    customers: [],
    total: 0,
    loading: false,
    cart_list: [],
    printCart: [],
    printSummary: null,
    rawMaterials: [],
    lowStockItems: [],
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

  const userId = profile?.id || profile?.user_id;
  const isAdmin = profile?.is_super_admin === 1 ||
    ['Owner', 'Executive', 'Admin'].includes(profile?.role_name) ||
    profile?.role_id === 1; // Fallback for common admin IDs


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

  // ── set user id and name ──
  useEffect(() => {
    setObjSummary((p) => ({
      ...p,
      user_id: userId,
      user_name: profile?.name || profile?.first_name || "Admin"
    }));
  }, [userId, profile]);

  // ── initial data ──
  useEffect(() => {
    if (userId) {
      checkShiftStatus();
      getParentCategories();
      getBranchInfo();
      if (isPermission("Table Management")) {
        getPendingOrders();
      }
      const iv = setInterval(() => {
        if (isPermission("Table Management")) {
          getPendingOrders();
        }
      }, 30000);
      return () => clearInterval(iv);
    }
  }, [userId]);

  const checkShiftStatus = async () => {
    try {
      const res = await request("shift/current", "get");
      if (res && res.success && res.data) {
        setCurrentShift(res.data);
        setOpenShiftModalVisible(false);
      } else {
        setCurrentShift(null);
        // User requested: don't auto-open modal. They will click to open.
        setOpenShiftModalVisible(false);
      }
    } catch (error) {
      console.error("Error checking shift status:", error);
    }
  };

  const onOpenShift = async (values) => {
    try {
      const data = {
        opening_cash_usd: values.opening_cash_usd || 0,
        opening_cash_khr: values.opening_cash_khr || 0,
      };
      const res = await request("shift/open", "post", data);
      if (res && res.success) {
        message.success(res.message);
        checkShiftStatus();
      } else {
        message.warning(res.message);
      }
    } catch (error) {
      console.error(error);
      message.error("Failed to open shift");
    }
  };

  useEffect(() => {
    if (userId) {
      getList();
      getMaterials();
    }
  }, [selectedCategory, userId]);

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
      if (res && res.list && res.list.length > 0) {
        const cats = res.list.map((c) => ({
          id: c.id,
          name: c.name,
          icon: getIconForCategory(c.name),
          color: getColorForCategory(c.name) || (layoutType === "pharmacy" ? "#2196f3" : COLORS.darkGreen),
        }));

        // ADDED: Prepend 'All Products' category
        setParentCategories([
          { id: 'all', name: t.all_products || "All Products", icon: "🌐", color: COLORS.darkGreen },
          ...cats
        ]);

        if (cats.length > 0 && selectedCategory === null) {
          setSelectedCategory('all');
        }
      } else {
        // Use localized defaults if no categories in DB
        const defaults = getLocalizedDefaultCategories(layoutType);
        setParentCategories([
          { id: 'all', name: t.all_products || "All Products", icon: "🌐", color: COLORS.darkGreen },
          ...defaults
        ]);
      }
    } catch {
      setParentCategories(getLocalizedDefaultCategories(layoutType));
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

  const getMaterials = async () => {
    try {
      const res = await request("raw_material", "get");
      if (res && res.list) {
        setState(p => ({ ...p, rawMaterials: res.list }));
        const low = res.list.filter(rm => Number(rm.qty) <= (Number(rm.min_stock) || 5));
        setState(p => ({ ...p, lowStockItems: low }));
      }
    } catch (error) {
      console.error("Error fetching materials:", error);
    }
  };

  const getList = async () => {
    const currentUserId = profile?.id || profile?.user_id;
    if (!currentUserId) return;
    setState((p) => ({ ...p, loading: true }));
    try {
      const res = await request(`product`, "get", {
        category_id: selectedCategory === 'all' ? null : selectedCategory,
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
      const originalUnitPrice = Number(item.unit_price || item.price || 0);
      const discountPercent = parseFloat(item.discount || 0);
      const discountedUnitPrice = originalUnitPrice * (1 - (discountPercent / 100));

      total_qty += qty;
      sub_total += originalUnitPrice * qty;
      save_discount += (originalUnitPrice - discountedUnitPrice) * qty;
    });

    const total = sub_total - save_discount;

    setObjSummary((p) => ({
      ...p,
      total_qty,
      sub_total: parseFloat(sub_total.toFixed(2)),
      save_discount: parseFloat(save_discount.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
      tax: 0,
    }));
  }, [state.cart_list]);

  // ── cart helpers ──
  const handleAdd = useCallback((product) => {
    // 1. Check if product has options (moods, sizes, or addons)
    const moods = safeParse(product.moods);
    const sizes = safeParse(product.sizes);
    const addons = safeParse(product.addons);
    const hasOptions = (Array.isArray(moods) && moods.length > 0) || (Array.isArray(sizes) && sizes.length > 0) || (Array.isArray(addons) && addons.length > 0);

    const isDrink = product.category_name?.toLowerCase().includes("coffee") || product.category_name?.toLowerCase().includes("drink") || product.category_name?.toLowerCase().includes("juice");

    // 2. If it has options, ALWAYS open the modal to get specific choices
    if (hasOptions) {
      if (product.product_type !== 'recipe' && Number(product.qty) <= 0) {
        notification.error({ message: "Out of Stock" });
        return;
      }
      setSelectedProductForOptions(product);
      setTempOptions({
        // Only pre-select mood if this product actually has moods configured
        mood: Array.isArray(moods) && moods.length > 0
          ? (typeof moods[0] === 'object' ? moods[0].value : moods[0])
          : "",
        // Only pre-select first size if sizes are defined
        size: Array.isArray(sizes) && sizes.length > 0
          ? (typeof sizes[0] === 'object' ? sizes[0].label : sizes[0])
          : "",
        // Never force sugar — let customer choose
        sugar: "",
        addons: [],
        note: ""
      });
      setOptionsModalVisible(true);
      return;
    }

    // 3. If no options, treat as standard item and increment quantity if already in cart
    setState((prev) => {
      const cart = [...prev.cart_list];
      const standardId = `${product.id}-standard`;
      const idx = cart.findIndex((c) => c.unique_id === standardId);

      if (idx === -1) {
        if (product.product_type !== 'recipe' && Number(product.qty) <= 0) {
          notification.error({ message: "Out of Stock" });
          return prev;
        }
        const newItem = { ...product, cart_qty: 1, unique_id: standardId };
        setTempUnassignedItems(prev => [...prev, newItem]);
        cart.push(newItem);
      } else {
        if (product.product_type !== 'recipe' && cart[idx].cart_qty >= Number(product.qty)) {
          notification.warning({ message: `Only ${product.qty} available` });
          return prev;
        }
        setTempUnassignedItems(prevTemp => {
          const tIdx = prevTemp.findIndex(it => it.unique_id === standardId);
          if (tIdx > -1) {
            const updated = [...prevTemp];
            updated[tIdx].cart_qty += 1;
            return updated;
          }
          return [...prevTemp, { ...cart[idx], cart_qty: 1, unique_id: standardId }];
        });
        cart[idx] = { ...cart[idx], cart_qty: (cart[idx].cart_qty || 0) + 1 };
      }
      return { ...prev, cart_list: cart };
    });
  }, [profile, setTempUnassignedItems, setOptionsModalVisible, setSelectedProductForOptions, setTempOptions]);

  const handleEditCartItem = useCallback((item) => {
    // Find the original product from the list to get full metadata (sizes, addons)
    const product = state.list.find(p => p.id === item.id);
    if (!product) return;

    setSelectedProductForOptions(product);
    setTempOptions({
      mood: item.mood || "",
      size: item.size || "",
      sugar: item.sugar || "",
      addons: item.addons_selected || [],
      note: item.kitchen_note || ""
    });
    setIsEditingUniqueId(item.unique_id);
    setOptionsModalVisible(true);
  }, [state.list]);

  const handleConfirmOptions = () => {
    const product = selectedProductForOptions;
    if (!product) return;

    if (orderType === 'dine_in' && !tableNo) {
      setTableModalVisible(true);
      message.info("Please select a table to start this order / សូមជ្រើសរើសតុដើម្បីចាប់ផ្ដើម");
    }

    // Prepare options string for unique identification
    // Treat size prices as surcharges (base + size price)
    let adjustedPrice = Number(product.price || product.unit_price || 0);
    if (product.sizes) {
      const sizes = safeParse(product.sizes) || [];
      const selectedSizeObj = sizes.find(s => s.label === tempOptions.size);
      if (selectedSizeObj && Number(selectedSizeObj.price) > 0) {
        adjustedPrice = Number(selectedSizeObj.price); // 🚀 OVERRIDE: Use size price as the total price
      }
    }

    if (product.addons && tempOptions.addons.length > 0) {
      const addonsList = safeParse(product.addons) || [];
      tempOptions.addons.forEach(addonLabel => {
        const addonObj = addonsList.find(a => a.label === addonLabel);
        if (addonObj && addonObj.price) {
          adjustedPrice += Number(addonObj.price);
        }
      });
    }

    const addonStr = tempOptions.addons.length > 0 ? ` + ${tempOptions.addons.join(", ")}` : "";
    const sizeStr = tempOptions.size ? `${tempOptions.size}` : "";
    const moodStr = tempOptions.mood ? `${tempOptions.mood}` : "";
    const sugarStr = tempOptions.sugar ? `, ${tempOptions.sugar} Sugar` : "";

    let noteParts = [];
    if (moodStr) noteParts.push(moodStr);
    if (sizeStr) noteParts.push(sizeStr);

    const optionNote = `${noteParts.join(", ")}${sugarStr}${addonStr}`;
    const uniqueName = `${product.name} [${optionNote}]`;
    const uniqueId = `${product.id}-${optionNote}-${tempOptions.note}`;

    setState((prev) => {
      let cart = [...prev.cart_list];
      let currentQty = 1;

      if (isEditingUniqueId) {
        const oldIndex = cart.findIndex(c => c.unique_id === isEditingUniqueId);
        if (oldIndex > -1) {
          currentQty = cart[oldIndex].cart_qty;
          cart.splice(oldIndex, 1);
        }
      }

      const newItem = {
        ...product,
        unique_id: uniqueId,
        display_name: uniqueName,
        unit_price: adjustedPrice,
        price: adjustedPrice,
        cart_qty: currentQty,
        mood: tempOptions.mood,
        size: tempOptions.size,
        sugar: tempOptions.sugar,
        addons_selected: tempOptions.addons,
        note: optionNote,
        kitchen_note: tempOptions.note
      };

      // Add to temp unassigned so it follows table switches
      setTempUnassignedItems(prevTemp => {
        const tidx = prevTemp.findIndex(it => it.unique_id === uniqueId);
        if (tidx > -1) {
          const updated = [...prevTemp];
          updated[tidx].cart_qty += currentQty;
          return updated;
        }
        return [...prevTemp, newItem];
      });

      const idx = cart.findIndex((c) => c.unique_id === uniqueId);
      if (idx === -1) {
        cart.push(newItem);
      } else {
        cart[idx] = { ...cart[idx], cart_qty: cart[idx].cart_qty + currentQty };
      }
      return { ...prev, cart_list: cart };
    });

    setOptionsModalVisible(false);
    setSelectedProductForOptions(null);
    setIsEditingUniqueId(null);
  };

  const handleIncrease = useCallback((item) => {
    setState((prev) => {
      const cart = prev.cart_list.map((c) =>
        c.unique_id === item.unique_id
          ? { ...c, cart_qty: Math.min((c.cart_qty || 0) + 1, item.qty || 999) }
          : c
      );
      return { ...prev, cart_list: cart };
    });
  }, []);

  const handleDecrease = useCallback((item) => {
    setState((prev) => {
      const cart = prev.cart_list
        .map((c) =>
          c.unique_id === item.unique_id
            ? { ...c, cart_qty: (c.cart_qty || 1) - 1 }
            : c
        )
        .filter((c) => c.cart_qty > 0);
      return { ...prev, cart_list: cart };
    });
  }, []);

  const handleRemoveItem = useCallback((item) => {
    setState((prev) => ({
      ...prev,
      cart_list: prev.cart_list.filter(
        (c) => c.unique_id !== item.unique_id
      ),
    }));
  }, []);

  const handleHoldOrder = (directCart = null) => {
    const cartToSave = directCart || state.cart_list;
    if (cartToSave.length === 0) {
      if (!directCart) message.warning("Cart is empty");
      return;
    }

    // Smart logic for restaurant: If tableNo is set, check if an active draft already exists for this table
    let draftIdToUpdate = currentDraftId;
    if (!draftIdToUpdate && tableNo && orderType === 'dine_in') {
      const existingTableDraft = heldOrders.find(o => String(o.tableNo) === String(tableNo));
      if (existingTableDraft) {
        draftIdToUpdate = existingTableDraft.id;
      }
    }

    // Mark items as printed and trigger Label printing
    const labeledCart = cartToSave.map(item => ({ ...item, printed: true }));

    holdOrder({
      id: draftIdToUpdate,
      cart_list: labeledCart,
      customerName,
      tableNo,
      guestCount,
      orderType,
      objSummary,
      currentOrderId,
    });

    // Auto-Print Label even when holding (for Dine-In drinks)
    const pSettings = getPrinterSettings();
    if (pSettings.auto_print && pSettings.label_enabled) {
      setState(prev => ({
        ...prev,
        printCart: labeledCart,
        printSummary: { ...objSummary, order_type: orderType, order_no: "DRAFT" }
      }));
      setTimeout(() => {
        handlePrintLabel();
      }, 500);
    }
  };

  const handleResumeHeldOrder = (order) => {
    const resumed = resumeOrder(order.id);
    if (resumed) {
      setState((prev) => {
        const resumedCart = resumed.cart_list || [];

        // Items picked in THIS session that haven't been 'settled' into a table yet
        let mergedCart = [...resumedCart];

        // SMART MERGE: Only carry over floating (unassigned) items
        tempUnassignedItems.forEach(floatingItem => {
          const fUId = floatingItem.unique_id || `${floatingItem.id}-standard`;

          const existingIdx = mergedCart.findIndex(c =>
            c.id === floatingItem.id &&
            (c.unique_id || `${c.id}-standard`) === fUId
          );

          if (existingIdx > -1) {
            mergedCart[existingIdx] = {
              ...mergedCart[existingIdx],
              cart_qty: (mergedCart[existingIdx].cart_qty || 0) + (floatingItem.cart_qty || 0)
            };
          } else {
            mergedCart.push({ ...floatingItem });
          }
        });

        return { ...prev, cart_list: mergedCart };
      });

      setCustomerName(resumed.customerName || "");
      setTableNo(resumed.tableNo || "");
      setGuestCount(resumed.guestCount || 1);
      setOrderType(resumed.orderType || "dine_in");
      setCurrentDraftId(resumed.id);
      setCurrentOrderId(resumed.currentOrderId || null);
      setHeldOrdersVisible(false);
      message.success(`Merged items into Table ${resumed.tableNo || ''}`);
    }
  };

  const handleMergeHeldOrder = (order) => {
    const resumed = resumeOrder(order.id);
    if (resumed) {
      setState((prev) => {
        const newCart = [...prev.cart_list];
        resumed.cart_list.forEach(item => {
          const uId = item.unique_id || item.id;
          const idx = newCart.findIndex(c => (c.unique_id || c.id) === uId);
          if (idx > -1) {
            newCart[idx].cart_qty += item.cart_qty;
          } else {
            newCart.push({ ...item });
          }
        });
        return { ...prev, cart_list: newCart };
      });
      setHeldOrdersVisible(false);
      message.success(`Merged items from draft into cart`);
    }
  };



  const handleClearCart = useCallback((isCheckout = false) => {
    // CRITICAL: For restaurant workflow, only remove from held storage on SUCCESSFUL checkout
    if (isCheckout && currentDraftId) {
      removeHeldOrder(currentDraftId);
    }

    setState((p) => ({ ...p, cart_list: [] }));
    setTempUnassignedItems([]); // Reset session floating items
    setObjSummary((p) => ({
      ...p,
      sub_total: 0, total_qty: 0, save_discount: 0,
      tax: 0, total: 0, total_paid: 0,
      customer_id: null, payment_method: null,
    }));
    setCustomerName("");
    setTableNo("");
    setGuestCount(1);
    setCurrentOrderId(null);
    setCurrentDraftId(null);
    setCashReceivedUSD(0);
    setCashReceivedKHR(0);
    setCashPaymentModalVisible(false);
    if (form) form.resetFields();
    getPendingOrders();
  }, [currentDraftId, removeHeldOrder, form, setTempUnassignedItems]);

  const handleSelectPendingOrder = useCallback(async (order) => {
    setState((p) => ({ ...p, loading: true }));
    try {
      const res = await request(`order/${order.id}`, "get");
      if (res && res.details) {
        const cart = res.details.map((d) => ({
          id: d.product_id,
          name: d.product_name,
          unit_price: d.price,
          cart_qty: d.qty,
          image: d.image,
          note: d.note || "",
          display_name: d.product_name + (d.note ? ` [${d.note}]` : ""),
          unique_id: `${d.product_id}-${d.note || ""}`
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
      } else {
        setState((p) => ({ ...p, loading: false }));
        message.warning("Could not load order details.");
      }
    } catch (error) {
      console.error("Error loading pending order:", error);
      setState((p) => ({ ...p, loading: false }));
    }
  }, []);

  // ── place order ──
  const handleClickOut = async () => {
    if (!currentShift) {
      message.warning("Please open a shift before placing an order!");
      setOpenShiftModalVisible(true);
      return;
    }
    if (!state.cart_list.length) {
      message.error("Cart is empty!");
      return;
    }
    if (!objSummary.payment_method) {
      message.error("Please select a payment method!");
      return;
    }

    // Validation for Dine-In Table Requirement
    const hasTables = tables && tables.length > 0;
    if (orderType === "dine_in" && hasTables && !tableNo) {
      message.warning(t.please_select_table || "Please select a table for Dine-In order!");
      // Optional: Highlight the table selector
      const tableSelector = document.getElementById('table-selector-trigger');
      if (tableSelector) {
        tableSelector.style.border = '2px solid #ef4444';
        tableSelector.style.boxShadow = '0 0 10px rgba(239,68,68,0.3)';
        setTimeout(() => {
          tableSelector.style.border = '';
          tableSelector.style.boxShadow = '';
        }, 3000);
      }
      return;
    }

    // New Validation: For Cash, ensure enough money is received
    if (objSummary.payment_method === "Cash") {
      const totalPaidUSD = Number(cashReceivedUSD || 0) + (Number(cashReceivedKHR || 0) / exchangeRate);
      if (totalPaidUSD < (Number(objSummary.total || 0) - 0.001)) { // Allow tiny margin for floating point
        message.warning(t.insufficient_cash || "Insufficient cash received!");
        return;
      }
    }
    const items = state.cart_list.map((item) => {
      const qty = Number(item.cart_qty) || 1;
      const rawPrice = item.unit_price !== undefined && item.unit_price !== null ? item.unit_price : (item.price || 0);
      const unitPrice = isNaN(Number(rawPrice)) ? 0 : Number(rawPrice);
      return {
        product_id: item.id,
        qty: qty,
        price: unitPrice,
        note: item.note || "",
        options: {
          size: item.size,
          sugar: item.sugar,
          mood: item.mood,
          addons: item.addons_selected
        }
      };
    });
    const param = {
      ...objSummary,
      cart_items: items,
      customer_name: customerName,
      table_no: tableNo,
      order_type: orderType,
      guest_count: guestCount,
      sub_total: +objSummary.sub_total,
      total_amount: +objSummary.total,
      total_qty: +objSummary.total_qty,
      tax: 0,
      discount: 0,
      payment_method: objSummary.payment_method,
      shift_id: currentShift?.id,
      total_paid: objSummary.payment_method === "Cash"
        ? (Number(cashReceivedUSD) + (Number(cashReceivedKHR) / exchangeRate))
        : +objSummary.total
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
        const pSettings = getPrinterSettings();
        const key = `open${Date.now()}`;
        const btn = (
          <Space>
            <Button type="primary" size="small" icon={<PrinterOutlined />} onClick={() => {
              handlePrintInvoice();
            }}>
              Print Invoice
            </Button>
            <Button size="small" icon={<TagOutlined />} onClick={() => {
              handlePrintLabel();
            }}>
              Print Label
            </Button>
            <Button size="small" onClick={() => {
              notification.destroy(key);
              handleClearCart(true);
            }}>
              Done
            </Button>
          </Space>
        );

        notification.success({
          message: currentOrderId ? t.order_completed : t.order_placed,
          description: `Order ID: #${res.order_no || res.order_id}. Manual print available below if needed.`,
          action: btn,
          key,
          duration: 10,
          placement: 'top'
        });

        getPendingOrders();
        getList();
        getMaterials();

        const currentPrintCart = [...state.cart_list];
        const currentPrintSummary = {
          ...objSummary,
          order_no: res.order_no || res.order_id,
          order_date: new Date().toISOString(),
          order_type: orderType,
          received_usd: cashReceivedUSD,
          received_khr: cashReceivedKHR
        };

        setState(prev => ({
          ...prev,
          printCart: currentPrintCart,
          printSummary: currentPrintSummary
        }));

        const isBankPayment = objSummary.payment_method !== "Cash";

        if (isBankPayment) {
          setPaymentData({
            paymentLink: res.payment_link || "",
            orderNo: res.order_no || res.order_id || "TEMP",
            total: +objSummary.total
          });
          setQrModalVisible(true);
        }

        setObjSummary((p) => ({
          ...p,
          order_no: res.order_no || res.order_id,
          order_date: new Date().toISOString(),
        }));

        // --- DYNAMIC PRINTING WORKFLOW ---
        if (!isBankPayment) {
          // Trigger print workflow for all order types at checkout 
          triggerAutoPrintWorkflow(false);
        }
      } else {
        message.error(`Order failed! ${res?.message || res?.error || ""}`);
      }
    } catch (err) {
      console.error(err);
      message.error(t.order_failed || "Order failed!");
    }
  };

  // ── print ──
  const handlePrintInvoice = useReactToPrint({
    contentRef: refInvoice,
    pageStyle: `@page { size: 80mm auto; margin: 0; } body { margin: 0; }`,
  });

  const handlePrintLabel = useReactToPrint({
    contentRef: refLabel,
    pageStyle: `@page { size: 40mm 30mm !important; margin: 0 !important; } @media print { body { -webkit-print-color-adjust: exact; margin: 0 !important; } }`,
  });

  const handlePrintKitchen = useReactToPrint({
    contentRef: refKitchen,
    onBeforeGetContent: () => {
      if (kitchenItems.length === 0) {
        message.warning("All items already sent to kitchen / មុខម្ហូបទាំងអស់ត្រូវបានផ្ញើរួចហើយ");
        return Promise.reject("Empty");
      }
      return Promise.resolve();
    },
    onAfterPrint: () => {
      // Mark all currently in-cart items as sent to kitchen
      const updatedItems = state.cart_list.map(item => ({
        ...item,
        isSentToKitchen: true
      }));

      // We must hold the order WITH the updated flags before clearing
      handleHoldOrder(updatedItems);

      // Now safe to clear the cart
      handleClearCart();
      message.success("Order sent to kitchen and saved to table / ផ្ញើទៅចង្ក្រាន និងរក្សាទុកក្នុងតុរួចរាល់");
    }
  });

  const triggerAutoPrintWorkflow = useCallback((skipLabel = false) => {
    const pSettings = getPrinterSettings();
    if (!pSettings.auto_print) {
      handleClearCart(true); // Still clear if not auto printing
      return;
    }

    setTimeout(() => {
      const shouldPrintLabel = pSettings.label_enabled && !skipLabel;
      const shouldPrintInvoice = pSettings.invoice_enabled;

      if (pSettings.label_first) {
        if (shouldPrintLabel) handlePrintLabel();
        if (shouldPrintInvoice) {
          setTimeout(() => handlePrintInvoice(), shouldPrintLabel ? 800 : 0);
        }
      } else {
        if (shouldPrintInvoice) handlePrintInvoice();
        if (shouldPrintLabel) {
          setTimeout(() => handlePrintLabel(), shouldPrintInvoice ? 800 : 0);
        }
      }
      // Final cleanup after all prints have started
      setTimeout(() => handleClearCart(true), 1500);
    }, 300);
  }, [handlePrintLabel, handlePrintInvoice, handleClearCart]);

  const kitchenItems = state.cart_list.filter(item => !item.isSentToKitchen);

  // ── filtered products (Memoized for performance) ──
  const filteredProducts = React.useMemo(() => {
    const list = state.list || [];
    const search = (searchText || "").toLowerCase();
    return list.filter((p) =>
      (p.name || "").toLowerCase().includes(search)
    );
  }, [state.list, searchText]);

  const { inStock, outOfStock } = React.useMemo(() => {
    const is = filteredProducts.filter((p) => p.qty > 0);
    const os = filteredProducts.filter((p) => p.qty <= 0);
    return { inStock: is, outOfStock: os };
  }, [filteredProducts]);

  const allVisible = React.useMemo(() => {
    return [...inStock, ...outOfStock];
  }, [inStock, outOfStock]);

  const getCartQty = useCallback((productId) => {
    const item = state.cart_list.find((c) => c.id === productId);
    return item ? item.cart_qty : 0;
  }, [state.cart_list]);

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
      <div style={{ 
        display: "block", 
        position: "absolute", 
        left: "-9999px", 
        top: 0, 
        width: '80mm',
        opacity: 1,
        visibility: "visible",
        background: "white"
      }}>
        <div ref={refInvoice}>
          <PrintInvoice
            cart_list={state.printCart.length > 0 ? state.printCart : state.cart_list}
            objSummary={state.printSummary || { ...objSummary, order_type: orderType }}
            layoutType={layoutType}
            branchInfo={branchInfo}
            exchangeRate={exchangeRate}
          />
        </div>
        <div ref={refLabel}>
          <PrintLabel
            cart_list={(state.printCart.length > 0 ? state.printCart : state.cart_list).filter(item => !item.printed)}
            objSummary={state.printSummary || { ...objSummary, order_type: orderType }}
            branchInfo={branchInfo}
          />
        </div>
        <div ref={refShiftReport}>
          {/* Shift report data source needs to be verified before re-enabling */}
        </div>
        <div ref={refKitchen}>
          <PrintKitchenTicket
            cart_list={state.printCart.length > 0 ? state.printCart : state.cart_list}
            objSummary={state.printSummary || { ...objSummary, customerName, tableNo, order_type: orderType, remark: "" }}
          />
        </div>
      </div>

      {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
      {/* ══ BODY ════════════════════════════════════════════════════════════ */}
      <div
        style={{
          display: "flex",
          flex: 1,
          gap: 0,
          overflow: "hidden",
          height: "calc(100vh - 140px)",
        }}
      >
        {/* Categories Sidebar (Retail/Pharmacy) */}
        {layoutConfig.hasSidebar && (
          <div
            style={{
              width: 200,
              background: COLORS.white,
              borderRight: `1px solid ${COLORS.softBorder}`,
              display: "flex",
              flexDirection: "column",
              padding: "24px 12px",
              gap: 12,
              overflowY: "auto",
              scrollbarWidth: "none",
              boxShadow: "4px 0 15px rgba(0,0,0,0.02)"
            }}
          >
            <div style={{
              fontSize: 11,
              fontWeight: 900,
              color: COLORS.textSecondary,
              marginBottom: 12,
              paddingLeft: 8,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              opacity: 0.6
            }}>
              Browse Categories
            </div>
            {parentCategories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const catColor = cat.color || primaryColor;
              return (
                <div
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "14px 16px",
                    borderRadius: 16,
                    cursor: "pointer",
                    background: isSelected ? `${catColor}15` : "transparent",
                    color: isSelected ? catColor : COLORS.textPrimary,
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    border: `1px solid ${isSelected ? `${catColor}30` : "transparent"}`,
                    position: "relative",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = "#f8f9fa";
                      e.currentTarget.style.transform = "translateX(4px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.transform = "translateX(0)";
                    }
                  }}
                >
                  {/* Active Indicator Bar */}
                  {isSelected && (
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: '20%',
                      bottom: '20%',
                      width: 4,
                      background: catColor,
                      borderRadius: '0 4px 4px 0',
                    }} />
                  )}

                  <div style={{
                    fontSize: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    filter: isSelected ? 'grayscale(0)' : 'grayscale(0.4)',
                    transition: 'all 0.3s'
                  }}>
                    {cat.icon}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{
                      fontSize: 13,
                      fontWeight: isSelected ? 800 : 600,
                      lineHeight: 1.2
                    }}>
                      {cat.name}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
              marginBottom: 20,
              background: COLORS.white,
              padding: "10px 16px",
              borderRadius: 14,
              border: `1px solid ${COLORS.softBorder}`,
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
          >

            {/* Shift Control Button - User requested: Click to Open */}
            {!currentShift ? (
              <button
                onClick={() => setOpenShiftModalVisible(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: COLORS.white,
                  border: `2px solid ${COLORS.redBadge}`,
                  borderRadius: 10,
                  padding: "6px 16px",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 800,
                  color: COLORS.redBadge,
                  transition: "all 0.25s",
                  whiteSpace: "nowrap",
                  boxShadow: "0 4px 10px rgba(232,93,93,0.15)"
                }}
              >
                <PlusCircleOutlined style={{ fontSize: 18 }} />
                <span>Open New Shift / បើកបញ្ជីថ្មី</span>
              </button>
            ) : (
              <div style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "#e6f4ea", borderRadius: 8, padding: "6px 12px",
                color: COLORS.darkGreen, fontSize: 13, fontWeight: 700
              }}>
                <div style={{ width: 8, height: 8, background: COLORS.midGreen, borderRadius: "50%" }} />
                Shift Started: {currentShift?.start_date ? new Date(currentShift.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just Now"}
              </div>
            )}

            <Divider type="vertical" />

            <SearchOutlined style={{ color: COLORS.textSecondary, fontSize: 18 }} />
            <input
              placeholder={
                layoutType === "pharmacy" ? "Search medicine, SKU, or generic name..." :
                  layoutType === "retail" ? "Search items or scan barcode..." :
                    "Discover your coffee or snacks..."
              }
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{
                flex: 1,
                minWidth: 150,
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
              {t.total}: <span style={{ fontWeight: 700, color: primaryColor }}>{state.cart_list.length}</span>
            </div>

            <Divider type="vertical" />

            {/* Held Orders Button (Coffee/Restaurant) */}
            {layoutConfig.hasDrafts && (
              <Badge count={heldOrders.length} size="small" offset={[-2, 2]} color={COLORS.softGold}>
                <button
                  onClick={() => setHeldOrdersVisible(true)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: COLORS.white,
                    border: `1px solid ${COLORS.softBorder}`,
                    borderRadius: 8,
                    padding: "6px 14px",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 700,
                    color: COLORS.textPrimary,
                    transition: "all 0.25s",
                    whiteSpace: "nowrap",
                  }}
                >
                  <FolderOpenOutlined style={{ fontSize: 16, color: COLORS.softGold }} />
                  <span>Held Drafts</span>
                </button>
              </Badge>
            )}

            {/* View Mode Toggle */}
            <div style={{
              display: 'flex',
              background: COLORS.white,
              border: `1px solid ${COLORS.softBorder}`,
              borderRadius: 8,
              padding: 2,
              gap: 2
            }}>
              <button
                onClick={() => setViewMode("grid")}
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: 'none',
                  background: viewMode === "grid" ? COLORS.darkGreen : 'transparent',
                  color: viewMode === "grid" ? '#fff' : COLORS.textPrimary,
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 700,
                  transition: 'all 0.2s'
                }}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode("list")}
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: 'none',
                  background: viewMode === "list" ? COLORS.darkGreen : 'transparent',
                  color: viewMode === "list" ? '#fff' : COLORS.textPrimary,
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 700,
                  transition: 'all 0.2s'
                }}
              >
                List
              </button>
            </div>

            {/* Table Orders Button */}
            {isPermission("Table Management") && (
              <Badge count={pendingCount} size="small" offset={[-2, 2]} overflowCount={99}>
                <button
                  onClick={() => setPendingOrdersVisible(true)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: pendingCount > 0 ? primaryColor : COLORS.white,
                    border: `1px solid ${pendingCount > 0 ? primaryColor : COLORS.softBorder}`,
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
            )}

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
              <Badge count={state.lowStockItems?.length || 0} size="small" offset={[2, -2]}>
                <BellOutlined style={{ fontSize: 16 }} />
              </Badge>
              <span>{isSoundEnabled ? t.sound_on : t.sound_off}</span>
            </button>

            <button
              onClick={toggleFullScreen}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: isFullScreen ? COLORS.darkGreen : COLORS.white,
                border: `1px solid ${isFullScreen ? COLORS.darkGreen : COLORS.softBorder}`,
                borderRadius: 8,
                padding: "6px 14px",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 700,
                color: isFullScreen ? "#fff" : COLORS.textPrimary,
                transition: "all 0.25s",
                whiteSpace: "nowrap",
                boxShadow: isFullScreen ? "0 4px 12px rgba(30,74,45,0.2)" : "none"
              }}
            >
              {isFullScreen ? <CompressOutlined style={{ fontSize: 16 }} /> : <ExpandOutlined style={{ fontSize: 16 }} />}
              <span>{isFullScreen ? "Exit Full" : "Full Screen"}</span>
            </button>

            <button
              onClick={() => {
                window.location.href = "/product";
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: COLORS.white,
                border: `1px solid ${COLORS.softBorder}`,
                borderRadius: 8,
                padding: "6px 14px",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 700,
                color: COLORS.textPrimary,
                transition: "all 0.25s",
                whiteSpace: "nowrap"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = COLORS.darkGreen;
                e.currentTarget.style.color = COLORS.darkGreen;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = COLORS.softBorder;
                e.currentTarget.style.color = COLORS.textPrimary;
              }}
            >
              <UnorderedListOutlined style={{ fontSize: 16 }} />
              <span>{t.product_list || "Product List"}</span>
            </button>

            <button
              onClick={() => {
                if (isAdmin) {
                  window.location.href = "/report_Sale_Summary";
                } else {
                  window.location.href = "/order";
                }
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: COLORS.white,
                border: `1px solid ${COLORS.softBorder}`,
                borderRadius: 8,
                padding: "6px 14px",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 700,
                color: COLORS.textPrimary,
                transition: "all 0.25s",
                whiteSpace: "nowrap"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = COLORS.darkGreen;
                e.currentTarget.style.color = COLORS.darkGreen;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = COLORS.softBorder;
                e.currentTarget.style.color = COLORS.textPrimary;
              }}
            >
              {isAdmin ? (
                <>
                  <FileTextOutlined style={{ fontSize: 16 }} /> {t.report}
                </>
              ) : (
                <>
                  <HistoryOutlined style={{ fontSize: 16 }} /> {t.order_history}
                </>
              )}
            </button>

          </div>

          {/* Horizontal Category selection (Coffee/Restaurant) */}
          {layoutConfig.hasHorizontalCats && (
            <div
              style={{
                display: "flex",
                gap: 10,
                overflowX: "auto",
                paddingBottom: 6,
                scrollbarWidth: "none",
                marginBottom: 4
              }}
            >
              {parentCategories.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                const total = state.list.filter((p) => p.category_id === cat.id).length;
                const needsRestock = selectedCategory === cat.id ? outOfStock.length > 0 && inStock.length === 0 : false;

                return (
                  <div
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    style={{
                      minWidth: 130,
                      borderRadius: 14,
                      padding: "10px 12px",
                      background: isSelected ? primaryColor : COLORS.white,
                      border: `1px solid ${isSelected ? primaryColor : COLORS.softBorder}`,
                      cursor: "pointer",
                      position: "relative",
                      overflow: "hidden",
                      transition: "all 0.25s ease",
                      boxShadow: isSelected ? `0 4px 15px ${primaryColor}33` : "0 2px 6px rgba(0,0,0,0.04)",
                      flexShrink: 0,
                    }}
                  >
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: needsRestock ? "rgba(232,93,93,0.15)" : isSelected ? "rgba(255,255,255,0.15)" : "rgba(30,74,45,0.06)", borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 600, color: needsRestock ? COLORS.redBadge : isSelected ? "#fff" : COLORS.darkGreen, border: needsRestock ? `1px solid ${COLORS.redBadge}` : "none", marginBottom: 6 }}>
                      {needsRestock && <span style={{ width: 5, height: 5, background: COLORS.redBadge, borderRadius: "50%", display: "inline-block" }} />}
                      {isSelected ? t.viewing || "Selected" : t.available}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: isSelected ? COLORS.white : COLORS.textPrimary, marginBottom: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cat.name}</div>
                    <div style={{ fontSize: 11, color: isSelected ? "rgba(255,255,255,0.7)" : COLORS.textSecondary }}>{selectedCategory === cat.id ? `${state.list.length} ${t.items}` : `${total} ${t.items}`}</div>
                    <div style={{ position: "absolute", right: 6, bottom: 4, fontSize: 28, opacity: isSelected ? 0.2 : 0.06 }}>{cat.icon}</div>
                  </div>
                );
              })}
            </div>
          )}

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
              ) : viewMode === "grid" ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(auto-fill, minmax(${layoutConfig.denseGrid ? '135px' : '150px'}, 1fr))`,
                    gap: layoutConfig.denseGrid ? 10 : 14,
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
              ) : (
                <ProductListView
                  products={allVisible}
                  onAdd={handleAdd}
                  getCartQty={getCartQty}
                  COLORS={COLORS}
                />
              )}
            </div>
          </Spin>
        </div>

        {/* ── RIGHT PANEL / RECEIPT ── */}
        <div
          style={{
            width: 420,
            flexShrink: 0,
            background: COLORS.white,
            borderLeft: `1px solid ${COLORS.softBorder}`,
            display: "flex",
            flexDirection: "column",
            height: "100%",
            overflow: "hidden", // Control scroll behavior manually
          }}
        >
          {/* 1. Receipt Header */}
          <div
            style={{
              padding: "20px 18px",
              borderBottom: `1px solid ${COLORS.softBorder}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "#fff"
            }}
          >
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: COLORS.textSecondary, letterSpacing: 1, marginBottom: 2 }}>
                PURCHASE RECEIPT
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary }}>
                #{String(objSummary.order_no || "00000").padStart(5, "0")}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', width: '100%' }}>
              {layoutConfig.hasKitchen && (
                <>
                  <Button
                    size="small"
                    icon={<PrinterOutlined />}
                    onClick={() => {
                      if (kitchenItems.length > 0) {
                        handlePrintKitchen();
                      } else {
                        message.info("No new items to send / គ្មានមុខម្ហូបថ្មីសម្រាប់ផ្ញើទេ");
                      }
                    }}
                    disabled={state.cart_list.length === 0 || kitchenItems.length === 0}
                    style={{
                      borderRadius: 8,
                      fontSize: 11,
                      fontWeight: 700,
                      height: 32,
                      background: kitchenItems.length === 0 ? '#f5f5f5' : '#f8fafc',
                      border: '1px solid #e2e8f0',
                      color: kitchenItems.length === 0 ? '#bfbfbf' : COLORS.textPrimary
                    }}
                  >
                    {kitchenItems.length === 0 ? "Sent ✅" : "Kitchen"}
                  </Button>
                  <Button
                    size="small"
                    icon={<PushpinOutlined />}
                    onClick={() => {
                      handleHoldOrder();
                      handleClearCart();
                      message.success(tableNo ? `Tab for Table ${tableNo} saved / រក្សាទុកតុលេខ ${tableNo} រួចរាល់` : "Draft saved!");
                    }}
                    disabled={state.cart_list.length === 0}
                    style={{
                      borderRadius: 8,
                      fontSize: 11,
                      fontWeight: 700,
                      height: 32,
                      background: '#fff',
                      color: COLORS.darkGreen,
                      border: `1px solid ${COLORS.darkGreen}`
                    }}
                  >
                    {currentDraftId ? "Update" : "Save"}
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* 2. Order Info (Customer/Table) */}
          {layoutConfig.hasOrderTypes && (
            <div style={{ padding: "16px 18px 12px", borderBottom: `1px solid #f8f9fa`, background: '#fff' }}>
              {/* Order Type Toggle */}
              <div style={{ display: "flex", background: "#f1f3f5", borderRadius: 12, padding: 4, gap: 4, marginBottom: 12 }}>
                {[
                  { key: "dine_in", label: t.dine_in, icon: "🍽️" },
                  { key: "take_away", label: t.take_away, icon: "📦" },
                ].map(({ key, label, icon }) => (
                  <button
                    key={key}
                    onClick={() => setOrderType(key)}
                    style={{
                      flex: 1, padding: "8px 0", borderRadius: 8, border: "none",
                      background: orderType === key ? (key === 'take_away' ? '#e65100' : COLORS.darkGreen) : "transparent",
                      color: orderType === key ? "#fff" : COLORS.textSecondary,
                      fontWeight: 700, fontSize: 12, cursor: "pointer", transition: "all 0.2s",
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4
                    }}
                  >
                    <span>{icon}</span> {label}
                  </button>
                ))}
              </div>

              {/* Takeaway / Table Selection Row */}
              <div style={{ display: "flex", gap: 12 }}>
                {/* Table Section (Only for Dine-in) */}
                {orderType === 'dine_in' ? (
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: COLORS.textSecondary, marginBottom: 4, fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                      TABLE / តុ
                      <span onClick={() => setTableModalVisible(true)} style={{ color: COLORS.darkGreen, cursor: 'pointer', textDecoration: 'underline', fontWeight: 800 }}>DASHBOARD 📋</span>
                    </div>
                    <div
                      onClick={() => setTableModalVisible(true)}
                      style={{
                        width: "100%", border: `1px solid ${COLORS.softBorder}`, borderRadius: 10,
                        padding: "8px 12px", fontSize: 13, background: "#fafafa", textAlign: 'center', cursor: 'pointer', fontWeight: 800, color: COLORS.textPrimary,
                        animation: (!tableNo && state.cart_list.length > 0) ? 'pulse-border 1.5s infinite' : 'none'
                      }}
                    >
                      {tableNo ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                          <span>TABLE {tableNo}</span>
                          <span style={{ fontSize: 11, color: COLORS.textSecondary, fontWeight: 500, background: '#eee', padding: '1px 8px', borderRadius: 20 }}>{guestCount} 👥</span>
                        </div>
                      ) : (
                        <span style={{ color: state.cart_list.length > 0 ? COLORS.redBadge : 'inherit' }}>SELECT TABLE</span>
                      )}
                    </div>
                  </div>
                ) : (
                  // Takeaway Mode UI 
                  <div style={{ flex: 1, padding: '12px', background: `${COLORS.darkGreen}08`, border: `1px dashed ${COLORS.darkGreen}`, borderRadius: 10, textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: COLORS.darkGreen, fontWeight: 700, marginBottom: 4 }}>TAKEAWAY QUEUE / លេខរៀងកក់ខ្ចប់</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: COLORS.darkGreen }}>
                      #{String(objSummary.order_no || "00000").padStart(5, "0")}
                    </div>
                    <div style={{ fontSize: 9, color: COLORS.textSecondary, marginTop: 2 }}>Order is marked for packaging</div>
                  </div>
                )}
              </div>
            </div>
          )}

          <TableSelectorModal
            visible={tableModalVisible}
            onCancel={() => setTableModalVisible(false)}
            onSelect={(val) => {
              setTableNo(val);
              setCurrentDraftId(null);
              // When moving to an empty table, we only take our floatingItems
              setState(prev => ({ ...prev, cart_list: [...tempUnassignedItems] }));
              setTableModalVisible(false);
            }}
            onResume={(order) => {
              // Switch to this existing table draft
              handleResumeHeldOrder(order);
              setTableModalVisible(false);
            }}
            heldOrders={heldOrders}
            guestCount={guestCount}
            setGuestCount={setGuestCount}
            branchId={profile?.branch_id}
            COLORS={COLORS}
            t={t}
          />

          {/* 3. Scrollable List of Items */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "0 18px",
              scrollbarWidth: "thin",
              scrollbarColor: `${COLORS.softBorder} transparent`,
              background: '#fff'
            }}
          >
            <div style={{ padding: "16px 0 8px" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: COLORS.textSecondary }}>ORDER ITEMS ({state.cart_list.length})</div>
            </div>

            {state.cart_list.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: COLORS.textSecondary }}>
                <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.5 }}>🛒</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{t.cart_empty}</div>
                <div style={{ fontSize: 11, marginTop: 4, opacity: 0.7 }}>{t.add_from_menu}</div>
              </div>
            ) : (
              state.cart_list.map((item, idx) => (
                <BillCartItem
                  key={`${item.id}-${idx}`}
                  item={item}
                  onIncrease={handleIncrease}
                  onDecrease={handleDecrease}
                  onRemove={handleRemoveItem}
                  onEdit={handleEditCartItem}
                />
              ))
            )}
          </div>

          {/* 4. Payment Section (Fixed at Bottom) */}
          <div
            style={{
              padding: "12px 20px",
              borderTop: `1px solid ${COLORS.softBorder}`,
              background: COLORS.white,
              boxShadow: "0 -8px 20px rgba(0,0,0,0.03)",
              zIndex: 10
            }}
          >
            {/* Quick Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
              <div style={{ background: '#f8f9fa', padding: '6px 10px', borderRadius: 8, border: '1px solid #f1f3f5' }}>
                <div style={{ fontSize: 8, color: COLORS.textSecondary, marginBottom: 1, fontWeight: 700 }}>SUBTOTAL</div>
                <div style={{ fontSize: 13, fontWeight: 800 }}>${objSummary.sub_total.toFixed(2)}</div>
              </div>
              <div style={{ background: objSummary.save_discount > 0 ? '#fff5f5' : '#f8f9fa', padding: '6px 10px', borderRadius: 8, border: `1px solid ${objSummary.save_discount > 0 ? '#ffe3e3' : '#f1f3f5'}` }}>
                <div style={{ fontSize: 8, color: objSummary.save_discount > 0 ? '#e85d5d' : COLORS.textSecondary, marginBottom: 1, fontWeight: 700 }}>DISCOUNT</div>
                <div style={{ fontSize: 13, fontWeight: 800 }}>-${objSummary.save_discount.toFixed(2)}</div>
              </div>
            </div>

            {/* GRAND TOTAL CARD */}
            <div style={{
              background: primaryColor,
              padding: '8px 14px',
              borderRadius: 10,
              color: '#fff',
              marginBottom: 8,
              boxShadow: `0 4px 10px ${primaryColor}20`,
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                <div>
                  <div style={{ fontSize: 8, fontWeight: 700, opacity: 0.9 }}>TOTAL / សរុប</div>
                  <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1 }}>${objSummary.total.toFixed(2)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 8, opacity: 0.9 }}>KHR / រៀល</div>
                  <div style={{ fontSize: 13, fontWeight: 800 }}>{(objSummary.total * exchangeRate).toLocaleString()} ៛</div>
                </div>
              </div>
            </div>

            {/* Payment method Selection */}
            <div style={{ marginBottom: 8 }}>
              <Select
                size="middle"
                style={{ width: "100%", height: 38 }}
                placeholder={<span style={{ color: COLORS.textPrimary, opacity: 0.7, fontWeight: 500, fontSize: 12 }}>{t.select_payment}</span>}
                value={objSummary.payment_method}
                className="custom-select-checkout-compact"
                onChange={(v) => setObjSummary((p) => ({ ...p, payment_method: v }))}
                options={[
                  { label: "💵 Cash (សាច់ប្រាក់)", value: "Cash" },
                  { label: "📱 Wing Pay", value: "Wing" },
                  { label: "🏦 ABA Pay", value: "ABA" },
                  { label: "💳 Credit Card", value: "Card" },
                  { label: `❤️ Other Methods`, value: "Other" },
                ]}
              />

              {objSummary.payment_method === "Cash" && (
                <div style={{ marginTop: 10, padding: "10px 14px", background: '#f8f9fa', borderRadius: 12, border: `1px solid #eee` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: COLORS.textPrimary }}>CASH COLLECTED</span>
                    <Button size="small" type="link" style={{ height: 18, padding: 0, fontSize: 10, fontWeight: 700 }} onClick={() => setCashPaymentModalVisible(true)}>Calc</Button>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <InputNumber prefix="$" placeholder="USD" size="middle" style={{ flex: 1, borderRadius: 8 }} value={cashReceivedUSD} onChange={v => setCashReceivedUSD(v || 0)} min={0} />
                    <InputNumber prefix="៛" placeholder="KHR" size="middle" style={{ flex: 1, borderRadius: 8 }} value={cashReceivedKHR} onChange={v => setCashReceivedKHR(v || 0)} min={0} step={100} />
                  </div>

                  {(cashReceivedUSD > 0 || cashReceivedKHR > 0) && (
                    <div style={{ marginTop: 4, padding: '8px 10px', background: '#fff', borderRadius: 8, border: `1px solid #eee`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.darkGreen }}>CHANGE:</span>
                      <span style={{ fontSize: 14, fontWeight: 900, color: COLORS.darkGreen }}>${Math.max(0, (Number(cashReceivedUSD) + (Number(cashReceivedKHR) / exchangeRate)) - objSummary.total).toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Row */}
            <div style={{ display: 'flex', gap: 8 }}>
              <Popconfirm
                title="Clear current cart?"
                description="This will remove all items from the screen."
                onConfirm={() => handleClearCart(false)}
                okText="Yes, Clear"
                cancelText="No"
                okButtonProps={{ danger: true }}
              >
                <Button
                  danger
                  ghost
                  icon={<DeleteOutlined />}
                  style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0 }}
                  title={t.clear_cart}
                />
              </Popconfirm>

              <button
                disabled={isDisabled || state.cart_list.length === 0 || !objSummary.payment_method}
                onClick={handleClickOut}
                style={{
                  flex: 1, height: 44, borderRadius: 12, border: "none",
                  background: isDisabled || state.cart_list.length === 0 || !objSummary.payment_method ? "#eff1f3" : primaryColor,
                  color: isDisabled || state.cart_list.length === 0 || !objSummary.payment_method ? "#bcc1c7" : "#fff",
                  fontWeight: 800, fontSize: 15, transition: "all 0.3s",
                  boxShadow: state.cart_list.length > 0 && objSummary.payment_method ? `0 6px 15px ${primaryColor}30` : "none",
                  cursor: isDisabled || state.cart_list.length === 0 || !objSummary.payment_method ? "not-allowed" : "pointer",
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                }}
              >
                <ShoppingOutlined style={{ fontSize: 18 }} />
                {t.place_order.toUpperCase()}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Held Orders Drawer (Local Drafts) */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: COLORS.darkGreen }}>
            <PauseCircleOutlined />
            <span>Held Drafts / ការកុម្ម៉ង់ផ្អាកទុក</span>
          </div>
        }
        placement="right"
        onClose={() => setHeldOrdersVisible(false)}
        open={heldOrdersVisible}
        width={380}
        styles={{
          header: { borderBottom: `1px solid ${COLORS.softBorder}`, padding: '16px 24px' },
          body: { padding: 0 }
        }}
      >
        <List
          dataSource={heldOrders}
          locale={{ emptyText: <Empty description="No held drafts" /> }}
          renderItem={(order) => (
            <List.Item
              style={{
                padding: '16px 24px',
                borderBottom: `1px solid ${COLORS.softBorder}`,
                display: 'block'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text strong style={{ fontSize: 16 }}>
                  {order.tableNo ? `${t.table_label} ${order.tableNo}` : t.walk_in}
                </Text>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {new Date(order.heldAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 4 }}>
                  {order.customerName || t.guest} • {order.cart_list.length} Items
                </div>
                <div style={{ fontSize: 12, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {order.cart_list.slice(0, 3).map((it, i) => (
                    <Tag key={i} style={{ borderRadius: 4, fontSize: 10, margin: 0 }}>
                      {it.name} x{it.cart_qty}
                    </Tag>
                  ))}
                  {order.cart_list.length > 3 && <Tag style={{ borderRadius: 4, fontSize: 10, margin: 0 }}>...</Tag>}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ flex: 1, display: 'flex', gap: 6 }}>
                  <Button
                    type="primary"
                    icon={<FolderOpenOutlined />}
                    style={{ background: COLORS.darkGreen, borderRadius: 8, padding: '0 20px' }}
                    onClick={() => handleResumeHeldOrder(order)}
                  >
                    Open / បើកតុ
                  </Button>
                </div>

                <div style={{ textAlign: 'right', minWidth: 80 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.darkGreen }}>
                    ${(order.objSummary?.total || 0).toFixed(2)}
                  </div>
                  <div style={{ fontSize: 10, color: COLORS.textSecondary }}>
                    ≈ {((order.objSummary?.total || 0) * exchangeRate).toLocaleString()} ៛
                  </div>
                </div>
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => removeHeldOrder(order.id)}
                />
              </div>

            </List.Item>
          )}
        />
        {heldOrders.length > 0 && (
          <div style={{ padding: 20 }}>
            <Button
              block
              danger
              type="dashed"
              onClick={() => {
                Modal.confirm({
                  title: 'Clear all held orders?',
                  content: 'This action cannot be undone.',
                  onOk: () => useHeldOrdersStore.getState().clearAllHeldOrders()
                })
              }}
            >
              Clear All Drafts
            </Button>
          </div>
        )}
      </Drawer>

      <QRPaymentModal
        visible={qrModalVisible}
        onClose={() => {
          setQrModalVisible(false);
          setPaymentData({ paymentLink: "", orderNo: "", total: 0 });
          // Trigger print workflow for all order types after QR payment
          triggerAutoPrintWorkflow(false);
        }}
        paymentLink={paymentData.paymentLink}
        orderNo={paymentData.orderNo}
        total={paymentData.total}
        branchInfo={branchInfo}
      />

      <Modal
        title={
          <div style={{ fontSize: 17, color: COLORS.darkGreen, fontWeight: 800 }}>
            {selectedProductForOptions?.name || t.customize_coffee}
          </div>
        }
        open={optionsModalVisible}
        onCancel={() => {
          setOptionsModalVisible(false);
          setIsEditingUniqueId(null);
        }}
        footer={[
          <Button key="cancel" onClick={() => { setOptionsModalVisible(false); setIsEditingUniqueId(null); }}>
            {t.cancel || "Cancel"}
          </Button>,
          // "Add Directly" - adds the item without any customization (useful for simple/standard orders)
          !isEditingUniqueId && (
            <Button key="direct" onClick={() => {
              const product = selectedProductForOptions;
              if (!product) return;
              setState(prev => {
                const cart = [...prev.cart_list];
                const idx = cart.findIndex(c => c.id === product.id && !c.unique_id);
                if (idx === -1) {
                  cart.push({ ...product, cart_qty: 1 });
                } else {
                  cart[idx] = { ...cart[idx], cart_qty: cart[idx].cart_qty + 1 };
                }
                return { ...prev, cart_list: cart };
              });
              setOptionsModalVisible(false);
              setSelectedProductForOptions(null);
            }}>
              ➕ {t.add_to_cart || "Add Standard"}
            </Button>
          ),
          <Button key="confirm" type="primary" onClick={handleConfirmOptions}
            style={{ background: COLORS.darkGreen, borderRadius: 8 }}>
            ✅ {t.confirm || "Confirm Options"}
          </Button>
        ].filter(Boolean)}
        width={520}
        centered
        destroyOnClose
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '10px 0' }}>
          {/* 1. Mood Selector (Instructions / Taste) */}
          {(selectedProductForOptions?.moods && Array.isArray(safeParse(selectedProductForOptions.moods)) && safeParse(selectedProductForOptions.moods).length > 0) && (
            <div>
              <div style={{ fontWeight: 800, marginBottom: 12, color: COLORS.textPrimary, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>🌶️</span> {layoutType === 'restaurant' ? "Taste Options / រសជាតិ" : (t.mood || "Choice")}
              </div>
              <Radio.Group
                value={tempOptions.mood}
                onChange={e => setTempOptions(p => ({ ...p, mood: e.target.value }))}
                buttonStyle="solid"
                style={{ width: '100%' }}
              >
                <Space wrap>
                  {(safeParse(selectedProductForOptions.moods) || []).map(m => {
                    const mLabel = typeof m === 'object' ? (m.label || m.value) : m;
                    const mValue = typeof m === 'object' ? (m.value || m.label) : m;
                    return (
                      <Radio.Button key={mValue} value={mValue} style={{ borderRadius: 8, margin: '2px' }}>
                        {mLabel}
                      </Radio.Button>
                    );
                  })}
                </Space>
              </Radio.Group>
            </div>
          )}

          {/* 2. Size Selector (Portion) */}
          {(selectedProductForOptions?.sizes && Array.isArray(safeParse(selectedProductForOptions.sizes)) && safeParse(selectedProductForOptions.sizes).length > 0) && (
            <div>
              <div style={{ fontWeight: 800, marginBottom: 12, color: COLORS.textPrimary, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>🍽️</span> {layoutType === 'restaurant' ? "Portion / ទំហំ" : (t.size || "Size")}
              </div>
              <Radio.Group
                value={tempOptions.size}
                onChange={e => setTempOptions(p => ({ ...p, size: e.target.value }))}
                style={{ width: '100%' }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {(safeParse(selectedProductForOptions.sizes) || []).map(s => (
                    <Radio.Button
                      key={s.label}
                      value={s.label}
                      style={{
                        height: 'auto',
                        padding: '10px',
                        borderRadius: 12,
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        lineHeight: 1.2
                      }}
                    >
                      <div style={{ fontWeight: 700 }}>{s.label}</div>
                      <div style={{ fontSize: 12, color: COLORS.midGreen }}>
                        ${Number(s.price || 0).toFixed(2)}
                      </div>
                    </Radio.Button>
                  ))}
                </div>
              </Radio.Group>
            </div>
          )}

          {/* 3. Sugar Selector (Only for Drinks) */}
          {(selectedProductForOptions?.moods && safeParse(selectedProductForOptions.moods)?.length > 0) && (
            <div>
              <div style={{ fontWeight: 800, marginBottom: 12, color: COLORS.textPrimary, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>🍯</span> {t.sugar_level || "Sugar Level"}
              </div>
              <Radio.Group
                value={tempOptions.sugar}
                onChange={e => setTempOptions(p => ({ ...p, sugar: e.target.value }))}
                buttonStyle="solid"
              >
                <Radio.Button value="0%" style={{ borderRadius: '8px 0 0 8px' }}>0%</Radio.Button>
                <Radio.Button value="25%">25%</Radio.Button>
                <Radio.Button value="50%">50%</Radio.Button>
                <Radio.Button value="100%" style={{ borderRadius: '0 8px 8px 0' }}>100%</Radio.Button>
              </Radio.Group>
            </div>
          )}

          {/* 4. Add-ons Selector (Side Dishes) */}
          {(selectedProductForOptions?.addons && Array.isArray(safeParse(selectedProductForOptions.addons)) && safeParse(selectedProductForOptions.addons).length > 0) && (
            <div>
              <div style={{ fontWeight: 800, marginBottom: 12, color: COLORS.textPrimary, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>🥗</span> {layoutType === 'restaurant' ? "Side Dishes / គ្រឿមបន្ថែម" : (t.addons || "Add-ons")}
              </div>
              <Checkbox.Group
                value={tempOptions.addons}
                onChange={v => setTempOptions(p => ({ ...p, addons: v }))}
                style={{ width: '100%' }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {(safeParse(selectedProductForOptions.addons) || []).map(a => (
                    <div key={a.label} style={{
                      background: '#f8fafc',
                      padding: '8px 12px',
                      borderRadius: 10,
                      border: `1px solid ${tempOptions.addons.includes(a.label) ? COLORS.darkGreen : '#e2e8f0'}`,
                      transition: 'all 0.2s'
                    }}>
                      <Checkbox value={a.label}>
                        <div style={{ display: 'inline-flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600, fontSize: 13 }}>{a.label}</span>
                          <span style={{ fontSize: 11, color: COLORS.midGreen }}>+${Number(a.price).toFixed(2)}</span>
                        </div>
                      </Checkbox>
                    </div>
                  ))}
                </div>
              </Checkbox.Group>
            </div>
          )}

          {/* 5. Kitchen Note */}
          <div style={{ marginTop: 4 }}>
            <div style={{ fontWeight: 800, marginBottom: 8, color: COLORS.textPrimary, fontSize: 14 }}>
              🗒️ {layoutType === 'restaurant' ? "Kitchen Note / ចុងភៅ" : "Note / ចំណាំ"}
            </div>
            <Input.TextArea
              placeholder={layoutType === 'restaurant' ? "e.g. Less Spicy, No Peanuts..." : "Add your note here..."}
              value={tempOptions.note}
              onChange={e => setTempOptions(p => ({ ...p, note: e.target.value }))}
              rows={2}
              style={{ borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0' }}
            />
          </div>
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
          renderItem={(order) => {
            const isTableOccupied = heldOrders.some(h => String(h.tableNo) === String(order.table_no));
            return (
              <List.Item
                onClick={() => handleSelectPendingOrder(order)}
                style={{
                  cursor: 'pointer',
                  padding: '16px 24px',
                  borderBottom: `1px solid ${COLORS.softBorder}`,
                  transition: 'all 0.2s',
                  background: isTableOccupied ? '#fff1f0' : 'inherit'
                }}
                className="pending-order-item"
              >
                <div style={{ width: '100%' }}>
                  {isTableOccupied && (
                    <div style={{ marginBottom: 8 }}>
                      <Tag color="error" icon={<WarningFilled />} style={{ width: '100%', textAlign: 'center', fontWeight: 700 }}>
                        CONFLICT: TABLE ALREADY OCCUPIED
                      </Tag>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Text strong style={{ fontSize: 15 }}>
                        {order.table_no ? `${t.table_label} ${order.table_no}` : t.walk_in}
                      </Text>
                      {order.is_verified === 1 ? (
                        <Tag color="success" icon={<EnvironmentFilled />} style={{ fontSize: 9, borderRadius: 10 }}>IN SHOP</Tag>
                      ) : order.lat ? (
                        <Tag color="error" icon={<WarningFilled />} style={{ fontSize: 9, borderRadius: 10 }}>REMOTE</Tag>
                      ) : (
                        <Tag color="default" style={{ fontSize: 9, borderRadius: 10 }}>NO LOCATION</Tag>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <Tag color={order.status === 'unpaid' ? 'volcano' : 'blue'}>{order.status.toUpperCase()}</Tag>
                      {order.kitchen_status && (
                        <Tag color={order.kitchen_status === 'preparing' ? 'processing' : order.kitchen_status === 'ready' ? 'success' : 'default'}>
                          {order.kitchen_status.toUpperCase()}
                        </Tag>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>{order.customer_name || t.guest}</Text>
                      <Text type="secondary" style={{ fontSize: 11 }}>{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                    </div>
                    <Text strong style={{ color: COLORS.darkGreen, fontSize: 16 }}>${Number(order.total_amount).toFixed(2)}</Text>
                  </div>
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
            );
          }}
        />
        <div style={{ padding: 20 }}>
          <Button block onClick={getPendingOrders} icon={<ClockCircleOutlined />}>{t.refresh_list}</Button>
        </div>
      </Drawer>

      {/* Cash Payment / Change Calculator Modal */}
      <Modal
        title={
          <div style={{ textAlign: 'center', color: COLORS.darkGreen, fontSize: 20 }}>
            💵 Cash Payment Calculator
          </div>
        }
        open={cashPaymentModalVisible}
        onCancel={() => setCashPaymentModalVisible(false)}
        footer={[
          <Button
            key="exact"
            onClick={() => {
              setCashReceivedUSD(objSummary.total);
              setCashReceivedKHR(0);
            }}
            size="large"
            style={{ borderRadius: 10, background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}
          >
            Exact Amount ($)
          </Button>,
          <Button key="close" type="primary" onClick={() => setCashPaymentModalVisible(false)} size="large" style={{ borderRadius: 10, background: COLORS.darkGreen, minWidth: 120 }}>
            Done
          </Button>
        ]}
        width={450}
        centered
      >
        <div style={{ padding: '10px 0' }}>
          {/* Total Summary Header */}
          <div style={{
            background: '#1e4a2d',
            padding: '24px 20px',
            borderRadius: 20,
            marginBottom: 24,
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(30,74,45,0.2)',
            color: '#fff'
          }}>
            <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Total Amount Due</div>
            <div style={{ fontSize: 40, fontWeight: 900 }}>
              ${objSummary.total.toFixed(2)}
            </div>
            <div style={{ fontSize: 20, opacity: 0.9, fontWeight: 600, marginTop: 4 }}>
              ៛ {(Math.round(objSummary.total * exchangeRate / 100) * 100).toLocaleString()}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* USD Input Section */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontWeight: 800, fontSize: 16, color: '#2d3748' }}>Received USD ($)</span>
                <Button size="small" type="link" onClick={() => setCashReceivedUSD(0)}>Clear</Button>
              </div>
              <InputNumber
                size="large"
                style={{ width: '100%', borderRadius: 12, height: 50, display: 'flex', alignItems: 'center', fontSize: 20, fontWeight: 700 }}
                value={cashReceivedUSD}
                onChange={v => setCashReceivedUSD(v || 0)}
                min={0}
                placeholder="0.00"
                autoFocus
                onFocus={(e) => e.target.select()}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                {[1, 5, 10, 20, 50].map(val => (
                  <Button
                    key={val}
                    style={{ flex: 1, borderRadius: 8, height: 36, fontWeight: 700 }}
                    onClick={() => setCashReceivedUSD(prev => (Number(prev) || 0) + val)}
                  >
                    +${val}
                  </Button>
                ))}
              </div>
            </div>

            {/* KHR Input Section */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontWeight: 800, fontSize: 16, color: '#2d3748' }}>Received KHR (៛)</span>
                <Button size="small" type="link" onClick={() => setCashReceivedKHR(0)}>Clear</Button>
              </div>
              <InputNumber
                size="large"
                style={{ width: '100%', borderRadius: 12, height: 50, display: 'flex', alignItems: 'center', fontSize: 20, fontWeight: 700 }}
                value={cashReceivedKHR}
                onChange={v => setCashReceivedKHR(v || 0)}
                min={0}
                step={100}
                placeholder="0"
                onFocus={(e) => e.target.select()}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                {[5000, 10000, 20000, 50000].map(val => (
                  <Button
                    key={val}
                    style={{ flex: 1, borderRadius: 8, height: 36, fontWeight: 700, fontSize: 11 }}
                    onClick={() => setCashReceivedKHR(prev => (Number(prev) || 0) + val)}
                  >
                    +{(val / 1000)}k៛
                  </Button>
                ))}
              </div>
            </div>

            {/* Smart Change Result */}
            {(() => {
              const totalReceivedUSD = Number(cashReceivedUSD || 0) + (Number(cashReceivedKHR || 0) / exchangeRate);
              const changeUSD = Math.max(0, totalReceivedUSD - objSummary.total);

              // Smart Split Logic: Full USD + Remaining in KHR
              const fullUSD = Math.floor(changeUSD);
              const remainUSD = changeUSD - fullUSD;
              const remainKHR = Math.round((remainUSD * exchangeRate) / 100) * 100;

              return (
                <div style={{
                  marginTop: 8,
                  padding: '24px 20px',
                  background: changeUSD > 0 ? '#f0fdf4' : '#f8fafc',
                  border: `2px dashed ${changeUSD > 0 ? '#22c55e' : '#cbd5e1'}`,
                  borderRadius: 20,
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase' }}>Change to Return</div>

                  {changeUSD > 0 ? (
                    <div>
                      <div style={{ fontSize: 44, fontWeight: 900, color: '#166534', lineHeight: 1 }}>
                        ${changeUSD.toFixed(2)}
                      </div>
                      <Divider style={{ margin: '16px 0', borderColor: 'rgba(22,101,52,0.1)' }}>
                        <span style={{ fontSize: 11, color: '#166534', fontWeight: 700 }}>OR SMART SPLIT</span>
                      </Divider>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 20, alignItems: 'center' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 24, fontWeight: 800, color: '#166534' }}>${fullUSD}</div>
                          <div style={{ fontSize: 10, color: '#166534', opacity: 0.7 }}>DOLLARS</div>
                        </div>
                        <div style={{ fontSize: 24, color: '#166534', opacity: 0.3 }}>+</div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 24, fontWeight: 800, color: '#166534' }}>{remainKHR.toLocaleString()}៛</div>
                          <div style={{ fontSize: 10, color: '#166534', opacity: 0.7 }}>RIELS</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#94a3b8', padding: '10px 0' }}>
                      Insufficient Cash
                    </div>
                  )}
                </div>
              );
            })()}

            <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', fontStyle: 'italic' }}>
              Official Exchange: 1$ = {exchangeRate.toLocaleString()}៛
            </div>
          </div>
        </div>
      </Modal>
      {/* 🚀 Open Shift Modal */}
      <Modal
        title={
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <Typography.Title level={4} style={{ margin: 0 }}><ShoppingOutlined /> Open New Shift / បើកបញ្ជីថ្មី</Typography.Title>
            <Typography.Text type="secondary">Enter your opening cash to start / បញ្ចូលសាច់ប្រាក់ដើមគ្រាដើម្បីចាប់ផ្តើម</Typography.Text>
          </div>
        }
        open={openShiftModalVisible}
        footer={null}
        width={400}
        closable={false}
        maskClosable={false}
      >
        <Form layout="vertical" onFinish={onOpenShift}>
          <div style={{ background: '#f8fafc', padding: 20, borderRadius: 12, marginBottom: 20 }}>
            <Form.Item
              name="opening_cash_usd"
              label="Opening Cash (USD) / លុយដើម ($)"
              initialValue={0}
            >
              <InputNumber
                style={{ width: '100%' }}
                size="large"
                prefix="$"
                min={0}
              />
            </Form.Item>
            <Form.Item
              name="opening_cash_khr"
              label="Opening Cash (KHR) / លុយដើម (៛)"
              initialValue={0}
            >
              <InputNumber
                style={{ width: '100%' }}
                size="large"
                prefix="៛"
                min={0}
                step={100}
              />
            </Form.Item>
          </div>

          <div style={{ textAlign: 'center', marginBottom: 10 }}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Authorized By: <Typography.Text strong>{profile?.name}</Typography.Text>
            </Typography.Text>
          </div>

          <Button
            type="primary"
            htmlType="submit"
            block
            size="large"
            style={{ height: 50, borderRadius: 8, background: COLORS.darkGreen }}
          >
            Open Shift Now / បើកបញ្ជីឥឡូវនេះ
          </Button>

          <div style={{ marginTop: 15, textAlign: 'center' }}>
            <Button type="link" onClick={() => window.location.href = '/'}>
              Back to Dashboard / ត្រឡប់ទៅផ្ទាំងគ្រប់គ្រង
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}

export default PosPage;