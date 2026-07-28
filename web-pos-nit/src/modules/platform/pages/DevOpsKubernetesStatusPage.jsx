import React, { useState, useEffect } from "react";
import { Card, Table, Badge, Typography, message } from "antd";
import { PartitionOutlined } from "@ant-design/icons";
import { request } from "@/shared/utils/helper";

const { Title, Text } = Typography;

const DevOpsKubernetesStatusPage = () => {
  const [k8sStatus, setK8sStatus] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchK8s();
  }, []);

  const fetchK8s = async () => {
    setLoading(true);
    try {
      const res = await request("devops", "get");
      if (res && res.success) {
        setK8sStatus(res.k8sStatus || []);
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to load Kubernetes status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-body page-container" style={{ padding: '24px' }}>
      <div style={{ marginBottom: 32 }}>
        <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
          <PartitionOutlined /> Kubernetes Cluster Status
        </Title>
        <Text type="secondary">
          Monitor active K8s pods, deployments, replicas, and ingress controllers.
        </Text>
      </div>

      <Card bordered={false} style={{ borderRadius: 12 }}>
        <Table
          dataSource={k8sStatus}
          loading={loading}
          pagination={false}
          columns={[
            { title: "Pod Name", dataIndex: "name" },
            { title: "Age", dataIndex: "age" },
            { title: "Restarts", dataIndex: "restarts" },
            { 
              title: "Status", 
              dataIndex: "status", 
              render: s => <Badge status="success" text={s} /> 
            }
          ]}
        />
      </Card>
    </div>
  );
};

export default DevOpsKubernetesStatusPage;
