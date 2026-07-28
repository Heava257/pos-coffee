import React, { useState, useEffect } from "react";
import { Card, Table, Tag, Button, Space, Typography, Modal, Input, Switch, message, Spin, Alert, Form, Row, Col, Divider, Upload } from "antd";
import { CreditCardOutlined, SafetyOutlined, EditOutlined, TransactionOutlined, MailOutlined, BankOutlined, KeyOutlined, TeamOutlined, PlusOutlined, CheckCircleOutlined, SettingOutlined } from "@ant-design/icons";
import { request } from "@/shared/utils/helper";
import { Config } from "@/shared/utils/config";
import dayjs from "dayjs";

const { Title, Text, Paragraph } = Typography;

const PaymentGatewayPage = () => {
  const [loading, setLoading] = useState(true);
  const [gateways, setGateways] = useState([]);
  const [activeGateway, setActiveGateway] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editForm, setEditForm] = useState({ merchant_id: "", api_key: "", secure_hash: "" });
  const [transactionLogs, setTransactionLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const [systemForm] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [sysLoading, setSysLoading] = useState(false);
  const [systemSettings, setSystemSettings] = useState({});

  const fetchGateways = async () => {
    setLoading(true);
    try {
      const res = await request("payment-gateway", "get");
      if (res && res.success) {
        setGateways(res.list);
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to load payment gateways.");
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await request("payment-gateway/transactions", "get");
      if (res && res.success) {
        setTransactionLogs(res.list || []);
      }
    } catch (err) {
      console.error("Failed to fetch gateway transaction logs:", err);
    } finally {
      setLogsLoading(false);
    }
  };

  const fetchSystemSettings = async () => {
    try {
      const res = await request("system-settings", "get");
      if (res && res.success) {
        const cleaned = {};
        Object.keys(res.settings).forEach(key => {
          const v = res.settings[key];
          if (key === "payway_allow_simulation") {
            cleaned[key] = v === "true";
          } else {
            cleaned[key] = (v === "null" || v === "undefined") ? "" : v;
          }
        });
        setSystemSettings(cleaned);
        systemForm.setFieldsValue(cleaned);
        if (cleaned.payway_khqr_image) {
          setFileList([{
            uid: '-1',
            name: 'khqr.png',
            status: 'done',
            url: Config.getFullImagePath(res.settings.payway_khqr_image),
          }]);
        } else {
          setFileList([]);
        }
      }
    } catch (err) {
      console.error("Failed to load system settings:", err);
    }
  };

  useEffect(() => {
    fetchGateways();
    fetchLogs();
    fetchSystemSettings();
  }, []);

  const handleEdit = (gw) => {
    setActiveGateway(gw);
    setEditForm({ 
      merchant_id: gw.merchant_id || "", 
      api_key: gw.api_key || "", 
      secure_hash: gw.secure_hash || "" 
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    try {
      const res = await request("payment-gateway/configure", "put", {
        id: activeGateway.id,
        ...editForm
      });
      if (res && res.success) {
        setGateways(gateways.map(g => {
          if (g.id === activeGateway.id) {
            return { ...g, ...editForm };
          }
          return g;
        }));
        setModalVisible(false);
        message.success(`${activeGateway.name} configuration updated successfully.`);
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to update gateway credentials.");
    }
  };

  const handleToggleStatus = async (record, checked) => {
    const newStatus = checked ? "active" : "inactive";
    try {
      const res = await request("payment-gateway/toggle", "put", {
        id: record.id,
        status: newStatus
      });
      if (res && res.success) {
        setGateways(gateways.map(g => {
          if (g.id === record.id) {
            return { ...g, status: newStatus };
          }
          return g;
        }));
        message.success(`${record.name} is now ${newStatus}.`);
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to update gateway status.");
    }
  };

  const handleSaveSystemSettings = async (values) => {
    setSysLoading(true);
    try {
      const formData = new FormData();
      
      Object.keys(values).forEach(key => {
        if (values[key] !== undefined) {
          formData.append(key, values[key]);
        }
      });

      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append("khqr_image", fileList[0].originFileObj);
      } else if (fileList.length === 0 && systemSettings.payway_khqr_image) {
        formData.append("image_remove", "1");
      }

      const res = await request("system-settings", "put", formData);
      if (res && res.success) {
        message.success("Manual payment and IMAP settings updated successfully!");
        fetchSystemSettings();
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to save settings.");
    } finally {
      setSysLoading(false);
    }
  };

  const columns = [
    { title: "Gateway Partner", dataIndex: "name", key: "name", render: (t) => <Text strong style={{ color: "#1e4a2d" }}>{t}</Text> },
    { title: "Merchant Identifier", dataIndex: "merchant_id", key: "merchant_id", render: (t) => <Text code>{t || "Not Configured"}</Text> },
    { title: "Active Currencies", dataIndex: "currency", key: "currency", render: (t) => <Tag color="blue">{t}</Tag> },
    { 
      title: "Connection Status", 
      dataIndex: "status", 
      key: "status", 
      render: (status, record) => (
        <Space>
          <Switch 
            size="small" 
            checked={status === "active"} 
            onChange={(checked) => handleToggleStatus(record, checked)} 
          />
          <Tag color={status === "active" ? "success" : "default"}>{status.toUpperCase()}</Tag>
        </Space>
      ) 
    },
    { 
      title: "Actions", 
      key: "actions", 
      render: (_, r) => (
        <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(r)}>Configure</Button>
      ) 
    }
  ];

  const logColumns = [
    { 
      title: "Timestamp", 
      dataIndex: "time", 
      key: "time",
      render: (t) => dayjs(t).format("YYYY-MM-DD HH:mm:ss A")
    },
    { title: "Gateway", dataIndex: "gateway", key: "gateway" },
    { title: "Amount", dataIndex: "amount", key: "amount" },
    { title: "Tenant", dataIndex: "tenant", key: "tenant" },
    { title: "Status", dataIndex: "status", key: "status", render: (s) => <Tag color={s === 'success' ? 'success' : 'error'}>{s.toUpperCase()}</Tag> }
  ];

  return (
    <div style={{ padding: "20px 0" }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ color: "#1e4a2d", margin: 0 }}>
          <CreditCardOutlined style={{ marginRight: 8 }} /> Payment Gateway Control
        </Title>
        <Paragraph style={{ color: "#666", marginTop: 4 }}>
          Manage payment processor credentials, enable active payment channels, and audit platform checkout logs.
        </Paragraph>
      </div>

      <Alert 
        message="PCI-DSS Compliance Protected" 
        description="All API keys and credentials are encrypted using AES-256 before database storage. Sandbox mode settings can be configured via tenant billing profiles." 
        type="info" 
        showIcon 
        icon={<SafetyOutlined />}
        style={{ marginBottom: 24, borderRadius: 8 }}
      />

      <Spin spinning={loading}>
        <Card bordered={false} className="shadow-sm" style={{ borderRadius: 12, marginBottom: 24 }} title={<b>Active SaaS Integrations</b>}>
          <Table columns={columns} dataSource={gateways} pagination={false} size="small" rowKey="id" />
        </Card>
      </Spin>

      <Card bordered={false} className="shadow-sm" style={{ borderRadius: 12, marginBottom: 24 }} title={<span><TransactionOutlined style={{ marginRight: 8 }} /><b>Recent Platform Transaction Logs</b></span>}>
        <Table columns={logColumns} dataSource={transactionLogs} pagination={false} size="small" loading={logsLoading} rowKey="key" />
      </Card>

      <Card 
        bordered={false} 
        className="shadow-sm" 
        style={{ borderRadius: 12 }} 
        title={<span><SettingOutlined style={{ marginRight: 8 }} /><b>Manual Payment & IMAP Reader Settings</b></span>}
      >
        <div style={{ marginBottom: 20 }}>
          <Text type="secondary">Configure fallback payment options, Telegram notification link, and personal Gmail IMAP listener settings for manual transactions.</Text>
        </div>
        
        <Form form={systemForm} layout="vertical" onFinish={handleSaveSystemSettings}>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item name="payway_receiver_name" label="Receiver Account Name" tooltip="The name displayed to customers in bank apps">
                <Input prefix={<TeamOutlined />} placeholder="e.g. COFFEE SaaS PLATFORM" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="telegram_support_link" label="Telegram Support Link" tooltip="Link for clients to contact for manual/payment queries">
                <Input prefix={<MailOutlined />} placeholder="e.g. https://t.me/your_telegram_username" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="payway_allow_simulation" label="Allow Payment Simulation" valuePropName="checked" tooltip="Enable/Disable simulated success payment button for testing/debugging">
                <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
              </Form.Item>
            </Col>
            
            <Col span={24}>
              <Divider orientation="left" style={{ fontSize: 13, color: '#999', margin: "12px 0 24px 0" }}>ABA Personal Account Notification Reader (Gmail IMAP)</Divider>
            </Col>
            <Col span={12}>
              <Form.Item name="payment_imap_user" label="Gmail Address" tooltip="Gmail account that receives ABA transaction email notifications">
                <Input placeholder="e.g. growme.payment@gmail.com" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="payment_imap_pass" label="Gmail App Password" tooltip="Gmail App Password (16 characters) created in Google Account Settings">
                <Input.Password placeholder="e.g. abcd efgh ijkl mnop" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="payment_imap_host" label="IMAP Host" tooltip="IMAP server address. Default is imap.gmail.com">
                <Input placeholder="imap.gmail.com" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="payment_imap_port" label="IMAP Port" tooltip="IMAP port. Default is 993">
                <Input placeholder="993" />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Divider orientation="left" style={{ fontSize: 13, color: '#999', margin: "12px 0 24px 0" }}>Master KHQR Image (Fallback)</Divider>
              <Form.Item label="Upload Platform QR">
                <Upload
                  listType="picture-card"
                  fileList={fileList}
                  onChange={({ fileList }) => setFileList(fileList)}
                  beforeUpload={() => false}
                  maxCount={1}
                >
                  {fileList.length < 1 && (
                    <div>
                      <PlusOutlined />
                      <div style={{ marginTop: 8 }}>Upload QR</div>
                    </div>
                  )}
                </Upload>
                <Text type="secondary" style={{ fontSize: 11 }}>This image will be shown if dynamic QR generation is disabled or fails.</Text>
              </Form.Item>
            </Col>
          </Row>
          <Button
            type="primary"
            htmlType="submit"
            loading={sysLoading}
            icon={<CheckCircleOutlined />}
            style={{ height: 40, borderRadius: 8, background: '#1e4a2d', borderColor: '#1e4a2d', marginTop: 16 }}
          >
            Save Master Settings
          </Button>
        </Form>
      </Card>

      {/* Configuration Modal */}
      <Modal
        title={activeGateway ? `Configure ${activeGateway.name}` : ""}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSave}
        okText="Save Credentials"
        okButtonProps={{ style: { backgroundColor: "#1e4a2d", borderColor: "#1e4a2d" } }}
      >
        <div style={{ margin: "16px 0" }}>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Merchant ID / Account ID</label>
          <Input value={editForm.merchant_id} onChange={(e) => setEditForm({ ...editForm, merchant_id: e.target.value })} />
        </div>
        <div style={{ margin: "16px 0" }}>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Secret API Key / Token</label>
          <Input.Password value={editForm.api_key} onChange={(e) => setEditForm({ ...editForm, api_key: e.target.value })} />
        </div>
        <div style={{ margin: "16px 0" }}>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Secure Hash Secret</label>
          <Input.Password value={editForm.secure_hash} onChange={(e) => setEditForm({ ...editForm, secure_hash: e.target.value })} />
        </div>
      </Modal>
    </div>
  );
};

export default PaymentGatewayPage;
