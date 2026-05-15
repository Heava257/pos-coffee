import React, { useEffect, useState } from "react";
import { Breadcrumb, Button, Dropdown, Input, Layout, Menu, Tag, theme, Drawer, Divider, Space, Alert, Tooltip, Select, Modal, Typography, Avatar, message } from "antd";
const { Title, Text } = Typography;
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import "./MainLayout.css";
import packageJson from "../../../package.json";
import logo from "../../assets/business_default_logo.png";
import ImgUser from "../../assets/profile.png";
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
  StarOutlined,
  DownOutlined,
  UserAddOutlined,
  CustomerServiceOutlined,
  LogoutOutlined
} from "@ant-design/icons";
import {
  getPermission,
  getProfile,
  setAcccessToken,
  setPermission,
  setProfile,
} from "../../store/profile.store";
import { useProfileStore } from "../../store/profileStore"; // Import the new store
import { request } from "../../util/helper";
import { useUIStore } from "../../store/uiStore";
import { configStore } from "../../store/configStore";
import { useShiftStore } from "../../store/shiftStore";
import { FaShop } from "react-icons/fa6";
import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';
function cn(...inputs) { return twMerge(clsx(inputs)); }
import { Config } from "../../util/config";
import { FaHistory } from "react-icons/fa";
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
      },
      {
        key: "plans",
        labelKey: "plans",
        icon: <CreditCardOutlined />,
      },
      {
        key: "service-blueprints",
        labelKey: "service_blueprints",
        icon: <PartitionOutlined />,
      },
      {
        key: "system-subscriptions",
        labelKey: "system_subscriptions",
        icon: <SafetyCertificateOutlined />,
      },
      {
        key: "system-modules",
        labelKey: "system_modules",
        icon: <AppstoreOutlined />,
      },
    ]
  },
];


