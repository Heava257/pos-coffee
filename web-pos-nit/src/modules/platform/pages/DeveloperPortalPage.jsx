import React, { useState, useEffect } from "react";
import { Table, Tag, Button, Space, Typography, Modal, Input, Checkbox, message, Tabs, Spin, Alert } from "antd";
import { CodeOutlined, KeyOutlined, ApiOutlined, PlusOutlined, DeleteOutlined, CopyOutlined } from "@ant-design/icons";
import { request } from "@/shared/utils/helper";

const { Title, Text, Paragraph } = Typography;

const DeveloperPortalPage = () => {
  const [loading, setLoading] = useState(true);
  const [apiKeys, setApiKeys] = useState([]);
  const [webhooks, setWebhooks] = useState([]);

  const [keyModalVisible, setKeyModalVisible] = useState(false);
  const [webhookModalVisible, setWebhookModalVisible] = useState(false);
  const [newKey, setNewKey] = useState({ name: "", scopes: [] });
  const [newWebhook, setNewWebhook] = useState({ url: "", events: [] });

  // Key creation success display state
  const [createdKey, setCreatedKey] = useState(null);
  const [successModalVisible, setSuccessModalVisible] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const keysRes = await request("developer/keys", "get");
      if (keysRes && keysRes.success) {
        setApiKeys(keysRes.list || []);
      }
      const hooksRes = await request("developer/webhooks", "get");
      if (hooksRes && hooksRes.success) {
        setWebhooks(hooksRes.list || []);
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to load developer configurations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    message.success("Copied to clipboard!");
  };

  const handleCreateKey = async () => {
    if (!newKey.name) return message.error("Please enter a name");
    try {
      const res = await request("developer/keys", "post", newKey);
      if (res && res.success) {
        setApiKeys([res.key, ...apiKeys]);
        setKeyModalVisible(false);
        setNewKey({ name: "", scopes: [] });
        setCreatedKey(res.key);
        setSuccessModalVisible(true);
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to generate API Key.");
    }
  };

  const handleDeleteKey = async (id) => {
    try {
      const res = await request(`developer/keys/${id}`, "delete");
      if (res && res.success) {
        setApiKeys(apiKeys.filter(item => item.key !== id));
        message.success("API key revoked.");
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to revoke API key.");
    }
  };

  const handleCreateWebhook = async () => {
    if (!newWebhook.url) return message.error("Please enter a URL");
    try {
      const res = await request("developer/webhooks", "post", newWebhook);
      if (res && res.success) {
        setWebhooks([res.webhook, ...webhooks]);
        setWebhookModalVisible(false);
        setNewWebhook({ url: "", events: [] });
        message.success("Webhook endpoint registered successfully!");
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to register webhook.");
    }
  };

  const handleDeleteWebhook = async (id) => {
    try {
      const res = await request(`developer/webhooks/${id}`, "delete");
      if (res && res.success) {
        setWebhooks(webhooks.filter(w => w.id !== id));
        message.success("Webhook endpoint deleted.");
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to delete webhook.");
    }
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
          {Array.isArray(scopes) && scopes.map(s => <Tag color="blue" key={s}>{s}</Tag>)}
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
          {Array.isArray(events) && events.map(e => <Tag color="purple" key={e}>{e}</Tag>)}
        </Space>
      ) 
    },
    { title: "Status", dataIndex: "status", key: "status", render: (s) => <Tag color="success">{s.toUpperCase()}</Tag> },
    { title: "Registered", dataIndex: "created", key: "created" },
    { 
      title: "Actions", 
      key: "actions", 
      render: (_, r) => (
        <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteWebhook(r.id)}>Delete</Button>
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

      <Spin spinning={loading}>
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
      </Spin>

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

      {/* Success API Key Generated Modal */}
      <Modal
        title={<span style={{ color: "#1e4a2d" }}><KeyOutlined /> API Key Generated Successfully</span>}
        open={successModalVisible}
        onCancel={() => setSuccessModalVisible(false)}
        footer={[
          <Button type="primary" key="close" onClick={() => setSuccessModalVisible(false)} style={{ backgroundColor: "#1e4a2d", borderColor: "#1e4a2d", borderRadius: 8 }}>
            I Have Saved the Secret Key
          </Button>
        ]}
        width={550}
        destroyOnClose
      >
        <div style={{ padding: "10px 0" }}>
          <Alert
            message="Warning"
            description="Make sure to copy your client secret key now. You will not be able to see it again for security reasons!"
            type="warning"
            showIcon
            style={{ marginBottom: 20, borderRadius: 8 }}
          />
          
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 12 }}>Key Name</label>
            <Input value={createdKey?.name} readOnly style={{ borderRadius: 6 }} />
          </div>
          
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 12 }}>Client ID / Token (x-client-id)</label>
            <Input 
              value={createdKey?.client_id} 
              readOnly 
              style={{ borderRadius: 6 }}
              addonAfter={<Button type="text" size="small" icon={<CopyOutlined />} onClick={() => copyToClipboard(createdKey?.client_id)} style={{ margin: -5 }} />}
            />
          </div>
          
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 12 }}>Client Secret Key (x-client-secret)</label>
            <Input.Password 
              value={createdKey?.client_secret} 
              readOnly 
              style={{ borderRadius: 6 }}
              addonAfter={<Button type="text" size="small" icon={<CopyOutlined />} onClick={() => copyToClipboard(createdKey?.client_secret)} style={{ margin: -5 }} />}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DeveloperPortalPage;
