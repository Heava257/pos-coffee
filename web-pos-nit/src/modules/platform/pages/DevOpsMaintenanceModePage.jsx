import React, { useState, useEffect } from "react";
import { Card, Row, Col, Switch, Alert, Input, Button, Typography, message, Spin, Space } from "antd";
import { WarningOutlined } from "@ant-design/icons";
import { request } from "@/shared/utils/helper";

const { Title, Text, Paragraph } = Typography;

const DevOpsMaintenanceModePage = () => {
  const [maintenanceActive, setMaintenanceActive] = useState(false);
  const [maintenanceMsg, setMaintenanceMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMaintenance();
  }, []);

  const fetchMaintenance = async () => {
    setLoading(true);
    try {
      const res = await request("devops", "get");
      if (res && res.success) {
        setMaintenanceActive(!!res.maintenance?.active);
        setMaintenanceMsg(res.maintenance?.message || "");
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to load maintenance configuration");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMaintenance = async (checked) => {
    setSaving(true);
    try {
      const res = await request("devops/maintenance", "put", {
        active: checked,
        message: maintenanceMsg
      });
      if (res && res.success) {
        setMaintenanceActive(checked);
        message.success(`Maintenance Mode ${checked ? "ACTIVATED" : "DEACTIVATED"}`);
      } else {
        message.error("Failed to update Maintenance Mode");
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to execute Maintenance Mode change");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMaintenanceMsg = async () => {
    setSaving(true);
    try {
      const res = await request("devops/maintenance", "put", {
        active: maintenanceActive,
        message: maintenanceMsg
      });
      if (res && res.success) {
        message.success("Maintenance alert message updated successfully");
      } else {
        message.error("Failed to update alert message");
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to update configuration");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-body page-container" style={{ padding: '24px' }}>
      <div style={{ marginBottom: 32 }}>
        <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
          <WarningOutlined /> Maintenance Mode Controller
        </Title>
        <Text type="secondary">
          Trigger platform maintenance blackout and configure custom ETA alerts.
        </Text>
      </div>

      <Spin spinning={loading}>
        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <Card title="Active State" bordered={false} style={{ borderRadius: 12 }}>
              <Space direction="vertical" size={16} style={{ width: "100%" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <Text strong style={{ fontSize: 16 }}>Blackout Status</Text>
                    <Paragraph style={{ margin: 0, color: "#888" }}>Enable to block access for all tenants</Paragraph>
                  </div>
                  <Switch 
                    checked={maintenanceActive} 
                    loading={saving}
                    onChange={handleToggleMaintenance}
                    checkedChildren="Active"
                    unCheckedChildren="Inactive"
                  />
                </div>
                {maintenanceActive ? (
                  <Alert message="System is currently offline for maintenance." type="error" showIcon />
                ) : (
                  <Alert message="System is running normally." type="success" showIcon />
                )}
              </Space>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="Alert Message Configuration" bordered={false} style={{ borderRadius: 12 }}>
              <Space direction="vertical" size={12} style={{ width: "100%" }}>
                <label style={{ fontWeight: 600 }}>Message shown to users:</label>
                <Input.TextArea 
                  rows={4} 
                  value={maintenanceMsg} 
                  onChange={e => setMaintenanceMsg(e.target.value)} 
                  style={{ borderRadius: 8 }}
                />
                <Button type="primary" block loading={saving} onClick={handleSaveMaintenanceMsg}>Save Configuration</Button>
              </Space>
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
};

export default DevOpsMaintenanceModePage;
