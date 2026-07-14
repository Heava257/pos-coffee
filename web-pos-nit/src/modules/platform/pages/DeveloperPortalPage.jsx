import React, { useState } from "react";
import { Card, Table, Tag, Button, Space, Typography, Modal, Input, Checkbox, Select, message, Tabs, Alert } from "antd";
import { CodeOutlined, KeyOutlined, ApiOutlined, PlusOutlined, DeleteOutlined, CopyOutlined, QuestionCircleOutlined } from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

const DeveloperPortalPage = () => {
  const [apiKeys, setApiKeys] = useState([
    { key: "1", name: "TechWorld POS Integration", client_id: "pk_live_51M...", scopes: ["read:orders", "write:products"], created: "2026-05-12", status: "active" },
    { key: "2", name: "Internal Reporting Bot", client_id: "pk_live_92A...", scopes: ["read:revenue", "read:users"], created: "2026-06-01", status: "active" }
  ]);

  const [webhooks, setWebhooks] = useState([
    { id: "1", url: "https://api.techworld.com/webhooks/pos", events: ["order.created", "payment.received"], status: "active", created: "2026-05-14" }
  ]);

  const [keyModalVisible, setKeyModalVisible] = useState(false);
  const [webhookModalVisible, setWebhookModalVisible] = useState(false);
  const [newKey, setNewKey] = useState({ name: "", scopes: [] });
  const [newWebhook, setNewWebhook] = useState({ url: "", events: [] });

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    message.success("Copied to clipboard!");
  };

  const handleCreateKey = () => {
    if (!newKey.name) return message.error("Please enter a name");
    const newEntry = {
      key: Date.now().toString(),
      name: newKey.name,
      client_id: `pk_live_${Math.random().toString(36).substr(2, 8).toUpperCase()}...`,
      scopes: newKey.scopes,
      created: new Date().toISOString().split("T")[0],
      status: "active"
    };
    setApiKeys([...apiKeys, newEntry]);
    setKeyModalVisible(false);
    setNewKey({ name: "", scopes: [] });
    message.success("API key generated successfully!");
  };

  const handleDeleteKey = (key) => {
    setApiKeys(apiKeys.filter(item => item.key !== key));
    message.success("API key revoked.");
  };

  const handleCreateWebhook = () => {
    if (!newWebhook.url) return message.error("Please enter a URL");
    const newEntry = {
      id: Date.now().toString(),
      url: newWebhook.url,
      events: newWebhook.events,
      status: "active",
      created: new Date().toISOString().split("T")[0]
    };
    setWebhooks([...webhooks, newEntry]);
    setWebhookModalVisible(false);
    setNewWebhook({ url: "", events: [] });
    message.success("Webhook endpoint registered successfully!");
  };

  const keyColumns = [
    { title: "Key Name", dataIndex: "name", key: "name", render: (t) => <Text strong>{t}</Text> },
    { title: "Client ID / Token", dataIndex: "client_id", key: "client_id", render: (t) => <Text code>{t}</Text> },
    { 
      title: "Authorized Scopes", 
      dataIndex: "scopes", 
      key: "scopes", 
      render: (scopes) => (
        <Space size={[0, 4]} wrap>
          {scopes.map(s => <Tag color="blue" key={s}>{s}</Tag>)}
        </Space>
      ) 
    },
    { title: "Created Date", dataIndex: "created", key: "created" },
    { title: "Status", dataIndex: "status", key: "status", render: (s) => <Tag color="success">{s.toUpperCase()}</Tag> },
    { 
      title: "Actions", 
      key: "actions", 
      render: (_, r) => (
        <Space>
          <Button size="small" icon={<CopyOutlined />} onClick={() => copyToClipboard(r.client_id)}>Copy</Button>
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteKey(r.key)}>Revoke</Button>
        </Space>
      ) 
    }
  ];

  const webhookColumns = [
    { title: "Endpoint URL", dataIndex: "url", key: "url", render: (t) => <Text strong>{t}</Text> },
    { 
      title: "Trigger Events", 
      dataIndex: "events", 
      key: "events", 
      render: (events) => (
        <Space size={[0, 4]} wrap>
          {events.map(e => <Tag color="purple" key={e}>{e}</Tag>)}
        </Space>
      ) 
    },
    { title: "Status", dataIndex: "status", key: "status", render: (s) => <Tag color="success">{s.toUpperCase()}</Tag> },
    { title: "Registered", dataIndex: "created", key: "created" },
    { 
      title: "Actions", 
      key: "actions", 
      render: (_, r) => (
        <Button size="small" danger icon={<DeleteOutlined />} onClick={() => setWebhooks(webhooks.filter(w => w.id !== r.id))}>Delete</Button>
      ) 
    }
  ];

  return (
    <div style={{ padding: "20px 0" }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ color: "#1e4a2d", margin: 0 }}>
          <CodeOutlined style={{ marginRight: 8 }} /> Developer Portal
        </Title>
        <Paragraph style={{ color: "#666", marginTop: 4 }}>
          Generate system API credentials, register real-time webhook callbacks, and access enterprise integration tools.
        </Paragraph>
      </div>

      <Tabs defaultActiveKey="1" style={{ background: "#fff", padding: 24, borderRadius: 12, boxShadow: "0 4px 15px rgba(0,0,0,0.02)" }}>
        <Tabs.TabPane tab={<span><KeyOutlined /> API Credentials</span>} key="1">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <Text strong style={{ fontSize: 16 }}>Platform API Keys</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>Keys used to authenticate external systems with the SaaS API.</Text>
            </div>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setKeyModalVisible(true)} style={{ backgroundColor: "#1e4a2d", borderColor: "#1e4a2d" }}>
              Generate API Key
            </Button>
          </div>
          <Table columns={keyColumns} dataSource={apiKeys} pagination={false} size="small" />
        </Tabs.TabPane>

        <Tabs.TabPane tab={<span><ApiOutlined /> Webhooks</span>} key="2">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <Text strong style={{ fontSize: 16 }}>Webhook Endpoints</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>Subscribe to real-time events happening in your SaaS ecosystem.</Text>
            </div>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setWebhookModalVisible(true)} style={{ backgroundColor: "#1e4a2d", borderColor: "#1e4a2d" }}>
              Add Endpoint
            </Button>
          </div>
          <Table columns={webhookColumns} dataSource={webhooks} pagination={false} size="small" />
        </Tabs.TabPane>
      </Tabs>

      {/* API Key Modal */}
      <Modal
        title="Generate System API Key"
        open={keyModalVisible}
        onCancel={() => setKeyModalVisible(false)}
        onOk={handleCreateKey}
        okText="Generate Key"
        okButtonProps={{ style: { backgroundColor: "#1e4a2d", borderColor: "#1e4a2d" } }}
      >
        <div style={{ margin: "16px 0" }}>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Key Description / Name</label>
          <Input placeholder="e.g. ERP Syncer" value={newKey.name} onChange={(e) => setNewKey({ ...newKey, name: e.target.value })} />
        </div>
        <div style={{ margin: "16px 0" }}>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>API Scopes</label>
          <Checkbox.Group 
            options={["read:orders", "write:orders", "read:products", "write:products", "read:revenue", "read:users"]} 
            value={newKey.scopes} 
            onChange={(checked) => setNewKey({ ...newKey, scopes: checked })} 
          />
        </div>
      </Modal>

      {/* Webhook Modal */}
      <Modal
        title="Register Webhook Endpoint"
        open={webhookModalVisible}
        onCancel={() => setWebhookModalVisible(false)}
        onOk={handleCreateWebhook}
        okText="Add Endpoint"
        okButtonProps={{ style: { backgroundColor: "#1e4a2d", borderColor: "#1e4a2d" } }}
      >
        <div style={{ margin: "16px 0" }}>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Endpoint URL</label>
          <Input placeholder="https://api.yourdomain.com/callbacks" value={newWebhook.url} onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })} />
        </div>
        <div style={{ margin: "16px 0" }}>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Trigger Events</label>
          <Checkbox.Group 
            options={["order.created", "order.refunded", "product.created", "tenant.created", "tenant.suspended"]} 
            value={newWebhook.events} 
            onChange={(checked) => setNewWebhook({ ...newWebhook, events: checked })} 
          />
        </div>
      </Modal>
    </div>
  );
};

export default DeveloperPortalPage;
