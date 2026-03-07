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
        await fetchProductConfigurations(res.list || []);
      }
    } catch (error) {
      console.error('Error fetching shop products:', error);
    }
  };

  const fetchProductConfigurations = async (products) => {
    if (!products || products.length === 0) return;
    const productIds = products.map(p => p.id);

    try {
      // Use consolidated bulk endpoint instead of looping (fixes 404s and slowness)
      const res = await request(`product/config/bulk`, "post", { product_ids: productIds });
      if (res && res.success) {
        setProductSizes(res.sizes || {});
        setProductAddons(res.addons || {});
      }
    } catch (error) {
      console.error('Error fetching bulk configurations:', error);
    }
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
      onClick={onClick}
      className={cn(
        "flex-shrink-0 cursor-pointer rounded-2xl p-4 transition-all duration-300 min-w-[140px] border",
        isActive
          ? "bg-[#1e4a2d] border-[#1e4a2d] text-white shadow-lg"
          : "bg-white border-gray-100 text-[#1e4a2d] hover:border-[#1e4a2d]/30"
      )}
    >
      <div className="flex flex-col gap-3">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center text-xl",
          isActive ? "bg-white/20" : "bg-[#f8f7f2]"
        )}>
          {getIconForCategory(category.name)}
        </div>
        <div>
          <p className="font-bold text-sm block truncate">{category.name}</p>
          <p className={cn("text-[10px]", isActive ? "text-white/70" : "text-gray-400")}>Available</p>
        </div>
      </div>
    </motion.div>
  );

  const ProductCard = ({ item, onSelect }) => {
    const calculateDiscountedPrice = (price, discount) => {
      const p = parseFloat(price) || 0;
      const d = parseFloat(discount) || 0;
      return p - (p * d / 100);
    };
    const discountedPrice = calculateDiscountedPrice(item.price, item.discount);
    const inStock = (item.qty || item.stock) > 0;

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[32px] p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all group"
      >
        <div className="relative aspect-square rounded-[24px] bg-[#f8f7f2] overflow-hidden mb-4">
          {item.image ? (
            <img
              src={Config.getFullImagePath(item.image)}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              alt={item.name}
              onError={(e) => { e.target.src = 'https://via.placeholder.com/200?text=Coffee'; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl opacity-50">☕</div>
          )}
          {item.discount > 0 && (
            <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
              -{item.discount}%
            </div>
          )}
        </div>
        <div className="space-y-1 px-1">
          <h3 className="font-bold text-[#1e4a2d] truncate">{item.name}</h3>
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              {item.discount > 0 && (
                <span className="text-[10px] text-gray-400 line-through font-bold">
                  ${parseFloat(item.price).toFixed(2)}
                </span>
              )}
              <p className="text-lg font-black text-[#1e4a2d] leading-none">
                ${discountedPrice.toFixed(2)}
              </p>
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => onSelect(item)}
              disabled={!inStock}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                inStock ? "bg-[#1e4a2d] text-white hover:bg-[#153420]" : "bg-gray-200 text-gray-400 cursor-not-allowed"
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

  const showOptionsModal = (item) => {
    setOptionsModalItem(item);
  };

  const handleAddToCart = (item, selectedSize, selectedAddons, selectedTemp, selectedSugar, itemQty) => {
    addToCart(item, selectedSize, selectedAddons, selectedTemp, selectedSugar, itemQty);
    setOptionsModalItem(null);
  };


  switch (currentView) {
    case 'menu': return (
      <div className="min-h-screen bg-[#f8f7f2] flex flex-col md:flex-row">
        <div className="flex-1 flex flex-col max-h-screen overflow-hidden">
          <header className="px-6 py-6 flex items-center justify-between bg-white border-b border-[#1e4a2d]/5">
            <div className="flex items-center gap-3">
              <div className="bg-[#1e4a2d] p-2 rounded-xl text-white"> <Coffee size={24} /> </div>
              <div>
                <h1 className="text-xl font-black text-[#1e4a2d] tracking-tight uppercase leading-none">
                  {selectedShop?.business_name || "Green Grounds"}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-[10px] text-[#1e4a2d] font-bold uppercase tracking-widest opacity-60">
                    {selectedShop?.branch_name || "Main Branch"}
                  </p>
                  <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                  <p className="text-[10px] text-gray-400 font-medium">
                    Table: {selectedTable || "N/A"}
                  </p>
                  {getProfile()?.name && (
                    <>
                      <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                      <p className="text-[10px] text-[#1e4a2d] font-bold">
                        Staff: {getProfile().name}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right mr-2">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                  {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                </p>
                <p className="text-[10px] text-[#1e4a2d] font-black">{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</p>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsCartOpen(true)}
                className="relative bg-[#1e4a2d] p-3 rounded-full text-white shadow-lg shadow-[#1e4a2d]/20"
              >
                <ShoppingCart size={20} />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                    {cart.length}
                  </span>
                )}
              </motion.button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
            <div className="relative mb-8 text-[#1e4a2d]">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search beverages, snacks..."
                className="w-full bg-white border border-gray-100 rounded-[24px] py-4 pl-14 pr-6 focus:outline-none focus:ring-2 focus:ring-[#1e4a2d]/10 transition-all font-medium"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>

            <div className="mb-10">
              <h2 className="text-lg font-black text-[#1e4a2d] mb-4">Categories</h2>
              <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
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

            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
              {menuItems.map(item => (<ProductCard key={item.id} item={item} onSelect={showOptionsModal} />))}
            </div>

            {menuItems.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 opacity-30 text-[#1e4a2d]">
                <ImageIcon size={64} />
                <p className="mt-4 font-bold uppercase tracking-widest text-xs">No items found</p>
              </div>
            )}
          </div>
        </div>

        <Modal
          open={!!optionsModalItem}
          onCancel={() => setOptionsModalItem(null)}
          footer={null}
          closeIcon={<X className="text-[#1e4a2d]" />}
          centered
          width={450}
          maskClosable={true}
          className="premium-modal"
          modalRender={(modal) => modal}
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
          width={window.innerWidth > 768 ? 400 : '100%'}
          className="premium-drawer"
          title={<span className="font-black text-[#1e4a2d] uppercase tracking-tighter">Current Order List</span>}
          closeIcon={<X className="text-[#1e4a2d]" />}
        >
          <div className="flex flex-col h-full bg-[#f8f7f2]">
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pt-2">
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setOrderType('dine_in')}
                  className={cn(
                    "flex-1 py-3 rounded-2xl font-bold text-sm transition-all border",
                    orderType === 'dine_in' ? "bg-[#1e4a2d] border-[#1e4a2d] text-white shadow-lg" : "bg-white border-gray-100 text-[#1e4a2d]"
                  )}
                > Dine In </button>
                <button
                  onClick={() => setOrderType('take_away')}
                  className={cn(
                    "flex-1 py-3 rounded-2xl font-bold text-sm transition-all border",
                    orderType === 'take_away' ? "bg-[#1e4a2d] border-[#1e4a2d] text-white shadow-lg" : "bg-white border-gray-100 text-[#1e4a2d]"
                  )}
                > Take Away </button>
              </div>

              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[50vh] opacity-30 gap-4">
                  <div className="bg-[#1e4a2d] p-6 rounded-full text-white"> <ShoppingCart size={40} /> </div>
                  <p className="font-bold uppercase tracking-widest text-[10px] text-[#1e4a2d]">Your cart is empty</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item, index) => (
                    <div key={index} className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm flex gap-4 group hover:border-[#1e4a2d]/30 transition-all">
                      <div className="w-16 h-16 rounded-2xl bg-[#f8f7f2] overflow-hidden flex-shrink-0">
                        {item.image ? (<img src={Config.getFullImagePath(item.image)} className="w-full h-full object-cover" />) : <div className="w-full h-full flex items-center justify-center text-xl">☕</div>}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-[#1e4a2d] text-sm">{item.name}</h4>
                          <button onClick={() => removeFromCart(index)} className="text-red-400 opacity-0 group-hover:opacity-100 transition-all"> <X size={14} /> </button>
                        </div>
                        <p className="text-[9px] text-gray-400 font-medium">{item.size?.name}, {item.temperature}, {item.sugarLevel}</p>
                        <div className="flex justify-between items-center mt-1">
                          <p className="font-black text-[#1e4a2d] text-sm">${item.totalPrice.toFixed(2)}</p>
                          <span className="text-[10px] font-black text-[#1e4a2d] bg-[#f8f7f2] px-2 py-0.5 rounded-lg border border-gray-50">x{item.quantity}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="pt-6 border-t mt-4 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-400 text-sm font-bold"> <span>Subtotal</span> <span>${getTotalPrice().toFixed(2)}</span> </div>
                  <div className="flex justify-between text-[#1e4a2d] text-2xl font-black"> <span>Total</span> <span>${getTotalPrice().toFixed(2)}</span> </div>
                </div>
                <button
                  onClick={submitOrder}
                  className="w-full bg-[#1e4a2d] text-white py-5 rounded-3xl font-black text-lg shadow-lg shadow-[#1e4a2d]/20 hover:bg-[#153420] transition-colors uppercase tracking-tight"
                > Place Order Now </button>
              </div>
            )}
          </div>
        </Drawer>

        <style>{`
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          .custom-scrollbar::-webkit-scrollbar { width: 6px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e4a2d20; border-radius: 10px; }
          
          /* Premium Modal & Mask */
          .ant-modal-mask {
            backdrop-filter: blur(4px) !important;
            background: rgba(0, 0, 0, 0.45) !important;
            transition: none !important;
          }
          .premium-modal .ant-modal-content { 
            border-radius: 40px; 
            padding: 24px; 
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            border: 1px solid rgba(255,255,255,0.2);
          }
          
          /* Premium Drawer & Blur */
          .ant-drawer-mask {
            backdrop-filter: blur(8px) !important;
          }
          .premium-drawer .ant-drawer-content { 
            border-radius: 40px 0 0 40px; 
            background: #f8f7f2 !important;
          }
          .premium-drawer .ant-drawer-header { border-bottom: none; padding: 32px 24px 16px; background: transparent; }
        `}</style>
      </div>
    );
    case 'tables': return (
      <div className="min-h-screen bg-[#f8f7f2] flex flex-col items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]">
        <div className="max-w-4xl w-full">
          <header className="text-center mb-12">
            <div className="inline-block bg-[#1e4a2d] p-5 rounded-[32px] text-white shadow-xl mb-6"> <Coffee size={48} /> </div>
            <h1 className="text-4xl font-black text-[#1e4a2d] tracking-tighter uppercase mb-2">{selectedShop?.name}</h1>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Select your table to start ordering</p>
          </header>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
            {Array.from({ length: selectedShop?.table_count || 10 }, (_, i) => i + 1).map(num => (
              <motion.button
                key={num}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setSelectedTable(num); setCurrentView('menu'); }}
                className="aspect-square bg-white rounded-[24px] border border-gray-100 shadow-sm flex flex-col items-center justify-center gap-2 hover:border-[#1e4a2d] hover:shadow-lg transition-all"
              >
                <span className="text-2xl">🪑</span>
                <span className="font-black text-[#1e4a2d]">T-{num}</span>
              </motion.button>
            ))}
          </div>
          <button onClick={() => setCurrentView('shops')} className="mt-12 text-[#1e4a2d] font-bold flex items-center gap-2 mx-auto hover:opacity-70 transition-opacity">
            <ChevronRight size={20} className="rotate-180" /> Change Shop
          </button>
        </div>
      </div>
    );
    case 'seller': return <div className="p-10 font-black text-[#1e4a2d]">Seller logic here (WIP)</div>;
    default: return (
      <div className="min-h-screen bg-[#f8f7f2] flex flex-col items-center justify-center p-6 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-12 rounded-[48px] shadow-2xl shadow-[#1e4a2d]/10 border border-gray-100 max-w-md w-full">
          <div className="w-24 h-24 bg-[#1e4a2d] rounded-[32px] flex items-center justify-center text-white mx-auto mb-8 shadow-xl"> <Coffee size={48} /> </div>
          <h1 className="text-3xl font-black text-[#1e4a2d] mb-2 uppercase tracking-tight">Welcome Guest</h1>
          <p className="text-gray-400 mb-8 font-medium">Please select a shop or scan a QR code to explore our menu</p>
          {shops.length > 0 ? (
            <div className="grid gap-3 w-full">
              {shops.map(shop => (
                <motion.button key={shop.id} whileHover={{ x: 5 }} onClick={() => { setSelectedShop(shop); setCurrentView('tables'); }} className="bg-[#f8f7f2] p-5 rounded-[24px] border border-transparent hover:border-[#1e4a2d]/20 font-bold text-[#1e4a2d] transition-all flex items-center justify-between">
                  <span className="flex items-center gap-3"> <Store size={20} className="opacity-50" /> {shop.name} </span>
                  <ChevronRight size={20} className="opacity-30" />
                </motion.button>
              ))}
            </div>
          ) : (<div className="py-4 px-6 bg-amber-50 rounded-2xl text-amber-700 text-sm font-bold flex items-center gap-2"> <Zap size={16} /> Waiting for shop data... </div>)}
        </motion.div>
      </div>
    );
  }
};

export default CoffeeMenuApp;