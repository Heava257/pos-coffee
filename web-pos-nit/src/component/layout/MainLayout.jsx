import React, { useEffect, useState } from "react";
import { Breadcrumb, Button, Dropdown, Input, Layout, Menu, Tag, theme, Drawer, Divider, Space } from "antd";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import "./MainLayout.css";
import logo from "../../assets/business_default_logo.png";
import ImgUser from "../../assets/profile.png";
import { Tooltip } from "antd";
import { MdOutlineMarkEmailUnread, MdRestaurantMenu, MdCompareArrows } from "react-icons/md";
import { IoMdNotificationsOutline } from "react-icons/io";
import { 
  CoffeeOutlined, 
  LockOutlined, 
  MenuOutlined, 
  PartitionOutlined, 
  UnlockOutlined,
  PieChartOutlined,
  DesktopOutlined,
  FileOutlined,
  ShopOutlined,
  FileProtectOutlined,
  SolutionOutlined,
  ShoppingCartOutlined,
  UsergroupAddOutlined,
  DollarOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  TrophyOutlined,
  CreditCardOutlined,
  SmileOutlined,
  TeamOutlined,
  GlobalOutlined,
  SettingOutlined,
  CrownOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  AppstoreOutlined,
  DeleteOutlined,
  ThunderboltOutlined,
  GiftOutlined,
  FireOutlined,
  LineChartOutlined,
  StarOutlined
} from "@ant-design/icons";
import {
  getPermission,
  getProfile, // Keep getProfile from profile.store.js for initial load if needed
  setAcccessToken,
  setPermission, // Keep setPermission from profile.store.js
} from "../../store/profile.store";
import { useProfileStore } from "../../store/profileStore"; // Import the new store
import { request } from "../../util/helper";
import { useUIStore } from "../../store/uiStore";
import { configStore } from "../../store/configStore";
import { FaShop } from "react-icons/fa6";
import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';
function cn(...inputs) { return twMerge(clsx(inputs)); }
import { Config } from "../../util/config";
import { FaHistory } from "react-icons/fa";
import { Alert, Select } from "antd";
import dayjs from "dayjs";
import { useLanguage, translations } from "../../store/language.store";
const { Header, Content, Footer, Sider } = Layout;

