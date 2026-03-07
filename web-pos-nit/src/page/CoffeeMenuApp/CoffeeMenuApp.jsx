import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingCart, Plus, Minus, QrCode, Coffee, MapPin,
  Bell, Eye, Check, Thermometer, Zap, Store, Settings,
  Edit3, Trash2, Save, X, Search, ChevronRight, Menu, Image as ImageIcon
} from 'lucide-react';
import { request, getIconForCategory, getColorForCategory } from '../../util/helper';
import { getProfile } from '../../store/profile.store';
import { Config } from '../../util/config';
import { message, Select, Modal, Input, Button, InputNumber, Badge, Drawer } from 'antd';
import { configStore } from "../../store/configStore";
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Helper for tailwind classes
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const ProductOptionsModal = ({
  item,
  onAdd,
  onClose,
  productSizes,
  calculateItemPrice
}) => {
  const [selectedSize, setSelSize] = useState(null);
  const [selectedAddons, setSelAddons] = useState([]);
  const [selectedTemp, setSelTemp] = useState('Cold');
  const [selectedSugar, setSelSugar] = useState('50%');
  const [itemQty, setItemQty] = useState(1);

  const temperatures = ['Hot', 'Cold'];
  const sugarLevels = ['No Sugar', '25%', '50%', '75%', '100%'];

  useEffect(() => {
    if (item) {
      setSelSize(productSizes[item.id]?.[0] || null);
      setSelAddons([]);
      setSelTemp('Cold');
      setSelSugar('50%');
      setItemQty(1);
    }
  }, [item, productSizes]);

  if (!item) return null;

  return (
    <div className="space-y-6 pt-2">
      <div className="flex gap-4">
        <div className="w-24 h-24 rounded-2xl bg-[#f8f7f2] overflow-hidden flex-shrink-0">
          {item.image ? (
            <img src={Config.getFullImagePath(item.image)} className="w-full h-full object-cover" />
          ) : (<div className="w-full h-full flex items-center justify-center text-3xl">☕</div>)}
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#1e4a2d]">{item.name}</h2>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-[#1e4a2d] font-black text-2xl">
              ${calculateItemPrice(item, selectedSize, []).toFixed(2)}
            </p>
            {item.discount > 0 && (
              <span className="text-sm text-gray-400 line-through font-bold">
                ${(selectedSize?.price ? parseFloat(selectedSize.price) : parseFloat(item.price)).toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {productSizes[item.id]?.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-bold text-[#1e4a2d]">Select Size</p>
            <div className="flex flex-wrap gap-2">
              {productSizes[item.id].map(size => (
                <button
                  key={size.id}
                  onClick={() => setSelSize(size)}
                  className={cn(
                    "px-4 py-2 rounded-xl border text-sm font-bold transition-all",
                    selectedSize?.id === size.id ? "bg-[#1e4a2d] border-[#1e4a2d] text-white" : "bg-white border-gray-100 text-[#1e4a2d] hover:bg-gray-50"
                  )}
                > {size.name} </button>
              ))}
            </div>
          </div>
        )}

        {/* Filter drink-specific options: Temperature and Sugar */}
        {(item.category_name?.toLowerCase().includes('coffee') ||
          item.category_name?.toLowerCase().includes('juice') ||
          item.category_name?.toLowerCase().includes('milk') ||
          item.category_name?.toLowerCase().includes('drink') ||
          item.category_name?.toLowerCase().includes('tea')) && (
            <>
              <div className="space-y-2">
                <p className="text-sm font-bold text-[#1e4a2d]">Temperature</p>
                <div className="flex gap-2">
                  {temperatures.map(temp => (
                    <button
                      key={temp}
                      onClick={() => setSelTemp(temp)}
                      className={cn(
                        "flex-1 py-3 rounded-xl border text-sm font-bold transition-all flex items-center justify-center gap-2",
                        selectedTemp === temp ? "bg-[#1e4a2d] border-[#1e4a2d] text-white" : "bg-white border-gray-100 text-[#1e4a2d] hover:bg-gray-50"
                      )}
                    > {temp === 'Hot' ? '🔥' : '🧊'} {temp} </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-bold text-[#1e4a2d]">Sugar Level</p>
                <div className="grid grid-cols-3 gap-2">
                  {sugarLevels.map(level => (
                    <button
                      key={level}
                      onClick={() => setSelSugar(level)}
                      className={cn(
                        "py-2 rounded-xl border text-xs font-bold transition-all",
                        selectedSugar === level ? "bg-[#1e4a2d] border-[#1e4a2d] text-white" : "bg-white border-gray-100 text-[#1e4a2d] hover:bg-gray-50"
                      )}
                    > {level} </button>
                  ))}
                </div>
              </div>
            </>
          )}

        <div className="pt-4 flex items-center justify-between gap-4">
          <div className="flex items-center bg-[#f8f7f2] rounded-2xl p-1 border border-gray-100">
            <button onClick={() => setItemQty(q => Math.max(1, q - 1))} className="w-10 h-10 flex items-center justify-center text-[#1e4a2d]"> <Minus size={18} /> </button>
            <span className="w-8 text-center font-bold text-[#1e4a2d]">{itemQty}</span>
            <button onClick={() => setItemQty(q => q + 1)} className="w-10 h-10 flex items-center justify-center text-[#1e4a2d]"> <Plus size={18} /> </button>
          </div>
          <button
            onClick={() => onAdd(item, selectedSize, selectedAddons, selectedTemp, selectedSugar, itemQty)}
            className="flex-1 bg-[#1e4a2d] text-white py-4 rounded-2xl font-bold shadow-lg shadow-[#1e4a2d]/20 hover:bg-[#153420] transition-colors"
          > Add to Cart </button>
        </div>
      </div>
    </div>
  );
};

const CoffeeMenuApp = () => {
  const [selectedTable, setSelectedTable] = useState(() => localStorage.getItem('coffee_pos_table') || null);
  const [selectedShop, setSelectedShop] = useState(() => {
    const saved = localStorage.getItem('coffee_pos_shop');
    return saved ? JSON.parse(saved) : null;
  });
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('coffee_pos_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentView, setCurrentView] = useState(() => localStorage.getItem('coffee_pos_view') || 'shops');
  const [orders, setOrders] = useState([]);
  const [newOrderAlert, setNewOrderAlert] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [productSizes, setProductSizes] = useState({});
  const [productAddons, setProductAddons] = useState({});
  const [shops, setShops] = useState([]);
  const [categories, setCategories] = useState([]);
  const [parentCategories, setParentCategories] = useState([]);
  const [isQRModalVisible, setIsQRModalVisible] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [isShopModalVisible, setIsShopModalVisible] = useState(false);
  const [editingShop, setEditingShop] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderType, setOrderType] = useState('dine_in');
  const [newShop, setNewShop] = useState({
    name: '',
    location: '',
    table_count: 10,
    user_id: null
  });
  const { config } = configStore();

  // Save selections and cart to localStorage for survival after browser refresh
  useEffect(() => {
    if (selectedTable) {
      localStorage.setItem('coffee_pos_table', selectedTable);
    } else {
      localStorage.removeItem('coffee_pos_table');
    }

    if (selectedShop) {
      localStorage.setItem('coffee_pos_shop', JSON.stringify(selectedShop));
    } else {
      localStorage.removeItem('coffee_pos_shop');
    }

    localStorage.setItem('coffee_pos_view', currentView || 'shops');
    localStorage.setItem('coffee_pos_cart', JSON.stringify(cart));
  }, [selectedTable, selectedShop, currentView, cart]);

  useEffect(() => {
    const isGuest = localStorage.getItem("is_guest") === "true";
    if (!isGuest) {
      fetchShops();
    }
    handleGuestEntry();
  }, []);

  const handleGuestEntry = () => {
    const profile = getProfile();
    const isGuest = localStorage.getItem("is_guest") === "true";

    if (isGuest && profile && profile.branch_id) {
      setSelectedShop({
        id: profile.branch_id,
        business_id: profile.business_id,
        name: profile.branch_name || "Branch",
        business_name: profile.business_name || "Coffee Shop",
        table_count: 20
      });
      setSelectedTable(profile.table_no || null);
      setCurrentView('menu');
      localStorage.removeItem("is_guest");
    }
  };

  useEffect(() => {
    if (selectedShop?.id) {
      fetchShopProducts();
    }
  }, [selectedShop, selectedCategory, searchText]);

  const fetchShops = async () => {
    try {
      const profile = getProfile();
      if (!profile?.id) return;
      const res = await request("branch", "get");
      if (res && res.list) {
        setShops(res.list || []);
      }
    } catch (error) {
      console.error('Error fetching shops:', error);
    }
  };

  const fetchShopProducts = async () => {
    try {
      const res = await request("product", "get", {
        txt_search: searchText || "",
        category_id: selectedCategory === 'all' ? null : selectedCategory,
      });

      if (res && res.list) {
        setMenuItems(res.list || []);
        const uniqueCats = Array.from(new Set(res.list.map(i => i.category_name))).map(name => {
          const item = res.list.find(i => i.category_name === name);
          return { id: item.category_id, name: name };
        });
        setCategories(uniqueCats);
        fetchProductConfigurations(res.list || []);
      }
    } catch (error) {
      console.error('Error fetching shop products:', error);
    }
  };

  const fetchProductConfigurations = (products) => {
    if (!products || products.length === 0) return;
    const sizesMap = {};
    const addonsMap = {};

    products.forEach(p => {
      try {
        if (p.sizes) {
          const parsedSizes = typeof p.sizes === 'string' ? JSON.parse(p.sizes) : p.sizes;
          sizesMap[p.id] = parsedSizes.map(s => ({
            id: s.id || Math.random(),
            name: s.label || s.name || "Default",
            value: (s.id || s.label || s.name || "").toString(),
            price: parseFloat(s.price || 0)
          }));
        }
        if (p.addons) {
          const parsedAddons = typeof p.addons === 'string' ? JSON.parse(p.addons) : p.addons;
          addonsMap[p.id] = parsedAddons.map(a => ({
            id: a.id || Math.random(),
            name: a.label || a.name || "Default",
            value: (a.id || a.label || a.name || "").toString(),
            price: parseFloat(a.price || 0)
          }));
        }
      } catch (e) {
        console.error("Error parsing configs for product", p.id, e);
      }
    });

    setProductSizes(sizesMap);
    setProductAddons(addonsMap);
  };

  const temperatures = ['Hot', 'Cold'];
  const sugarLevels = ['No Sugar', '25%', '50%', '75%', '100%'];

  const calculateDiscountedPrice = (price, discount) => {
    const p = parseFloat(price) || 0;
    const d = parseFloat(discount) || 0;
    return p - (p * d / 100);
  };

  const calculateItemPrice = (item, size, addons) => {
    let basePrice = parseFloat(item.price) || 0;
    if (size && size.price) {
      basePrice = parseFloat(size.price);
    }
    const discountedBase = basePrice - (basePrice * (parseFloat(item.discount) || 0) / 100);
    let total = discountedBase;
    if (addons && addons.length > 0) {
      total += addons.reduce((sum, addon) => sum + (parseFloat(addon.price) || 0), 0);
    }
    return total;
  };

  const addToCart = (item, selectedSize, selectedAddons, temperature, sugarLevel, quantity = 1) => {
    const availableStock = item.qty || item.stock || 0;
    if (availableStock < quantity) {
      message.error(`Sorry, only ${availableStock} items available!`);
      return;
    }

    const unitPrice = calculateItemPrice(item, selectedSize, selectedAddons);

    const cartItem = {
      cart_id: Date.now() + Math.random(),
      product_id: item.id,
      name: item.name,
      barcode: item.barcode,
      size: selectedSize,
      addons: selectedAddons,
      temperature,
      sugarLevel,
      quantity: Number(quantity),
      originalPrice: parseFloat(item.price) || 0,
      discount: parseFloat(item.discount) || 0,
      discountedPrice: unitPrice,
      totalPrice: unitPrice * Number(quantity),
      image: item.image,
      category_name: item.category_name || ''
    };

    setCart(prev => [...prev, cartItem]);
    message.success(`${item.name} added!`);
  };

  const getTotalPrice = () => cart.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0);
  const removeFromCart = (index) => setCart(cart.filter((_, i) => i !== index));

  const submitOrder = async () => {
    if (cart.length === 0) return;
    const profile = getProfile();
    const order = {
      table_no: selectedTable,
      branch_id: selectedShop?.id,
      sub_total: getTotalPrice(),
      total_amount: getTotalPrice(),
      user_id: profile?.id || null,
      customer_name: profile?.name || 'Guest',
      status: 'ordered',
      payment_method: 'Cash',
      order_type: orderType,
      cart_items: cart.map(item => ({
        product_id: item.product_id,
        qty: item.quantity,
        price: item.discountedPrice,
        note: `${item.size?.name || ''} ${item.temperature} ${item.sugarLevel}`
      }))
    };

    try {
      const res = await request("order", "post", order);
      if (res && res.success) {
        message.success("Order placed successfully!");
        setCart([]);
        setIsCartOpen(false);
      } else {
        message.error("Failed to place order");
      }
    } catch (error) {
      message.error("Network error");
    }
  };

  const CategoryCard = ({ category, isActive, onClick }) => (
    <motion.div
      whileTap={{ scale: 0.95 }}
      whileHover={{ y: -4 }}
      onClick={onClick}
      className={cn(
        "flex-shrink-0 cursor-pointer rounded-[28px] p-2 transition-all duration-500 min-w-[110px] sm:min-w-[130px] border",
        isActive
          ? "bg-[#1e4a2d] border-[#1e4a2d] text-white shadow-[0_20px_25px_-5px_rgba(30,74,45,0.2)]"
          : "bg-white border-transparent text-[#1e4a2d] hover:bg-white/80 hover:border-[#1e4a2d]/10"
      )}
    >
      <div className="flex flex-col items-center gap-2 py-2">
        <div className={cn(
          "w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-transform duration-500",
          isActive ? "bg-white/10 scale-110" : "bg-[#f8f7f2]"
        )}>
          {getIconForCategory(category.name)}
        </div>
        <div className="text-center px-1">
          <p className="font-bold text-[13px] tracking-tight truncate w-full">{category.name}</p>
          <div className={cn(
            "w-1 h-1 rounded-full mx-auto mt-1 transition-all duration-500",
            isActive ? "bg-white w-4" : "bg-transparent"
          )}></div>
        </div>
      </div>
    </motion.div>
  );

  const ProductCard = ({ item, onSelect }) => {
    const discountedPrice = calculateDiscountedPrice(item.price, item.discount);
    const inStock = (item.qty || item.stock) > 0;

    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ y: -8 }}
        className="bg-white rounded-[40px] p-3 border border-gray-50 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(30,74,45,0.08)] transition-all duration-500 group"
      >
        <div className="relative aspect-[4/5] rounded-[32px] bg-[#f8f7f2] overflow-hidden mb-4">
          {item.image ? (
            <img
              src={Config.getFullImagePath(item.image)}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              alt={item.name}
              onError={(e) => { e.target.src = 'https://via.placeholder.com/200?text=Coffee'; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl opacity-50">☕</div>
          )}

          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {item.discount > 0 && (
              <div className="bg-amber-400 text-[#1e4a2d] text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm">
                -{item.discount}%
              </div>
            )}
            {!inStock && (
              <div className="bg-gray-800/80 backdrop-blur-md text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-tighter">
                Sold Out
              </div>
            )}
          </div>

          <div className="absolute inset-x-3 bottom-3 translate-y-12 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500">
            <button
              onClick={() => inStock && onSelect(item)}
              className="w-full bg-white/95 backdrop-blur-md text-[#1e4a2d] py-3 rounded-2xl font-bold text-xs shadow-xl flex items-center justify-center gap-2 hover:bg-[#1e4a2d] hover:text-white transition-all"
            >
              <ShoppingCart size={14} /> Quick Add
            </button>
          </div>
        </div>

        <div className="space-y-1 px-3 pb-2 pt-1">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">
            {item.category_name}
          </p>
          <h3 className="font-bold text-[#1e4a2d] text-lg leading-tight line-clamp-1">{item.name}</h3>

          <div className="flex items-center justify-between pt-1">
            <div className="flex flex-col">
              {item.discount > 0 ? (
                <div className="flex items-center gap-2">
                  <p className="text-xl font-black text-[#1e4a2d]">
                    ${discountedPrice.toFixed(2)}
                  </p>
                  <span className="text-[11px] text-gray-300 line-through font-bold">
                    ${parseFloat(item.price).toFixed(2)}
                  </span>
                </div>
              ) : (
                <p className="text-xl font-black text-[#1e4a2d]">
                  ${parseFloat(item.price).toFixed(2)}
                </p>
              )}
            </div>
            <motion.button
              whileTap={{ scale: 0.8 }}
              onClick={() => inStock && onSelect(item)}
              disabled={!inStock}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500",
                inStock
                  ? "bg-[#1e4a2d] text-white shadow-lg shadow-[#1e4a2d]/20 group-hover:scale-110 group-hover:rotate-90"
                  : "bg-gray-100 text-gray-300 cursor-not-allowed"
              )}
            >
              <Plus size={20} />
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  };

  const [optionsModalItem, setOptionsModalItem] = useState(null);

  const showOptionsModal = (item) => setOptionsModalItem(item);

  const handleAddToCart = (item, selectedSize, selectedAddons, selectedTemp, selectedSugar, itemQty) => {
    addToCart(item, selectedSize, selectedAddons, selectedTemp, selectedSugar, itemQty);
    setOptionsModalItem(null);
  };

  switch (currentView) {
    case 'menu': return (
      <div className="min-h-screen bg-[#fafaf8] flex flex-col md:flex-row font-sans selection:bg-[#1e4a2d]/10">
        <div className="flex-1 flex flex-col max-h-screen overflow-hidden">
          <header className="px-6 py-8 flex items-center justify-between bg-white/70 backdrop-blur-2xl border-b border-gray-50 z-20">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="bg-[#1e4a2d] p-3 rounded-2xl text-white shadow-[0_8px_20px_-4px_rgba(30,74,45,0.4)]">
                  <Coffee size={24} />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-400 border-2 border-white rounded-full"></div>
              </div>
              <div>
                <h1 className="text-2xl font-black text-[#1e4a2d] tracking-tighter uppercase leading-none font-serif">
                  {selectedShop?.business_name || "Green Grounds"}
                </h1>
                <div className="flex items-center gap-2 mt-1.5 px-0.5">
                  <div className="flex items-center gap-1.5 py-0.5 px-2 bg-[#f8f7f2] rounded-full border border-gray-50">
                    <Store size={10} className="text-[#1e4a2d]/60" />
                    <p className="text-[9px] text-[#1e4a2d] font-black uppercase tracking-widest opacity-80">
                      {selectedShop?.branch_name || "Main Branch"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 py-0.5 px-2 bg-[#f8f7f2] rounded-full border border-gray-50">
                    <MapPin size={10} className="text-[#1e4a2d]/60" />
                    <p className="text-[9px] text-[#1e4a2d] font-bold uppercase">
                      Table: {selectedTable || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-5">
              <div className="hidden sm:flex flex-col items-end">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">
                  {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                </p>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                  <p className="text-[10px] text-[#1e4a2d] font-black uppercase tracking-tighter">Open Now</p>
                </div>
              </div>

              <button
                onClick={() => setIsCartOpen(true)}
                className="group relative bg-[#1e4a2d] w-14 h-14 rounded-[22px] text-white shadow-[0_12px_24px_-8px_rgba(30,74,45,0.5)] active:scale-95 transition-all duration-300 flex items-center justify-center overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                <ShoppingCart size={22} className="relative z-10" />
                {cart.length > 0 && (
                  <span className="absolute top-2.5 right-2.5 bg-amber-400 text-[#1e4a2d] text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#1e4a2d] animate-bounce">
                    {cart.length}
                  </span>
                )}
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-6 py-8 custom-scrollbar scroll-smooth">
            <div className="max-w-7xl mx-auto space-y-10">

              <div className="space-y-2">
                <h2 className="text-4xl font-black text-[#1e4a2d] tracking-tight leading-tight font-serif max-w-lg">
                  What would you like to <span className="text-amber-500">order</span> today?
                </h2>
                <div className="relative pt-4 max-w-2xl">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-gray-50 rounded-2xl text-gray-400 group-focus-within:text-[#1e4a2d] transition-colors">
                    <Search size={22} />
                  </div>
                  <input
                    type="text"
                    placeholder="Search your favorite coffee, snacks..."
                    className="w-full bg-white border border-gray-100 rounded-[30px] py-6 pl-20 pr-8 shadow-[0_10px_30px_rgba(0,0,0,0.02)] focus:outline-none focus:ring-4 focus:ring-[#1e4a2d]/5 focus:border-[#1e4a2d]/10 transition-all font-medium text-lg placeholder:text-gray-300"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-5 px-1">
                  <h3 className="text-xl font-bold text-[#1e4a2d] font-serif">Categories</h3>
                  <button className="text-xs font-black uppercase tracking-widest text-amber-600 hover:text-amber-700 transition-colors">See All</button>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar -mx-2 px-2">
                  <CategoryCard
                    category={{ id: 'all', name: 'All Menu' }}
                    isActive={selectedCategory === 'all'}
                    onClick={() => setSelectedCategory('all')}
                  />
                  {categories.map(cat => (
                    <CategoryCard
                      key={cat.id}
                      category={cat}
                      isActive={selectedCategory === cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                    />
                  ))}
                </div>
              </div>

              <div className="pb-32">
                <div className="flex items-center gap-3 mb-8 px-1">
                  <div className="w-1.5 h-8 bg-[#1e4a2d] rounded-full"></div>
                  <h3 className="text-2xl font-black text-[#1e4a2d] tracking-tight uppercase font-serif">
                    {selectedCategory === 'all' ? 'Featured Selection' : categories.find(c => c.id === selectedCategory)?.name}
                  </h3>
                </div>

                <AnimatePresence mode="popLayout">
                  <motion.div
                    layout
                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8"
                  >
                    {menuItems.map(item => (
                      <ProductCard key={item.id} item={item} onSelect={showOptionsModal} />
                    ))}
                  </motion.div>
                </AnimatePresence>

                {menuItems.length === 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-24 text-[#1e4a2d]/20">
                    <div className="bg-gray-50 p-10 rounded-full mb-6">
                      <ImageIcon size={80} strokeWidth={1} />
                    </div>
                    <p className="font-black uppercase tracking-[0.3em] text-sm">No items matching your taste</p>
                    <button onClick={() => { setSearchText(''); setSelectedCategory('all'); }} className="mt-4 text-[#1e4a2d] font-bold underline underline-offset-4 hover:text-[#1e4a2d]/60">Clear Search</button>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>

        <Modal
          open={!!optionsModalItem}
          onCancel={() => setOptionsModalItem(null)}
          footer={null}
          closeIcon={<div className="bg-gray-100 p-2 rounded-full hover:bg-red-50 hover:text-red-500 transition-all"><X size={18} /></div>}
          centered
          width={480}
          className="premium-modal"
          transitionName="ant-zoom"
          maskTransitionName="ant-fade"
        >
          <ProductOptionsModal
            item={optionsModalItem}
            onAdd={handleAddToCart}
            onClose={() => setOptionsModalItem(null)}
            productSizes={productSizes}
            calculateItemPrice={calculateItemPrice}
          />
        </Modal>

        <Drawer
          open={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          placement="right"
          width={window.innerWidth > 768 ? 420 : '100%'}
          className="premium-drawer"
          title={
            <div className="flex flex-col">
              <span className="font-serif font-black text-2xl text-[#1e4a2d] uppercase tracking-tighter">Your Order</span>
              <span className="text-[10px] text-gray-400 font-bold tracking-[0.4em] mt-1 uppercase">Ready to brewing?</span>
            </div>
          }
          closeIcon={<div className="bg-[#1e4a2d] text-white p-2 rounded-xl"><X size={18} /></div>}
        >
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pt-1 space-y-8">
              <div className="bg-white/50 backdrop-blur-md rounded-[32px] p-2 flex gap-1 border border-gray-100 shadow-sm">
                <button
                  onClick={() => setOrderType('dine_in')}
                  className={cn(
                    "flex-1 py-4 rounded-[24px] font-black text-xs transition-all duration-500 uppercase tracking-widest",
                    orderType === 'dine_in' ? "bg-[#1e4a2d] text-white shadow-xl shadow-[#1e4a2d]/20" : "bg-transparent text-[#1e4a2d]/40"
                  )}
                > Dine In </button>
                <button
                  onClick={() => setOrderType('take_away')}
                  className={cn(
                    "flex-1 py-4 rounded-[24px] font-black text-xs transition-all duration-500 uppercase tracking-widest",
                    orderType === 'take_away' ? "bg-[#1e4a2d] text-white shadow-xl shadow-[#1e4a2d]/20" : "bg-transparent text-[#1e4a2d]/40"
                  )}
                > Take Out </button>
              </div>

              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[50vh] gap-6 text-center">
                  <div className="relative">
                    <div className="bg-[#f8f7f2] w-32 h-32 rounded-full flex items-center justify-center text-[#1e4a2d]/10"> <ShoppingCart size={64} strokeWidth={1} /> </div>
                    <div className="absolute top-0 right-0 w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center text-[#1e4a2d] font-bold text-xs border-4 border-[#f8f7f2]">0</div>
                  </div>
                  <div className="space-y-2">
                    <p className="font-serif font-black text-xl text-[#1e4a2d]">Empty Cart</p>
                    <p className="text-xs text-gray-400 font-medium px-10">Add some delicious brews and bites to start your experience</p>
                  </div>
                  <button onClick={() => setIsCartOpen(false)} className="bg-[#1e4a2d] text-white px-8 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest">Browse Menu</button>
                </div>
              ) : (
                <div className="space-y-6">
                  {cart.map((item, index) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={item.cart_id}
                      className="bg-white rounded-[32px] p-4 border border-gray-50 shadow-[0_8px_20px_rgba(0,0,0,0.02)] flex gap-4 group hover:border-[#1e4a2d]/20 transition-all duration-500"
                    >
                      <div className="w-20 h-20 rounded-2xl bg-[#f8f7f2] overflow-hidden flex-shrink-0 relative">
                        {item.image ? (
                          <img src={Config.getFullImagePath(item.image)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">☕</div>
                        )}
                        <div className="absolute top-1 right-1 bg-[#1e4a2d] text-white text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full">
                          {item.quantity}
                        </div>
                      </div>
                      <div className="flex-1 flex flex-col justify-between py-0.5">
                        <div className="space-y-1">
                          <div className="flex justify-between items-start">
                            <h4 className="font-bold text-[#1e4a2d] text-base leading-tight line-clamp-1">{item.name}</h4>
                            <button onClick={() => removeFromCart(index)} className="text-gray-300 hover:text-red-500 transition-colors p-1"> <Trash2 size={14} /> </button>
                          </div>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            <span className="text-[8px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100/50">{item.size?.name || 'Standard'}</span>
                            {item.temperature && <span className="text-[8px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100/50">{item.temperature}</span>}
                            {item.sugarLevel && <span className="text-[8px] font-black uppercase tracking-widest text-[#1e4a2d] bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100/50">{item.sugarLevel}</span>}
                          </div>
                        </div>
                        <div className="flex justify-between items-end">
                          <p className="font-black text-[#1e4a2d] text-lg font-serif">${item.totalPrice.toFixed(2)}</p>
                          <div className="flex items-center bg-gray-50 rounded-xl px-1.5 py-1 border border-gray-100">
                            <span className="text-[10px] font-black text-[#1e4a2d] px-1 opacity-60">Qty: {item.quantity}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="pt-8 border-t border-gray-100 mt-6 space-y-6">
                <div className="bg-white rounded-[32px] p-6 space-y-4 shadow-[0_-10px_30px_rgba(0,0,0,0.02)]">
                  <div className="flex justify-between items-center text-gray-400 text-sm font-bold uppercase tracking-widest">
                    <span>Order Subtotal</span>
                    <span className="text-[#1e4a2d]">${getTotalPrice().toFixed(2)}</span>
                  </div>
                  <div className="h-px bg-dashed border-t border-dashed border-gray-100"></div>
                  <div className="flex justify-between items-center text-[#1e4a2d]">
                    <span className="text-base font-serif font-black uppercase">Final Total</span>
                    <span className="text-4xl font-serif font-black">${getTotalPrice().toFixed(2)}</span>
                  </div>
                </div>
                <button
                  onClick={submitOrder}
                  className="group relative w-full bg-[#1e4a2d] text-white py-6 rounded-[30px] font-black text-xl shadow-2xl shadow-[#1e4a2d]/30 hover:bg-[#153420] transition-all overflow-hidden flex items-center justify-center gap-3 uppercase tracking-tighter"
                >
                  <div className="absolute inset-0 bg-white/5 translate-x-full group-hover:translate-x-0 transition-transform duration-700 slant-glow"></div>
                  <ShoppingCart size={24} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  <span>Confirm Order</span>
                </button>
              </div>
            )}
          </div>
        </Drawer>

        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Playfair+Display:wght@700;800;900&display=swap');
          
          .font-sans { font-family: 'Outfit', sans-serif; }
          .font-serif { font-family: 'Playfair Display', serif; }

          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          .custom-scrollbar::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e4a2d15; border-radius: 10px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #1e4a2d25; }
          
          .ant-modal-mask { backdrop-filter: blur(12px) !important; background: rgba(30, 74, 45, 0.1) !important; }
          .premium-modal .ant-modal-content { border-radius: 50px; padding: 24px; border: 1px solid rgba(255,255,255,0.8); box-shadow: 0 40px 80px -20px rgba(0,0,0,0.15) !important; }
          
          .ant-drawer-mask { backdrop-filter: blur(8px) !important; background: rgba(30, 74, 45, 0.05) !important; }
          .premium-drawer .ant-drawer-content { border-radius: 60px 0 0 60px; background: #fafaf8 !important; box-shadow: -20px 0 60px rgba(0,0,0,0.05); }
          .premium-drawer .ant-drawer-header { border-bottom: none; padding: 40px 32px 20px; background: transparent; }
          .premium-drawer .ant-drawer-body { padding: 0 32px 40px; }

          .slant-glow { transform: skewX(-20deg) translateX(-100%); }
          .group:hover .slant-glow { transform: skewX(-20deg) translateX(200%); }
        `}</style>
      </div>
    );
    case 'tables': return (
      <div className="min-h-screen bg-[#fafaf8] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]"></div>

        <div className="max-w-5xl w-full relative z-10">
          <header className="text-center mb-16 space-y-6">
            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="inline-block bg-[#1e4a2d] p-6 rounded-[40px] text-white shadow-2xl relative">
              <Coffee size={56} />
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-400 rounded-full border-4 border-[#fafaf8]"></div>
            </motion.div>
            <div className="space-y-2">
              <h1 className="text-5xl font-black text-[#1e4a2d] tracking-tighter uppercase font-serif">{selectedShop?.name}</h1>
              <div className="flex items-center justify-center gap-3">
                <div className="h-px w-12 bg-gray-200"></div>
                <p className="text-amber-600 font-black uppercase tracking-[0.4em] text-[10px]">Select Your Spot</p>
                <div className="h-px w-12 bg-gray-200"></div>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {Array.from({ length: selectedShop?.table_count || 10 }, (_, i) => i + 1).map(num => (
              <motion.button
                key={num}
                whileHover={{ y: -10, shadow: "0 20px 40px rgba(0,0,0,0.1)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setSelectedTable(num); setCurrentView('menu'); }}
                className="aspect-square bg-white rounded-[48px] border border-gray-50 shadow-sm flex flex-col items-center justify-center gap-4 group transition-all duration-500 overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-[#1e4a2d] translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                <div className="relative z-10 flex flex-col items-center gap-2 group-hover:text-white transition-colors duration-500">
                  <span className="text-4xl filter grayscale group-hover:grayscale-0 transition-all">🪑</span>
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-60">Table</span>
                    <span className="text-2xl font-black font-serif">{num}</span>
                  </div>
                </div>
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-500 order-last">
                  <ChevronRight size={20} className="text-white/40" />
                </div>
              </motion.button>
            ))}
          </div>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setCurrentView('shops')}
            className="mt-20 group text-[#1e4a2d] font-black flex items-center gap-4 mx-auto p-4 rounded-3xl hover:bg-white transition-all uppercase tracking-widest text-[10px]"
          >
            <div className="w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center group-hover:bg-[#1e4a2d] group-hover:text-white transition-all">
              <ChevronRight size={16} className="rotate-180" />
            </div>
            Switch Coffee Shop
          </motion.button>
        </div>
      </div>
    );
    case 'seller': return <div className="p-10 font-black text-[#1e4a2d]">Seller logic here (WIP)</div>;
    default: return (
      <div className="min-h-screen bg-[#fafaf8] flex flex-col items-center justify-center p-6 text-center font-sans">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-12 rounded-[60px] shadow-2xl shadow-[#1e4a2d]/5 border border-gray-50 max-w-md w-full relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-[#1e4a2d]"></div>
          <div className="w-24 h-24 bg-[#1e4a2d] rounded-[32px] flex items-center justify-center text-white mx-auto mb-8 shadow-[0_20px_40px_-10px_rgba(30,74,45,0.4)]">
            <Coffee size={48} />
          </div>
          <h1 className="text-3xl font-black text-[#1e4a2d] mb-3 uppercase tracking-tight font-serif">Welcome Guest</h1>
          <p className="text-gray-400 mb-10 font-medium px-6 leading-relaxed">Please select a coffee shop or scan a QR code to explore our premium menu</p>

          {shops.length > 0 ? (
            <div className="grid gap-4 w-full">
              {shops.map(shop => (
                <motion.button
                  key={shop.id}
                  whileHover={{ x: 8, backgroundColor: '#f8f7f2' }}
                  onClick={() => { setSelectedShop(shop); setCurrentView('tables'); }}
                  className="bg-white p-6 rounded-[30px] border border-gray-100 hover:border-[#1e4a2d]/20 font-bold text-[#1e4a2d] transition-all flex items-center justify-between group shadow-sm"
                >
                  <span className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-[#f8f7f2] flex items-center justify-center group-hover:bg-[#1e4a2d] group-hover:text-white transition-all">
                      <Store size={20} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-black uppercase tracking-tight">{shop.name}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{shop.location || 'Cafe & Bakery'}</p>
                    </div>
                  </span>
                  <ChevronRight size={20} className="text-gray-200 group-hover:text-[#1e4a2d] transition-colors" />
                </motion.button>
              ))}
            </div>
          ) : (
            <div className="py-5 px-8 bg-amber-50 rounded-[24px] text-amber-700 text-sm font-bold flex items-center justify-center gap-3 border border-amber-100/50">
              <Zap size={18} className="animate-pulse" />
              Waiting for shop data...
            </div>
          )}
        </motion.div>
      </div>
    );
  }
};

export default CoffeeMenuApp;
