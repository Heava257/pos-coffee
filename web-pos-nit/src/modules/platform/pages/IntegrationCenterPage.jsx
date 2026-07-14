import React, { useState } from "react";
import { Card, Input, Button, Switch, Typography, Space, Tag, Row, Col, message, Alert, Divider } from "antd";
import { NodeIndexOutlined, SendOutlined, SettingOutlined, CheckCircleOutlined, InfoCircleOutlined, MessageOutlined, BellOutlined } from "@ant-design/icons";
import { request } from "@/shared/utils/helper";

const { Title, Text, Paragraph } = Typography;

const IntegrationCenterPage = () => {
  const [telegram, setTelegram] = useState({
    token: "6802951912:AAH9b*********************",
    chatId: "-100204859218",
    active: true
  });

  const [slack, setSlack] = useState({
    webhookUrl: "https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX",
    active: false
  });

  const [sms, setSms] = useState({
    twilioSid: "ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    twilioToken: "********************************",
    senderName: "PLATFORMOS",
    active: false
  });

  const [testing, setTesting] = useState(false);

  const handleTestTelegram = async () => {
    setTesting(true);
    try {
      const res = await request("business/test-telegram", "post", {
        telegram_token: telegram.token,
        telegram_chat_id: telegram.chatId,
        test_message: "🔔 *PlatformOS Security Alert Test*\nThis is a high-fidelity system integration validation test from the Platform Owner console."
      });

      if (res && res.success) {
        message.success("Test Telegram alert broadcasted successfully!");
      } else {
        message.error("Failed to send test message: Telegram response status error.");
      }
    } catch (err) {
      console.error(err);
      message.error("Telegram connection failed. Please verify your token and Chat ID.");
    } finally {
      setTesting(false);
    }
  };

  const handleSaveSettings = () => {
    message.success("Platform integration settings updated successfully!");
  };

  return (
    <div style={{ padding: "20px 0" }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ color: "#1e4a2d", margin: 0 }}>
          <NodeIndexOutlined style={{ marginRight: 8 }} /> Integration Center
        </Title>
        <Paragraph style={{ color: "#666", marginTop: 4 }}>
          Connect communication channels, broadcast channels, and alert networks to keep your operations synchronized.
        </Paragraph>
      </div>

      <Row gutter={[24, 24]}>
        {/* Telegram Notifications */}
        <Col xs={24} lg={12}>
          <Card 
            bordered={false} 
            className="shadow-sm" 
            style={{ borderRadius: 12, height: "100%" }}
            title={
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span><SendOutlined style={{ color: "#1890ff", marginRight: 8 }} /><b>Telegram Broadcast Bot</b></span>
                <Switch checked={telegram.active} onChange={(val) => setTelegram({ ...telegram, active: val })} />
              </div>
            }
          >
            <Paragraph style={{ fontSize: 12, color: "#666" }}>
              Broadcast critical events, daily reports, and security alerts directly to your team's Telegram channels.
            </Paragraph>
            <div style={{ margin: "16px 0" }}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 12 }}>Bot Token</label>
              <Input.Password value={telegram.token} onChange={(e) => setTelegram({ ...telegram, token: e.target.value })} />
            </div>
            <div style={{ margin: "16px 0" }}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 12 }}>Target Chat ID / Group ID</label>
              <Input value={telegram.chatId} onChange={(e) => setTelegram({ ...telegram, chatId: e.target.value })} />
            </div>
            <Divider style={{ margin: "12px 0" }} />
            <Space>
              <Button type="primary" style={{ backgroundColor: "#1e4a2d", borderColor: "#1e4a2d" }} onClick={handleSaveSettings}>Save Configuration</Button>
              <Button icon={<BellOutlined />} onClick={handleTestTelegram} loading={testing} disabled={!telegram.active}>Test Alert</Button>
            </Space>
          </Card>
        </Col>

        {/* Slack Alerts */}
        <Col xs={24} lg={12}>
          <Card 
            bordered={false} 
            className="shadow-sm" 
            style={{ borderRadius: 12, height: "100%" }}
            title={
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span><MessageOutlined style={{ color: "#eb2f96", marginRight: 8 }} /><b>Slack Incident Webhook</b></span>
                <Switch checked={slack.active} onChange={(val) => setSlack({ ...slack, active: val })} />
              </div>
            }
          >
            <Paragraph style={{ fontSize: 12, color: "#666" }}>
              Send automated security reports and developer alerts directly to your #operations Slack channels.
            </Paragraph>
            <div style={{ margin: "16px 0" }}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 12 }}>Webhook URL</label>
              <Input placeholder="https://hooks.slack.com/services/..." value={slack.webhookUrl} onChange={(e) => setSlack({ ...slack, webhookUrl: e.target.value })} />
            </div>
            <Divider style={{ margin: "12px 0" }} />
            <Button type="primary" style={{ backgroundColor: "#1e4a2d", borderColor: "#1e4a2d" }} onClick={handleSaveSettings}>Save Configuration</Button>
          </Card>
        </Col>

        {/* SMS Gateways */}
        <Col xs={24} lg={12}>
          <Card 
            bordered={false} 
            className="shadow-sm" 
            style={{ borderRadius: 12 }}
            title={
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span><BellOutlined style={{ color: "#fa8c16", marginRight: 8 }} /><b>Twilio SMS Service</b></span>
                <Switch checked={sms.active} onChange={(val) => setSms({ ...sms, active: val })} />
              </div>
            }
          >
            <Paragraph style={{ fontSize: 12, color: "#666" }}>
              Deliver multi-factor authentication (MFA) OTP codes and user password reset SMS notifications globally.
            </Paragraph>
            <div style={{ margin: "16px 0" }}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 12 }}>Twilio Account SID</label>
              <Input value={sms.twilioSid} onChange={(e) => setSms({ ...sms, twilioSid: e.target.value })} />
            </div>
            <div style={{ margin: "16px 0" }}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 12 }}>Auth Token</label>
              <Input.Password value={sms.twilioToken} onChange={(e) => setSms({ ...sms, twilioToken: e.target.value })} />
            </div>
            <div style={{ margin: "16px 0" }}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 12 }}>SMS Sender ID / Alphanumeric Sender</label>
              <Input value={sms.senderName} onChange={(e) => setSms({ ...sms, senderName: e.target.value })} />
            </div>
            <Divider style={{ margin: "12px 0" }} />
            <Button type="primary" style={{ backgroundColor: "#1e4a2d", borderColor: "#1e4a2d" }} onClick={handleSaveSettings}>Save Configuration</Button>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default IntegrationCenterPage;
