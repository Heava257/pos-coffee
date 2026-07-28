import React, { useState, useEffect } from "react";
import { Card, Table, Tag, Badge, Button, Typography, message } from "antd";
import { HistoryOutlined, SyncOutlined } from "@ant-design/icons";
import { request } from "@/shared/utils/helper";

const { Title, Text } = Typography;

const DevOpsDeploymentHistoryPage = () => {
  const [commits, setCommits] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCommits();
  }, []);

  const fetchCommits = async () => {
    setLoading(true);
    try {
      const res = await request("devops", "get");
      if (res && res.success) {
        setCommits(res.commits || []);
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to load deployment history");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-body page-container" style={{ padding: '24px' }}>
      <div style={{ marginBottom: 32 }}>
        <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
          <HistoryOutlined /> Deployment History
        </Title>
        <Text type="secondary">
          Track server deployments, automated CI/CD logs, and rollback controls.
        </Text>
      </div>

      <Card bordered={false} style={{ borderRadius: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <Text strong style={{ fontSize: 16 }}>CI/CD Builds (Git Log)</Text>
          <Button type="primary" icon={<SyncOutlined />} onClick={fetchCommits} loading={loading}>Trigger Deployment</Button>
        </div>
        <Table
          dataSource={commits}
          loading={loading}
          pagination={false}
          columns={[
            { title: "Commit Hash", dataIndex: "ver", render: text => <Tag color="blue">{text}</Tag> },
            { title: "Branch", dataIndex: "branch", render: text => <Tag>{text}</Tag> },
            { title: "Commit Message", dataIndex: "commit" },
            { title: "Author", dataIndex: "author" },
            { title: "Duration", dataIndex: "dur" },
            { title: "Date / Time", dataIndex: "date" },
            { 
              title: "Status", 
              dataIndex: "status", 
              render: status => (
                <Badge status={status === "success" ? "success" : "error"} text={status.toUpperCase()} />
              ) 
            },
            {
              title: "Action",
              render: (_, record) => (
                <Button size="small" type="link" onClick={() => message.success(`Rolling back to commit ${record.ver}...`)}>Rollback</Button>
              )
            }
          ]}
        />
      </Card>
    </div>
  );
};

export default DevOpsDeploymentHistoryPage;
