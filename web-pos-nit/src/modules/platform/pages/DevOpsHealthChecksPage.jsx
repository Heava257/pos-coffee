import React, { useState, useEffect } from "react";
import { Card, Row, Col, Tag, Typography, message, Spin } from "antd";
import { HeartOutlined } from "@ant-design/icons";
import { request } from "@/shared/utils/helper";

const { Title, Text } = Typography;

const DevOpsHealthChecksPage = () => {
  const [healths, setHealths] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchHealths();
  }, []);

  const fetchHealths = async () => {
    setLoading(true);
    try {
      const res = await request("devops", "get");
      if (res && res.success) {
        setHealths(res.healths || []);
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to load health check stats");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-body page-container" style={{ padding: '24px' }}>
      <div style={{ marginBottom: 32 }}>
        <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
          <HeartOutlined /> System Health Checks
        </Title>
        <Text type="secondary">
          Real-time health status of database nodes, email servers, and cache layers.
        </Text>
      </div>

      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          {healths.map((h, i) => (
            <Col xs={24} sm={12} md={8} key={i}>
              <Card bordered={false} style={{ borderRadius: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Text strong>{h.name}</Text>
                  <Tag color={h.status === "HEALTHY" ? "green" : "red"}>{h.status}</Tag>
                </div>
                <div style={{ marginTop: 12 }}>
                  <Text type="secondary">Latency / Metrics: </Text>
                  <Text strong style={{ color: h.status === "HEALTHY" ? "var(--theme-accent-green)" : "#ff4d4f" }}>{h.value}</Text>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Spin>
    </div>
  );
};

export default DevOpsHealthChecksPage;
