import React, { useState, useEffect } from "react";
import { Card, Row, Col, Progress, Tag, Typography, Button, Space, Statistic, Spin } from "antd";
import { DashboardOutlined, ReloadOutlined, DatabaseOutlined, BugOutlined, HourglassOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { request } from "@/shared/utils/helper";

const { Title, Text, Paragraph } = Typography;

const InfrastructureMonitoringPage = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [polling, setPolling] = useState(true);

  const fetchMetrics = async (isFirstLoad = false) => {
    if (isFirstLoad) setLoading(true);
    try {
      const res = await request("security/server-status", "get");
      if (res) {
        setMetrics(res);
      }
    } catch (err) {
      console.error("Failed to load server infrastructure metrics:", err);
    } finally {
      if (isFirstLoad) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics(true);
  }, []);

  // Set up 3-second auto-polling
  useEffect(() => {
    if (!polling) return;
    const interval = setInterval(() => {
      fetchMetrics(false);
    }, 3000);
    return () => clearInterval(interval);
  }, [polling]);

  const formatUptime = (seconds) => {
    if (!seconds) return "0s";
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    parts.push(`${s}s`);
    return parts.join(" ");
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "100px 0" }}>
        <Spin size="large" tip="Loading System Telemetry..." />
      </div>
    );
  }

  const { cpu, ram, redis, database, uptime_seconds } = metrics || {
    cpu: { cores: 0, usage_pct: 0, load_avg: [0, 0, 0] },
    ram: { total_mb: 0, used_mb: 0, free_mb: 0, usage_pct: 0, process_rss_mb: 0 },
    redis: { status: "disconnected" },
    database: { status: "healthy", latency_ms: 0 },
    uptime_seconds: 0
  };

  // Determine progress colors
  const getProgressColor = (pct) => {
    if (pct < 60) return "#52c41a"; // green
    if (pct < 85) return "#faad14"; // warning/orange
    return "#f5222d"; // critical/red
  };

  return (
    <div style={{ padding: "20px 0" }}>
      {/* Header section */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ color: "#1e4a2d", margin: 0 }}>
            <DashboardOutlined style={{ marginRight: 8 }} /> Infrastructure Monitoring
          </Title>
          <Paragraph style={{ color: "#666", marginTop: 4 }}>
            Monitor physical CPU cores, RAM allocation, Redis connection state, and DB database latency in real-time.
          </Paragraph>
        </div>
        <Space>
          <Button 
            type={polling ? "primary" : "default"} 
            onClick={() => setPolling(!polling)}
            style={polling ? { backgroundColor: "#1e4a2d", borderColor: "#1e4a2d" } : {}}
          >
            {polling ? "Auto Polling [Active]" : "Resume Polling"}
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => fetchMetrics(false)}>
            Force Refresh
          </Button>
        </Space>
      </div>

      <Row gutter={[24, 24]}>
        {/* CPU Telemetry Card */}
        <Col xs={24} lg={12}>
          <Card bordered={false} className="shadow-sm" style={{ borderRadius: 12, height: "100%" }} title="CPU Telemetry">
            <Row gutter={16} align="middle">
              <Col span={10} style={{ textAlign: "center" }}>
                <Progress 
                  type="dashboard" 
                  percent={cpu.usage_pct} 
                  strokeColor={getProgressColor(cpu.usage_pct)}
                  width={140}
                  strokeWidth={8}
                />
              </Col>
              <Col span={14}>
                <Space direction="vertical" size={8} style={{ width: "100%" }}>
                  <div>
                    <Text type="secondary">CPU Processing Load</Text>
                    <div style={{ fontSize: "20px", fontWeight: "bold" }}>{cpu.usage_pct}% <span style={{ fontSize: "12px", fontWeight: "normal", color: "#888" }}>of total capacity</span></div>
                  </div>
                  <Row gutter={8}>
                    <Col span={12}>
                      <Statistic title="CPU Cores" value={cpu.cores} suffix="Cores" valueStyle={{ fontSize: "16px" }} />
                    </Col>
                    <Col span={12}>
                      <Statistic title="1-Min Load" value={parseFloat(cpu.load_avg[0]).toFixed(2)} valueStyle={{ fontSize: "16px" }} />
                    </Col>
                  </Row>
                </Space>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* RAM Telemetry Card */}
        <Col xs={24} lg={12}>
          <Card bordered={false} className="shadow-sm" style={{ borderRadius: 12, height: "100%" }} title="Memory Telemetry">
            <Row gutter={16} align="middle">
              <Col span={10} style={{ textAlign: "center" }}>
                <Progress 
                  type="dashboard" 
                  percent={ram.usage_pct} 
                  strokeColor={getProgressColor(ram.usage_pct)}
                  width={140}
                  strokeWidth={8}
                />
              </Col>
              <Col span={14}>
                <Space direction="vertical" size={6} style={{ width: "100%" }}>
                  <div>
                    <Text type="secondary">Physical Memory Usage</Text>
                    <div style={{ fontSize: "20px", fontWeight: "bold" }}>{ram.used_mb} MB <span style={{ fontSize: "12px", fontWeight: "normal", color: "#888" }}>/ {ram.total_mb} MB</span></div>
                  </div>
                  <Row gutter={8}>
                    <Col span={12}>
                      <Statistic title="Node.js RSS" value={ram.process_rss_mb} suffix="MB" valueStyle={{ fontSize: "16px" }} />
                    </Col>
                    <Col span={12}>
                      <Statistic title="Free Memory" value={ram.free_mb} suffix="MB" valueStyle={{ fontSize: "16px" }} />
                    </Col>
                  </Row>
                </Space>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Network & Infrastructure Health Services */}
        <Col xs={24} md={8}>
          <Card bordered={false} className="shadow-sm" style={{ borderRadius: 12 }} title="Database Engine">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Text strong><DatabaseOutlined style={{ marginRight: 8 }} /> MySQL Status</Text>
              <Tag color={database.status === "healthy" ? "success" : "error"}>{database.status.toUpperCase()}</Tag>
            </div>
            <Statistic title="DB Query Latency" value={database.latency_ms} suffix="ms" valueStyle={{ color: database.latency_ms > 100 ? "#cf1322" : "#3f8600" }} />
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card bordered={false} className="shadow-sm" style={{ borderRadius: 12 }} title="Cache Engine">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Text strong><BugOutlined style={{ marginRight: 8 }} /> Redis Cache</Text>
              <Tag color={redis.status === "healthy" ? "success" : "default"}>{redis.status.toUpperCase()}</Tag>
            </div>
            <Text type="secondary" style={{ fontSize: "12px" }}>
              Active connections used for API rate limiting and token session revocation caching.
            </Text>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card bordered={false} className="shadow-sm" style={{ borderRadius: 12 }} title="System Availability">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Text strong><HourglassOutlined style={{ marginRight: 8 }} /> Server Uptime</Text>
              <Tag color="processing">ONLINE</Tag>
            </div>
            <div style={{ fontSize: "20px", fontWeight: "bold", color: "#1e4a2d", marginTop: 4 }}>
              {formatUptime(uptime_seconds)}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default InfrastructureMonitoringPage;
