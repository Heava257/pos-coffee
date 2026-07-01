import React, { useEffect, useState } from "react";
import { formatDateServer, request } from "@/shared/utils/helper";
import { useProfileStore } from "@/app/store/profileStore";
import {
  Avatar,
  Button,
  Col,
  Form,
  Image,
  Input,
  message,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Upload,
  Tabs,
  Card,
  Badge,
  Typography,
  Divider,
  Tooltip,
  Alert,
  Progress, // Added Progress component
} from "antd";
const { Title, Text } = Typography;
import { configStore } from "@/app/store/configStore";
import { MdOutlineCreateNewFolder } from "react-icons/md";
import { UploadOutlined, UserOutlined } from "@ant-design/icons";
import { Config } from "@/shared/utils/config";
import { IoEyeOutline } from "react-icons/io5";
import imageExtensions from 'image-extensions';
import dayjs from "dayjs";

import { useLanguage, translations } from "@/app/store/language.store";
import { HelpCircle } from "lucide-react";
import Swal from "sweetalert2";

const { TabPane } = Tabs;

function UserPage() {
  const { lang } = useLanguage();
  const t = translations[lang];
  const profile = useProfileStore(s => s.profile);
  const userId = profile?.id || profile?.user_id;

  const isSuperAdmin = profile?.business_id === 1 && profile?.is_super_admin === 1;
  const isOwner = profile?.role_name?.toUpperCase() === "OWNER" || profile?.role_code === "owner";
  const isAdmin = profile?.role_name?.toUpperCase().includes("ADMIN") || profile?.role_code === "admin";

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [imageDefault, setImageDefault] = useState([]);
  const [form] = Form.useForm();
  const { config } = configStore();
  const [activeTab, setActiveTab] = useState("all"); // Add active tab state
  const [showGuide, setShowGuide] = useState(false);
  const [filter, setFilter] = useState({
    txt_search: "",
    branch_id: "", // Add branch filter state
  });
  const [state, setState] = useState({
    role: [],
    branches: [],
    businesses: [], // Add businesses list for super admin
    summary: {
      total_staff: 0,
      super_admins: 0,
      active_users: 0,
      regular_staff: 0,
      total_branches: 0
    },
    subscription: {
      plan_name: "Free Plan",
      deadline: "Lifetime",
      sub_status: "active",
      max_branches: 1,
      max_staff: 2,
      max_products: 50
    },
    loading: false,
    visible: false,
    filteredList: null,
    selected_business_id: profile?.business_id === 1 ? null : profile?.business_id // Track which business is being managed
  });

  const [passwordVal, setPasswordVal] = useState("");

  const hasMinLen = passwordVal.length >= 8;
  const hasUppercase = /[A-Z]/.test(passwordVal);
  const hasNumber = /[0-9]/.test(passwordVal);
  const hasSpecial = /[^A-Za-z0-9]/.test(passwordVal);

  const metCount = [hasMinLen, hasUppercase, hasNumber, hasSpecial].filter(Boolean).length;
  const strengthPercent = metCount * 25;

  let progressColor = "#ff4d4f";
  if (strengthPercent === 50 || strengthPercent === 75) {
    progressColor = "#faad14";
  } else if (strengthPercent === 100) {
    progressColor = "#52c41a";
  }

  const renderPasswordStrength = () => {
    if (!passwordVal) return null;

    return (
      <Progress
        percent={strengthPercent}
        strokeColor={progressColor}
        showInfo={false}
        strokeWidth={3}
        style={{ marginTop: -10, marginBottom: 0, position: 'relative', zIndex: 1 }}
      />
    );
  };

  useEffect(() => {
    if (userId) getList();
  }, [userId, filter.branch_id]); // Re-fetch when branch filter changes

  // Fetch user list with summary and sub info
  const getList = async () => {
    setState(pre => ({ ...pre, loading: true }));
    const params = {
      branch_id: filter.branch_id,
      target_business_id: state.selected_business_id
    };
    const res = await request("user", "get", params);
    if (res && !res.error) {
      setState((pre) => ({
        ...pre,
        list: res.list,
        role: res.role,
        branches: res.branches,
        businesses: res.businesses || [],
        summary: res.summary || pre.summary,
        subscription: res.subscription || pre.subscription,
        loading: false
      }));
    } else {
      setState(pre => ({ ...pre, loading: false }));
    }
  };

  const getFilteredUsers = () => {
    let filteredUsers = state.filteredList || state.list;

    if (activeTab === "superAdmins") {
      filteredUsers = filteredUsers.filter(u => u.is_super_admin === 1);
    } else if (activeTab === "admins") {
      filteredUsers = filteredUsers.filter(u => u.is_super_admin === 0 && u.role_name?.toUpperCase().includes('ADMIN'));
    } else if (activeTab === "users") {
      filteredUsers = filteredUsers.filter(u => u.is_super_admin === 0 && !u.role_name?.toUpperCase().includes('ADMIN'));
    }

    return filteredUsers;
  };

  const generateStrongPassword = (e) => {
    e.preventDefault();
    const length = 12;
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const symbols = "@$!%*?&";
    
    let password = "";
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    const allChars = uppercase + lowercase + numbers + symbols;
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    password = password.split('').sort(() => 0.5 - Math.random()).join('');
    
    form.setFieldsValue({
      password: password,
      confirm_password: password
    });
    
    setPasswordVal(password);
    
    navigator.clipboard.writeText(password);
    message.success(lang === 'kh' ? `លេខសម្ងាត់ខ្លាំងត្រូវបានបង្កើត និងចម្លងរួចរាល់៖ ${password}` : `Strong password generated and copied: ${password}`);
  };

  // Function to convert file to base64
  const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // Handle edit user
  const onClickEdit = (item) => {
    setPasswordVal("");
    form.setFieldsValue({
      ...item,
      is_active: item.status === "active" ? 1 : 0,
    });

    setState((pre) => ({
      ...pre,
      visible: true,
    }));

    if (item.profile_image && item.profile_image !== "") {
      const imageProduct = [
        {
          uid: "-1",
          name: item.profile_image,
          status: "done",
          url: Config.getFullImagePath(item.profile_image),
        },
      ];
      setImageDefault(imageProduct);
    } else {
      setImageDefault([]);
    }
  };

  // Handle delete user
  const clickBtnDelete = (item) => {
    Modal.confirm({
      title: t.confirm_delete || "Confirm Deletion",
      content: t.remove_data,
      okText: t.delete,
      cancelText: t.cancel,
      okButtonProps: { danger: true },
      onOk: async () => {
        const res = await request("user", "delete", { id: item.id });
        if (res && !res.error) {
          message.success(t.success);
          getList();
        } else {
          message.error(res.message || t.failed);
        }
      },
    });
  };

  // Modal Controls
  const handleCloseModal = () => {
    setState((pre) => ({ ...pre, visible: false }));
    form.resetFields();
    setImageDefault([]);
    setPasswordVal("");
  };

  const handleOpenModal = () => {
    setState((pre) => ({ ...pre, visible: true }));
    form.resetFields();
    setImageDefault([]);
    setPasswordVal("");
  };

  // Image Utilities
  const beforeUpload = (file) => {
    const isImg = file.type.startsWith('image/');
    if (!isImg) message.error(t.invalid_image_format || 'Format Error: Only image files permitted.');
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) message.error(t.image_size_too_large || 'Size Error: Image must be smaller than 2MB.');
    return isImg && isLt2M;
  };

  const handlePreview = async (file) => {
    if (!file.url && !file.preview) file.preview = await getBase64(file.originFileObj);
    setPreviewImage(file.url || file.preview);
    setPreviewOpen(true);
  };

  const handleChangeImageDefault = ({ fileList: newFileList }) => setImageDefault(newFileList);

  // Search Logic
  const handleSearch = (value) => {
    const filtered = state.list.filter(user =>
      (user.name || "").toLowerCase().includes((value || "").toLowerCase()) ||
      (user.username || "").toLowerCase().includes((value || "").toLowerCase()) ||
      (user.tel || "").includes(value || "")
    );
    setState(prev => ({ ...prev, filteredList: filtered }));
  };

  // Form Submission
  const onFinish = async (items) => {
    const currentUserId = form.getFieldValue("id");
    const isUpdate = !!currentUserId;

    const params = new FormData();
    params.append("name", items.name);
    params.append("username", items.username);
    if (items.password) params.append("password", items.password);
    params.append("role_id", items.role_id);
    params.append("is_super_admin", items.is_super_admin || 0);
    params.append("business_id", items.business_id || profile.business_id); // Allow setting business_id
    params.append("address", items.address);
    params.append("tel", items.tel);
    params.append("branch_id", items.branch_id);
    params.append("is_active", items.is_active || 0);

    if (items.profile_image && items.profile_image.fileList && items.profile_image.fileList[0]) {
      params.append("upload_image", items.profile_image.fileList[0].originFileObj);
    }

    if (isUpdate) params.append("id", currentUserId);

    const res = await request("user", isUpdate ? "put" : "post", params);
    if (res && !res.error) {
      message.success(t.success);
      getList();
      handleCloseModal();
    } else {
      message.error(res.message || t.failed);
    }
  };

  const columns = [
    {
      key: "profile_image",
      title: t.staff_identity,
      dataIndex: "profile_image",
      render: (img) => img ? (
        <Image
          src={Config.getFullImagePath(img)}
          width={45}
          height={45}
          style={{ borderRadius: "10px", objectFit: "cover", border: '1px solid #eee' }}
        />
      ) : <Avatar size={45} icon={<UserOutlined />} style={{ background: '#f5f5f5', color: '#ccc', borderRadius: '10px' }} />
    },
    {
      key: "name",
      title: t.full_name,
      dataIndex: "name",
      render: (text, row) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ color: '#1e4a2d' }}>{text}</Text>
          <Text type="secondary" style={{ fontSize: '11px' }}>{row.username}</Text>
        </Space>
      )
    },
    {
      key: "role",
      title: t.business_role,
      dataIndex: "role_name",
      render: (role, row) => {
        const isSystemSuper = row.business_id === 1 && row.is_super_admin === 1;
        const color = isSystemSuper ? "gold" : (row.role_code === "owner" ? "blue" : "green");
        let label = role;
        if (isSystemSuper) label = t.executives || "Super Admin";
        else if (row.role_code === "owner") label = t.owner || "Owner";

        return (
          <Space>
            <Tag color={color} style={{ borderRadius: '6px', border: 'none' }}>
              {label || t.staff}
            </Tag>
          </Space>
        );
      }
    },
    {
      key: "contact",
      title: t.contact_branch,
      render: (_, row) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: '13px' }}>{row.tel || "N/A"}</Text>
          {profile?.business_id === 1 && row.business_name && (
            <Tag color="orange" style={{ fontSize: '10px', margin: 0, borderRadius: '4px' }}>
              {row.business_name}
            </Tag>
          )}
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {t.branch}: {row.is_super_admin === 1 && !row.branch_id ? "Global Access" : (row.branch_name || t.main_headquarter)}
          </Text>
        </Space>
      )
    },
    {
      key: "status",
      title: t.access_status,
      dataIndex: "status",
      render: (status) => (
        <Badge
          status={status === 'active' ? 'success' : 'error'}
          text={status === 'active' ? t.permitted : t.suspended}
          style={{ fontSize: '12px' }}
        />
      )
    },
    {
      key: "action",
      title: t.management,
      align: "right",
      render: (_, row) => {
        const isPlatformAdmin = profile?.business_id === 1;
        const canEdit = isPlatformAdmin || isOwner || row.id === userId;

        return (
          <Space>
            {canEdit ? (
              <>
                <Button type="text" onClick={() => onClickEdit(row)} style={{ color: '#1e4a2d' }}>{t.edit}</Button>
                {row.id !== userId && (
                  <Button type="text" danger onClick={() => clickBtnDelete(row)}>{t.delete}</Button>
                )}
              </>
            ) : (
              <Text type="secondary" italic>{t.view_only}</Text>
            )}
          </Space>
        );
      }
    }
  ];

  return (
    <div style={{ padding: "0 10px" }}>
      {/* Executive Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ color: '#1e4a2d', margin: 0, display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span>{isSuperAdmin ? (activeTab === 'superAdmins' ? "Platform Super Admins" : "Platform Staff & Access") : (t.staff + " & " + t.management)}</span>
          <Button
            type="text"
            icon={<HelpCircle size={15} style={{ color: "#1e4a2d", marginRight: 4 }} />}
            onClick={() => setShowGuide(!showGuide)}
            style={{
              background: showGuide ? "rgba(30, 74, 45, 0.15)" : "rgba(30, 74, 45, 0.08)",
              color: "#1e4a2d",
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 12,
              display: "inline-flex",
              alignItems: "center",
              height: 32,
            }}
          >
            {showGuide ? "លាក់ការណែនាំ" : "របៀបប្រើប្រាស់"}
          </Button>
        </Title>
        <Text type="secondary">
          {isSuperAdmin
            ? t.branch_management_desc
            : t.staff_management_desc}
        </Text>
      </div>

      {showGuide && (
        <Alert
          message={<strong>💡 របៀបគ្រប់គ្រងបុគ្គលិក និងតួនាទី (Staff & Permissions Guide)</strong>}
          description={
            <div style={{ fontSize: 13, marginTop: 4, color: '#333' }}>
              <p style={{ margin: '3px 0' }}>1. <strong>ចុះឈ្មោះបុគ្គលិក៖</strong> ចុចលើប៊ូតុង <strong>[+ Create New]</strong> ឬ <strong>[បង្កើតថ្មី]</strong> ដើម្បីចុះឈ្មោះគណនីបុគ្គលិកថ្មី និងកំណត់លេខកូដសម្ងាត់ (PIN) សម្រាប់ពួកគេចូលលក់។</p>
              <p style={{ margin: '3px 0' }}>2. <strong>កំណត់សាខា និងតួនាទី៖</strong> បងត្រូវជ្រើសរើសសាខា និងកំណត់តួនាទី (ដូចជា Cashier, Manager) ដើម្បីឱ្យពួកគេមានសិទ្ធិចូលប្រើប្រាស់ប្រព័ន្ធទៅតាមភារកិច្ចជាក់ស្តែង។</p>
              <p style={{ margin: '3px 0' }}>3. <strong>កម្រិតដែនកំណត់៖</strong> ចំនួនបុគ្គលិកដែលអាចបង្កើតបានគឺអាស្រ័យលើកញ្ចប់គម្រោង (Subscription Plan) ដែលបងកំពុងប្រើប្រាស់។</p>
            </div>
          }
          type="info"
          closable
          onClose={() => setShowGuide(false)}
          style={{ borderRadius: 16, marginBottom: 24, border: '1px solid #bae7ff', background: '#e6f7ff' }}
        />
      )}

      <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
        {/* Main Stats */}
        <Col xs={24} lg={18}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {isSuperAdmin && (
              <Card style={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', background: '#f0f7f2' }}>
                <Space direction="vertical" size={0}>
                  <Text type="secondary" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>{t.active_branches}</Text>
                  <Title level={2} style={{ margin: 0, color: '#1e4a2d' }}>{state.summary.total_branches}</Title>
                  <Tag color="green" style={{ borderRadius: '10px' }}>{t.main_headquarter}</Tag>
                </Space>
              </Card>
            )}
            <Card style={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <Space direction="vertical" size={0}>
                <Text type="secondary" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>{t.total_personnel}</Text>
                <Title level={2} style={{ margin: 0, color: '#1e4a2d' }}>{state.summary.total_staff}</Title>
                <Tag color="green" style={{ borderRadius: '10px' }}>+ {state.summary.active_users} {t.active}</Tag>
              </Space>
            </Card>
            {!isSuperAdmin && (
              <Card style={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <Space direction="vertical" size={0}>
                  <Text type="secondary" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>{t.user_role || "Roles"}</Text>
                  <Title level={4} style={{ margin: 0, color: '#c0a060' }}>{state.summary.active_users} {t.active}</Title>
                  <Tag color="gold" style={{ borderRadius: '10px' }}>{isOwner ? "Owner Level" : "Staff Level"}</Tag>
                </Space>
              </Card>
            )}
            <Card style={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <Space direction="vertical" size={0}>
                <Text type="secondary" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>{t.regular_team}</Text>
                <Title level={2} style={{ margin: 0, color: '#1e4a2d' }}>{state.summary.regular_staff}</Title>
                <Tag color="blue" style={{ borderRadius: '10px' }}>{t.staff}</Tag>
              </Space>
            </Card>
          </div>
        </Col>

        {/* Platform Intelligence / Subscription Detail Card */}
        <Col xs={24} lg={6}>
          {profile?.business_id === 1 ? (
            <Card
              className="platform-control-card"
              style={{
                borderRadius: '16px',
                border: 'none',
                height: '100%'
              }}
            >
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: '#00d2ff', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Platform Control</Text>
                  <Badge status="processing" color="#00d2ff" text={<span style={{ color: '#00d2ff', fontSize: '10px' }}>SYSTEM ONLINE</span>} />
                </div>
                <div>
                  <div style={{ fontSize: '12px', opacity: 0.8 }}>TOTAL BUSINESSES</div>
                  <Title level={2} style={{ color: 'white', margin: 0, display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    {state.businesses?.length || 0}
                    <span style={{ fontSize: '14px', fontWeight: 400, opacity: 0.6 }}>Tenants</span>
                  </Title>
                </div>
                <Divider style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <Button
                    size="small"
                    ghost
                    style={{ borderRadius: '6px', fontSize: '10px', borderColor: 'rgba(255,255,255,0.3)' }}
                    onClick={() => window.location.href = '/business'}
                  >
                    Onboard
                  </Button>
                  <Button
                    size="small"
                    ghost
                    style={{ borderRadius: '6px', fontSize: '10px', borderColor: 'rgba(255,255,255,0.3)' }}
                    onClick={() => window.location.href = '/system-modules'}
                  >
                    Registry
                  </Button>
                </div>
              </Space>
            </Card>
          ) : (
            <Card
              className="subscription-info-card"
              style={{
                borderRadius: '16px',
                border: 'none',
                height: '100%'
              }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: '#c0a060', fontWeight: 700 }}>{t.subscription}</Text>
                  <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', color: '#ffffff' }}>
                    {state.subscription.sub_status?.toUpperCase() || t.active}
                  </div>
                </div>
                <Title level={3} style={{ color: '#ffffff', margin: 0 }}>{state.subscription.plan_name}</Title>
                <div style={{ fontSize: '12px', opacity: 0.8, color: 'rgba(255,255,255,0.85)' }}>
                  {t.expires}: {state.subscription.deadline && dayjs(state.subscription.deadline).isValid() ? dayjs(state.subscription.deadline).format("DD MMM YYYY") : t.main_headquarter}
                </div>
                <Divider style={{ borderColor: 'rgba(255,255,255,0.15)', margin: '8px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(255,255,255,0.9)' }}>
                  <span>{t.staff_nodes}:</span>
                  <span>{state.summary.total_staff} / {state.subscription.max_staff || "∞"}</span>
                </div>
              </Space>
            </Card>
          )}
        </Col>
      </Row>

      {/* Action Bar */}
      <Card bodyStyle={{ padding: '12px 20px' }} style={{ borderRadius: '16px', marginBottom: 20, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <Row justify="space-between" align="middle">
          <Col xs={24} lg={8} xl={6}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {isSuperAdmin ? (
                <>
                  <Button
                    type={activeTab === 'all' ? 'primary' : 'text'}
                    onClick={() => setActiveTab('all')}
                    style={activeTab === 'all' ? { background: '#1e4a2d', borderRadius: '12px' } : {}}
                  >
                    Platform Team
                  </Button>
                  <Button
                    type={activeTab === 'superAdmins' ? 'primary' : 'text'}
                    onClick={() => setActiveTab('superAdmins')}
                    style={activeTab === 'superAdmins' ? { background: '#1e4a2d', borderRadius: '12px' } : {}}
                  >
                    Super Admin
                  </Button>
                  <Button
                    type={activeTab === 'admins' ? 'primary' : 'text'}
                    onClick={() => setActiveTab('admins')}
                    style={activeTab === 'admins' ? { background: '#1e4a2d', borderRadius: '12px' } : {}}
                  >
                    {t.admins}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type={activeTab === 'all' ? 'primary' : 'text'}
                    onClick={() => setActiveTab('all')}
                    style={activeTab === 'all' ? { background: '#1e4a2d', borderRadius: '12px' } : {}}
                  >
                    {lang === 'kh' ? 'ទាំងអស់' : 'All'}
                  </Button>
                  <Button
                    type={activeTab === 'admins' ? 'primary' : 'text'}
                    onClick={() => setActiveTab('admins')}
                    style={activeTab === 'admins' ? { background: '#1e4a2d', borderRadius: '12px' } : {}}
                  >
                    {t.admins}
                  </Button>
                  <Button
                    type={activeTab === 'users' ? 'primary' : 'text'}
                    onClick={() => setActiveTab('users')}
                    style={activeTab === 'users' ? { background: '#1e4a2d', borderRadius: '12px' } : {}}
                  >
                    {lang === 'kh' ? 'បុគ្គលិកទូទៅ' : 'General Staff'}
                  </Button>
                </>
              )}
            </div>
          </Col>
          <Col xs={24} lg={16} xl={18} style={{ textAlign: 'right', marginTop: '10px' }}>
            <Space wrap style={{ width: '100%', justifyContent: 'flex-end' }}>
              {profile?.business_id === 1 && (
                <Select
                  placeholder="Select Business"
                  allowClear
                  style={{ width: 220 }}
                  value={state.selected_business_id}
                  onChange={(v) => {
                    setState(p => ({ ...p, selected_business_id: v }));
                    // Trigger getList after state update
                    setTimeout(() => getList(), 0);
                  }}
                  options={state.businesses.map(b => ({ label: b.name, value: b.id }))}
                />
              )}
              <Select
                placeholder={t.all_branches || "All Branches"}
                allowClear
                style={{ width: 180 }}
                value={filter.branch_id || undefined}
                onChange={(v) => setFilter(p => ({ ...p, branch_id: v }))}
                options={[{ label: t.all_branches || "All Branches", value: "" }, ...state.branches]}
              />
              <Input.Search
                placeholder={t.search}
                onSearch={handleSearch}
                style={{ width: 250 }}
                className="premium-search"
              />
              {(() => {
                const isLimitReached = profile?.business_id !== 1 && state.subscription.max_staff && state.summary.total_staff >= state.subscription.max_staff;
                return (isOwner || profile?.business_id === 1) && (
                  <Button
                    type="primary"
                    icon={<MdOutlineCreateNewFolder />}
                    onClick={() => {
                      if (isLimitReached) {
                        const redirectPath = profile?.business_id === 1 ? '/plans' : '/my-plan';
                        Swal.fire({
                          html: `
                            <div style="display: flex; align-items: flex-start; gap: 16px; text-align: left; font-family: inherit;">
                                <!-- Left Warning Icon -->
                                <div style="background: #f59e0b; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px;">
                                    <span style="color: #ffffff; font-size: 18px; font-weight: bold; font-family: inherit; line-height: 1;">!</span>
                                </div>
                                <!-- Right Content -->
                                <div style="flex: 1;">
                                    <h3 style="margin: 0 0 6px 0; font-family: inherit; font-size: 18px; font-weight: bold; color: #111827; display: flex; align-items: center; gap: 8px;">
                                        💎 ${lang === 'kh' ? 'តម្រូវឱ្យមានគម្រោង Pro' : 'Pro Feature Required'}
                                    </h3>
                                    <p style="margin: 0; font-family: inherit; font-size: 14px; color: #4b5563; line-height: 1.5;">
                                        ${lang === 'kh' 
                                            ? `គណនីរបស់អ្នកបានឈានដល់ដែនកំណត់ចំនួនបុគ្គលិក (${state.summary.total_staff}/${state.subscription.max_staff}) ហើយ។ សូមធ្វើការដំឡើងគម្រោងសេវាកម្មដើម្បីបន្ថែមបុគ្គលិកបានកាន់តែច្រើន!` 
                                            : `You have reached your staff limit (${state.summary.total_staff}/${state.subscription.max_staff}). Please upgrade your plan to add more staff.`}
                                    </p>
                                </div>
                            </div>
                          `,
                          showCancelButton: true,
                          confirmButtonText: lang === 'kh' ? 'Upgrade ឥឡូវនេះ' : 'Upgrade Now',
                          cancelButtonText: lang === 'kh' ? 'បន្តិចទៀត' : 'Later',
                          reverseButtons: true,
                          buttonsStyling: false,
                          customClass: {
                              popup: 'rounded-2xl',
                          },
                          didOpen: () => {
                              const popup = Swal.getPopup();
                              if (popup) {
                                  popup.style.width = '480px';
                                  popup.style.padding = '24px';
                                  popup.style.borderRadius = '20px';
                              }

                              const actions = Swal.getActions();
                              if (actions) {
                                  actions.style.display = 'flex';
                                  actions.style.justifyContent = 'flex-end';
                                  actions.style.gap = '16px';
                                  actions.style.marginTop = '16px';
                                  actions.style.width = '100%';
                              }

                              const confirmBtn = Swal.getConfirmButton();
                              const cancelBtn = Swal.getCancelButton();
                              if (confirmBtn) {
                                  confirmBtn.style.padding = '8px 20px';
                                  confirmBtn.style.borderRadius = '30px';
                                  confirmBtn.style.backgroundColor = '#1e4a2d';
                                  confirmBtn.style.color = '#ffffff';
                                  confirmBtn.style.border = '2px solid #1e4a2d';
                                  confirmBtn.style.fontWeight = 'bold';
                                  confirmBtn.style.fontSize = '14px';
                                  confirmBtn.style.cursor = 'pointer';
                                  confirmBtn.style.display = 'inline-flex';
                                  confirmBtn.style.alignItems = 'center';
                                  confirmBtn.style.height = '40px';
                              }
                              if (cancelBtn) {
                                  cancelBtn.style.padding = '8px 20px';
                                  cancelBtn.style.borderRadius = '30px';
                                  cancelBtn.style.backgroundColor = '#ffffff';
                                  cancelBtn.style.color = '#111827';
                                  cancelBtn.style.border = '1.5px solid #d1d5db';
                                  cancelBtn.style.fontWeight = 'bold';
                                  cancelBtn.style.fontSize = '14px';
                                  cancelBtn.style.cursor = 'pointer';
                                  cancelBtn.style.display = 'inline-flex';
                                  cancelBtn.style.alignItems = 'center';
                                  cancelBtn.style.height = '40px';
                              }
                          }
                        }).then((result) => {
                          if (result.isConfirmed) {
                              window.location.href = redirectPath;
                          }
                        });
                        return;
                      }
                      handleOpenModal();
                    }}
                    style={{ background: '#1e4a2d', borderColor: '#1e4a2d', borderRadius: '12px', height: '40px' }}
                  >
                    + {profile?.business_id === 1 ? "Add Platform User" : t.add_new}
                  </Button>
                );
              })()}
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Table Interface */}
      <Card style={{ borderRadius: '24px', border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.05)' }}>
        <Table
          rowClassName={() => "pos-row"}
          dataSource={getFilteredUsers()}
          columns={columns}
          loading={state.loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} ${t.staff}`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Form and Preview Modals remain exactly as they were code-wise */}
      <Modal
        open={previewOpen}
        title={t.view_details}
        footer={null}
        onCancel={() => setPreviewOpen(false)}
      >
        <img alt="Identity" style={{ width: "100%", borderRadius: '12px' }} src={previewImage} />
      </Modal>
      <Modal
        open={state.visible}
        onCancel={handleCloseModal}
        centered
        width={800}
        footer={null}
        title={
          <Title level={4} style={{ margin: 0, color: '#1e4a2d' }}>
            {form.getFieldValue("id") ? t.update_staff : t.add_new}
          </Title>
        }
      >
        <Form layout="vertical" form={form} onFinish={onFinish}>
          <Row justify="center" align="middle" style={{ marginBottom: '24px' }}>
            <Col>
              <Form.Item
                name="profile_image"
                style={{ margin: 0 }}
                label={<div style={{ textAlign: "center", width: "100%", fontWeight: 600 }}>{t.image}</div>}
              >
                <Upload
                  name="profile_image"
                  customRequest={({ file, onSuccess }) => {
                    onSuccess();
                  }}
                  maxCount={1}
                  listType="picture-card"
                  fileList={imageDefault}
                  onPreview={handlePreview}
                  onChange={handleChangeImageDefault}
                  beforeUpload={beforeUpload}
                  accept="image/*"
                >
                  {imageDefault.length >= 1 ? null : (
                    <div>
                      <UserOutlined style={{ fontSize: 40, color: "#aaa" }} />
                      <div style={{ marginTop: 8 }}>{t.upload}</div>
                    </div>
                  )}
                </Upload>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[32, 16]}>
            {/* Left Column */}
            <Col xs={24} md={12}>
              {/* Name */}
              <Form.Item
                name="name"
                label={<Text strong>{t.full_name}</Text>}
                rules={[{ required: true, message: t.full_name + " " + t.required }]}
              >
                <Input placeholder={t.full_name} size="large" />
              </Form.Item>

              {/* Username (Email) */}
              <Form.Item
                name="username"
                label={<Text strong>{t.email}</Text>}
                rules={[{ required: true, message: t.email + " " + t.required }]}
              >
                <Input
                  placeholder={t.email}
                  size="large"
                  disabled={form.getFieldValue("id") && !isSuperAdmin}
                  style={{ background: (form.getFieldValue("id") && !isSuperAdmin) ? "#f5f5f5" : "#fff" }}
                />
              </Form.Item>

              {/* Tel */}
              <Form.Item
                name="tel"
                label={<Text strong>{t.tel}</Text>}
                rules={[{ required: true, message: t.tel + " " + t.required }]}
              >
                <Input placeholder={t.tel} size="large" />
              </Form.Item>

              {/* Address */}
              <Form.Item
                name="address"
                label={<Text strong>{t.address}</Text>}
                rules={[{ required: true, message: t.address + " " + t.required }]}
              >
                <Input placeholder={t.address} size="large" />
              </Form.Item>

              {/* Status */}
              <Form.Item
                name="is_active"
                label={<Text strong>{t.status}</Text>}
                rules={[{ required: true, message: t.status + " " + t.required }]}
              >
                <Select
                  placeholder={t.status}
                  size="large"
                  options={[
                    { label: t.active, value: 1 },
                    { label: t.inactive, value: 0 },
                  ]}
                />
              </Form.Item>
            </Col>

            {/* Right Column */}
            <Col xs={24} md={12}>
              {/* Role */}
              <Form.Item
                name="role_id"
                label={<Text strong>{t.user_role}</Text>}
                rules={[{ required: true, message: t.user_role + " " + t.required }]}
              >
                <Select placeholder={t.user_role} size="large" options={state?.role} />
              </Form.Item>

              {profile?.business_id === 1 && (
                <Form.Item
                  name="business_id"
                  label={<Text strong>{t.business_label || "Business"}</Text>}
                  rules={[{ required: true }]}
                >
                  <Select
                    placeholder="Select Business"
                    size="large"
                    options={state.businesses.map(b => ({ label: b.name, value: b.id }))}
                    onChange={async (biz_id) => {
                      // Refresh roles and branches for the selected business
                      const res = await request("user", "get", { target_business_id: biz_id });
                      if (res && !res.error) {
                        setState(p => ({ ...p, role: res.role, branches: res.branches }));
                      }
                    }}
                  />
                </Form.Item>
              )}

              {/* Branch */}
              <Form.Item
                name="branch_id"
                label={<Text strong>{t.branch}</Text>}
                rules={[
                  {
                    required: form.getFieldValue("is_super_admin") !== 1,
                    message: t.branch + " " + t.required
                  }
                ]}
              >
                <Select
                  placeholder={t.branch}
                  size="large"
                  options={state?.branches}
                  allowClear={form.getFieldValue("is_super_admin") === 1}
                />
              </Form.Item>

              {profile?.business_id === 1 && (
                <Form.Item
                  name="is_super_admin"
                  label={<Text strong>System Role</Text>}
                >
                  <Select
                    placeholder="Select System Level"
                    size="large"
                    options={[
                      { label: "Normal Staff", value: 0 },
                      { label: "Super Admin", value: 1 }
                    ]}
                  />
                </Form.Item>
              )}

              {/* Password */}
              <Form.Item
                name="password"
                label={
                  <span style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <Text strong style={{ margin: 0 }}>{t.password}</Text>
                    <a onClick={generateStrongPassword} style={{ fontSize: '11px', color: '#1e4a2d', fontWeight: '500', marginLeft: '12px', textDecoration: 'underline' }}>
                      {lang === 'kh' ? 'បង្កើតស្វ័យប្រវត្ត' : 'Auto Generate'}
                    </a>
                  </span>
                }
                rules={form.getFieldValue("id") ? [] : [{ required: true, message: t.password + " " + t.required }]}
                style={{ marginBottom: passwordVal ? 12 : 24 }}
              >
                <Input.Password
                  placeholder={t.password}
                  size="large"
                  value={passwordVal}
                  onChange={(e) => setPasswordVal(e.target.value)}
                />
                {renderPasswordStrength()}
              </Form.Item>

              {/* Confirm Password */}
              <Form.Item
                name="confirm_password"
                label={<Text strong>{t.confirm_password}</Text>}
                dependencies={["password"]}
                rules={form.getFieldValue("id") ? [] : [
                  { required: true, message: t.confirm_password + " " + t.required },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("password") === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error(t.password_not_match || "Passwords do not match!"));
                    },
                  }),
                ]}
              >
                <Input.Password placeholder={t.confirm_password} size="large" />
              </Form.Item>
            </Col>
          </Row>

          {/* Form Footer */}
          <Divider style={{ margin: '16px 0' }} />
          <div style={{ textAlign: "right" }}>
            <Space>
              <Button onClick={handleCloseModal} size="large" style={{ borderRadius: '8px' }}>{t.cancel}</Button>
              <Button type="primary" htmlType="submit" size="large" style={{ background: '#1e4a2d', borderColor: '#1e4a2d', borderRadius: '8px' }}>
                {form.getFieldValue("id") ? t.update : t.save}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
}

export default UserPage;