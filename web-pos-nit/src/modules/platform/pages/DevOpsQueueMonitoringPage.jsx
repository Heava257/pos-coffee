import React, { useState, useEffect } from "react";
import { Card, Row, Col, Typography, Space, Progress, Alert, Spin, message } from "antd";
import { LineChartOutlined } from "@ant-design/icons";
import { request } from "@/shared/utils/helper";

const { Title, Text } = Typography;

const DevOpsQueueMonitoringPage = () => {
  const [queueStats, setQueueStats] = useState({
    activeQueues: [],
    waitingJobs: 0,
    activeWorkers: 0,
    failedJobs: 0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchQueues();
  }, []);

  const fetchQueues = async () => {
    setLoading(true);
    try {
      const res = await request("devops", "get");
      if (res && res.success && res.queueStats) {
        setQueueStats(res.queueStats);
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to load queue monitoring statistics");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-body page-container" style={{ padding: '24px' }}>
      <div style={{ marginBottom: 32 }}>
        <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
          <LineChartOutlined /> Queue Monitoring
        </Title>
        <Text type="secondary">
          Monitor active RabbitMQ/BullMQ jobs, consumer workers, and failed queues.
        </Text>
      </div>

      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card title="Active Message Queues" bordered={false} style={{ borderRadius: 12 }}>
              <Space direction="vertical" size={16} style={{ width: "100%" }}>
                {queueStats.activeQueues.map((q, idx) => (
                  <div key={idx}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <Text>{q.name}</Text>
                      <Text strong>{q.count} Jobs ({q.pct}%)</Text>
                    </div>
                    <Progress percent={q.pct} strokeColor="var(--theme-accent-green)" />
                  </div>
                ))}
                {queueStats.activeQueues.length === 0 && (
                  <Alert message="No active job queues running." type="info" showIcon />
                )}
              </Space>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="Queue Statistics" bordered={false} style={{ borderRadius: 12 }}>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Card size="small" style={{ background: "var(--theme-milk-bg)", border: "none" }}>
                    <Text type="secondary">Waiting Jobs</Text>
                    <Title level={4} style={{ margin: 0 }}>{queueStats.waitingJobs} Jobs</Title>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small" style={{ background: "var(--theme-milk-bg)", border: "none" }}>
                    <Text type="secondary">Active Workers</Text>
                    <Title level={4} style={{ margin: 0, color: "var(--theme-accent-green)" }}>{queueStats.activeWorkers} Active</Title>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small" style={{ background: "var(--theme-milk-bg)", border: "none" }}>
                    <Text type="secondary">Failed Jobs</Text>
                    <Title level={4} style={{ margin: 0, color: "#ff4d4f" }}>{queueStats.failedJobs} Failed</Title>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small" style={{ background: "var(--theme-milk-bg)", border: "none" }}>
                    <Text type="secondary">Avg Process Time</Text>
                    <Title level={4} style={{ margin: 0 }}>142 ms</Title>
                  </Card>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
};

export default DevOpsQueueMonitoringPage;
