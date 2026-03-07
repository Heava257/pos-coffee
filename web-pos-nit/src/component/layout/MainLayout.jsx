import React, { useEffect, useState } from "react";
import { Breadcrumb, Button, Dropdown, Input, Layout, Menu, Tag, theme, Drawer, Divider } from "antd";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import "./MainLayout.css";
import logo from "../../assets/coffee.png";
import ImgUser from "../../assets/profile.png";
import { Tooltip } from "antd";
import { MdOutlineMarkEmailUnread, MdRestaurantMenu } from "react-icons/md";
import { IoMdNotificationsOutline } from "react-icons/io";
import { MenuOutlined, UnlockOutlined } from "@ant-design/icons";
import {
  getPermission,
  getProfile,
  setAcccessToken,
  setProfile,
} from "../../store/profile.store";
import { request } from "../../util/helper";
import { configStore } from "../../store/configStore";
import { FaShop } from "react-icons/fa6";
import {
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
} from "@ant-design/icons";
import { Config } from "../../util/config";
import { FaHistory } from "react-icons/fa";
import { Alert } from "antd";
import dayjs from "dayjs";
const { Header, Content, Footer, Sider } = Layout;

const items_menu = [
  {
    key: "",
    label: "Dashboard",
    icon: <PieChartOutlined />,
  },
  {
    key: "my-plan",
    label: "My Subscription",
    icon: <CreditCardOutlined />,
    style: { background: '#f0f7f2', margin: '4px 8px', borderRadius: '8px', color: '#1e4a2d', fontWeight: 'bold' }
  },
  {
    key: "inventory",
    label: "Inventory / 📦 Logistics",
    icon: <ShoppingCartOutlined />,
    children: [
      { key: "purchase", label: "Purchases", icon: <ShoppingCartOutlined /> },
      { key: "supplier", label: "Suppliers", icon: <TeamOutlined /> },
      { key: "raw_material", label: "Inventory Stock", icon: <FileProtectOutlined /> },
      { key: "stock", label: "Stock Logs & Adjust", icon: <FileProtectOutlined /> },
    ]
  },
  {
    key: "invoices",
    label: "POS / Sales",
    icon: <MdRestaurantMenu />,
  },
  {
    key: "shop_managment",
    label: "My Branches",
    icon: <FaShop />,
  },
  {
    key: "table",
    label: "Tables & QR Setup",
    icon: <DesktopOutlined />,
  },
  {
    key: "product",
    label: "Products",
    icon: <ShopOutlined />,
  },
  {
    key: "category",
    label: "Categories",
    icon: <SolutionOutlined />,
  },
  {
    key: "order",
    label: "Order History",
    icon: <FaHistory />,
  },
  {
    key: "staff",
    label: "Staff & Roles",
    icon: <UsergroupAddOutlined />,
    children: [
      { key: "user", label: "Users / Staff", icon: <UserOutlined /> },
      { key: "role", label: "Roles", icon: <SafetyCertificateOutlined /> },
      { key: "permission", label: "Role Permissions", icon: <UnlockOutlined /> },
      { key: "plans", label: "Subscription Plans", icon: <CreditCardOutlined /> },
    ],
  },
  {
    key: "reports",
    label: "Reports & Insights",
    icon: <FileOutlined />,
    children: [
      { key: "report_Sale_Summary", label: "Sales Report", icon: <PieChartOutlined /> },
      { key: "expense", label: "Expenses", icon: <DollarOutlined /> },
      { key: "Top_Sale", label: "Best Sellers", icon: <TrophyOutlined /> },
    ],
  },
  {
    key: "business",
    label: "Business Ecosystem",
    icon: <GlobalOutlined />,
    style: { background: '#fff9ef', margin: '4px 8px', borderRadius: '8px', color: '#c0a060', fontWeight: 'bold' }
  },
];

