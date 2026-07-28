import React, { useState, useEffect } from "react";
import { Card, Table, Typography, message } from "antd";
import { ClusterOutlined } from "@ant-design/icons";
import { request } from "@/shared/utils/helper";

const { Title, Text } = Typography;

const DevOpsEnvironmentPage = () => {
  const [envVars, setEnvVars] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEnv();
  }, []);

  const fetchEnv = async () => {
    setLoading(true);
    try {
      const res = await request("devops", "get");
      if (res && res.success) {
        setEnvVars(res.envVars || []);
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to load environment configuration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-body page-container" style={{ padding: '24px' }}>
      <div style={{ marginBottom: 32 }}>
        <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
          <ClusterOutlined /> Environment Configuration
        </Title>
        <Text type="secondary">
          Inspect global environment variables and microservices configurations.
        </Text>
      </div>

      <Card bordered={false} style={{ borderRadius: 12 }}>
        <Table
          dataSource={envVars}
          loading={loading}
          pagination={false}
          columns={[
            { title: "Variable Name", dataIndex: "name", render: text => <Text code>{text}</Text> },
            { title: "Current Value", dataIndex: "val" },
            { title: "Source Description", dataIndex: "source" }
          ]}
        />
      </Card>
    </div>
  );
};

export default DevOpsEnvironmentPage;
