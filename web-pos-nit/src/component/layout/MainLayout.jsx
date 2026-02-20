import React, { useEffect, useState } from "react";
import { Breadcrumb, Button, Dropdown, Input, Layout, Menu, Tag, theme, Drawer } from "antd";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import "./MainLayout.css";
import logo from "../../assets/coffee.png";
import ImgUser from "../../assets/profile.png";
import { Tooltip } from "antd";
import { MdOutlineMarkEmailUnread, MdRestaurantMenu } from "react-icons/md";
import { IoMdNotificationsOutline } from "react-icons/io";
import { MenuOutlined } from "@ant-design/icons";
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
} from "@ant-design/icons";
import { Config } from "../../util/config";
import { FaHistory } from "react-icons/fa";
const { Header, Content, Footer, Sider } = Layout;

const items_menu = [
  {
    key: "version",
    label: <Tag color="green">V 1.0.1</Tag>,
    disabled: true,
    className: "version-item khmrt-branch",
  },
  {
    key: "",
    label: "Dashboard",
    icon: <PieChartOutlined />,
    className: "dashboard-item khmrt-branch",
  },
  {
    key: "invoices",
    label: "Menu",
    icon: <MdRestaurantMenu />,
    className: "invoices-item khmrt-branch",
  },
  {
    key: "shop_managment",
    label: "Shop Managment",
    icon: <FaShop />,
    className: "invoices-item khmrt-branch",
  },
  {
    key: "customer",
    label: "CoffeeMenuApp",
    icon: <MdRestaurantMenu />,
    className: "invoices-item khmrt-branch",
  },
  {
    key: "order",
    label: "History",
    icon: <FaHistory />,
    className: "invoices-detail-item khmrt-branch",
  },
  {
    label: "Products",
    key: "product",
    icon: <ShopOutlined />,
    className: "product-menu khmrt-branch",
  },
  {
    key: "raw_material",
    label: "Raw Materials",
    icon: <FileProtectOutlined />,
    className: "raw-material-menu khmrt-branch",
  },
  {
    key: "purchase",
    label: "Purchases",
    icon: <ShoppingCartOutlined />,
    className: "purchase-menu khmrt-branch",
  },
  {
    key: "supplier",
    label: "Suppliers",
    icon: <TeamOutlined />,
    className: "supplier-menu khmrt-branch",
  },
  {
    key: "category",
    label: "Categories",
    icon: <SolutionOutlined />,
    className: "category-item khmrt-branch",
  },
  {
    label: "Expenses",
    icon: <DollarOutlined />,
    className: "expense-menu khmrt-branch",
    children: [
      {
        key: "expanse",
        label: "Expenses",
        icon: <DollarOutlined />,
        className: "expense-item khmrt-branch",
      },
      {
        key: "expanse_type",
        label: "Expense Types",
        icon: <DollarOutlined />,
        className: "expense-item khmrt-branch",
      },
    ],
  },
  {
    label: "Users",
    icon: <SolutionOutlined />,
    className: "user-menu khmrt-branch",
    children: [
      {
        key: "user",
        label: "Users",
        icon: <UserOutlined />,
        className: "user-item khmrt-branch",
      },
      {
        key: "role",
        label: "Roles",
        icon: <SafetyCertificateOutlined />,
        className: "role-item khmrt-branch",
      },
    ],
  },
  {
    label: "Reports",
    icon: <FileOutlined />,
    className: "report-menu khmrt-branch",
    children: [
      {
        key: "report_Sale_Summary",
        label: "Sales Summary",
        icon: <PieChartOutlined />,
        className: "sale-summary-item khmrt-branch",
      },
      {
        key: "report_Expense_Summary",
        label: "Expense Summary",
        icon: <DollarOutlined />,
        className: "expense-summary-item khmrt-branch",
      },
      {
        key: "Top_Sale",
        label: "Top Sales",
        icon: <TrophyOutlined />,
        className: "top-sale-item khmrt-branch",
      },
    ],
  },
  {
    key: "employee",
    label: "ExchangeRatePage",
    icon: <SolutionOutlined />,
    className: "category-item khmrt-branch",
  },
  {
    key: "total_due",
    label: "Product Management",
    icon: <SolutionOutlined />,
    className: "category-item khmrt-branch",
  },
];

