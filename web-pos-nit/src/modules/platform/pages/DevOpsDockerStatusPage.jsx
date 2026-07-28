import React, { useState, useEffect } from "react";
import { Card, Table, Badge, Typography, message } from "antd";
import { DatabaseOutlined } from "@ant-design/icons";
import { request } from "@/shared/utils/helper";

const { Title, Text } = Typography;

const DevOpsDockerStatusPage = () => {
  const [dockerStatus, setDockerStatus] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDocker();
  }, []);

  const fetchDocker = async () => {
    setLoading(true);
    try {
      const res = await request("devops", "get");
      if (res && res.success) {
        setDockerStatus(res.dockerStatus || []);
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to load Docker stats");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-body page-container" style={{ padding: '24px' }}>
      <div style={{ marginBottom: 32 }}>
        <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
          <DatabaseOutlined /> Docker Container Status
        </Title>
        <Text type="secondary">
          Monitor virtual Docker engines, container resources, and restart limits.
        </Text>
      </div>

      <Card bordered={false} style={{ borderRadius: 12 }}>
        <Table
          dataSource={dockerStatus}
          loading={loading}
          pagination={false}
          columns={[
            { title: "Container Name", dataIndex: "name", render: text => <Text strong>{text}</Text> },
            { title: "Container ID", dataIndex: "id", render: text => <Text code>{text}</Text> },
            { title: "CPU Usage", dataIndex: "cpu" },
            { title: "Memory Allocation", dataIndex: "mem" },
            { 
              title: "Status", 
              dataIndex: "status", 
              render: s => <Badge status="success" text={s.toUpperCase()} /> 
            }
          ]}
        />
      </Card>
    </div>
  );
};

export default DevOpsDockerStatusPage;