// Menu keys used for mapping translations
const MENU_STRUCTURE = [
  {
    type: 'group',
    labelKey: 'menu_group_main',
    children: [
      {
        key: "dashboard",
        labelKey: "dashboard",
        icon: <PieChartOutlined />,
      },
      {
        key: "invoices",
        labelKey: "pos",
        icon: <MdRestaurantMenu />,
      },
      {
        key: "order",
        labelKey: "order_detail",
        icon: <FaHistory />,
      },
      {
        key: "kds",
        labelKey: "kds_label",
        icon: <FireOutlined />,
      },
    ]
  },

  {
    type: 'group',
    labelKey: 'menu_group_marketing',
    children: [
      {
        key: "marketing/dashboard",
        labelKey: "marketing_label",
        icon: <GiftOutlined />,
      },
      {
        key: "membership/search",
        labelKey: "loyalty_portal",
        icon: <TrophyOutlined />,
      },
    ]
  },

  {
    type: 'group',
    labelKey: 'menu_group_inventory',
    children: [
      {
        key: "inventory",
        labelKey: "inventory",
        icon: <ShoppingCartOutlined />,
        children: [
          { key: "purchase", labelKey: "purchase", icon: <ShoppingCartOutlined /> },
          { key: "supplier", labelKey: "supplier", icon: <TeamOutlined /> },
          { key: "raw_material", labelKey: "raw_material", icon: <FileProtectOutlined /> },
          { key: "recipe", labelKey: "recipe", icon: <SolutionOutlined /> },
          { key: "stock", labelKey: "stock", icon: <FileProtectOutlined /> },
          { key: "stock-transfer", labelKey: "stock_transfer", icon: <MdCompareArrows /> },
          { key: "waste", labelKey: "waste_label", icon: <DeleteOutlined /> },
          { key: "inventory/forecast", labelKey: "forecast_label", icon: <ThunderboltOutlined /> },
        ]
      },
    ]
  },

  {
    type: 'group',
    labelKey: 'menu_group_setup',
    children: [
      {
        key: "shop_managment",
        labelKey: "shop_managment",
        icon: <FaShop />,
      },
      {
        key: "table",
        labelKey: "table",
        icon: <DesktopOutlined />,
      },
      {
        key: "product",
        labelKey: "product",
        icon: <ShopOutlined />,
      },
      {
        key: "category",
        labelKey: "category",
        icon: <SolutionOutlined />,
      },
      {
        key: "menu-board",
        labelKey: "menu_board_label",
        icon: <DesktopOutlined />,
      },
    ]
  },

  {
    type: 'group',
    labelKey: 'menu_group_admin',
    children: [
      {
        key: "staff",
        labelKey: "staff_roles",
        icon: <UsergroupAddOutlined />,
        children: [
          { key: "user", labelKey: "user", icon: <UserOutlined /> },
          { key: "employee/performance", labelKey: "performance_label", icon: <LineChartOutlined /> },
          { key: "role", labelKey: "roles", icon: <SafetyCertificateOutlined /> },
          { key: "permission", labelKey: "permission", icon: <UnlockOutlined /> },
          { key: "plans", labelKey: "plans", icon: <CreditCardOutlined /> },
          { key: "system-modules", labelKey: "system_modules", icon: <AppstoreOutlined /> },
        ],
      },
      {
        key: "reports",
        labelKey: "reports",
        icon: <FileOutlined />,
        children: [
          { key: "report_Sale_Summary", labelKey: "sales_report", icon: <PieChartOutlined /> },
          { key: "expense", labelKey: "expenses", icon: <DollarOutlined /> },
          { key: "Top_Sale", labelKey: "best_sellers", icon: <TrophyOutlined /> },
        ],
      },
      {
        key: "settings",
        labelKey: "settings",
        icon: <SettingOutlined />,
      },
      {
        key: "business",
        labelKey: "business",
        icon: <GlobalOutlined />,
        style: { background: '#fff9ef', margin: '4px 0', borderRadius: '8px', color: '#c0a060', fontWeight: 'bold' }
      },
      {
        key: "service-blueprints",
        labelKey: "service_blueprints",
        icon: <PartitionOutlined />,
        style: { background: '#f5f7fa', margin: '4px 0', borderRadius: '8px', color: '#1e4a2d', fontWeight: 'bold' }
      },
      {
        key: "system-modules",
        labelKey: "system_modules",
        icon: <AppstoreOutlined />,
        style: { background: '#f5f7fa', margin: '4px 0', borderRadius: '8px', color: '#1e4a2d', fontWeight: 'bold' }
      },
    ]
  },
];


