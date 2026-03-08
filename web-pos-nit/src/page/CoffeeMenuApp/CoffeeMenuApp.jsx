import React, { useState, useEffect, useMemo } from 'react';
import {
  Bell, Menu, Search, ShoppingCart, Plus, Minus, X,
  Home, FileText, Star, User, ChevronLeft, LogOut, Settings, History, Globe
} from 'lucide-react';
import { request } from '../../util/helper';
import { Config } from '../../util/config';
import { getProfile, setLogout } from '../../store/profile.store';
import { message, Modal, Badge, Empty, Button } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';

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

// --- VIEW COMPONENTS ---

const ProductCard = ({ item, isStarred, onToggleStar, onClick }) => (
  <div
    className="group bg-white rounded-2xl border border-transparent hover:border-gray-100 hover:shadow-xl hover:shadow-gray-100/50 transition-all p-3 cursor-pointer relative"
    onClick={onClick}
  >
    <div className="relative aspect-square rounded-xl bg-gray-50 overflow-hidden mb-4 shadow-sm">
      {item.image ? (
        <img src={Config.getFullImagePath(item.image)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-3xl">☕</div>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); onToggleStar(item); }}
        className={cn(
          "absolute top-2 left-2 w-8 h-8 rounded-lg flex items-center justify-center backdrop-blur-md transition-all",
          isStarred ? "bg-amber-400 text-white" : "bg-white/80 text-gray-400 hover:bg-white hover:text-amber-400"
        )}
      >
        <Star size={16} fill={isStarred ? "currentColor" : "none"} strokeWidth={2.5} />
      </button>
      <div className="absolute top-2 right-2 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm border border-gray-100">
        <Star size={12} className="fill-amber-500 text-amber-500" />
        <span className="text-[10px] font-bold">4.9</span>
      </div>
    </div>
    <h4 className="font-bold text-gray-800 text-sm mb-1 line-clamp-1">{item.name}</h4>
    <p className="text-[10px] text-gray-400 mb-3 line-clamp-1">Freshly brewed coffee...</p>
    <div className="flex justify-between items-center">
      <span className="font-extrabold text-[#1A3C28]">${parseFloat(item.price).toFixed(2)}</span>
      <button className="w-8 h-8 flex items-center justify-center bg-[#1A3C28] text-white rounded-lg shadow-lg shadow-[#1A3C28]/20 hover:scale-110 active:scale-95 transition-all">
        <Plus size={16} strokeWidth={3} />
      </button>
    </div>
  </div>
);

const HomeView = ({
  selectedShop, categories, currentCategory, setCurrentCategory,
  menuItems, cart, setIsCartOpen, searchText, setSearchText,
  setOptionsModalItem, starredItems, onToggleStar
}) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col px-6 pb-24 pt-8">
    <div className="flex justify-between items-center mb-8">
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Welcome to</p>
        <h1 className="text-2xl font-extrabold text-[#1A3C28]">{selectedShop?.business_name || "Mingly Coffee"}</h1>
      </div>
      <div className="flex items-center gap-3">
        <button className="relative w-10 h-10 flex items-center justify-center bg-gray-50 rounded-full hover:bg-gray-100 transition-colors">
          <Bell size={20} className="text-gray-600" />
        </button>
      </div>
    </div>

    <div className="relative mb-8">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
      <input
        type="text" placeholder="Search for coffee, snacks..."
        className="w-full h-14 bg-gray-50 border-none rounded-2xl pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-[#1A3C28]/10 transition-all"
        value={searchText} onChange={(e) => setSearchText(e.target.value)}
      />
    </div>

    <div className="relative bg-[#1A3C28] rounded-3xl p-8 text-white overflow-hidden mb-10 shadow-lg shadow-[#1A3C28]/10">
      <div className="relative z-10 max-w-[65%]">
        <h2 className="text-xl font-bold mb-2 leading-tight">Get 20% discount on your first order!</h2>
        <p className="text-xs text-white/60 mb-6">Enjoy premium coffee brewed from the finest beans.</p>
        <button className="bg-white text-[#1A3C28] px-6 py-2.5 rounded-xl text-sm font-bold shadow-xl shadow-black/10">Order Now</button>
      </div>
      <img src="https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=300&auto=format&fit=crop"
        className="absolute -right-8 -bottom-8 w-44 h-44 object-cover rounded-full border-8 border-white/10 rotate-12" alt="Coffee" />
    </div>

    <div className="mb-10">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-800">Categories</h3>
        <button onClick={() => setCurrentCategory(null)} className="text-sm font-bold text-[#1A3C28]">View all</button>
      </div>
      <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-6 px-6">
        {[{ id: null, name: 'All' }, ...categories].map((cat) => (
          <button
            key={cat.id} onClick={() => setCurrentCategory(cat)}
            className={cn("px-6 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap",
              currentCategory?.id === cat.id ? "bg-[#1A3C28] text-white shadow-md shadow-[#1A3C28]/20" : "bg-gray-50 text-gray-500")}
          >{cat.name}</button>
        ))}
      </div>
    </div>

    <h3 className="text-lg font-bold text-gray-800 mb-6 font-sans">{searchText ? "Search Results" : "Most Popular"}</h3>
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {menuItems
        .filter(i => !searchText || i.name.toLowerCase().includes(searchText.toLowerCase()))
        .map((item) => (
          <ProductCard
            key={item.id} item={item}
            isStarred={starredItems.some(s => s.id === item.id)}
            onToggleStar={onToggleStar}
            onClick={() => setOptionsModalItem(item)}
          />
        ))}
    </div>
  </motion.div>
);

const StarredView = ({ starredItems, onToggleStar, setOptionsModalItem }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col px-6 pb-24 pt-8">
    <h1 className="text-2xl font-extrabold text-[#1A3C28] mb-2">My Starred</h1>
    <p className="text-xs text-gray-400 font-bold mb-8 uppercase tracking-widest">Your favorite collections ({starredItems.length})</p>

    {starredItems.length === 0 ? (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-10">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
          <Star size={32} className="text-gray-200" />
        </div>
        <h3 className="text-lg font-bold text-gray-700 mb-2">No Starred Items Yet</h3>
        <p className="text-sm text-gray-400">Items you mark as favorite will appear here for quick access next time!</p>
      </div>
    ) : (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {starredItems.map((item) => (
          <ProductCard
            key={item.id} item={item} isStarred={true}
            onToggleStar={onToggleStar} onClick={() => setOptionsModalItem(item)}
          />
        ))}
      </div>
    )}
  </motion.div>
);

const ProfileView = ({ selectedShop, selectedTable }) => {
  const profile = getProfile();
  const navigate = useNavigate();

  const handleLogout = () => {
    Modal.confirm({
      title: 'Sign Out',
      content: 'Are you sure you want to sign out?',
      okText: 'Sign Out',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => {
        setLogout();
        navigate("/login");
      }
    });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col px-6 pb-24 pt-8">
      <h1 className="text-2xl font-extrabold text-[#1A3C28] mb-8">My Profile</h1>

      <div className="bg-gray-50 rounded-3xl p-6 flex flex-col items-center mb-8 border border-gray-100">
        <div className="w-20 h-20 bg-[#1A3C28] rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4 shadow-xl shadow-[#1A3C28]/20 uppercase">
          {profile?.firstname?.charAt(0) || "C"}
        </div>
        <h3 className="text-lg font-bold text-gray-800">{profile?.firstname || "Guest"} {profile?.lastname || ""}</h3>
        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Customer @ {selectedShop?.business_name}</p>
        <div className="mt-4 px-4 py-1.5 bg-white rounded-full text-[10px] font-black border border-gray-100 shadow-sm text-[#1A3C28]">TABLE NUMBER: {selectedTable || 'N/A'}</div>
      </div>

      <div className="space-y-3">
        {[
          { icon: History, label: 'Order History', color: 'text-blue-500' },
          { icon: Globe, label: 'Language', color: 'text-purple-500', detail: 'English' },
          { icon: Settings, label: 'Settings', color: 'text-gray-500' },
          { icon: LogOut, label: 'Sign Out', color: 'text-red-500', action: handleLogout },
        ].map((item, i) => (
          <button
            key={i} onClick={item.action}
            className="w-full flex justify-between items-center p-5 bg-white border border-gray-50 rounded-2xl hover:bg-gray-50 transition-all active:scale-[0.99]"
          >
            <div className="flex items-center gap-4">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-gray-50", item.color.replace('text', 'bg').replace('500', '50'))}>
                <item.icon size={20} className={item.color} />
              </div>
              <span className="text-sm font-bold text-gray-700">{item.label}</span>
            </div>
            {item.detail && <span className="text-xs font-bold text-gray-400">{item.detail}</span>}
          </button>
        ))}
      </div>

      <div className="mt-auto py-10 text-center">
        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.3em]">Mingly Coffee App v1.2.0</p>
      </div>
    </motion.div>
  );
};

const CategoryView = ({ currentCategory, setCurrentCategory, menuItems, searchText, setSearchText, setOptionsModalItem, starredItems, onToggleStar }) => {
  const filtered = menuItems.filter(i => (currentCategory.id === null || i.category_id === currentCategory.id) && (!searchText || i.name.toLowerCase().includes(searchText.toLowerCase())));
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 flex flex-col px-6 pb-24 pt-8">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => setCurrentCategory(null)} className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-full hover:bg-gray-100 transition-colors">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-xl font-extrabold text-[#1A3C28]">{currentCategory.name}</h1>
      </div>
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input type="text" placeholder={`Search in ${currentCategory.name}...`} className="w-full h-14 bg-gray-50 border-none rounded-2xl pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-[#1A3C28]/10 transition-all font-sans" value={searchText} onChange={(e) => setSearchText(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {filtered.map((item) => (
          <ProductCard
            key={item.id} item={item} onToggleStar={onToggleStar}
            isStarred={starredItems.some(s => s.id === item.id)}
            onClick={() => setOptionsModalItem(item)}
          />
        ))}
      </div>
    </motion.div>
  );
};

// --- MAIN APPLICATION ---

const CoffeeMenuApp = () => {
  const [selectedShop, setSelectedShop] = useState(() => JSON.parse(localStorage.getItem('coffee_pos_shop')));
  const [selectedTable, setSelectedTable] = useState(() => localStorage.getItem('coffee_pos_table'));
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('coffee_pos_cart')) || []);
  const [starredItems, setStarredItems] = useState(() => JSON.parse(localStorage.getItem('coffee_pos_starred')) || []);

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
    localStorage.setItem('coffee_pos_starred', JSON.stringify(starredItems));
  }, [selectedTable, selectedShop, cart, starredItems]);

  useEffect(() => {
    const profile = getProfile();
    const isGuest = localStorage.getItem("is_guest") === "true";
    if (isGuest && profile?.branch_id) {
      setSelectedShop({ id: profile.branch_id, business_id: profile.business_id, name: profile.branch_name, business_name: profile.business_name });
      setSelectedTable(profile.table_no);
      localStorage.removeItem("is_guest");
    }
    setTimeout(() => setSplash(false), 1500);
  }, []);

  useEffect(() => { fetchShopProducts(); }, [selectedShop, currentCategory?.id]);

  const fetchShopProducts = async () => {
    try {
      setLoading(true);
      if (categories.length === 0) {
        const catRes = await request("category", "get");
        if (catRes?.list) setCategories(catRes.list);
      }
      const productRes = await request("product", "get", { branch_id: selectedShop?.id, category_id: currentCategory?.id });
      if (productRes?.list) {
        setMenuItems(productRes.list);
        let sizesMap = {};
        productRes.list.forEach(p => { if (p.sizes) { try { sizesMap[p.id] = typeof p.sizes === 'string' ? JSON.parse(p.sizes) : p.sizes; } catch (e) { } } });
        setProductSizes(sizesMap);
      }
    } catch { } finally { setLoading(false); }
  };

  const onToggleStar = (item) => {
    if (starredItems.some(s => s.id === item.id)) {
      setStarredItems(starredItems.filter(s => s.id !== item.id));
      message.info("Removed from Starred");
    } else {
      setStarredItems([...starredItems, item]);
      message.success("Added to Starred!");
    }
  };

  const addToCart = (item, size, qty) => {
    const price = size ? parseFloat(size.price) : parseFloat(item.price);
    setCart([...cart, { ...item, size, quantity: qty, totalPrice: price * qty }]);
    message.success("Added to cart!");
    setIsCartOpen(true);
  };

  if (splash) return <SplashView businessName={selectedShop?.business_name} />;

  return (
    <MainWrapper>
      <div className="flex-1 flex flex-col relative min-h-screen">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex items-center justify-center">
              <div className="w-8 h-8 border-3 border-gray-100 border-t-[#1A3C28] rounded-full animate-spin"></div>
            </motion.div>
          ) : activeTab === 'profile' ? (
            <ProfileView selectedShop={selectedShop} selectedTable={selectedTable} />
          ) : activeTab === 'starred' ? (
            <StarredView starredItems={starredItems} onToggleStar={onToggleStar} setOptionsModalItem={setOptionsModalItem} />
          ) : currentCategory ? (
            <CategoryView
              currentCategory={currentCategory} setCurrentCategory={setCurrentCategory}
              menuItems={menuItems} starredItems={starredItems} onToggleStar={onToggleStar}
              searchText={searchText} setSearchText={setSearchText} setOptionsModalItem={setOptionsModalItem}
            />
          ) : (
            <HomeView
              selectedShop={selectedShop} categories={categories} currentCategory={currentCategory} setCurrentCategory={setCurrentCategory}
              menuItems={menuItems} starredItems={starredItems} onToggleStar={onToggleStar}
              cart={cart} setIsCartOpen={setIsCartOpen} searchText={searchText} setSearchText={setSearchText}
              getTotalPrice={() => cart.reduce((sum, item) => sum + item.totalPrice, 0)} setOptionsModalItem={setOptionsModalItem}
            />
          )}
        </AnimatePresence>

        <div className="fixed bottom-0 md:bottom-8 left-0 md:left-1/2 md:-translate-x-1/2 w-full md:w-[480px] bg-white/90 backdrop-blur-xl border-t md:border border-gray-100 md:rounded-[32px] px-8 py-4 flex justify-between items-center z-50 md:shadow-2xl shadow-gray-200/50">
          {[
            { id: 'home', icon: Home, label: 'Home' },
            { id: 'order', icon: FileText, label: 'Order', badge: cart.length },
            { id: 'starred', icon: Star, label: 'Starred' },
            { id: 'profile', icon: User, label: 'Profile' }
          ].map(tab => (
            <button
              key={tab.id} onClick={() => { setActiveTab(tab.id); if (tab.id === 'order') setIsCartOpen(true); else setCurrentCategory(null); }}
              className={cn("flex flex-col items-center gap-1.5 transition-all", (activeTab === tab.id || (tab.id === 'order' && isCartOpen)) ? "text-[#1A3C28]" : "text-gray-300")}
            >
              <div className="relative">
                <tab.icon size={22} strokeWidth={(activeTab === tab.id || (tab.id === 'order' && isCartOpen)) ? 3 : 2} />
                {tab.badge > 0 && <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full border-2 border-white text-[8px] flex items-center justify-center text-white font-black">{tab.badge}</span>}
              </div>
              <span className="text-[10px] font-bold uppercase">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <Modal open={!!optionsModalItem} onCancel={() => setOptionsModalItem(null)} footer={null} centered width={450} className="premium-modal font-sans" destroyOnClose>
        <div className="font-sans">
          <div className="relative h-48 bg-gray-50 overflow-hidden">
            {optionsModalItem?.image ? <img src={Config.getFullImagePath(optionsModalItem.image)} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-6xl">☕</div>}
          </div>
          <div className="p-8">
            <h2 className="text-xl font-extrabold text-[#1A3C28] mb-1">{optionsModalItem?.name}</h2>
            <p className="text-2xl font-extrabold text-[#1A3C28] mb-8">${parseFloat(optionsModalItem?.price || 0).toFixed(2)}</p>
            <div className="flex items-center gap-4">
              <Button className="h-12 flex-1 bg-[#1A3C28] text-white rounded-xl font-bold border-none" onClick={() => addToCart(optionsModalItem, null, 1)}>Add to Basket</Button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal open={isCartOpen} onCancel={() => { setIsCartOpen(false); setActiveTab('home'); }} footer={null} centered width={500} className="premium-modal" title={<span className="text-lg font-extrabold text-gray-800 uppercase">Order Details</span>}>
        <div className="p-6 font-sans">
          {cart.length === 0 ? <Empty description="Your basket is empty" /> : (
            <div className="space-y-4">
              {cart.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <div className="flex gap-4 items-center">
                    <img src={Config.getFullImagePath(item.image)} className="w-12 h-12 rounded-xl object-cover" />
                    <div><h4 className="font-bold text-sm">{item.name}</h4><span className="text-[10px] text-gray-400">x{item.quantity}</span></div>
                  </div>
                  <span className="font-extrabold text-[#1A3C28]">${item.totalPrice.toFixed(2)}</span>
                </div>
              ))}
              <div className="pt-6 border-t border-dashed flex justify-between items-baseline">
                <span className="text-sm font-bold text-gray-400">Total Amount</span>
                <span className="text-3xl font-extrabold text-[#1A3C28]">${cart.reduce((s, i) => s + i.totalPrice, 0).toFixed(2)}</span>
              </div>
              <Button block size="large" className="mt-8 bg-[#1A3C28] text-white rounded-xl font-bold border-none" onClick={() => { message.success("Order Placed!"); setCart([]); setIsCartOpen(false); setActiveTab('home'); }}>Place Order</Button>
            </div>
          )}
        </div>
      </Modal>
    </MainWrapper>
  );
};

export default CoffeeMenuApp;
