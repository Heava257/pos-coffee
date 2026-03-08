import React, { useState, useEffect, useMemo } from 'react';
import {
  Bell, Menu, Search, ShoppingCart, Plus, Minus, X,
  Home, FileText, Star, User, ChevronLeft
} from 'lucide-react';
import { request } from '../../util/helper';
import { Config } from '../../util/config';
import { getProfile } from '../../store/profile.store';
import { message, Modal, Badge } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// --- SHARED COMPONENTS ---

const MainWrapper = ({ children, bgClass = "bg-[#F8F9FA]" }) => (
  <div className={cn("min-h-screen font-sans antialiased text-[#2D3436]", bgClass)}>
    <div className="max-w-[1280px] mx-auto min-h-screen relative flex flex-col bg-white shadow-sm overflow-hidden md:rounded-3xl md:my-6 md:min-h-[calc(100vh-48px)]">
      <div className="w-full h-full relative flex flex-col overflow-y-auto no-scrollbar">
        {children}
      </div>
    </div>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
      .font-sans { font-family: 'Plus Jakarta Sans', sans-serif; }
      .no-scrollbar::-webkit-scrollbar { display: none; }
      .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      .premium-modal .ant-modal-content { border-radius: 24px !important; padding: 0 !important; overflow: hidden; }
      .premium-modal .ant-modal-header { padding: 20px 24px; border-bottom: 1px solid #F1F2F6; margin: 0; }
      .premium-modal .ant-modal-body { padding: 24px; }
    `}</style>
  </div>
);

const SplashView = ({ businessName }) => (
  <div className="min-h-screen bg-white flex flex-col items-center justify-center">
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center"
    >
      <div className="w-20 h-20 bg-[#1A3C28] rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-[#1A3C28]/20">
        <ShoppingCart size={36} color="white" />
      </div>
      <h1 className="text-2xl font-extrabold tracking-tight text-[#1A3C28]">
        {businessName || "MINGLY COFFEE"}
      </h1>
      <div className="mt-4 flex gap-1">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
            className="w-1.5 h-1.5 bg-[#1A3C28]/20 rounded-full"
          />
        ))}
      </div>
    </motion.div>
  </div>
);

// --- VIEW COMPONENTS ---

const HomeView = ({
  selectedShop, categories, currentCategory, setCurrentCategory,
  menuItems, cart, setIsCartOpen, searchText, setSearchText,
  getTotalPrice, setOptionsModalItem
}) => (
  <motion.div
    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
    className="flex-1 flex flex-col px-6 pb-24 pt-8"
  >
    {/* Header */}
    <div className="flex justify-between items-center mb-8">
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Welcome to</p>
        <h1 className="text-2xl font-extrabold text-[#1A3C28]">
          {selectedShop?.business_name || "Mingly Coffee"}
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <button className="relative w-10 h-10 flex items-center justify-center bg-gray-50 rounded-full hover:bg-gray-100 transition-colors">
          <Bell size={20} className="text-gray-600" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        <button className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-full hover:bg-gray-100 transition-colors">
          <Menu size={20} className="text-gray-600" />
        </button>
      </div>
    </div>

    {/* Search */}
    <div className="relative mb-8">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
      <input
        type="text"
        placeholder="Search for coffee, snacks..."
        className="w-full h-14 bg-gray-50 border-none rounded-2xl pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-[#1A3C28]/10 transition-all"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
      />
    </div>

    {/* Banner */}
    <div className="relative bg-[#1A3C28] rounded-3xl p-8 text-white overflow-hidden mb-10 shadow-lg shadow-[#1A3C28]/10">
      <div className="relative z-10 max-w-[60%]">
        <h2 className="text-xl font-bold mb-2">Get 20% discount on your first order!</h2>
        <p className="text-sm text-white/70 mb-6">Enjoy our premium coffee brewed from the finest beans.</p>
        <button className="bg-white text-[#1A3C28] px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors">
          Order Now
        </button>
      </div>
      <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 pointer-events-none">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <circle cx="150" cy="50" r="100" fill="white" />
        </svg>
      </div>
      <img
        src="https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=300&auto=format&fit=crop"
        className="absolute -right-8 -bottom-8 w-48 h-48 object-cover rounded-full border-8 border-white/10 shadow-2xl rotate-12"
        alt="Coffee"
      />
    </div>

    {/* Categories */}
    <div className="mb-10">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-800">Categories</h3>
        <button onClick={() => setCurrentCategory(null)} className="text-sm font-bold text-[#1A3C28] hover:opacity-70">View all</button>
      </div>
      <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-6 px-6">
        <button
          onClick={() => setCurrentCategory(null)}
          className={cn(
            "px-6 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap",
            currentCategory === null ? "bg-[#1A3C28] text-white shadow-md shadow-[#1A3C28]/20" : "bg-gray-50 text-gray-500 hover:bg-gray-100"
          )}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCurrentCategory(cat)}
            className={cn(
              "px-6 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap",
              currentCategory?.id === cat.id ? "bg-[#1A3C28] text-white shadow-md shadow-[#1A3C28]/20" : "bg-gray-50 text-gray-500 hover:bg-gray-100"
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>

    {/* Products list */}
    <div>
      <h3 className="text-lg font-bold text-gray-800 mb-6 font-sans">
        {searchText ? "Search Results" : "Most Popular"}
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {menuItems
          .filter(i => !searchText || i.name.toLowerCase().includes(searchText.toLowerCase()))
          .map((item) => (
            <div
              key={item.id}
              className="group bg-white rounded-2xl border border-transparent hover:border-gray-100 hover:shadow-xl hover:shadow-gray-100/50 transition-all p-3 cursor-pointer"
              onClick={() => setOptionsModalItem(item)}
            >
              <div className="relative aspect-square rounded-xl bg-gray-50 overflow-hidden mb-4 shadow-sm">
                {item.image ? (
                  <img src={Config.getFullImagePath(item.image)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl">☕</div>
                )}
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm border border-gray-100">
                  <Star size={12} className="fill-amber-500 text-amber-500" />
                  <span className="text-[10px] font-bold">4.9</span>
                </div>
              </div>
              <h4 className="font-bold text-gray-800 text-sm mb-1 line-clamp-1">{item.name}</h4>
              <p className="text-[10px] text-gray-400 mb-3 line-clamp-1">Rich brewed coffee...</p>
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-[#1A3C28]">${parseFloat(item.price).toFixed(2)}</span>
                <button className="w-8 h-8 flex items-center justify-center bg-[#1A3C28] text-white rounded-lg shadow-lg shadow-[#1A3C28]/20 hover:scale-110 active:scale-95 transition-all">
                  <Plus size={16} strokeWidth={3} />
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  </motion.div>
);

const CategoryView = ({
  currentCategory, setCurrentCategory, menuItems, cart, setIsCartOpen,
  searchText, setSearchText, setOptionsModalItem
}) => {
  const filtered = menuItems.filter(i => {
    const matchCat = currentCategory.name === 'All' || i.category_name === currentCategory.name;
    const matchSearch = !searchText || i.name.toLowerCase().includes(searchText.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
      className="flex-1 flex flex-col px-6 pb-24 pt-8"
    >
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => setCurrentCategory(null)}
          className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-xl font-extrabold text-[#1A3C28]">{currentCategory.name}</h1>
      </div>

      <div className="relative mb-10">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder={`Search for ${currentCategory.name.toLowerCase()}...`}
          className="w-full h-14 bg-gray-50 border-none rounded-2xl pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-[#1A3C28]/10 transition-all font-sans"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="group bg-white rounded-2xl border border-transparent hover:border-gray-50 hover:shadow-xl transition-all p-3 cursor-pointer"
            onClick={() => setOptionsModalItem(item)}
          >
            <div className="relative aspect-square rounded-xl bg-gray-50 overflow-hidden mb-4 shadow-sm border border-gray-50">
              {item.image ? (
                <img src={Config.getFullImagePath(item.image)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl">☕</div>
              )}
            </div>
            <h4 className="font-bold text-gray-800 text-sm mb-1">{item.name}</h4>
            <p className="text-[10px] text-gray-400 mb-3 block h-4 overflow-hidden">Freshly prepared...</p>
            <div className="flex justify-between items-center">
              <span className="font-extrabold text-[#1A3C28] text-lg">${parseFloat(item.price).toFixed(2)}</span>
              <button className="w-9 h-9 flex items-center justify-center bg-[#1A3C28] text-white rounded-xl shadow-md hover:scale-110 active:scale-95 transition-all">
                <Plus size={18} strokeWidth={3} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// --- MAIN APPLICATION ---

const CoffeeMenuApp = () => {
  const [selectedShop, setSelectedShop] = useState(() => {
    const saved = localStorage.getItem('coffee_pos_shop');
    return saved ? JSON.parse(saved) : null;
  });
  const [selectedTable, setSelectedTable] = useState(() => localStorage.getItem('coffee_pos_table') || null);
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('coffee_pos_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [productSizes, setProductSizes] = useState({});
  const [splash, setSplash] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [currentCategory, setCurrentCategory] = useState(null);
  const [optionsModalItem, setOptionsModalItem] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem('coffee_pos_table', selectedTable);
    localStorage.setItem('coffee_pos_shop', JSON.stringify(selectedShop));
    localStorage.setItem('coffee_pos_cart', JSON.stringify(cart));
  }, [selectedTable, selectedShop, cart]);

  useEffect(() => {
    const profile = getProfile();
    const isGuest = localStorage.getItem("is_guest") === "true";
    if (isGuest && profile?.branch_id) {
      setSelectedShop({
        id: profile.branch_id,
        business_id: profile.business_id,
        name: profile.branch_name,
        business_name: profile.business_name,
      });
      setSelectedTable(profile.table_no);
      localStorage.removeItem("is_guest");
    }
    const timeout = setTimeout(() => setSplash(false), 2000);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (selectedShop?.id || categories.length === 0) fetchShopProducts();
  }, [selectedShop, currentCategory?.id]);

  const fetchShopProducts = async () => {
    try {
      setLoading(true);
      if (categories.length === 0) {
        const catRes = await request("category", "get");
        if (catRes?.list) setCategories(catRes.list);
      }
      const productRes = await request("product", "get", {
        branch_id: selectedShop?.id,
        category_id: currentCategory?.id
      });
      if (productRes?.list) {
        setMenuItems(productRes.list);
        let sizesMap = {};
        productRes.list.forEach(p => {
          if (p.sizes) {
            try {
              const parsed = typeof p.sizes === 'string' ? JSON.parse(p.sizes) : p.sizes;
              sizesMap[p.id] = parsed;
            } catch (e) { }
          }
        });
        setProductSizes(sizesMap);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const calculateItemPrice = (item, size) => {
    if (size) return parseFloat(size.price || 0);
    return parseFloat(item.price || 0);
  };

  const addToCart = (item, size, qty) => {
    const price = calculateItemPrice(item, size);
    const cartItem = {
      ...item,
      size,
      quantity: qty,
      totalPrice: price * qty
    };
    setCart([...cart, cartItem]);
    message.success("Added to cart!");
    setIsCartOpen(true);
  };

  const getTotalPrice = () => cart.reduce((sum, item) => sum + item.totalPrice, 0);

  if (splash) return <SplashView businessName={selectedShop?.business_name} />;

  return (
    <MainWrapper>
      <div className="flex-1 flex flex-col relative min-h-screen">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex items-center justify-center">
              <div className="w-8 h-8 border-3 border-gray-100 border-t-[#1A3C28] rounded-full animate-spin"></div>
            </motion.div>
          ) : currentCategory ? (
            <CategoryView
              key="category"
              currentCategory={currentCategory} setCurrentCategory={setCurrentCategory}
              menuItems={menuItems} cart={cart} setIsCartOpen={setIsCartOpen}
              searchText={searchText} setSearchText={setSearchText} setOptionsModalItem={setOptionsModalItem}
            />
          ) : (
            <HomeView
              key="home"
              selectedShop={selectedShop} categories={categories}
              currentCategory={currentCategory} setCurrentCategory={setCurrentCategory}
              menuItems={menuItems} cart={cart} setIsCartOpen={setIsCartOpen}
              searchText={searchText} setSearchText={setSearchText}
              getTotalPrice={getTotalPrice} setOptionsModalItem={setOptionsModalItem}
            />
          )}
        </AnimatePresence>

        {/* Navigation Bar */}
        <div className="fixed bottom-0 md:bottom-8 left-0 md:left-1/2 md:-translate-x-1/2 w-full md:w-[480px] bg-white/80 backdrop-blur-xl border-t md:border border-gray-100 md:rounded-[32px] px-8 py-4 flex justify-between items-center z-50 md:shadow-2xl shadow-gray-200/50">
          <button
            onClick={() => { setActiveTab('home'); setCurrentCategory(null); }}
            className={cn("flex flex-col items-center gap-1.5 transition-all", activeTab === 'home' ? "text-[#1A3C28]" : "text-gray-300 hover:text-gray-400")}
          >
            <Home size={22} strokeWidth={activeTab === 'home' ? 3 : 2} />
            <span className="text-[10px] font-bold uppercase tracking-tight">Home</span>
          </button>

          <button
            onClick={() => { setActiveTab('order'); setIsCartOpen(true); }}
            className={cn("flex flex-col items-center gap-1.5 relative transition-all", activeTab === 'order' ? "text-[#1A3C28]" : "text-gray-300 hover:text-gray-400")}
          >
            <div className="relative">
              <FileText size={22} strokeWidth={activeTab === 'order' ? 3 : 2} />
              {cart.length > 0 && <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full border-2 border-white text-[8px] flex items-center justify-center text-white font-black">{cart.length}</span>}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-tight">My Order</span>
          </button>

          <button
            className={cn("flex flex-col items-center gap-1.5 transition-all text-gray-300 hover:text-gray-400")}
          >
            <Star size={22} />
            <span className="text-[10px] font-bold uppercase tracking-tight">Starred</span>
          </button>

          <button
            className={cn("flex flex-col items-center gap-1.5 transition-all text-gray-300 hover:text-gray-400")}
          >
            <User size={22} />
            <span className="text-[10px] font-bold uppercase tracking-tight">Profile</span>
          </button>
        </div>
      </div>

      {/* Product Options Modal */}
      <Modal
        open={!!optionsModalItem}
        onCancel={() => setOptionsModalItem(null)}
        footer={null}
        centered
        width={450}
        className="premium-modal font-sans"
        destroyOnClose
        closeIcon={<div className="bg-gray-50 p-2 rounded-full hover:bg-gray-100 transition-all"><X size={16} /></div>}
      >
        <ProductOptionsModal
          item={optionsModalItem}
          productSizes={productSizes}
          calculateItemPrice={calculateItemPrice}
          onAdd={(item, size, qty) => {
            addToCart(item, size, qty);
            setOptionsModalItem(null);
          }}
        />
      </Modal>

      {/* Cart Modal */}
      <Modal
        open={isCartOpen}
        onCancel={() => { setIsCartOpen(false); setActiveTab('home'); }}
        footer={null}
        centered
        width={500}
        className="premium-modal"
        title={<span className="text-lg font-extrabold text-gray-800 uppercase tracking-tight">Order Details</span>}
      >
        <div className="p-6 font-sans">
          {cart.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <ShoppingCart size={32} className="text-gray-200" />
              </div>
              <p className="text-gray-400 font-bold">Your basket is currently empty.</p>
              <button
                onClick={() => setIsCartOpen(false)}
                className="mt-6 px-10 py-3 bg-[#1A3C28] text-white rounded-xl text-xs font-black shadow-lg shadow-[#1A3C28]/20 transition-all active:scale-95"
              >
                Let's add some coffee
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="max-h-[50vh] overflow-y-auto no-scrollbar pr-1">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl mb-3 border border-gray-100 group">
                    <div className="flex gap-4 items-center">
                      <div className="w-12 h-12 rounded-xl bg-white overflow-hidden shadow-sm flex-shrink-0">
                        {item.image ? <img src={Config.getFullImagePath(item.image)} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-gray-50">☕</div>}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800 text-sm mb-0.5">{item.name}</h4>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">x{item.quantity} {item.size?.name ? `| ${item.size.name}` : ''}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-extrabold text-[#1A3C28] text-base">${item.totalPrice.toFixed(2)}</span>
                      <button
                        onClick={() => setCart(cart.filter((_, i) => i !== idx))}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:bg-white transition-all shadow-sm opacity-0 group-hover:opacity-100"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-dashed border-gray-200 mt-4 px-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Total Amount</span>
                  <span className="text-3xl font-extrabold text-[#1A3C28] tracking-tight">${getTotalPrice().toFixed(2)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-8">
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-6 py-4 rounded-2xl font-bold text-sm bg-gray-50 text-gray-500 hover:bg-gray-100 transition-all active:scale-95"
                >
                  Add More
                </button>
                <button
                  onClick={() => { message.success("Order Placed Successfully!"); setCart([]); setIsCartOpen(false); setActiveTab('home'); }}
                  className="px-6 py-4 rounded-2xl font-bold text-sm bg-[#1A3C28] text-white shadow-xl shadow-[#1A3C28]/20 transition-all active:scale-95"
                >
                  Place Order
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </MainWrapper>
  );
};

const ProductOptionsModal = ({ item, productSizes, calculateItemPrice, onAdd }) => {
  const [selectedSize, setSelSize] = useState(null);
  const [itemQty, setItemQty] = useState(1);

  useEffect(() => {
    if (item) {
      setSelSize(productSizes[item.id]?.[0] || null);
      setItemQty(1);
    }
  }, [item, productSizes]);

  if (!item) return null;

  return (
    <div className="font-sans">
      <div className="relative h-48 bg-gray-50 overflow-hidden">
        {item.image ? (
          <img src={Config.getFullImagePath(item.image)} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">☕</div>
        )}
      </div>
      <div className="p-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-extrabold text-[#1A3C28] mb-1">{item.name}</h2>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{item.category_name || 'Signature Item'}</p>
          </div>
          <p className="text-2xl font-extrabold text-[#1A3C28]">
            ${calculateItemPrice(item, selectedSize).toFixed(2)}
          </p>
        </div>

        <div className="space-y-6">
          {productSizes[item.id]?.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Select Size</p>
              <div className="flex gap-2">
                {productSizes[item.id].map(size => (
                  <button
                    key={size.id}
                    onClick={() => setSelSize(size)}
                    className={cn(
                      "px-5 py-2.5 rounded-xl border-2 font-bold text-xs transition-all",
                      selectedSize?.id === size.id ? "bg-[#1A3C28] border-[#1A3C28] text-white" : "bg-white border-gray-50 text-gray-400 hover:border-gray-100"
                    )}
                  >
                    {size.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 flex items-center gap-4">
            <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-100">
              <button
                onClick={() => setItemQty(q => Math.max(1, q - 1))}
                className="w-10 h-10 flex items-center justify-center text-[#1A3C28] hover:bg-white rounded-lg transition-colors"
              >
                <Minus size={18} strokeWidth={3} />
              </button>
              <span className="w-10 text-center font-bold text-[#1A3C28]">{itemQty}</span>
              <button
                onClick={() => setItemQty(q => q + 1)}
                className="w-10 h-10 flex items-center justify-center text-[#1A3C28] hover:bg-white rounded-lg transition-colors"
              >
                <Plus size={18} strokeWidth={3} />
              </button>
            </div>
            <button
              onClick={() => onAdd(item, selectedSize, itemQty)}
              className="flex-1 h-12 bg-[#1A3C28] text-white rounded-xl font-bold text-sm shadow-lg shadow-[#1A3C28]/20 active:scale-95 transition-all"
            >
              Add to Basket
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoffeeMenuApp;