const MainLayout = () => {
  const { lang, setLang } = useLanguage();
  const t = translations[lang];
  const [permision, setPermision] = useState(getPermission() || []);
  const [subAlert, setSubAlert] = useState(null);
  const { setConfig } = configStore();
  const { profile, setProfile: setProfileStore } = useProfileStore(); // Use reactive profile from the store
  const { isFullScreen, setFullScreen, isHeaderVisible, setHeaderVisible, isSidebarCollapsed, setSidebarCollapsed } = useUIStore();
  const COLORS = {
    darkGreen: "#1e4a2d",
    white: "#ffffff",
  };
  const [mobileDrawerVisible, setMobileDrawerVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [openKeys, setOpenKeys] = useState([]);

  // Dynamic Theme Injected based on Layout
  useEffect(() => {
    const getLayoutType = () => {
      if (profile?.business_layout) return profile.business_layout;
      const bp = (profile?.blueprint_name || "").toLowerCase();
      if (bp.includes("pharmacy") || bp.includes("medical")) return "pharmacy";
      if (bp.includes("mart") || bp.includes("retail")) return "retail";
      if (bp.includes("restaurant")) return "restaurant";
      return "coffee";
    };

    const layout = getLayoutType();
    const themes = {
      pharmacy: { primary: "#2196f3", accent: "#64b5f6", shadow: "0 4px 12px rgba(33, 150, 243, 0.3)" },
      restaurant: { primary: "#e65100", accent: "#fb8c00", shadow: "0 4px 12px rgba(230, 81, 0, 0.3)" },
      retail: { primary: "#1e4a2d", accent: "#2d6a42", shadow: "0 4px 12px rgba(30, 74, 45, 0.3)" },
      coffee: { primary: "#1e4a2d", accent: "#2d6a42", shadow: "0 4px 12px rgba(30, 74, 45, 0.3)" }
    };

    const theme = themes[layout] || themes.coffee;
    document.documentElement.style.setProperty('--primary-color', theme.primary);
    document.documentElement.style.setProperty('--accent-color', theme.accent);
    document.documentElement.style.setProperty('--primary-shadow', theme.shadow);
  }, [profile]);

  useEffect(() => {
    const list = getPermission();
    setPermision(Array.isArray(list) ? list : []);
    checkSubscriptionStatus();

    // Auto-exit full screen if not on invoices page
    if (isFullScreen && !location.pathname.includes('/invoices')) {
      setFullScreen(false);
    }
  }, [location.pathname]);

  const checkSubscriptionStatus = async () => {
    // Only check if logged in and NOT the system admin (Business ID 1)
    if (!profile || profile.business_id === 1) return;
    const res = await request("my-plan", "get");
    if (res && res.success && res.plan?.subscription) {
      const sub = res.plan.subscription;
      if (sub.is_lifetime) return;

      const expiry = dayjs(sub.end_date);
      const daysLeft = expiry.diff(dayjs(), 'day');

      if (daysLeft < 0) {
        setSubAlert({ type: 'error', msg: `Your subscription expired on ${expiry.format("DD MMM")}. Renew now to restore full access.` });
      } else if (daysLeft <= 7) {
        setSubAlert({ type: 'warning', msg: `Package expiring in ${daysLeft} days. Consider extending your subscription.` });
      } else {
        setSubAlert(null);
      }
    }
  };

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // Check screen size
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);

      // Only auto-collapse on active resize if we cross the threshold
      if (width < 1024) {
        setSidebarCollapsed(true);
      }
    };

    // Set initial mobile/tablet states WITHOUT forcing collapse
    const initialWidth = window.innerWidth;
    setIsMobile(initialWidth < 768);
    setIsTablet(initialWidth >= 768 && initialWidth < 1024);

    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    if (!profile || profile === "" || profile === "null") {
      console.warn("MainLayout: No profile found. Redirecting to customer page.");
      navigate("/customer");
      return;
    }
    checkISnotPermissionViewPage();
    getMenuByUser();
    getConfig();

    // Set selected menu item based on current path
    const currentPath = location.pathname.replace(/^\/+|\/+$/g, '');
    setSelectedKeys([currentPath || "dashboard"]);

    // Auto-expand parent menus for selected item
    const findParentKey = (menuItems, targetKey) => {
      for (const item of menuItems) {
        if (item.children) {
          const found = item.children.find(child => child.key === targetKey);
          if (found) {
            return item.key;
          }
        }
      }
      return null;
    };

    const items_menu = MENU_STRUCTURE.map(item => ({
      ...item,
      label: t[item.labelKey],
      children: item.children ? item.children.map(child => ({
        ...child,
        label: t[child.labelKey]
      })) : undefined
    }));

    const parentKey = findParentKey(items_menu, currentPath);
    if (parentKey) {
      setOpenKeys([parentKey]);
    }
  }, [location.pathname, lang, permision, isSidebarCollapsed]); // Added isSidebarCollapsed

  const checkISnotPermissionViewPage = () => {
    // Guard: if no profile or permissions loaded yet, don't redirect
    if (!profile || !permision || permision.length === 0) return;

    const currentPath = location.pathname;

    // always allow profile page for everyone (they need to edit their own info)
    if (currentPath === '/profile') return;

    // Special Case: always allow business page for system admin (Business ID 1)
    if (currentPath === '/business' && profile?.business_id === 1) return;

    // Check if the route is allowed for the user
    const findIndex = permision.findIndex((item) => {
      if (!item.route_key) return false;
      const p1 = item.route_key.toLowerCase().replace(/^\/+|\/+$/g, '');
      const p2 = currentPath.toLowerCase().replace(/^\/+|\/+$/g, '');

      // Check for exact match or prefix match (for sub-routes like /product/edit/1)
      return p1 === p2 || (p1 !== "" && p2.startsWith(p1 + "/"));
    });

    if (findIndex === -1) {
      // Special Exception for Root/Dashboard: Only for Platform Admins (ID 1) or specific Super Admins
      const isPlatformAdmin = profile?.business_id === 1;
      const isDashboardRoute = currentPath === "/" || currentPath === "/dashboard";

      if (isDashboardRoute && isPlatformAdmin) {
        return;
      }

      console.warn(`Unauthorized access attempt to: ${currentPath}. Redirecting...`);

      // Smart Redirection:
      // 1. If staff (has POS permission), send to /invoices
      // 2. Otherwise send to first permitted route
      // 3. Last fallback to login
      const posPerm = permision.find(p => p.web_route_key?.includes('invoices'));
      if (posPerm) {
        console.warn("Redirecting to /invoices (POS) as default permitted route.");
        navigate("/invoices");
      } else if (permision[0] && permision[0].web_route_key) {
        console.warn(`Redirecting to first permitted route: ${permision[0].web_route_key}`);
        navigate(permision[0].web_route_key);
      } else {
        console.warn("No permitted routes found. Redirecting to login.");
        navigate("/login");
      }
    }
  };

  // Reactive menu filtering
  const items = React.useMemo(() => {
    if (!permision || !Array.isArray(permision)) return [];

    // Helper to check permission safely
    const checkPath = (key) => {
      if (!key && key !== "") return false;
      const targetPath = (key === "" || key === "dashboard") ? "/" : "/" + key;
      return permision.some(p => {
        if (!p.route_key) return false;
        const p1 = p.route_key.toLowerCase().replace(/^\/+|\/+$/g, '');
        const p2 = targetPath.toLowerCase().replace(/^\/+|\/+$/g, '');
        if ((p1 === "" || p1 === "dashboard") && (p2 === "" || p2 === "dashboard")) return true;
        return p1 === p2;
      });
    };

    // 1. Pre-calculate layout to avoid repetitive safe checks in recursion
    const getLayoutType = () => {
      if (profile?.business_layout) return profile.business_layout;
      const bp = profile?.blueprint_name?.toLowerCase() || "";
      if (bp.includes("pharmacy") || bp.includes("medical")) return "pharmacy";
      if (bp.includes("mart") || bp.includes("retail")) return "retail";
      if (bp.includes("restaurant")) return "restaurant";
      return "coffee";
    };

    const currentLayout = getLayoutType();
    const isHospitality = ["coffee", "restaurant"].includes(currentLayout);

    // Recursive filtering function
    const filterMenuItems = (menuList) => {
      // Get active modules from profile (default to POS for old accounts)
      const isLargePlan = profile?.plan_name?.toLowerCase().includes('large') || profile?.plan_name?.toLowerCase().includes('enterprise');
      const isMediumPlan = profile?.plan_name?.toLowerCase().includes('medium') || profile?.plan_name?.toLowerCase().includes('professional');
      const isSmallPlan = profile?.plan_name?.toLowerCase().includes('small') || profile?.plan_name?.toLowerCase().includes('starter');

      const activeModules = profile?.active_modules ? profile.active_modules.toUpperCase().split(',').map(m => m.trim()) : ['POS'];
      const hasInventory = activeModules.includes('INVENTORY') || isLargePlan;
      const hasOrdering = activeModules.includes('ORDERING') || isLargePlan;
      const hasCRM = activeModules.includes('CRM') || activeModules.includes('LOYALTY') || isLargePlan;

      return menuList.map(item => {
        const newItem = { ...item };

        const isOwner = profile?.role_name?.toUpperCase() === "OWNER" || profile?.role_code === "owner";
        const isAdmin = profile?.role_name?.toUpperCase().includes("ADMIN") || profile?.role_code === "admin";
        const canSeeAllReports = isOwner || isAdmin;

        // --- Module Based Filtering ---
        // 1. Inventory Group (Visible for Medium and Large)
        if (newItem.labelKey === 'menu_group_inventory' && !hasInventory) return null;
        
        // 2. Marketing & CRM Group
        if (newItem.labelKey === 'menu_group_marketing' && !hasCRM) return null;

        // 3. Ordering / Digital Menu Features
        const orderingKeys = ['marketing/dashboard', 'kds', 'menu-board', 'marketing_label'];
        if (orderingKeys.includes(newItem.key) && !hasOrdering) return null;
        
        // Specific restriction: Digital Menu Board (TV) is Enterprise only
        if (newItem.key === 'menu-board' && isMediumPlan) return null;

        // 3. CRM / Loyalty Features
        if (newItem.key === "membership/search" && !hasCRM) return null;

        // 4. Force Restriction for Small/Starter Plans (Business logic)
        const premiumGroups = ['menu_group_inventory', 'menu_group_admin']; // Admin group has sub-items that might be premium
        if (isSmallPlan && (newItem.key === 'marketing/dashboard' || newItem.key === 'membership/search')) {
           // Even if modules are checked, Small plan might still restrict some high-end automation
           // return null; // Uncomment if you want strict plan-based restriction
        }
        if (newItem.labelKey) {
          newItem.label = t[newItem.labelKey];
        }

        // Customize labels based on role
        if (newItem.key === "order" && !canSeeAllReports) {
          newItem.label = t.my_shift_report || "My Shift report";
        }

        if (newItem.key === "kds" && !isHospitality) return null;
        if (newItem.key === "table" && (!isHospitality || isSmallPlan)) return null;
        if (newItem.key === "my-plan" && profile?.business_id === 1) return null;

        // Plan 5 (Legacy Logic) - Keeping it as fallback but prioritizing activeModules
        const advancedInventoryKeys = ["recipe", "raw_material", "stock-transfer", "waste", "inventory/forecast"];
        if (advancedInventoryKeys.includes(newItem.key) && (!hasInventory || isMediumPlan)) {
          return null;
        }

        // Hide full reports / analytics for staff (keep only my shift)
        if (newItem.key === "reports" && !canSeeAllReports) return null;
        if (newItem.key === "dashboard" && !canSeeAllReports) return null;

        // Hide Shop Operations for SaaS Owner (Business ID 1)
        const shopOps = ["order", "inventory", "table", "product", "shop_managment", "invoices", "pos", "expense", "report"];
        if (profile?.business_id === 1 && (shopOps.includes(newItem.key) || shopOps.some(op => newItem.key?.includes(op)))) {
          return null;
        }

        // 2. Platform Admin Exceptions (Critical Security)
        const platformAdminModules = ["plans", "business", "service-blueprints", "system-modules", "permission", "role"];
        if (platformAdminModules.includes(newItem.key)) {
          return profile?.business_id === 1 ? newItem : null;
        }

        if (newItem.key === "dashboard" && profile?.business_id === 1) {
          return newItem;
        }

        // Case: Group or Submenu
        if (newItem.children) {
          const filteredChildren = filterMenuItems(newItem.children);
          if (filteredChildren && filteredChildren.length > 0) {
            return { ...newItem, children: filteredChildren };
          }
          return null;
        }

        // Case: Simple menu item
        return checkPath(newItem.key) ? newItem : null;
      }).filter(Boolean);
    };

    return filterMenuItems(MENU_STRUCTURE);
  }, [permision, profile, lang, isSidebarCollapsed, t]);

  const getMenuByUser = () => {
    // This function is now redundant due to useMemo
    // but we keep the signature if called elsewhere
  };

  const getConfig = async () => {
    const res = await request("config", "get");
    if (res) {
      setConfig(res);
    }
  };

  const onClickMenu = (item) => {
    navigate("/" + item.key);
    setSelectedKeys([item.key]);
    // Close mobile drawer after navigation
    if (isMobile) {
      setMobileDrawerVisible(false);
    }
  };

  const onOpenChange = (keys) => {
    const rootSubmenuKeys = ["inventory", "staff", "reports"];
    const latestOpenKey = keys.find((key) => openKeys.indexOf(key) === -1);
    if (!rootSubmenuKeys.includes(latestOpenKey)) {
      setOpenKeys(keys);
    } else {
      setOpenKeys(latestOpenKey ? [latestOpenKey] : []);
    }
  };

  const onLoginOut = () => {
    setProfileStore(null); // Updated: Clear Zustand store (which also clears localStorage)
    setAcccessToken("");
    localStorage.removeItem("permission");
    localStorage.removeItem("user_id");
    navigate("/login");
  };

  const toggleMobileDrawer = () => {
    setMobileDrawerVisible(!mobileDrawerVisible);
  };

  if (!profile) {
    return null;
  }

  const itemsDropdown = [
    {
      key: "profile",
      label: `${t.profile} / ${translations.kh.profile}`,
      icon: <UserOutlined />,
    },
    {
      type: 'divider',
    },
    {
      key: "logout",
      danger: true,
      label: `${t.logout} / ${translations.kh.logout}`,
      icon: <LockOutlined />,
    },
  ];


  // Calculate responsive margins and dimensions
  const getSiderWidth = () => {
    if (isMobile) return 0;
    return isSidebarCollapsed ? 80 : 280;
  };

  const getContentMargin = () => {
    if (isFullScreen) return 0;
    if (isMobile) return 0;
    return getSiderWidth();
  };

  const getHeaderPadding = () => {
    if (isMobile) return '0 12px';
    if (isTablet) return '0 16px';
    return '0 24px';
  };

  const getContentPadding = () => {
    if (isMobile) return '12px';
    if (isTablet) return '16px';
    return '24px';
  };

  // Sidebar component (reusable for both desktop sidebar and mobile drawer)
  const SidebarContent = () => (
    <>
      <div className="admin-header-g1">
        <img
          src={(profile?.business_logo && typeof profile.business_logo === "string" && profile.business_logo.trim() !== "" && profile.business_logo !== "null" && profile.business_logo !== "undefined") ? Config.getFullImagePath(profile.business_logo) : logo}
          alt="Logo"
          className="admin-logo"
          style={{
            height: isMobile ? "80px" : isSidebarCollapsed ? "45px" : "110px",
            width: "auto",
            maxWidth: isSidebarCollapsed ? "60px" : "200px",
            objectFit: "contain",
            transition: "all 0.3s ease",
            margin: isSidebarCollapsed ? "0 auto" : "0"
          }}
        />
      </div>
      <Menu
        theme="light"
        selectedKeys={selectedKeys}
        openKeys={openKeys}
        mode="inline"
        items={items}
        onClick={onClickMenu}
        onOpenChange={onOpenChange}
        style={{
          background: "transparent",
          border: "none",
          height: isMobile ? "calc(100vh - 120px)" : "calc(100vh - 120px)",
          overflowY: "auto",
          fontSize: isMobile ? "14px" : "inherit"
        }}
        inlineCollapsed={!isMobile && isSidebarCollapsed}
      />
    </>
  );

  return (
    <Layout
      style={{
        minHeight: "100vh",
        background: "#f4f1eb",
      }}
    >
      {/* Desktop Sidebar */}
      {!isMobile && !isFullScreen && (
        <Sider
          collapsible
          collapsed={isSidebarCollapsed}
          onCollapse={(value) => setSidebarCollapsed(value)}
          trigger={null}
          style={{
            background: "#ffffff",
            borderRight: "1px solid #e8e3d8",
            position: "fixed",
            height: "100vh",
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 1000,
          }}
          width={280}
          collapsedWidth={80}
        >
          <SidebarContent />
        </Sider>
      )}


      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          title={null}
          placement="left"
          onClose={() => setMobileDrawerVisible(false)}
          open={mobileDrawerVisible}
          width={280}
          bodyStyle={{
            padding: 0,
            background: "#f8f9fa"
          }}
          headerStyle={{ display: 'none' }}
        >
          <SidebarContent />
        </Drawer>
      )}

      <Layout style={{
        marginLeft: getContentMargin(),
        transition: "margin-left 0.3s",
        background: "#f4f1eb"
      }}>
        {/* Sidebar Toggle Button (Floating) - Only visible when header is hidden */}
        {!isFullScreen && !isHeaderVisible && !isMobile && (
          <div
            onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
            style={{
              position: "fixed",
              top: 10,
              left: isSidebarCollapsed ? 90 : 290,
              zIndex: 9999,
              background: COLORS.white,
              color: COLORS.darkGreen,
              width: 40,
              height: 40,
              borderRadius: "10px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
              border: `1px solid #e8e3d8`,
              transition: "all 0.3s ease",
            }}
          >
            {isSidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </div>
        )}

        {/* Header Toggle Button (Floating) */}
        {!isFullScreen && (
          <div
            onClick={() => setHeaderVisible(!isHeaderVisible)}
            style={{
              position: "fixed",
              top: isHeaderVisible ? (isMobile ? 55 : 65) : 0,
              right: 20, // Move to far right
              zIndex: 9999,
              background: isHeaderVisible ? "rgba(30,74,45,0.6)" : COLORS.darkGreen,
              color: "#fff",
              padding: "2px 12px",
              borderRadius: "0 0 8px 8px",
              cursor: "pointer",
              fontSize: 9,
              fontWeight: 800,
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              display: "flex",
              alignItems: "center",
              gap: 4,
              opacity: isHeaderVisible ? 0.3 : 0.9,
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = "1"}
            onMouseLeave={e => { if (isHeaderVisible) e.currentTarget.style.opacity = "0.3" }}
          >
            {isHeaderVisible ? (
              <><MenuFoldOutlined style={{ fontSize: 10, transform: 'rotate(-90deg)' }} /> {t.hide_header || "លាក់ក្បាលទំព័រ"}</>
            ) : (
              <><MenuUnfoldOutlined style={{ fontSize: 10, transform: 'rotate(-90deg)' }} /> {t.show_header || "បង្ហាញក្បាលទំព័រ"}</>
            )}
          </div>
        )}

        {/* Header */}
        {!isFullScreen && isHeaderVisible && (
          <div
            className="admin-header"
            style={{
              background: "#ffffff",
              borderBottom: "1px solid #e8e3d8",
              padding: getHeaderPadding(),
              height: isMobile ? "60px" : "70px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              position: "sticky",
              top: 0,
              zIndex: 999,
              boxShadow: "0 2px 10px rgba(0, 0, 0, 0.05)",
              borderTop: `4px solid ${["pharmacy", "medical"].some(k => (profile?.blueprint_name || "").toLowerCase().includes(k)) ? "#2196f3" : "#1e4a2d"}`,
              transition: "all 0.3s ease",
            }}
          >
            {/* Mobile Menu Button */}
            <Tooltip title={isMobile ? (mobileDrawerVisible ? "Close Menu" : "Open Menu") : (isSidebarCollapsed ? "Expand Menu" : "Collapse Menu")} placement="bottom">
              <Button
                type="text"
                icon={isSidebarCollapsed && !isMobile ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={isMobile ? toggleMobileDrawer : () => setSidebarCollapsed(!isSidebarCollapsed)}
                className="sidebar-toggle-btn"
                style={{
                  fontSize: "18px",
                  width: 40,
                  height: 40,
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#f8f9fa',
                  border: '1px solid #e9ecef',
                  color: '#1e4a2d',
                  marginRight: '12px'
                }}
              />
            </Tooltip>

            {/* Header Right Content */}
            <div
              className="admin-header-g2"
              style={{
                display: "flex",
                alignItems: "center",
                gap: isMobile ? "12px" : "24px",
                marginLeft: "auto",
              }}
            >
              {/* 🚀 Quick Actions Group */}


              {/* 💎 Premium Feature / Branch Info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {!isMobile && profile?.business_id !== 1 && (
                  <Button
                    type="primary"
                    size="middle"
                    icon={
                      (profile?.plan_name?.toLowerCase().includes('enterprise') || Number(profile?.plan_id) >= 6) ? <CrownOutlined /> : 
                      (profile?.plan_name?.toLowerCase().includes('pro') || Number(profile?.plan_id) === 5) ? <StarOutlined /> : 
                      <ShopOutlined />
                    }
                    onClick={() => navigate('/my-plan')}
                    className={cn(
                      "plan-badge-btn",
                      (profile?.plan_name?.toLowerCase().includes('enterprise') || Number(profile?.plan_id) >= 6) && "gold-gradient",
                      (profile?.plan_name?.toLowerCase().includes('pro') || Number(profile?.plan_id) === 5) && "emerald-gradient",
                      (!profile?.plan_name?.toLowerCase().includes('enterprise') && !profile?.plan_name?.toLowerCase().includes('pro')) && "core-gradient"
                    )}
                    style={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 4px 10px rgba(0, 0, 0, 0.08)',
                      fontWeight: 800,
                      fontSize: '10px',
                      letterSpacing: '0.5px',
                      height: '34px',
                      padding: '0 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      textTransform: 'uppercase'
                    }}
                  >
                    {profile?.plan_name || (Number(profile?.plan_id) === 4 ? "CORE POS" : `PLAN: ${profile?.plan_id}`)}
                  </Button>
                )}

                {!isMobile && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    justifyContent: 'center',
                    borderLeft: '1px solid #f1f3f5',
                    paddingLeft: '16px',
                    marginLeft: '4px',
                    minWidth: '120px'
                  }}>
                    <div style={{
                      fontSize: '15px',
                      fontWeight: 800,
                      color: '#1e4a2d',
                      lineHeight: 1.2
                    }}>
                      {profile?.business_name || "Green Grounds"}
                    </div>
                    <div style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      color: '#95a5a6',
                      letterSpacing: '0.4px',
                      textTransform: 'uppercase',
                      marginTop: '2px'
                    }}>
                      {profile?.branch_name || t.main_branch}
                    </div>
                  </div>
                )}
              </div>

              {/* 👤 User Profile Section */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {/* User Badge - Hidden on small mobile */}
                {!isMobile && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: '#2d3436', fontSize: '13px', lineHeight: 1.2 }}>
                      {profile?.name}
                    </div>
                    <Tag
                      color={profile?.business_id === 1 ? "gold" : (profile?.role_code === 'owner' ? "blue" : "#34495e")}
                      style={{
                        fontSize: '9px',
                        borderRadius: '10px',
                        padding: '0 8px',
                        marginTop: '4px',
                        border: 'none',
                        fontWeight: 800,
                        textTransform: 'uppercase'
                      }}
                    >
                      {profile?.business_id === 1 ? t.admin_label : (profile?.role_name || t.staff_label)}
                    </Tag>
                  </div>
                )}

                {/* Language Switcher */}
                <div
                  className="lang-switcher-container"
                  onClick={() => setLang(lang === 'en' ? 'kh' : 'en')}
                  style={{ transform: isMobile ? 'scale(0.85)' : 'none' }}
                >
                  <div className={`lang-toggle-handle ${lang}`}>
                    <span className="lang-flag-emoji">
                      {lang === 'en' ? '🇺🇸' : '🇰🇭'}
                    </span>
                  </div>
                  <div className="lang-labels">
                    <span className={`lang-label ${lang === 'en' ? 'active' : ''}`}>EN</span>
                    <span className={`lang-label ${lang === 'kh' ? 'active' : ''}`}>KH</span>
                  </div>
                </div>

                {/* Profile Dropdown */}
                <Dropdown
                  menu={{
                    items: itemsDropdown,
                    onClick: (event) => {
                      if (event.key === "logout") onLoginOut();
                      else if (event.key === "profile") navigate('/profile');
                    },
                  }}
                  trigger={['click']}
                  placement="bottomRight"
                >
                  <div className="profile-wrapper" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                      <img
                        className="img-user-premium"
                        src={(profile?.profile_image && typeof profile.profile_image === "string" && profile.profile_image.trim() !== "" && profile.profile_image !== "null" && profile.profile_image !== "undefined") ? Config.getFullImagePath(profile.profile_image) : ImgUser}
                        alt={profile?.name}
                      />
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: 10,
                        height: 10,
                        background: '#2ecc71',
                        border: '2px solid #fff',
                        borderRadius: '50%'
                      }} />
                    </div>
                    {!isMobile && <span style={{ color: '#b2bec3', fontSize: 10, marginLeft: 8 }}>▼</span>}
                  </div>
                </Dropdown>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <Content
          style={{
            margin: getContentPadding(),
            background: "transparent",
            minHeight: `calc(100vh - ${isMobile ? '120px' : '140px'})`,
          }}
        >
          <div
            className="admin-body"
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              border: "1px solid #e8e3d8",
              padding: getContentPadding(),
              boxShadow: isMobile ? "0 2px 8px rgba(30, 74, 45, 0.03)" : "0 4px 12px rgba(30, 74, 45, 0.05)",
              minHeight: `calc(100vh - ${isMobile ? '160px' : '180px'})`,
            }}
          >
            {subAlert && (
              <Alert
                type={subAlert.type}
                message={subAlert.msg}
                banner
                closable
                onClose={() => setSubAlert(null)}
                style={{ marginBottom: 20, borderRadius: '8px' }}
                action={
                  <Button size="small" type="primary" ghost onClick={() => navigate('/my-plan')}>
                    {t.subscription_details}
                  </Button>
                }
              />
            )}
            <Outlet />
          </div>
        </Content>

        <Footer
          style={{
            textAlign: 'center',
            background: "transparent",
            color: "#6b7c6b",
            padding: isMobile ? "12px" : "16px 24px",
            fontSize: isMobile ? "12px" : "13px",
          }}
        >
          ©{new Date().getFullYear()}
          <span className="khmer-text"> Created by Team IT ស្រុកស្រែ</span>
        </Footer>
      </Layout>
    </Layout>
  );
};

export default MainLayout;