const MainLayout = () => {
  const permision = getPermission();
  const { setConfig } = configStore();
  const [items, setItems] = useState(items_menu);
  const profile = getProfile();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerVisible, setMobileDrawerVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const location = useLocation();
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [openKeys, setOpenKeys] = useState([]);

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
    checkISnotPermissionViewPage();
    getMenuByUser();
    getConfig();
    if (!profile) {
      navigate("/login");
    }

    // Set selected menu item based on current path
    const currentPath = location.pathname.replace('/', '');
    setSelectedKeys([currentPath || ""]);

    // Auto-expand parent menus for selected item
    const findParentKey = (menuItems, targetKey) => {
      for (const item of menuItems) {
        if (item.children) {
          const found = item.children.find(child => child.key === targetKey);
          if (found) {
            return item.key || item.label;
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
    let findIndex = permision?.findIndex(
      (item) => item.web_route_key == location.pathname
    );
    if (findIndex == -1) {
      for (let i = 0; i < permision.length; i++) {
        navigate(permision[i].web_route_key);
        break;
      }
    }
  };

  const getMenuByUser = () => {
    let new_items_menu = [];
    items_menu?.map((item1) => {
      const p1 = permision?.findIndex(
        (data1) => data1.web_route_key == "/" + item1.key
      );
      if (p1 != -1) {
        new_items_menu.push(item1);
      }
      if (item1?.children && item1?.children.length > 0) {
        let childTmp = [];
        item1?.children.map((data1) => {
          permision?.map((data2) => {
            if (data2.web_route_key == "/" + data1.key) {
              childTmp.push(data1);
            }
          });
        });
        if (childTmp.length > 0) {
          item1.children = childTmp;
          new_items_menu.push(item1);
        }
      }
    });
    setItems(new_items_menu);
  };

  const getConfig = async () => {
    const res = await request("config", "get");
    if (res) {
      setConfig(res);
    }
  };

  const onClickMenu = (item) => {
    navigate(item.key);
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
        background: "#FFFFFF",
      }}
    >
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={(value) => setCollapsed(value)}
          style={{
            background: "#f8f9fa",
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
        transition: "margin-left 0.3s"
      }}>
        {/* Header */}
        <div
          className="admin-header"
          style={{
            background: "#FFFFFF",
            borderBottom: "1px solid #e9ecef",
            padding: getHeaderPadding(),
            height: isMobile ? "60px" : "70px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            zIndex: 999,
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
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
                <div className="txt-username" style={{
                  fontWeight: "600",
                  color: "#495057",
                  fontSize: isTablet ? "14px" : "inherit"
                }}>
                  {profile?.name}
                </div>
                <div style={{
                  fontSize: isTablet ? "11px" : "12px",
                  color: "#6c757d"
                }}>
                  {profile?.username}
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
            background: "#FFFFFF",
            minHeight: `calc(100vh - ${isMobile ? '120px' : '140px'})`,
          }}
        >
          <div
            className="admin-body"
            style={{
              background: "#FFFFFF",
              borderRadius: borderRadiusLG,
              padding: getContentPadding(),
              boxShadow: isMobile ? "0 2px 8px rgba(0, 0, 0, 0.03)" : "0 4px 12px rgba(0, 0, 0, 0.05)",
              minHeight: `calc(100vh - ${isMobile ? '160px' : '180px'})`,
            }}
          >
            <Outlet />
          </div>
        </Content>

        {/* Footer */}
        <Footer
          style={{
            textAlign: 'center',
            background: "#FFFFFF",
            color: "#6c757d",
            borderTop: "1px solid #e9ecef",
            padding: isMobile ? "12px" : "16px 24px",
            fontSize: isMobile ? "12px" : "14px",
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