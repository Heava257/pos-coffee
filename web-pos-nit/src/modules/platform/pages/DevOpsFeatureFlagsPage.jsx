import React, { useState, useEffect } from "react";
import { Card, Table, Switch, Typography, message } from "antd";
import { AppstoreOutlined } from "@ant-design/icons";
import { request } from "@/shared/utils/helper";

const { Title, Text } = Typography;

const DevOpsFeatureFlagsPage = () => {
  const [featureFlags, setFeatureFlags] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFlags();
  }, []);

  const fetchFlags = async () => {
    setLoading(true);
    try {
      const res = await request("devops", "get");
      if (res && res.success) {
        setFeatureFlags(res.featureFlags || []);
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to load feature flags");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeatureFlag = async (raw_key, checked) => {
    try {
      const res = await request("devops/feature-flag", "put", {
        raw_key,
        active: checked
      });
      if (res && res.success) {
        setFeatureFlags(prev => prev.map(f => f.raw_key === raw_key ? { ...f, active: checked } : f));
        message.success(`Feature Flag ${raw_key.toUpperCase()} successfully updated`);
      } else {
        message.error("Failed to update feature flag state");
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to execute toggle command");
    }
  };

  return (
    <div className="admin-body page-container" style={{ padding: '24px' }}>
      <div style={{ marginBottom: 32 }}>
        <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
          <AppstoreOutlined /> Advanced Feature Flags
        </Title>
        <Text type="secondary">
          Control conditional features runtime toggles for A/B testing.
        </Text>
      </div>

      <Card bordered={false} style={{ borderRadius: 12 }}>
        <Table
          dataSource={featureFlags}
          loading={loading}
          pagination={false}
          columns={[
            { title: "Feature Name", dataIndex: "name", render: text => <Text strong>{text}</Text> },
            { title: "Config key", dataIndex: "raw_key", render: text => <Text code>{text}</Text> },
            { title: "Description", dataIndex: "desc" },
            { 
              title: "State", 
              dataIndex: "active", 
              render: (active, record) => (
                <Switch 
                  checked={active} 
                  onChange={(checked) => handleToggleFeatureFlag(record.raw_key, checked)}
                />
              ) 
            }
          ]}
        />
      </Card>
    </div>
  );
};

export default DevOpsFeatureFlagsPage;
