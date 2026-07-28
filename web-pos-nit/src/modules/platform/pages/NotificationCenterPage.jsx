import React, { useState, useEffect } from "react";
import { Card, Table, Tag, Button, Space, Typography, Modal, Input, Switch, message, Spin, Alert, Form, Row, Col, Divider, Select, List, Badge, Radio } from "antd";
import {
  BellOutlined,
  MailOutlined,
  MessageOutlined,
  ThunderboltOutlined,
  SettingOutlined,
  SendOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  WifiOutlined,
  LockOutlined,
  MobileOutlined,
  BulbOutlined,
  InfoCircleOutlined,
  ReloadOutlined
} from "@ant-design/icons";
import { request } from "@/shared/utils/helper";
import dayjs from "dayjs";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const NotificationCenterPage = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("announcements");
  
  // System Configurations State
  const [systemForm] = Form.useForm();
  const [sysLoading, setSysLoading] = useState(false);
  
  // Broadcast/Notifications List State
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [createForm] = Form.useForm();

  // Test states
  const [testingTelegram, setTestingTelegram] = useState(false);

  const fetchSystemSettings = async () => {
    setLoading(true);
    try {
      const res = await request("system-settings", "get");
      if (res && res.success) {
        const cleaned = {};
        Object.keys(res.settings).forEach(key => {
          const v = res.settings[key];
          cleaned[key] = (v === "null" || v === "undefined") ? "" : v;
        });
        
        // Convert maintenance_active string to boolean for the switch
        cleaned.maintenance_active = cleaned.maintenance_active === "true";
        
        systemForm.setFieldsValue(cleaned);
      }
    } catch (err) {
      console.error("Failed to load notification system settings:", err);
      message.error("Failed to load configurations.");
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    setNotifLoading(true);
    try {
      const res = await request("notifications", "get");
      if (res && res.list) {
        // Filter out business-specific alerts (e.g. DATEDIFF) to only show broadcasts/system announcements
        const systemNotifs = res.list.filter(n => n.business_id === null || n.type === "system");
        setNotifications(systemNotifs);
      }
    } catch (err) {
      console.error("Failed to load announcements:", err);
    } finally {
      setNotifLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemSettings();
    fetchNotifications();
  }, []);

  const handleSaveSystemSettings = async (values) => {
    setSysLoading(true);
    try {
      const payload = { ...values };
      // Convert boolean to string for database consistency
      payload.maintenance_active = values.maintenance_active ? "true" : "false";

      const formData = new FormData();
      Object.keys(payload).forEach(key => {
        if (payload[key] !== undefined) {
          formData.append(key, payload[key]);
        }
      });

      const res = await request("system-settings", "put", formData);
      if (res && res.success) {
        message.success("System configurations updated successfully!");
        fetchSystemSettings();
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to save settings.");
    } finally {
      setSysLoading(false);
    }
  };

  const handleSendBroadcast = async (values) => {
    setNotifLoading(true);
    try {
      const res = await request("notifications", "post", {
        title: values.title,
        message: values.message,
        type: values.type,
        target_business_id: "all" // Global broadcast to all tenants
      });
      if (res && res.success && res.notification) {
        message.success("Broadcast announcement sent to all active businesses!");
        createForm.resetFields();
        setNotifications(prev => [res.notification, ...prev]);
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to send broadcast.");
    } finally {
      setNotifLoading(false);
    }
  };

  const handleDeleteNotification = async (id) => {
    Modal.confirm({
      title: "Revoke Announcement?",
      content: "This will delete this broadcast notification from all tenants' notification drawers. This action is irreversible.",
      okText: "Revoke",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        setNotifLoading(true);
        try {
          const res = await request(`notifications/${id}`, "delete");
          if (res && res.success) {
            message.success("Announcement revoked successfully.");
            setNotifications(prev => prev.filter(item => item.id !== id));
          }
        } catch (err) {
          console.error(err);
          message.error("Failed to delete announcement.");
        } finally {
          setNotifLoading(false);
        }
      }
    });
  };

  const handleTestTelegram = async () => {
    const token = systemForm.getFieldValue("telegram_bot_token");
    const chatId = systemForm.getFieldValue("telegram_chat_id");
    
    if (!token || !chatId) {
      return message.error("Please enter both Bot Token and Chat ID to run a connection handshake.");
    }

    setTestingTelegram(true);
    try {
      const res = await request("system-settings/test-telegram", "post", {
        telegram_token: token,
        telegram_chat_id: chatId,
        test_message: "🔔 <b>Notification Center Connection Test</b>\nHandshake completed! Platform notifications are now online."
      });
      if (res && res.success) {
        message.success("Test message dispatched successfully to Telegram channel!");
      }
    } catch (err) {
      console.error(err);
      message.error("Connection handshake failed. Verify credentials.");
    } finally {
      setTestingTelegram(false);
    }
  };

  const broadcastColumns = [
    {
      title: "Date",
      dataIndex: "created_at",
      key: "created_at",
      render: (t) => dayjs(t).format("YYYY-MM-DD HH:mm A"),
      width: 170
    },
    {
      title: "Title / Announcement",
      key: "title",
      render: (_, r) => (
        <Space direction="vertical" size={2}>
          <Text strong style={{ color: "#1e4a2d" }}>{r.title}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{r.message}</Text>
        </Space>
      )
    },
    {
      title: "Severity",
      dataIndex: "type",
      key: "type",
      render: (type) => {
        let color = "blue";
        if (type === "warning") color = "orange";
        if (type === "danger" || type === "error") color = "red";
        if (type === "success") color = "green";
        return <Tag color={color} style={{ borderRadius: 4 }}>{type?.toUpperCase() || "SYSTEM"}</Tag>;
      },
      width: 120
    },
    {
      title: "Audience",
      dataIndex: "business_id",
      key: "business_id",
      render: (id) => <Tag color="cyan">ALL TENANTS</Tag>,
      width: 130
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, r) => (
        <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteNotification(r.id)}>Revoke</Button>
      ),
      width: 110
    }
  ];

  return (
    <div style={{ padding: "20px 0" }}>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <Title level={3} style={{ color: "#1e4a2d", margin: 0 }}>
            <BellOutlined style={{ marginRight: 8 }} /> Notification Center
          </Title>
          <Paragraph style={{ color: "#666", marginTop: 4, marginBottom: 0 }}>
            Configure global SMTP, SMS, Firebase push, Telegram alerts, and broadcast system announcements to all active businesses.
          </Paragraph>
        </div>
        <Button icon={<ReloadOutlined />} onClick={() => { fetchSystemSettings(); fetchNotifications(); }} loading={loading}>
          Sync Configurations
        </Button>
      </div>

      <Spin spinning={loading}>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
          
          {/* Side Menu Tab Selector */}
          <Card bordered={false} className="shadow-sm" style={{ width: 280, borderRadius: 12, padding: "8px 0" }}>
            <List
              size="small"
              dataSource={[
                { key: "announcements", label: "Broadcast Announcement", icon: <BellOutlined /> },
                { key: "maintenance", label: "Maintenance Scheduler", icon: <ExclamationCircleOutlined /> },
                { key: "email", label: "Email (SMTP) Gateway", icon: <MailOutlined /> },
                { key: "sms", label: "SMS Gateway", icon: <MobileOutlined /> },
                { key: "push", label: "Push Notification (FCM)", icon: <WifiOutlined /> },
                { key: "telegram", label: "Telegram Alerts", icon: <SendOutlined /> },
              ]}
              renderItem={item => (
                <List.Item
                  onClick={() => setActiveTab(item.key)}
                  style={{
                    cursor: "pointer",
                    padding: "12px 20px",
                    background: activeTab === item.key ? "rgba(45, 106, 66, 0.08)" : "transparent",
                    color: activeTab === item.key ? "#1e4a2d" : "#475569",
                    fontWeight: activeTab === item.key ? 700 : 500,
                    borderLeft: activeTab === item.key ? "4px solid #2d6a42" : "4px solid transparent",
                    borderBottom: "none"
                  }}
                >
                  <Space>
                    {item.icon}
                    <span>{item.label}</span>
                  </Space>
                </List.Item>
              )}
            />
          </Card>

          {/* Configuration Form Card */}
          <div style={{ flex: 1, minWidth: 320 }}>
            
            {activeTab === "announcements" && (
              <Space direction="vertical" size={24} style={{ width: "100%" }}>
                <Card 
                  bordered={false} 
                  className="shadow-sm" 
                  style={{ borderRadius: 12 }} 
                  title={<span><BellOutlined style={{ marginRight: 8, color: "#1e4a2d" }} /><b>Draft System Broadcast</b></span>}
                >
                  <Alert 
                    message="Global In-App Notification"
                    description="When sent, this announcement will automatically pop up inside the notification center of every tenant business dashboard in the system."
                    type="info"
                    showIcon
                    style={{ marginBottom: 20, borderRadius: 8 }}
                  />

                  <Form form={createForm} layout="vertical" onFinish={handleSendBroadcast}>
                    <Row gutter={16}>
                      <Col span={18}>
                        <Form.Item name="title" label="Announcement Title" rules={[{ required: true, message: "Title is required" }]}>
                          <Input placeholder="e.g. Scheduled Network Upgrade / គម្រោងលើកកម្ពស់ប្រព័ន្ធបណ្តាញ" />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item name="type" label="Announcement Type" initialValue="info" rules={[{ required: true }]}>
                          <Select>
                            <Option value="info">Information (Blue)</Option>
                            <Option value="warning">Warning (Orange)</Option>
                            <Option value="danger">Critical / Alert (Red)</Option>
                            <Option value="success">Success / Resolved (Green)</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={24}>
                        <Form.Item name="message" label="Detailed Broadcast Message" rules={[{ required: true, message: "Message is required" }]}>
                          <Input.TextArea rows={4} placeholder="Type announcement details in Khmer and English..." />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Button type="primary" htmlType="submit" icon={<SendOutlined />} loading={notifLoading} style={{ background: "#1e4a2d", borderColor: "#1e4a2d", borderRadius: 8, height: 38 }}>
                      Send Broadcast
                    </Button>
                  </Form>
                </Card>

                <Card 
                  bordered={false} 
                  className="shadow-sm" 
                  style={{ borderRadius: 12 }} 
                  title={<span><ThunderboltOutlined style={{ marginRight: 8, color: "#fa8c16" }} /><b>Announcement History Logs</b></span>}
                >
                  <Table columns={broadcastColumns} dataSource={notifications} rowKey="id" loading={notifLoading} size="middle" />
                </Card>
              </Space>
            )}

            {activeTab === "maintenance" && (
              <Form form={systemForm} layout="vertical" onFinish={handleSaveSystemSettings}>
                <Card 
                  bordered={false} 
                  className="shadow-sm" 
                  style={{ borderRadius: 12 }} 
                  title={<span><ExclamationCircleOutlined style={{ marginRight: 8, color: "#ef4444" }} /><b>Maintenance & Lockdown Scheduler</b></span>}
                >
                  <Alert 
                    message="Cautionary Notice"
                    description="Activating Maintenance Mode will block access to the public SaaS landing pages and displays a lockdown announcement screen. Authorized Admins can still bypass lockdown via specific portal entryways."
                    type="warning"
                    showIcon
                    style={{ marginBottom: 24, borderRadius: 8 }}
                  />

                  <Row gutter={24}>
                    <Col span={12} style={{ marginBottom: 24 }}>
                      <Form.Item name="maintenance_active" label="Maintenance Mode Status" valuePropName="checked">
                        <Space>
                          <Switch activeText="ACTIVE" inactiveText="INACTIVE" />
                          <Text strong style={{ marginLeft: 8 }}>Enable Maintenance Lockout</Text>
                        </Space>
                      </Form.Item>
                    </Col>
                    
                    <Col span={24}>
                      <Form.Item name="maintenance_title" label="Lockout Header / Title">
                        <Input placeholder="System Under Scheduled Maintenance" />
                      </Form.Item>
                    </Col>

                    <Col span={24}>
                      <Form.Item name="maintenance_message" label="Lockout Description / Message">
                        <Input.TextArea rows={3} placeholder="We are currently upgrading our platform resources. We will be back shortly." />
                      </Form.Item>
                    </Col>

                    <Col span={12}>
                      <Form.Item name="maintenance_eta" label="Estimated Time of Restoration (ETA)">
                        <Input placeholder="e.g. 2 hours, 10:00 PM" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Button type="primary" htmlType="submit" loading={sysLoading} icon={<SettingOutlined />} style={{ background: "#1e4a2d", borderColor: "#1e4a2d", borderRadius: 8 }}>
                    Save Maintenance Configurations
                  </Button>
                </Card>
              </Form>
            )}

            {activeTab === "email" && (
              <Form form={systemForm} layout="vertical" onFinish={handleSaveSystemSettings}>
                <Card 
                  bordered={false} 
                  className="shadow-sm" 
                  style={{ borderRadius: 12 }} 
                  title={<span><MailOutlined style={{ marginRight: 8, color: "#1e4a2d" }} /><b>SMTP Gateway Settings</b></span>}
                >
                  <Row gutter={24}>
                    <Col span={16}>
                      <Form.Item name="smtp_host" label="SMTP Server Host">
                        <Input placeholder="smtp.gmail.com or smtp.mailgun.org" />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name="smtp_port" label="SMTP Port">
                        <Input placeholder="e.g. 587 or 465" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="smtp_user" label="SMTP Username">
                        <Input placeholder="your_email@gmail.com" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="smtp_pass" label="SMTP Password">
                        <Input.Password placeholder="your_app_password" />
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item name="smtp_from" label="Sender Email Address (From)">
                        <Input placeholder="no-reply@yourdomain.com" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Button type="primary" htmlType="submit" loading={sysLoading} icon={<SettingOutlined />} style={{ background: "#1e4a2d", borderColor: "#1e4a2d", borderRadius: 8 }}>
                    Save Email Configurations
                  </Button>
                </Card>
              </Form>
            )}

            {activeTab === "sms" && (
              <Form form={systemForm} layout="vertical" onFinish={handleSaveSystemSettings}>
                <Card 
                  bordered={false} 
                  className="shadow-sm" 
                  style={{ borderRadius: 12 }} 
                  title={<span><MobileOutlined style={{ marginRight: 8, color: "#1890ff" }} /><b>SMS Gateway Settings</b></span>}
                >
                  <Row gutter={24}>
                    <Col span={24}>
                      <Form.Item name="sms_sid" label="Twilio Account SID">
                        <Input placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item name="sms_token" label="Twilio Auth Token">
                        <Input.Password placeholder="Auth Token Key" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="sms_sender" label="Twilio Sender Phone / Alphanumeric Sender ID">
                        <Input placeholder="e.g. +1234567890 or SROKSRE" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Button type="primary" htmlType="submit" loading={sysLoading} icon={<SettingOutlined />} style={{ background: "#1e4a2d", borderColor: "#1e4a2d", borderRadius: 8 }}>
                    Save SMS Configurations
                  </Button>
                </Card>
              </Form>
            )}

            {activeTab === "push" && (
              <Form form={systemForm} layout="vertical" onFinish={handleSaveSystemSettings}>
                <Card 
                  bordered={false} 
                  className="shadow-sm" 
                  style={{ borderRadius: 12 }} 
                  title={<span><WifiOutlined style={{ marginRight: 8, color: "#8b5cf6" }} /><b>FCM Push Notification Settings</b></span>}
                >
                  <Row gutter={24}>
                    <Col span={12}>
                      <Form.Item name="firebase_project_id" label="Firebase Project ID">
                        <Input placeholder="e.g. pos-coffee-saas" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="firebase_app_id" label="Firebase App ID">
                        <Input placeholder="e.g. 1:12345678:web:abcdefgh123" />
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item name="firebase_client_email" label="Firebase Client Email">
                        <Input placeholder="firebase-adminsdk-xxx@project.iam.gserviceaccount.com" />
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item name="firebase_private_key" label="Firebase Private Key">
                        <Input.TextArea rows={5} placeholder="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Button type="primary" htmlType="submit" loading={sysLoading} icon={<SettingOutlined />} style={{ background: "#1e4a2d", borderColor: "#1e4a2d", borderRadius: 8 }}>
                    Save Push Configurations
                  </Button>
                </Card>
              </Form>
            )}

            {activeTab === "telegram" && (
              <Form form={systemForm} layout="vertical" onFinish={handleSaveSystemSettings}>
                <Card 
                  bordered={false} 
                  className="shadow-sm" 
                  style={{ borderRadius: 12 }} 
                  title={<span><SendOutlined style={{ marginRight: 8, color: "#0088cc" }} /><b>Telegram Alerts Bot Settings</b></span>}
                >
                  <Row gutter={24}>
                    <Col span={24}>
                      <Form.Item name="telegram_bot_token" label="Telegram Bot Token" tooltip="Bot token issued by BotFather">
                        <Input.Password placeholder="e.g. 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="telegram_chat_id" label="Target Chat ID / Channel Username" tooltip="The chat ID where platform security alerts will be sent">
                        <Input placeholder="e.g. -100xxxxxxxxxx or @channel_username" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Space size={12}>
                    <Button type="primary" htmlType="submit" loading={sysLoading} icon={<SettingOutlined />} style={{ background: "#1e4a2d", borderColor: "#1e4a2d", borderRadius: 8 }}>
                      Save Bot Settings
                    </Button>
                    <Button type="default" onClick={handleTestTelegram} loading={testingTelegram} icon={<ThunderboltOutlined />} style={{ borderRadius: 8 }}>
                      Run Connection Test
                    </Button>
                  </Space>
                </Card>
              </Form>
            )}

          </div>

        </div>
      </Spin>
    </div>
  );
};

export default NotificationCenterPage;