const MainLayout = () => {
  const { lang, setLang } = useLanguage();
  const t = translations[lang];
  const { profile, permissions, setProfile: setProfileStore, setPermissions: setPermissionsStore } = useProfileStore(); // Use reactive profile/permissions from the store
  const [subAlert, setSubAlert] = useState(null);
  const { setConfig } = configStore();
  const { isFullScreen, setFullScreen, isHeaderVisible, setHeaderVisible, isSidebarCollapsed, setSidebarCollapsed } = useUIStore();
  const COLORS = {
    darkGreen: "#1e4a2d",
    white: "#ffffff",
  };
  const [menuSearch, setMenuSearch] = useState("");
  const [mobileDrawerVisible, setMobileDrawerVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentShift, fetchCurrentShift, openShift } = useShiftStore();
  const [openShiftModalVisible, setOpenShiftModalVisible] = useState(false);
  const [openingCash, setOpeningCash] = useState({ usd: 0, khr: 0 });

  const [staffList, setStaffList] = useState([]);
  const [switchAccountVisible, setSwitchAccountVisible] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [pin, setPin] = useState("");

  useEffect(() => {
    if (profile) {
      fetchCurrentShift();
      fetchStaffList();
    }
  }, [profile]);

  const fetchStaffList = async () => {
    const res = await request("user-switch-list", "get");
    if (res && res.list) {
      setStaffList(res.list.filter(u => u.id !== profile.id && u.id !== profile.user_id));
    }
  };

  const handleSwitchAccount = async () => {
    if (!selectedStaff || !pin) return;
    try {
      const res = await request("auth/login-switch", "post", {
        id: selectedStaff.id,
        password: pin
      });

      if (res && res.access_token) {
        message.success(`Switched to ${selectedStaff.name}`);
        setAcccessToken(res.access_token);
        setProfile(res.profile);
        setPermission(res.permission);
        setSwitchAccountVisible(false);
        setPin("");
        window.location.reload(); // Reload to refresh all state
      }
    } catch (error) {
      setPin(""); // Clear password on failure
      // Error is already shown by global request helper
    }
  };

  const handleOpenShift = async () => {
    const res = await openShift(openingCash.usd, openingCash.khr);
    if (res.success) {
      message.success(res.message);
      setOpenShiftModalVisible(false);
    } else {
      message.error(res.message);
    }
  };

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
  }, [location.pathname, lang, permissions, isSidebarCollapsed]); // Added isSidebarCollapsed

  const checkISnotPermissionViewPage = () => {
    // Guard: if no profile or permissions loaded yet, don't redirect
    if (!profile || !permissions || permissions.length === 0) return;

    const currentPath = location.pathname;

    // always allow profile page for everyone (they need to edit their own info)
    if (currentPath === '/profile') return;

    // Special Case: always allow administrative routes for system admin (Business ID 1)
    if (profile?.business_id === 1) {
      const adminRoutes = [
        '/business',
        '/plans',
        '/service-blueprints',
        '/system-subscriptions',
        '/system-modules',
        '/module-registry',
        '/user',
        '/role',
        '/permission',
        '/settings'
      ];
      if (adminRoutes.some(route => currentPath === route || currentPath.startsWith(route + "/"))) {
        return;
      }
    }

    // Check if the route is allowed for the user
    const findIndex = permissions.findIndex((p) => {
      const routeKey = typeof p === 'string' ? p : p.route_key;
      if (!routeKey && routeKey !== "") return false;

      const p1 = routeKey.toLowerCase().replace(/^\/+|\/+$/g, '');
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
      // 1. If we are already on POS, stay there
      if (currentPath === "/invoices" || currentPath === "/invoices/") return;

      // 2. If staff (has POS permission), send to /invoices
      const posPerm = permissions.find(p => (p.web_route_key || p.route_key)?.includes('invoices'));
      if (posPerm) {
        console.warn("Redirecting to /invoices (POS) as default permitted route.");
        navigate("/invoices");
      } else if (permissions[0]) {
        const targetPath = permissions[0].web_route_key || permissions[0].route_key;
        if (targetPath) {
          console.warn(`Redirecting to first permitted route: ${targetPath}`);
          navigate(targetPath);
        } else {
          navigate("/login");
        }
      } else {
        console.warn("No permitted routes found. Redirecting to login.");
        navigate("/login");
      }
    }
  };

  // Reactive menu filtering
  const items = React.useMemo(() => {
    if (!permissions || !Array.isArray(permissions)) return [];

    // Helper to check permission safely
    const checkPath = (key) => {
      if (!key && key !== "") return false;
      const targetPath = (key === "" || key === "dashboard") ? "/" : "/" + key;
      const adminRoutes = [
        'dashboard',
        'business',
        'plans',
        'service-blueprints',
        'system-subscriptions',
        'system-modules',
        'module-registry',
        'user',
        'role',
        'permission',
        'settings'
      ];
      if (profile?.business_id === 1 && adminRoutes.includes(key)) return true;

      return permissions.some(p => {
        // Handle both object {route_key: ...} and plain string
        const routeKey = typeof p === 'string' ? p : p.route_key;
        if (!routeKey) return false;

        const p1 = routeKey.toLowerCase().replace(/^\/+|\/+$/g, '');
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
      return menuList.map(item => {
        const newItem = { ...item };

        const isOwner = profile?.role_name?.toUpperCase() === "OWNER" || profile?.role_code === "owner";
        const isAdmin = profile?.role_name?.toUpperCase().includes("ADMIN") || profile?.role_code === "admin";
        const canSeeAllReports = isOwner || isAdmin;

        // Customize labels based on role
        if (newItem.key === "order" && !canSeeAllReports) {
          newItem.label = t.my_shift_report || "My Shift report";
        }

        // Hide full reports / analytics for staff (keep only my shift)
        if (newItem.key === "reports" && !canSeeAllReports) return null;
        if (newItem.key === "dashboard" && !canSeeAllReports) return null;

        // 1. Super Admin (Platform Owner) Filter
        // Strictly hide Shop groups and only allow Administration & Dashboard
        if (profile?.business_id === 1) {
          const allowedGroups = ["menu_group_main", "menu_group_admin"];
          const allowedSoloItems = ["dashboard"];

          if (newItem.type === "group" && !allowedGroups.includes(newItem.labelKey)) {
            return null;
          }

          // For leaf items in the root (like Dashboard), check if allowed
          if (!newItem.children && !newItem.type && !allowedSoloItems.includes(newItem.key)) {
            // If it's a top-level item that's not allowed, check if it's part of a group later
          }
        }

        // Set Label FIRST so it's available for all subsequent checks/returns
        if (newItem.labelKey) {
          newItem.label = t[newItem.labelKey];
        }

        // 2. Platform Admin Exceptions (Critical Security)
        const platformAdminModules = ["plans", "business", "service-blueprints", "system-modules", "permission", "role", "system-subscriptions", "modular_package"];
        if (platformAdminModules.includes(newItem.key)) {
          // These modules are strictly for the SaaS owner
          if (profile?.business_id !== 1) return null;
          return checkPath(newItem.key) ? newItem : null;
        }

        if (newItem.key === "dashboard" && profile?.business_id === 1) {
          return newItem;
        }

        // 3. Regular Menu Item Filtering
        // If it's a platform admin (Business ID 1), we check permissions strictly for LEAF items
        // Groups and submenus will be handled by the recursive block below
        if (profile?.business_id === 1 && !newItem.children && newItem.type !== 'group') {
          return checkPath(newItem.key) ? newItem : null;
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
  }, [permissions, profile, lang, isSidebarCollapsed, t]);

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

  // Sidebar color constants - Reverted to White (Default)
  const SB = {
    bg: "#ffffff",
    text: "#64748b",
    textActive: COLORS.darkGreen,
    activeBg: "#f1f5f9",
    hoverBg: "#f8fafc",
    border: "#f1f5f9",
  };

  return (
    <Layout
      style={{
        minHeight: "100vh",
        background: "#f0f2f5",
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
            background: SB.bg,
            borderRight: "1px solid #e2e8f0",
            position: "fixed",
            height: "100vh",
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 1000,
          }}
          width={280}
          collapsedWidth={72}
        >
          <div style={{
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            background: SB.bg,
            overflow: "hidden",
          }}>

            {/* ── Logo Row ── */}
            <div style={{
              padding: isSidebarCollapsed ? "24px 0" : "24px 20px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexShrink: 0,
              justifyContent: isSidebarCollapsed ? "center" : "flex-start",
            }}>
              <div style={{
                width: 36, height: 36,
                borderRadius: 10,
                background: COLORS.darkGreen,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
                fontSize: 16, fontWeight: 900, color: "#fff",
              }}>
                {(profile?.business_name || "C")[0].toUpperCase()}
              </div>
              {!isSidebarCollapsed && (
                <span style={{ color: "#1e293b", fontSize: 16, fontWeight: 700 }}>
                  {profile?.business_name || "Coffee POS"}
                </span>
              )}
            </div>

            {/* 👤 Current User Profile */}
            <div id="profile-dropdown-anchor" style={{ position: 'relative' }}>
              <Dropdown
                trigger={['click']}
                getPopupContainer={() => document.getElementById('profile-dropdown-anchor')}
                dropdownRender={() => (
                  <div style={{
                    background: '#fff', padding: '12px', borderRadius: '16px',
                    boxShadow: '0 12px 30px rgba(0,0,0,0.1)', minWidth: '240px',
                    border: '1px solid #f1f5f9'
                  }}>
                    {/* Current User Section */}
                    {/* 🛠 Profile Actions - Compact & Elegant List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div 
                        onClick={() => navigate("/profile")}
                        style={{ 
                          display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', 
                          borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s',
                          background: 'transparent'
                        }}
                        className="profile-menu-item"
                      >
                        <UserOutlined style={{ fontSize: '14px', color: '#c0a060' }} />
                        <Text style={{ fontSize: '12.5px', fontWeight: 600, color: '#475569' }}>View Profile</Text>
                      </div>

                      {(profile?.role_code === 'owner' || profile?.business_id === 1) && (
                        <div 
                          onClick={() => navigate("/user")}
                          style={{ 
                            display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', 
                            borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s',
                            background: 'transparent'
                          }}
                          className="profile-menu-item"
                        >
                          <UserAddOutlined style={{ fontSize: '14px', color: '#64748b' }} />
                          <Text style={{ fontSize: '12.5px', fontWeight: 600, color: '#475569' }}>Add account</Text>
                        </div>
                      )}
                    </div>

                    <Divider style={{ margin: '8px 0', borderColor: '#f1f5f9' }} />

                    {/* 🔄 Switch Account Section */}
                    <div style={{ marginTop: '8px' }}>
                      <div style={{ padding: '0 8px 8px 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '3px', height: '12px', background: '#64748b', borderRadius: '2px' }} />
                        <Text type="secondary" style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                          Switch Account
                        </Text>
                      </div>

                      <div style={{ maxHeight: '220px', overflowY: 'auto', padding: '4px 0' }}>
                        {staffList.length > 0 ? (
                          staffList.map(staff => (
                            <div 
                              key={staff.id}
                              onClick={() => {
                                setSelectedStaff(staff);
                                setSwitchAccountVisible(true);
                              }}
                              style={{ 
                                display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', 
                                borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s', marginBottom: '4px'
                              }}
                              className="staff-switch-item-compact"
                            >
                              <Avatar size={28} src={Config.getFullImagePath(staff.profile_image)} icon={<UserOutlined />} />
                              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                                <Text style={{ fontSize: '12px', fontWeight: 600 }}>{staff.name}</Text>
                                <Text type="secondary" style={{ fontSize: '10px' }}>{staff.role_name}</Text>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div style={{ padding: '12px', textAlign: 'center', opacity: 0.5 }}>
                            <Text type="secondary" style={{ fontSize: '11px' }}>No other active sessions</Text>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              >
                <div
                  className="profile-card"
                  style={{
                    background: "rgba(30, 74, 45, 0.04)",
                    borderRadius: "12px",
                    padding: isSidebarCollapsed ? "8px 0" : "8px 12px",
                    margin: "8px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    border: "1px solid rgba(30, 74, 45, 0.08)",
                    position: "relative",
                    justifyContent: isSidebarCollapsed ? "center" : "flex-start",
                  }}
                >
                  <div style={{ position: "relative" }}>
                    <Avatar
                      size={32}
                      src={Config.getFullImagePath(profile?.profile_image)}
                      icon={<UserOutlined />}
                      style={{
                        border: "1.5px solid #fff",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        bottom: -1,
                        right: -1,
                        width: 10,
                        height: 10,
                        background: "#22c55e",
                        borderRadius: "50%",
                        border: "1.5px solid #fff",
                      }}
                    />
                  </div>
                  {!isSidebarCollapsed && (
                    <>
                      <div style={{ flex: 1, overflow: "hidden", lineHeight: 1.2 }}>
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: 700,
                            color: "#1e293b",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {profile?.name}
                        </div>
                        <div
                          style={{
                            fontSize: "10.5px",
                            color: "#64748b",
                            textTransform: "capitalize",
                            opacity: 0.8
                          }}
                        >
                          {profile?.role_name}
                        </div>
                      </div>
                      <DownOutlined style={{ fontSize: 10, color: "#94a3b8" }} />
                    </>
                  )}
                </div>
              </Dropdown>
            </div>

            <div style={{ margin: "0 24px 12px", height: 1, background: "#f1f5f9" }} />

            <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", paddingBottom: 8 }} className="sb-scroll">
              <Menu
                theme="light"
                selectedKeys={selectedKeys}
                openKeys={openKeys}
                mode="inline"
                items={items.filter(item => {
                  if (!menuSearch) return true;
                  const search = menuSearch.toLowerCase();
                  if (item.type === 'group') {
                    return item.children.some(child =>
                      child.label.toLowerCase().includes(search) ||
                      (child.children && child.children.some(sub => sub.label.toLowerCase().includes(search)))
                    );
                  }
                  return item.label.toLowerCase().includes(search);
                })}
                onClick={onClickMenu}
                onOpenChange={onOpenChange}
                inlineCollapsed={isSidebarCollapsed}
                style={{ background: "transparent", border: "none" }}
              />
            </div>

            {/* ── Sidebar Footer ── */}
            <div style={{ padding: "8px 0", borderTop: "1px solid #f1f5f9", flexShrink: 0 }}>
              {/* Support */}
              <div
                style={{
                  margin: "2px 12px",
                  padding: "8px 12px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  cursor: "pointer",
                  color: "#64748b",
                  borderRadius: 8,
                  transition: "all 0.2s",
                  justifyContent: isSidebarCollapsed ? "center" : "flex-start"
                }}
                className="sb-footer-item"
                onClick={() => window.open('https://t.me/your_support', '_blank')}
              >
                <CustomerServiceOutlined style={{ fontSize: 16 }} />
                {!isSidebarCollapsed && <span style={{ fontSize: 12.5, fontWeight: 500 }}>Support</span>}
              </div>

              {/* Logout */}
              <div
                style={{
                  margin: "2px 12px",
                  padding: "8px 12px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  cursor: "pointer",
                  color: "#ef4444",
                  borderRadius: 8,
                  transition: "all 0.2s",
                  justifyContent: isSidebarCollapsed ? "center" : "flex-start"
                }}
                className="sb-footer-item-logout"
                onClick={onLoginOut}
              >
                <LogoutOutlined style={{ fontSize: 16 }} />
                {!isSidebarCollapsed && <span style={{ fontSize: 12.5, fontWeight: 500 }}>Logout</span>}
              </div>
            </div>
          </div>
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
          <div style={{
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            background: "#ffffff"
          }}>
            <div className="admin-header-g1" style={{ flexShrink: 0, padding: "20px 0" }}>
              <img
                src={(profile?.business_logo && typeof profile.business_logo === "string" && profile.business_logo.trim() !== "" && profile.business_logo !== "null" && profile.business_logo !== "undefined") ? Config.getFullImagePath(profile.business_logo) : logo}
                alt="Logo"
                className="admin-logo"
                style={{
                  height: "80px",
                  width: "auto",
                  maxWidth: "200px",
                  objectFit: "contain",
                  transition: "all 0.3s ease",
                  margin: "0 auto",
                  display: "block"
                }}
              />
            </div>
            <div style={{
              flex: 1,
              overflowY: "auto",
              overflowX: "hidden",
              paddingBottom: "100px"
            }}>
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
                  fontSize: "14px"
                }}
              />
            </div>
          </div>
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
              borderBottom: "1px solid #f1f5f9",
              padding: "0 24px 0 12px",
              height: "64px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              position: "sticky",
              top: 0,
              zIndex: 999,
              transition: "all 0.3s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Button
                type="text"
                icon={isSidebarCollapsed && !isMobile ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={isMobile ? toggleMobileDrawer : () => setSidebarCollapsed(!isSidebarCollapsed)}
                style={{
                  fontSize: "18px",
                  width: 40,
                  height: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b',
                  borderRadius: '8px',
                }}
              />

              {/* 🔍 Search Input in Header */}
              {!isMobile && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: "#f8fafc", borderRadius: 12,
                  padding: "0 14px", height: 40, border: "1px solid #f1f5f9",
                  width: 280
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round">
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search menu..."
                    value={menuSearch}
                    onChange={(e) => setMenuSearch(e.target.value)}
                    style={{ border: "none", background: "transparent", outline: "none", fontSize: 13, color: "#1e293b", width: "100%" }}
                  />
                </div>
              )}
            </div>

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


              {/* 💎 Premium Feature / Plan Badge Only */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* 🕔 Shift Status */}
                {!isMobile && profile?.business_id !== 1 && (
                  <div
                    onClick={() => !currentShift && setOpenShiftModalVisible(true)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "0 14px",
                      height: 34,
                      background: currentShift ? "rgba(34, 197, 94, 0.1)" : "rgba(244, 63, 94, 0.1)",
                      border: `1px solid ${currentShift ? "rgba(34, 197, 94, 0.2)" : "rgba(244, 63, 94, 0.2)"}`,
                      borderRadius: 12,
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    <div style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: currentShift ? "#22c55e" : "#f43f5e",
                      boxShadow: `0 0 10px ${currentShift ? "#22c55e" : "#f43f5e"}`
                    }} />
                    <span style={{
                      fontSize: 11, fontWeight: 700,
                      color: currentShift ? "#15803d" : "#be123c",
                      textTransform: "uppercase", letterSpacing: 0.5
                    }}>
                      {currentShift ? "Shift Open" : "Shift Closed"}
                    </span>
                  </div>
                )}

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
            color: "#64748b",
            padding: isMobile ? "12px 16px" : "16px 40px",
            fontSize: isMobile ? "11px" : "12px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span>©{new Date().getFullYear()}</span>
            <span style={{ fontWeight: 600, color: "#1e4a2d" }}>Team IT ស្រុកស្រែ</span>
            <span style={{ color: "#cbd5e1" }}>|</span>
            <span>Coffee POS Platform</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div className="status-dot-blink" style={{ width: 8, height: 8, background: "#22c55e", borderRadius: "50%", boxShadow: "0 0 8px rgba(34, 197, 94, 0.5)" }}></div>
              <span style={{ color: "#22c55e", fontWeight: 500, fontSize: "11px", letterSpacing: "0.5px" }}>SYSTEM ONLINE</span>
            </div>

            <div style={{
              background: "#f1f5f9",
              padding: "2px 8px",
              borderRadius: "4px",
              fontSize: "10px",
              fontWeight: 700,
              color: "#475569",
              border: "1px solid #e2e8f0",
              textTransform: "uppercase"
            }}>
              V{packageJson.version}-{import.meta.env.VITE_GIT_HASH || 'DEV'}
            </div>
          </div>
        </Footer>
      </Layout>
      {/* ── Open Shift Modal ── */}
      <Modal
        title={null}
        open={openShiftModalVisible}
        onCancel={() => setOpenShiftModalVisible(false)}
        footer={null}
        centered
        width={400}
      >
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{
            width: 60, height: 60, background: "rgba(30, 74, 45, 0.1)",
            borderRadius: "50%", display: "flex", alignItems: "center",
            justifyContent: "center", margin: "0 auto 16px"
          }}>
            <DesktopOutlined style={{ fontSize: 24, color: "#1e4a2d" }} />
          </div>
          <Title level={4} style={{ margin: 0, color: "#1e4a2d" }}>Open New Shift</Title>
          <Text type="secondary">Enter initial cash to start selling</Text>
        </div>

        <div style={{ padding: "0 10px" }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600, fontSize: 13, color: "#64748b" }}>Initial Cash (USD)</label>
            <Input
              size="large"
              prefix="$"
              type="number"
              placeholder="0.00"
              value={openingCash.usd}
              onChange={(e) => setOpeningCash({ ...openingCash, usd: e.target.value })}
              style={{ borderRadius: 10 }}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600, fontSize: 13, color: "#64748b" }}>Initial Cash (KHR)</label>
            <Input
              size="large"
              prefix="៛"
              type="number"
              placeholder="0"
              value={openingCash.khr}
              onChange={(e) => setOpeningCash({ ...openingCash, khr: e.target.value })}
              style={{ borderRadius: 10 }}
            />
          </div>
          <Button
            type="primary"
            block
            size="large"
            onClick={handleOpenShift}
            style={{
              height: 48, borderRadius: 12, background: "#1e4a2d",
              borderColor: "#1e4a2d", fontWeight: 700
            }}
          >
            Open Shift Now
          </Button>
        </div>
      </Modal>

      {/* ── Switch Account PIN Modal ── */}
      <Modal
        title={null}
        open={switchAccountVisible}
        onCancel={() => {
          setSwitchAccountVisible(false);
          setPin("");
        }}
        footer={null}
        centered
        width={350}
        bodyStyle={{ padding: '24px' }}
      >
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Avatar
            size={80}
            src={Config.getFullImagePath(selectedStaff?.profile_image)}
            icon={<UserOutlined />}
            style={{ marginBottom: 16, border: '4px solid #f1f5f9' }}
          />
          <Title level={4} style={{ margin: 0 }}>{selectedStaff?.name}</Title>
          <Text type="secondary">Enter your password to switch</Text>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Input.Password
            size="large"
            placeholder="Enter account password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            style={{ borderRadius: '12px' }}
            onPressEnter={handleSwitchAccount}
          />
          <Button
            type="primary"
            block
            size="large"
            onClick={handleSwitchAccount}
            style={{
              height: 48, borderRadius: 12, background: "#1e4a2d",
              borderColor: "#1e4a2d", fontWeight: 700
            }}
          >
            Switch Account
          </Button>
        </div>
      </Modal>
    </Layout>
  );
};

export default MainLayout;