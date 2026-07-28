import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Row, Col, Typography, Space, Button, Progress, Alert, Spin } from "antd";
import { 
  CloudServerOutlined, 
  SyncOutlined,
  HistoryOutlined,
  SlidersOutlined,
  ClusterOutlined,
  HeartOutlined,
  DatabaseOutlined,
  PartitionOutlined,
  LineChartOutlined,
  AppstoreOutlined,
  WarningOutlined
} from "@ant-design/icons";
import { request } from "@/shared/utils/helper";

const { Title, Text, Paragraph } = Typography;

const DevOpsCenterPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState({
    packageVersion: "v2.0.4",
    cpuUsage: 14,
    memUsage: 62,
    activeWorkers: 3,
    healthyServices: "5/5"
  });

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await request("devops", "get");
      if (res && res.success) {
        setMetrics(prev => ({
          ...prev,
          packageVersion: res.packageVersion || "v2.0.4",
          activeWorkers: res.queueStats?.activeWorkers || 3
        }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-body page-container" style={{ padding: '24px' }}>
      <div style={{ marginBottom: 32 }}>
        <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
          <CloudServerOutlined /> DevOps Control Center
        </Title>
        <Text type="secondary">
          Global infrastructure status, deployment summaries, and cluster telemetry.
        </Text>
      </div>

      <Spin spinning={loading}>
        <Row gutter={[20, 20]}>
          <Col xs={24} md={8}>
            <Card title="Infrastructure Load" bordered={false}>
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text>CPU Load</Text>
                    <Text strong>{metrics.cpuUsage}%</Text>
                  </div>
                  <Progress percent={metrics.cpuUsage} size="small" />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text>Memory Usage</Text>
                    <Text strong>{metrics.memUsage}%</Text>
                  </div>
                  <Progress percent={metrics.memUsage} size="small" strokeColor="#eab308" />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
                  <Text>Services Health</Text>
                  <Tag color="green">{metrics.healthyServices} HEALTHY</Tag>
                </div>
              </Space>
            </Card>
          </Col>

          <Col xs={24} md={16}>
            <Card title="DevOps Subsystem Navigation" bordered={false}>
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <Button block icon={<HistoryOutlined />} onClick={() => navigate("/devops-deployment-history")}>
                    Deployment History
                  </Button>
                </Col>
                <Col span={8}>
                  <Button block icon={<SlidersOutlined />} onClick={() => navigate("/devops-version-management")}>
                    Version Controller
                  </Button>
                </Col>
                <Col span={8}>
                  <Button block icon={<ClusterOutlined />} onClick={() => navigate("/devops-environment")}>
                    Environment Config
                  </Button>
                </Col>
                <Col span={8}>
                  <Button block icon={<HeartOutlined />} onClick={() => navigate("/devops-health-checks")}>
                    Health Monitor
                  </Button>
                </Col>
                <Col span={8}>
                  <Button block icon={<DatabaseOutlined />} onClick={() => navigate("/devops-docker-status")}>
                    Docker Engines
                  </Button>
                </Col>
                <Col span={8}>
                  <Button block icon={<PartitionOutlined />} onClick={() => navigate("/devops-kubernetes-status")}>
                    K8s Cluster
                  </Button>
                </Col>
                <Col span={8}>
                  <Button block icon={<LineChartOutlined />} onClick={() => navigate("/devops-queue-monitoring")}>
                    Queue Engine
                  </Button>
                </Col>
                <Col span={8}>
                  <Button block icon={<AppstoreOutlined />} onClick={() => navigate("/devops-feature-flags")}>
                    Feature Flags
                  </Button>
                </Col>
                <Col span={8}>
                  <Button danger block icon={<WarningOutlined />} onClick={() => navigate("/devops-maintenance-mode")}>
                    Maintenance Mode
                  </Button>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
};

export default DevOpsCenterPage;
