import React, { useState, useEffect } from "react";
import { Card, Row, Col, Switch, Button, Tag, Typography, Space, Spin, message, Divider, Alert } from "antd";
import { ControlOutlined, SaveOutlined, BulbOutlined, GlobalOutlined, LockOutlined, RobotOutlined, WarningOutlined } from "@ant-design/icons";
import { request } from "@/shared/utils/helper";

const { Title, Text, Paragraph } = Typography;

const FeatureFlagsPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [flags, setFlags] = useState({
    flag_ai_analytics: "false",
    flag_multicurrency: "false",
    flag_offline_mode: "false",
    flag_biometric_login: "false",
    flag_dark_mode_auto: "false",
    flag_audit_ledger: "false"
  });

  useEffect(() => {
    fetchFlags();
  }, []);

  const fetchFlags = async () => {
    setLoading(true);
    try {
      const res = await request("system-setting", "get");
      if (res && res.success && res.settings) {
        // Map settings to flags state, ensuring fallbacks
        const mappedFlags = { ...flags };
        Object.keys(flags).forEach(key => {
          if (res.settings[key] !== undefined) {
            mappedFlags[key] = res.settings[key];
          }
        });
        setFlags(mappedFlags);
      }
    } catch (err) {
      console.error("Failed to load feature flags:", err);
      message.error("Failed to load system feature flags");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key, checked) => {
    setFlags(prev => ({
      ...prev,
      [key]: checked ? "true" : "false"
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await request("system-setting", "put", flags);
      if (res && res.success) {
        message.success("Feature flags configuration updated successfully");
      } else {
        message.error("Failed to update feature flags configuration");
      }
    } catch (err) {
      console.error("Failed to save feature flags:", err);
      message.error("Failed to save feature flags");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "100px 0" }}>
        <Spin size="large" tip="Loading Feature Flag Configuration..." />
      </div>
    );
  }

  const flagGroups = [
    {
      title: "Advanced & Intelligent Services",
      icon: <RobotOutlined style={{ color: "#1890ff", marginRight: 8 }} />,
      items: [
        {
          key: "flag_ai_analytics",
          label: "AI Sales Forecasting & Analytics",
          desc: "Integrate custom machine learning algorithms to forecast next week's category and product sales based on historical logs.",
          category: "AI"
        }
      ]
    },
    {
      title: "Financial & Core Operations",
      icon: <GlobalOutlined style={{ color: "#52c41a", marginRight: 8 }} />,
      items: [
        {
          key: "flag_multicurrency",
          label: "Multi-Currency Transactions",
          desc: "Allow transactions in custom international currencies (USD, KHR, THB, EUR) with dynamic conversion rates.",
          category: "Finance"
        },
        {
          key: "flag_offline_mode",
          label: "Local Offline Cache Mode",
          desc: "Enable local IndexedDB caching so cashiers can proceed with orders even if local Wi-Fi or internet connection is completely severed.",
          category: "Core"
        }
      ]
    },
    {
      title: "Security & Interface customisation",
      icon: <LockOutlined style={{ color: "#722ed1", marginRight: 8 }} />,
      items: [
        {
          key: "flag_biometric_login",
          label: "Biometric Fingerprint Authentication",
          desc: "Require cashier fingerprint scan confirmation for high-value orders, adjustments, or manual invoice deletions.",
          category: "Security"
        },
        {
          key: "flag_dark_mode_auto",
          label: "Automatic Dark Mode Detection",
          desc: "Synchronize application color schemes with the cashier device's system dark mode schedule dynamically.",
          category: "UI"
        },
        {
          key: "flag_audit_ledger",
          label: "Tamper-Proof Audit Cryptography",
          desc: "Generate SHA-256 cryptographic signatures for invoice entries, rendering audit logs completely immutable.",
          category: "Audit"
        }
      ]
    }
  ];

  return (
    <div style={{ padding: "20px 0" }}>
      {/* Header Section */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ color: "#1e4a2d", margin: 0 }}>
            <ControlOutlined style={{ marginRight: 8 }} /> Feature Flags Management
          </Title>
          <Paragraph style={{ color: "#666", marginTop: 4 }}>
            Control rollout toggles and system-wide feature flags globally for all business tenants.
          </Paragraph>
        </div>
        <Button 
          type="primary" 
          icon={<SaveOutlined />} 
          loading={saving}
          onClick={handleSave}
          style={{ backgroundColor: "#1e4a2d", borderColor: "#1e4a2d" }}
        >
          Save Configuration
        </Button>
      </div>

      <Alert 
        message="Important Note"
        description="Feature flag modifications apply globally. Toggling beta features may affect checkout rendering speeds or local client caches. Proceed with caution."
        type="warning"
        showIcon
        icon={<WarningOutlined />}
        style={{ marginBottom: 24, borderRadius: 8 }}
      />

      <Row gutter={[24, 24]}>
        {flagGroups.map((group, gIdx) => (
          <Col span={24} key={gIdx}>
            <Card 
              bordered={false} 
              className="shadow-sm" 
              style={{ borderRadius: 12 }}
              title={
                <span style={{ display: "flex", alignItems: "center", fontSize: "16px", fontWeight: "bold" }}>
                  {group.icon}
                  {group.title}
                </span>
              }
            >
              <Row gutter={[16, 24]}>
                {group.items.map((item, iIdx) => {
                  const isActive = flags[item.key] === "true";
                  return (
                    <Col span={24} key={iIdx}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ paddingRight: 24 }}>
                          <Space size={8} style={{ marginBottom: 4 }}>
                            <Text strong style={{ fontSize: "14px" }}>{item.label}</Text>
                            <Tag color={isActive ? "success" : "default"}>
                              {isActive ? "ACTIVE" : "INACTIVE"}
                            </Tag>
                          </Space>
                          <Paragraph style={{ color: "#777", fontSize: "12px", margin: 0 }}>
                            {item.desc}
                          </Paragraph>
                        </div>
                        <Switch 
                          checked={isActive} 
                          onChange={(checked) => handleToggle(item.key, checked)}
                          style={isActive ? { backgroundColor: "#52c41a" } : {}}
                        />
                      </div>
                      {iIdx < group.items.length - 1 && <Divider style={{ margin: "16px 0" }} />}
                    </Col>
                  );
                })}
              </Row>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default FeatureFlagsPage;