const MainLayout = () => {
  const [permision, setPermision] = useState([]);
  const [subAlert, setSubAlert] = useState(null);
  const { setConfig } = configStore();
  const profile = getProfile();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerVisible, setMobileDrawerVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const location = useLocation();
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [openKeys, setOpenKeys] = useState([]);

  useEffect(() => {
    const list = getPermission();
    setPermision(Array.isArray(list) ? list : []);
    checkSubscriptionStatus();
  }, [location.pathname]);

  const checkSubscriptionStatus = async () => {
    // Only check if logged in and NOT the system admin (Business ID 1)
    if (!profile || profile.business_id === 1) return;
    const res = await request("my-plan", "get");
    if (res && res.success && res.plan.subscription) {
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
  const navigate = useNavigate();

  // Check screen size
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);

      // Auto-collapse sidebar on tablet and mobile
      if (width < 1024) {
        setCollapsed(true);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    if (!profile || profile === "" || profile === "null") {
      navigate("/login");
      return;
    }
    checkISnotPermissionViewPage();
    getMenuByUser();
    getConfig();

    // Set selected menu item based on current path
    const currentPath = location.pathname.replace('/', '');
    setSelectedKeys([currentPath || ""]);

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

    const parentKey = findParentKey(items_menu, currentPath);
    if (parentKey) {
      setOpenKeys([parentKey]);
    }
  }, [location.pathname]);

  const checkISnotPermissionViewPage = () => {
    // Guard: if no permissions loaded yet, don't redirect
    if (!permision || permision.length === 0) return;

    const currentPath = location.pathname;

    // always allow profile page
    if (currentPath === '/profile') return;

    // Special Case: always allow business page for system admin (Business ID 1)
    if (currentPath === '/business' && profile?.business_id === 1) return;

    const findIndex = permision.findIndex(
      (item) => item.web_route_key === currentPath
    );

    if (findIndex === -1) {
      if (currentPath === "/" && (profile?.business_id === 1 || profile?.is_super_admin === 1 || profile?.role_name?.toUpperCase() === "OWNER")) {
        return;
      }
      // Current page not in permissions — redirect to first allowed page
      // Ensure we have a valid route to redirect to
      if (permision[0] && permision[0].web_route_key) {
        navigate(permision[0].web_route_key);
      } else {
        navigate("/invoices"); // Fallback to POS if no permissions found
      }
    }
  };

  // Reactive menu filtering
  const items = React.useMemo(() => {
    if (!permision || !Array.isArray(permision)) return [];

    return items_menu.map(item => {
      const newItem = { ...item };

      // 1. Contextual Visibility Rules
      if (newItem.key === "business" && profile?.business_id !== 1) return null;
      if (newItem.key === "my-plan" && profile?.business_id === 1) return null;

      // Helper to check permission safely
      const checkPath = (key) => {
        if (!key && key !== "") return false;
        const targetPath = key === "" ? "/" : "/" + key;
        return permision.some(p => {
          if (!p.web_route_key) return false;
          // Normalize both paths: lowercase and remove trailing/leading slashes for comparison
          const p1 = p.web_route_key.toLowerCase().replace(/^\/+|\/+$/g, '');
          const p2 = targetPath.toLowerCase().replace(/^\/+|\/+$/g, '');
          return p1 === p2 || (p.web_route_key === "/" && targetPath === "/");
        });
      };

      // Case 1: Simple menu item (no children)
      if (newItem.hasOwnProperty('key') && !newItem.children) {
        if (newItem.key === "business" && profile?.business_id === 1) return newItem;

        // Let Dashboard ("") be shown ONLY if they have explicit permission OR they are the owner/Super Admin
        if (newItem.key === "") {
          if (profile?.business_id === 1 || profile?.is_super_admin === 1 || profile?.role_name?.toUpperCase() === "OWNER") {
            return newItem;
          }
        }

        return checkPath(newItem.key) ? newItem : null;
      }

      // Case 2: Parent menu with children
      if (newItem.children) {
        const filteredChildren = newItem.children.filter(child => checkPath(child.key));

        if (filteredChildren.length > 0) {
          return { ...newItem, children: filteredChildren };
        }
      }

      return null;
    }).filter(Boolean);
  }, [permision, profile]);

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
    setOpenKeys(keys);
  };

  const onLoginOut = () => {
    setProfile("");
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
      key: "1",
      label: (
        <a
          onClick={(e) => {
            e.preventDefault();
            navigate('/profile');
          }}
        >
          Profile
        </a>
      ),
    },
    {
      key: "2",
      label: (
        <a target="_blank" rel="noopener noreferrer" href="/">
          Change Your Password
        </a>
      ),
      icon: <SmileOutlined />,
      disabled: true,
    },
    {
      key: "logout",
      danger: true,
      label: "Logout",
    },
  ];

  // Calculate responsive margins and dimensions
  const getSiderWidth = () => {
    if (isMobile) return 0;
    return collapsed ? 80 : 280;
  };

  const getContentMargin = () => {
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
          src={logo}
          alt="Logo"
          className="admin-logo"
          style={{
            height: isMobile ? "80px" : collapsed ? "60px" : "130px",
            transition: "height 0.3s"
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
        inlineCollapsed={!isMobile && collapsed}
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
      {!isMobile && (
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={(value) => setCollapsed(value)}
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
          breakpoint="lg"
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
        {/* Header */}
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
            boxShadow: "0 2px 10px rgba(30, 74, 45, 0.05)",
          }}
        >
          {/* Mobile Menu Button */}
          {isMobile && (
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={toggleMobileDrawer}
              style={{
                fontSize: "18px",
                width: 40,
                height: 40,
              }}
            />
          )}

          {/* Header Right Section */}
          <div
            className="admin-header-g2"
            style={{
              display: "flex",
              alignItems: "center",
              gap: isMobile ? "8px" : "16px",
              marginLeft: isMobile ? "auto" : "0"
            }}
          >
            {/* Hide email and notification icons on small mobile screens */}
            {!isMobile && (
              <>
                <MdOutlineMarkEmailUnread
                  className="icon-email"
                  style={{ fontSize: "20px", color: "#6c757d" }}
                />
                <IoMdNotificationsOutline
                  className="icon-notify"
                  style={{ fontSize: "20px", color: "#6c757d" }}
                />
              </>
            )}

            {/* User info - hide text on mobile */}
            {!isMobile && (
              <div style={{ textAlign: "right", marginRight: "12px" }}>
                <div style={{ fontWeight: "700", color: "#1e4a2d", fontSize: "14px" }}>
                  {profile?.business_name || "Green Grounds Business"}
                </div>
                <div style={{ fontSize: "12px", color: "#6c757d", display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                  <FaShop size={10} color="#f7c06a" />
                  <span style={{ fontWeight: 500 }}>{profile?.branch_name || "Main Terminal"}</span>
                  <Divider type="vertical" />
                  <span style={{ fontStyle: 'italic' }}>{profile?.name}</span>
                </div>
              </div>
            )}

            <Dropdown
              menu={{
                items: itemsDropdown,
                onClick: (event) => {
                  if (event.key === "logout") {
                    onLoginOut();
                  } else if (event.key === "profile") {
                    navigate('/profile');
                  } else if (event.key === "change_password") {
                    navigate('/change-password');
                  }
                },
              }}
              trigger={['click']}
              placement="bottomRight"
            >
              <div className="profile-container" style={{ cursor: 'pointer' }}>
                <img
                  className="img-user"
                  src={profile?.profile_image ? Config.getFullImagePath(profile.profile_image) : ImgUser}
                  alt={profile?.name || "User"}
                  style={{
                    width: isMobile ? "32px" : "40px",
                    height: isMobile ? "32px" : "40px",
                    borderRadius: "50%"
                  }}
                />
                {!isMobile && <span className="dropdown-arrow">▼</span>}
              </div>
            </Dropdown>
          </div>
        </div>

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
                    Subscription Details
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