import React, { useState, useEffect } from "react";
import { Card, Input, Button, Switch, Typography, Space, Row, Col, message, Spin, Divider } from "antd";
import { NodeIndexOutlined, SendOutlined, BellOutlined, MessageOutlined } from "@ant-design/icons";
import { request } from "@/shared/utils/helper";

const { Title, Text, Paragraph } = Typography;

const IntegrationCenterPage = () => {
  const [loading, setLoading] = useState(true);
  const [telegramActive, setTelegramActive] = useState(false);
  const [telegramToken, setTelegramToken] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");

  const [slackActive, setSlackActive] = useState(false);
  const [slackWebhookUrl, setSlackWebhookUrl] = useState("");

  const [smsActive, setSmsActive] = useState(false);
  const [twilioSid, setTwilioSid] = useState("");
  const [twilioToken, setTwilioToken] = useState("");
  const [twilioSender, setTwilioSender] = useState("");

  const [testing, setTesting] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await request("system-setting", "get");
      if (res && res.success && res.settings) {
        const s = res.settings;
        setTelegramActive(s.telegram_active === "true");
        setTelegramToken(s.telegram_bot_token || "");
        setTelegramChatId(s.telegram_chat_id || "");

        setSlackActive(s.slack_active === "true");
        setSlackWebhookUrl(s.slack_webhook_url || "");

        setSmsActive(s.sms_active === "true");
        setTwilioSid(s.twilio_sid || "");
        setTwilioToken(s.twilio_token || "");
        setTwilioSender(s.twilio_sender || "");
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to load platform integration settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      const res = await request("system-setting", "put", {
        telegram_active: telegramActive ? "true" : "false",
        telegram_bot_token: telegramToken,
        telegram_chat_id: telegramChatId,
        slack_active: slackActive ? "true" : "false",
        slack_webhook_url: slackWebhookUrl,
        sms_active: smsActive ? "true" : "false",
        twilio_sid: twilioSid,
        twilio_token: twilioToken,
        twilio_sender: twilioSender
      });

      if (res && res.success) {
        message.success("Platform integration settings updated successfully!");
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to save integration settings.");
    }
  };

  const handleTestTelegram = async () => {
    setTesting(true);
    try {
      const res = await request("business/test-telegram", "post", {
        telegram_token: telegramToken,
        telegram_chat_id: telegramChatId,
        test_message: "🔔 *PlatformOS Security Alert Test*\nThis is a high-fidelity system integration validation test from the Platform Owner console."
      });

      if (res && res.success) {
        message.success("Test Telegram alert broadcasted successfully!");
      } else {
        message.error("Failed to send test message.");
      }
    } catch (err) {
      console.error(err);
      message.error("Telegram connection failed. Please verify your token and Chat ID.");
    } finally {
      setTesting(false);
    }
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

      <Spin spinning={loading}>
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
                  <Switch checked={telegramActive} onChange={(val) => setTelegramActive(val)} />
                </div>
              }
            >
              <Paragraph style={{ fontSize: 12, color: "#666" }}>
                Broadcast critical events, daily reports, and security alerts directly to your team's Telegram channels.
              </Paragraph>
              <div style={{ margin: "16px 0" }}>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 12 }}>Bot Token</label>
                <Input.Password value={telegramToken} onChange={(e) => setTelegramToken(e.target.value)} />
              </div>
              <div style={{ margin: "16px 0" }}>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 12 }}>Target Chat ID / Group ID</label>
                <Input value={telegramChatId} onChange={(e) => setTelegramChatId(e.target.value)} />
              </div>
              <Divider style={{ margin: "12px 0" }} />
              <Space>
                <Button type="primary" style={{ backgroundColor: "#1e4a2d", borderColor: "#1e4a2d" }} onClick={handleSave}>Save Configuration</Button>
                <Button icon={<BellOutlined />} onClick={handleTestTelegram} loading={testing} disabled={!telegramActive}>Test Alert</Button>
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
                  <Switch checked={slackActive} onChange={(val) => setSlackActive(val)} />
                </div>
              }
            >
              <Paragraph style={{ fontSize: 12, color: "#666" }}>
                Send automated security reports and developer alerts directly to your #operations Slack channels.
              </Paragraph>
              <div style={{ margin: "16px 0" }}>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 12 }}>Webhook URL</label>
                <Input placeholder="https://hooks.slack.com/services/..." value={slackWebhookUrl} onChange={(e) => setSlackWebhookUrl(e.target.value)} />
              </div>
              <Divider style={{ margin: "12px 0" }} />
              <Button type="primary" style={{ backgroundColor: "#1e4a2d", borderColor: "#1e4a2d" }} onClick={handleSave}>Save Configuration</Button>
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
                  <Switch checked={smsActive} onChange={(val) => setSmsActive(val)} />
                </div>
              }
            >
              <Paragraph style={{ fontSize: 12, color: "#666" }}>
                Deliver multi-factor authentication (MFA) OTP codes and user password reset SMS notifications globally.
              </Paragraph>
              <div style={{ margin: "16px 0" }}>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 12 }}>Twilio Account SID</label>
                <Input value={twilioSid} onChange={(e) => setTwilioSid(e.target.value)} />
              </div>
              <div style={{ margin: "16px 0" }}>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 12 }}>Auth Token</label>
                <Input.Password value={twilioToken} onChange={(e) => setTwilioToken(e.target.value)} />
              </div>
              <div style={{ margin: "16px 0" }}>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 12 }}>SMS Sender ID / Alphanumeric Sender</label>
                <Input value={twilioSender} onChange={(e) => setTwilioSender(e.target.value)} />
              </div>
              <Divider style={{ margin: "12px 0" }} />
              <Button type="primary" style={{ backgroundColor: "#1e4a2d", borderColor: "#1e4a2d" }} onClick={handleSave}>Save Configuration</Button>
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
};

export default IntegrationCenterPage;
