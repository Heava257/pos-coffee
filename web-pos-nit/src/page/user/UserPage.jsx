import React, { useEffect, useState } from "react";
import { formatDateServer, request } from "../../util/helper";
import { getProfile } from "../../store/profile.store";
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
} from "antd";
const { Title, Text } = Typography;
import { configStore } from "../../store/configStore";
import { MdOutlineCreateNewFolder } from "react-icons/md";
import { UploadOutlined, UserOutlined } from "@ant-design/icons";
import { Config } from "../../util/config";
import { IoEyeOutline } from "react-icons/io5";
import imageExtensions from 'image-extensions';
import dayjs from "dayjs";

const { TabPane } = Tabs;

function UserPage() {
  const profile = getProfile();
  const isSuperAdmin = profile?.is_super_admin === 1;
  const isOwner = profile?.role_name?.toUpperCase() === "OWNER" || profile?.role_code === "owner";
  const isAdmin = profile?.role_name?.toUpperCase().includes("ADMIN");

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [imageDefault, setImageDefault] = useState([]);
  const [form] = Form.useForm();
  const { config } = configStore();
  const [activeTab, setActiveTab] = useState("all"); // Add active tab state
  const [filter, setFilter] = useState({
    txt_search: "",
    category_id: "",
    brand: "",
  });
  const [state, setState] = useState({
    list: [],
    role: [],
    branches: [],
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
    filteredList: null
  });

  useEffect(() => {
    getList();
  }, []);

  // Fetch user list with summary and sub info
  const getList = async () => {
    setState(pre => ({ ...pre, loading: true }));
    const res = await request("user", "get");
    if (res && !res.error) {
      setState((pre) => ({
        ...pre,
        list: res.list,
        role: res.role,
        branches: res.branches,
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
    form.setFieldsValue({
      ...item,
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
      title: "Confirm Deletion",
      content: "This action will permanently remove this employee from your business database. Continue?",
      okText: "Yes, Delete",
      cancelText: "Cancel",
      okButtonProps: { danger: true },
      onOk: async () => {
        const res = await request("user", "delete", { id: item.id });
        if (res && !res.error) {
          message.success("Operational Success: Employee record purged.");
          getList();
        } else {
          message.error(res.message || "Constraint Error: Record is linked to active business data.");
        }
      },
    });
  };

  // Modal Controls
  const handleCloseModal = () => {
    setState((pre) => ({ ...pre, visible: false }));
    form.resetFields();
    setImageDefault([]);
  };

  const handleOpenModal = () => {
    setState((pre) => ({ ...pre, visible: true }));
    form.resetFields();
    setImageDefault([]);
  };

  // Image Utilities
  const beforeUpload = (file) => {
    const isImg = file.type.startsWith('image/');
    if (!isImg) message.error('Format Error: Only image files permitted.');
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) message.error('Size Error: Image must be smaller than 2MB.');
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
      user.name.toLowerCase().includes(value.toLowerCase()) ||
      user.username.toLowerCase().includes(value.toLowerCase()) ||
      user.tel?.includes(value)
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
      message.success(res.message);
      getList();
      handleCloseModal();
    } else {
      message.error(res.message || "Operational Error");
    }
  };

  const columns = [
    {
      key: "profile_image",
      title: "Staff Identity",
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
      title: "Full Name",
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
      title: "Business Role",
      dataIndex: "role_name",
      render: (role, row) => (
        <Space>
          <Tag color={row.is_super_admin ? "gold" : "green"} style={{ borderRadius: '6px', border: 'none' }}>
            {row.is_super_admin ? "EXECUTIVE" : role || "STAFF"}
          </Tag>
        </Space>
      )
    },
    {
      key: "contact",
      title: "Contact / Branch",
      render: (_, row) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: '13px' }}>{row.tel || "No Tel"}</Text>
          <Text type="secondary" style={{ fontSize: '11px' }}>Store: {row.branch_name || "Headquarters"}</Text>
        </Space>
      )
    },
    {
      key: "status",
      title: "Access Status",
      dataIndex: "status",
      render: (status) => (
        <Badge
          status={status === 'active' ? 'success' : 'error'}
          text={status === 'active' ? "Permitted" : "Suspended"}
          style={{ fontSize: '12px' }}
        />
      )
    },
    {
      key: "action",
      title: "Management",
      align: "right",
      render: (_, row) => (
        <Space>
          {(isOwner || !isSuperAdmin) && (
            <>
              <Button type="text" onClick={() => onClickEdit(row)} style={{ color: '#1e4a2d' }}>Edit</Button>
              <Button type="text" danger onClick={() => clickBtnDelete(row)}>Purge</Button>
            </>
          )}
          {isSuperAdmin && !isOwner && <Text type="secondary" italic>View Only</Text>}
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: "0 10px" }}>
      {/* Executive Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ color: '#1e4a2d', margin: 0 }}>
          {isSuperAdmin ? "Branch & Access Control" : "Staff & Identity Management"}
        </Title>
        <Text type="secondary">
          {isSuperAdmin
            ? "Global control center for multi-branch operations and executive oversight."
            : "Manage your business team, roles, and administrative access."}
        </Text>
      </div>

      <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
        {/* Main Stats */}
        <Col xs={24} lg={18}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {isSuperAdmin && (
              <Card style={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', background: '#f0f7f2' }}>
                <Space direction="vertical" size={0}>
                  <Text type="secondary" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Active Branches</Text>
                  <Title level={2} style={{ margin: 0, color: '#1e4a2d' }}>{state.summary.total_branches}</Title>
                  <Tag color="green" style={{ borderRadius: '10px' }}>Global Network</Tag>
                </Space>
              </Card>
            )}
            <Card style={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <Space direction="vertical" size={0}>
                <Text type="secondary" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Total Personnel</Text>
                <Title level={2} style={{ margin: 0, color: '#1e4a2d' }}>{state.summary.total_staff}</Title>
                <Tag color="green" style={{ borderRadius: '10px' }}>+ {state.summary.active_users} Online</Tag>
              </Space>
            </Card>
            {!isSuperAdmin && (
              <Card style={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <Space direction="vertical" size={0}>
                  <Text type="secondary" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Super Admins</Text>
                  <Title level={2} style={{ margin: 0, color: '#c0a060' }}>{state.summary.super_admins}</Title>
                  <Tag color="gold" style={{ borderRadius: '10px' }}>Executives</Tag>
                </Space>
              </Card>
            )}
            <Card style={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <Space direction="vertical" size={0}>
                <Text type="secondary" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Regular Team</Text>
                <Title level={2} style={{ margin: 0, color: '#1e4a2d' }}>{state.summary.regular_staff}</Title>
                <Tag color="blue" style={{ borderRadius: '10px' }}>Operation Staff</Tag>
              </Space>
            </Card>
          </div>
        </Col>

        {/* Subscription Detail Card */}
        <Col xs={24} lg={6}>
          <Card
            style={{
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #1e4a2d 0%, #2d6a3e 100%)',
              color: 'white',
              border: 'none',
              height: '100%'
            }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: '#c0a060', fontWeight: 700 }}>SUBSCRIPTION</Text>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '10px', fontSize: '10px' }}>
                  {state.subscription.sub_status?.toUpperCase() || "ACTIVE"}
                </div>
              </div>
              <Title level={3} style={{ color: 'white', margin: 0 }}>{state.subscription.plan_name}</Title>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>
                Expires: {state.subscription.deadline && dayjs(state.subscription.deadline).isValid() ? dayjs(state.subscription.deadline).format("DD MMM YYYY") : "Lifetime"}
              </div>
              <Divider style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '8px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span>Staff Nodes:</span>
                <span>{state.summary.total_staff} / {state.subscription.max_staff || "∞"}</span>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Action Bar */}
      <Card bodyStyle={{ padding: '12px 20px' }} style={{ borderRadius: '16px', marginBottom: 20, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <Row justify="space-between" align="middle">
          <Col xs={24} md={12}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                type={activeTab === 'all' ? 'primary' : 'text'}
                onClick={() => setActiveTab('all')}
                style={activeTab === 'all' ? { background: '#1e4a2d', borderRadius: '12px' } : {}}
              >
                All Staff
              </Button>
              <Button
                type={activeTab === 'superAdmins' ? 'primary' : 'text'}
                onClick={() => setActiveTab('superAdmins')}
                style={activeTab === 'superAdmins' ? { background: '#1e4a2d', borderRadius: '12px' } : {}}
              >
                Executives
              </Button>
              <Button
                type={activeTab === 'admins' ? 'primary' : 'text'}
                onClick={() => setActiveTab('admins')}
                style={activeTab === 'admins' ? { background: '#1e4a2d', borderRadius: '12px' } : {}}
              >
                Admins
              </Button>
            </div>
          </Col>
          <Col xs={24} md={12} style={{ textAlign: 'right', marginTop: '10px' }}>
            <Space>
              <Input.Search
                placeholder="Lookup by name/id..."
                onSearch={handleSearch}
                style={{ width: 250 }}
                className="premium-search"
              />
              {(isOwner || !isSuperAdmin) && (
                <Tooltip title={state.subscription.max_staff && state.summary.total_staff >= state.subscription.max_staff ? "Staff limit reached for your plan" : ""}>
                  <Button
                    type="primary"
                    disabled={state.subscription.max_staff && state.summary.total_staff >= state.subscription.max_staff}
                    icon={<MdOutlineCreateNewFolder />}
                    onClick={handleOpenModal}
                    style={{ background: '#1e4a2d', borderColor: '#1e4a2d', borderRadius: '12px', height: '40px' }}
                  >
                    + New Staff Member
                  </Button>
                </Tooltip>
              )}
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
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} employees`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Form and Preview Modals remain exactly as they were code-wise */}
      <Modal
        open={previewOpen}
        title="Identity Verification Preview"
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
            {form.getFieldValue("id") ? "កែប្រែអ្នកប្រើប្រាស់ / Update Staff" : "បញ្ចូលអ្នកប្រើប្រាស់ថ្មី / New Staff"}
          </Title>
        }
      >
        <Form layout="vertical" form={form} onFinish={onFinish}>
          <Row justify="center" align="middle" style={{ marginBottom: '24px' }}>
            <Col>
              <Form.Item
                name="profile_image"
                style={{ margin: 0 }}
                label={<div style={{ textAlign: "center", width: "100%", fontWeight: 600 }}>រូបភាព / Profile Image</div>}
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
                      <div style={{ marginTop: 8 }}>Upload</div>
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
                label={<Text strong>ឈ្មោះ / Name</Text>}
                rules={[{ required: true, message: "Please fill in name" }]}
              >
                <Input placeholder="Enter full name" size="large" />
              </Form.Item>

              {/* Username (Email) */}
              <Form.Item
                name="username"
                label={<Text strong>អ៊ីម៉ែល / Email</Text>}
                rules={[{ required: true, message: "Please fill in email" }]}
              >
                <Input placeholder="Enter username or email" size="large" />
              </Form.Item>

              {/* Tel */}
              <Form.Item
                name="tel"
                label={<Text strong>លេខទូរស័ព្ទ / Tel</Text>}
                rules={[{ required: true, message: "Please fill in Tel" }]}
              >
                <Input placeholder="Enter phone number" size="large" />
              </Form.Item>

              {/* Address */}
              <Form.Item
                name="address"
                label={<Text strong>អាសយដ្ឋាន / Address</Text>}
                rules={[{ required: true, message: "Please fill in Address" }]}
              >
                <Input placeholder="Enter address" size="large" />
              </Form.Item>

              {/* Status */}
              <Form.Item
                name="is_active"
                label={<Text strong>ស្ថានភាព / Status</Text>}
                rules={[{ required: true, message: "Please select status" }]}
              >
                <Select
                  placeholder="Select Status"
                  size="large"
                  options={[
                    { label: "Active / សកម្ម", value: 1 },
                    { label: "InActive / ផ្អាក", value: 0 },
                  ]}
                />
              </Form.Item>
            </Col>

            {/* Right Column */}
            <Col xs={24} md={12}>
              {/* Role */}
              <Form.Item
                name="role_id"
                label={<Text strong>តួនាទី / Role</Text>}
                rules={[{ required: true, message: "Please select role" }]}
              >
                <Select placeholder="Select Role" size="large" options={state?.role} />
              </Form.Item>

              {/* Branch */}
              <Form.Item
                name="branch_id"
                label={<Text strong>សាខា / Branch</Text>}
                rules={[{ required: true, message: "Please select Branch" }]}
              >
                <Select placeholder="Select Branch" size="large" options={state?.branches} />
              </Form.Item>

              <Form.Item
                name="is_super_admin"
                label={<Text strong>អ្នកគ្រប់គ្រងជាន់ខ្ពស់ / Super Admin</Text>}
              >
                <Select
                  placeholder="Is Super Admin?"
                  size="large"
                  options={[
                    { label: "No / ទេ", value: 0 },
                    { label: "Yes / បាទ/ចាស់", value: 1 }
                  ]}
                />
              </Form.Item>

              {/* Password */}
              <Form.Item
                name="password"
                label={<Text strong>ពាក្យសម្ងាត់ / Password</Text>}
                rules={form.getFieldValue("id") ? [] : [{ required: true, message: "Please fill in password" }]}
              >
                <Input.Password placeholder="Enter password" size="large" />
              </Form.Item>

              {/* Confirm Password */}
              <Form.Item
                name="confirm_password"
                label={<Text strong>បញ្ជាក់ពាក្យសម្ងាត់ / Confirm Password</Text>}
                dependencies={["password"]}
                rules={form.getFieldValue("id") ? [] : [
                  { required: true, message: "Please confirm password" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("password") === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error("Passwords do not match!"));
                    },
                  }),
                ]}
              >
                <Input.Password placeholder="Confirm password" size="large" />
              </Form.Item>
            </Col>
          </Row>

          {/* Form Footer */}
          <Divider style={{ margin: '16px 0' }} />
          <div style={{ textAlign: "right" }}>
            <Space>
              <Button onClick={handleCloseModal} size="large" style={{ borderRadius: '8px' }}>Cancel / បោះបង់</Button>
              <Button type="primary" htmlType="submit" size="large" style={{ background: '#1e4a2d', borderColor: '#1e4a2d', borderRadius: '8px' }}>
                {form.getFieldValue("id") ? "Update Account" : "Register Staff / រក្សាទុក"}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
}

export default UserPage;