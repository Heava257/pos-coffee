import React, { useState } from "react";
import { Card, Table, Tag, Button, Space, Typography, Modal, Input, Switch, message, Row, Col, Alert } from "antd";
import { CreditCardOutlined, SettingOutlined, CheckCircleOutlined, SafetyOutlined, EditOutlined, TransactionOutlined } from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

const PaymentGatewayPage = () => {
  const [gateways, setGateways] = useState([
    { id: "1", name: "ABA PayWay", merchant_id: "m_aba_coffee", status: "active", api_key: "api_aba_live_******************", currency: "USD/KHR" },
    { id: "2", name: "Stripe", merchant_id: "acct_stripe_1120", status: "active", api_key: "sk_live_51M******************", currency: "USD" },
    { id: "3", name: "Wing Pay", merchant_id: "m_wing_489", status: "inactive", api_key: "key_wing_live_******************", currency: "USD/KHR" },
    { id: "4", name: "Acleda X-Pay", merchant_id: "ac_xpay_902", status: "inactive", api_key: "sk_acleda_live_******************", currency: "KHR" }
  ]);

  const [activeGateway, setActiveGateway] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editForm, setEditForm] = useState({ merchant_id: "", api_key: "" });

  const handleEdit = (gw) => {
    setActiveGateway(gw);
    setEditForm({ merchant_id: gw.merchant_id, api_key: gw.api_key });
    setModalVisible(true);
  };

  const handleSave = () => {
    setGateways(gateways.map(g => {
      if (g.id === activeGateway.id) {
        return { ...g, merchant_id: editForm.merchant_id, api_key: editForm.api_key };
      }
      return g;
    }));
    setModalVisible(false);
    message.success(`${activeGateway.name} configuration updated successfully.`);
  };

  const handleToggleStatus = (id, checked) => {
    setGateways(gateways.map(g => {
      if (g.id === id) {
        const newStatus = checked ? "active" : "inactive";
        message.info(`${g.name} is now ${newStatus}.`);
        return { ...g, status: newStatus };
      }
      return g;
    }));
  };

  const columns = [
    { title: "Gateway Partner", dataIndex: "name", key: "name", render: (t) => <Text strong style={{ color: "#1e4a2d" }}>{t}</Text> },
    { title: "Merchant Identifier", dataIndex: "merchant_id", key: "merchant_id", render: (t) => <Text code>{t}</Text> },
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
            onChange={(checked) => handleToggleStatus(record.id, checked)} 
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

  // simulated logs
  const transactionLogs = [
    { key: "1", time: "2026-07-14 22:04:12", gateway: "ABA PayWay", amount: "$8.50", tenant: "Coffee Hub", status: "success" },
    { key: "2", time: "2026-07-14 21:58:30", gateway: "Stripe", amount: "$30.00", tenant: "RetailMart", status: "success" },
    { key: "3", time: "2026-07-14 21:12:05", gateway: "ABA PayWay", amount: "$12.00", tenant: "PharmaPlus", status: "failed", reason: "Insufficient balance" }
  ];

  const logColumns = [
    { title: "Timestamp", dataIndex: "time", key: "time" },
    { title: "Gateway", dataIndex: "gateway", key: "gateway" },
    { title: "Amount", dataIndex: "amount", key: "amount" },
    { title: "Tenant", dataIndex: "tenant", key: "tenant" },
    { title: "Status", dataIndex: "status", key: "status", render: (s, r) => <Tag color={s === 'success' ? 'success' : 'error'}>{s.toUpperCase()}</Tag> }
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

      <Card bordered={false} className="shadow-sm" style={{ borderRadius: 12, marginBottom: 24 }} title={<b>Active SaaS Integrations</b>}>
        <Table columns={columns} dataSource={gateways} pagination={false} size="small" rowKey="id" />
      </Card>

      <Card bordered={false} className="shadow-sm" style={{ borderRadius: 12 }} title={<span><TransactionOutlined style={{ marginRight: 8 }} /><b>Recent Platform Transaction Logs</b></span>}>
        <Table columns={logColumns} dataSource={transactionLogs} pagination={false} size="small" />
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
      </Modal>
    </div>
  );
};

export default PaymentGatewayPage;
