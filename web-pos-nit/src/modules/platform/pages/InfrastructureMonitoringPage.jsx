import React, { useState, useEffect, useRef } from "react";
import { Card, Row, Col, Progress, Tag, Typography, Button, Space, Statistic, Spin, Divider } from "antd";
import { DashboardOutlined, ReloadOutlined, DatabaseOutlined, BugOutlined, HourglassOutlined, InfoCircleOutlined, CodeOutlined, GlobalOutlined } from "@ant-design/icons";
import { request } from "@/shared/utils/helper";

const { Title, Text, Paragraph } = Typography;

const InfrastructureMonitoringPage = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [polling, setPolling] = useState(true);
  
  // Historical data for live charts (stores last 15 points)
  const [cpuHistory, setCpuHistory] = useState(new Array(15).fill(0));
  const [ramHistory, setRamHistory] = useState(new Array(15).fill(0));
  
  // Real-time log terminal state
  const [logs, setLogs] = useState([]);
  const terminalEndRef = useRef(null);

  const formatTime = () => {
    const d = new Date();
    return d.toTimeString().split(" ")[0];
  };

  const fetchMetrics = async (isFirstLoad = false) => {
    if (isFirstLoad) setLoading(true);
    try {
      const res = await request("security/server-status", "get");
      if (res) {
        setMetrics(res);
        
        // Update history arrays
        setCpuHistory(prev => [...prev.slice(1), res.cpu.usage_pct]);
        setRamHistory(prev => [...prev.slice(1), res.ram.usage_pct]);

        // Append log line
        const timestamp = formatTime();
        let logType = "INF";
        let logColor = "#52c41a"; // green
        
        if (res.cpu.usage_pct > 80 || res.ram.usage_pct > 85) {
          logType = "WRN";
          logColor = "#faad14"; // orange
        }

        const logMsg = `[${timestamp}] [${logType}] Telemetry: CPU ${res.cpu.usage_pct}% | RAM ${res.ram.usage_pct}% | DB Latency ${res.database.latency_ms}ms | Redis: ${res.redis.status.toUpperCase()}`;
        setLogs(prev => [...prev.slice(-49), { text: logMsg, color: logColor }]); // Keep last 50 logs
      }
    } catch (err) {
      console.error("Failed to load server infrastructure metrics:", err);
      const timestamp = formatTime();
      setLogs(prev => [...prev.slice(-49), { text: `[${timestamp}] [ERR] Telemetry request failed: connection refused.`, color: "#f5222d" }]);
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

  // Auto scroll terminal to bottom
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

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

  const { cpu, ram, redis, database, os_info, uptime_seconds } = metrics || {
    cpu: { cores: 0, usage_pct: 0, load_avg: [0, 0, 0], model: "Unknown" },
    ram: { total_mb: 0, used_mb: 0, free_mb: 0, usage_pct: 0, process_rss_mb: 0 },
    redis: { status: "disconnected" },
    database: { status: "healthy", latency_ms: 0 },
    os_info: { platform: "Unknown", release: "", hostname: "Unknown", arch: "" },
    uptime_seconds: 0
  };

  const getProgressColor = (pct) => {
    if (pct < 60) return "#52c41a"; // green
    if (pct < 85) return "#faad14"; // orange
    return "#f5222d"; // red
  };

  // Generate SVG Path for historical charts
  const generateSvgPath = (data) => {
    const width = 300;
    const height = 60;
    const padding = 5;
    const pointsCount = data.length;
    const step = width / (pointsCount - 1);
    
    const points = data.map((val, idx) => {
      const x = idx * step;
      // Map 0-100% to height - padding (0 is top, so we subtract from height)
      const y = height - padding - (val / 100) * (height - 2 * padding);
      return `${x},${y}`;
    });

    return `M ${points.join(" L ")}`;
  };

  return (
    <div style={{ padding: "20px 0" }}>
      {/* Header section */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ color: "var(--theme-dark-green, #1e4a2d)", margin: 0 }}>
            <DashboardOutlined style={{ marginRight: 8 }} /> Infrastructure Monitoring
          </Title>
          <Paragraph style={{ color: "inherit", opacity: 0.8, marginTop: 4 }}>
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
              <Col span={9} style={{ textAlign: "center" }}>
                <Progress 
                  type="dashboard" 
                  percent={cpu.usage_pct} 
                  strokeColor={getProgressColor(cpu.usage_pct)}
                  width={130}
                  strokeWidth={8}
                />
              </Col>
              <Col span={15}>
                <Space direction="vertical" size={8} style={{ width: "100%" }}>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>CPU Processing Load</Text>
                    <div style={{ fontSize: "20px", fontWeight: "bold", color: "var(--theme-accent-green, #1e4a2d)" }}>{cpu.usage_pct}%</div>
                  </div>

                  {/* Dynamic Neon Mini-Line Chart */}
                  <div style={{ height: 60, width: "100%", background: "var(--theme-milk-bg)", borderRadius: 8, overflow: "hidden", position: "relative" }}>
                    <svg width="100%" height="100%" viewBox="0 0 300 60" preserveAspectRatio="none" style={{ display: "block" }}>
                      <defs>
                        <linearGradient id="cpuGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#1890ff" stopOpacity="0.2" />
                          <stop offset="100%" stopColor="#1890ff" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      {/* Area Fill */}
                      <path d={`${generateSvgPath(cpuHistory)} L 300,60 L 0,60 Z`} fill="url(#cpuGrad)" />
                      {/* Glow Line */}
                      <path d={generateSvgPath(cpuHistory)} fill="none" stroke="#1890ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>

                  <Row gutter={8} style={{ marginTop: 4 }}>
                    <Col span={12}>
                      <Statistic title="CPU Cores" value={cpu.cores} suffix="Cores" valueStyle={{ fontSize: "14px" }} />
                    </Col>
                    <Col span={12}>
                      <Statistic title="1-Min Load" value={parseFloat(cpu.load_avg[0]).toFixed(2)} valueStyle={{ fontSize: "14px" }} />
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
              <Col span={9} style={{ textAlign: "center" }}>
                <Progress 
                  type="dashboard" 
                  percent={ram.usage_pct} 
                  strokeColor={getProgressColor(ram.usage_pct)}
                  width={130}
                  strokeWidth={8}
                />
              </Col>
              <Col span={15}>
                <Space direction="vertical" size={6} style={{ width: "100%" }}>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>Physical Memory Usage</Text>
                    <div style={{ fontSize: "20px", fontWeight: "bold", color: "var(--theme-accent-green, #1e4a2d)" }}>{ram.used_mb} MB <span style={{ fontSize: "12px", fontWeight: "normal", color: "#888" }}>/ {ram.total_mb} MB</span></div>
                  </div>

                  {/* Dynamic Neon Mini-Line Chart */}
                  <div style={{ height: 60, width: "100%", background: "var(--theme-milk-bg)", borderRadius: 8, overflow: "hidden", position: "relative" }}>
                    <svg width="100%" height="100%" viewBox="0 0 300 60" preserveAspectRatio="none" style={{ display: "block" }}>
                      <defs>
                        <linearGradient id="ramGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#faad14" stopOpacity="0.2" />
                          <stop offset="100%" stopColor="#faad14" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      {/* Area Fill */}
                      <path d={`${generateSvgPath(ramHistory)} L 300,60 L 0,60 Z`} fill="url(#ramGrad)" />
                      {/* Glow Line */}
                      <path d={generateSvgPath(ramHistory)} fill="none" stroke="#faad14" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>

                  <Row gutter={8} style={{ marginTop: 4 }}>
                    <Col span={12}>
                      <Statistic title="Node.js RSS" value={ram.process_rss_mb} suffix="MB" valueStyle={{ fontSize: "14px" }} />
                    </Col>
                    <Col span={12}>
                      <Statistic title="Free Memory" value={ram.free_mb} suffix="MB" valueStyle={{ fontSize: "14px" }} />
                    </Col>
                  </Row>
                </Space>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Server & OS Host Specifications */}
        <Col xs={24} lg={16}>
          <Card bordered={false} className="shadow-sm" style={{ borderRadius: 12 }} title={<span><GlobalOutlined style={{ marginRight: 8, color: "#1e4a2d" }} /><b>Host Specifications</b></span>}>
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={6}>
                <Statistic title="Processor Model" value={cpu.model.replace(/\((R)\)|\((TM)\)/g, "")} valueStyle={{ fontSize: "13px", fontWeight: 600, color: "#333" }} />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic title="OS Platform" value={`${os_info.platform.toUpperCase()} (${os_info.arch})`} valueStyle={{ fontSize: "13px", fontWeight: 600, color: "#333" }} />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic title="Host Name" value={os_info.hostname} valueStyle={{ fontSize: "13px", fontWeight: 600, color: "#333" }} />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic title="OS Release" value={os_info.release} valueStyle={{ fontSize: "13px", fontWeight: 600, color: "#333" }} />
              </Col>
            </Row>
          </Card>
        </Col>

        {/* System Availability / Uptime */}
        <Col xs={24} lg={8}>
          <Card bordered={false} className="shadow-sm" style={{ borderRadius: 12, height: "100%" }} title="Server Availability">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Text strong><HourglassOutlined style={{ marginRight: 8, color: "#1e4a2d" }} /> Availability Uptime</Text>
              <Tag color="processing">ONLINE</Tag>
            </div>
            <div style={{ fontSize: "20px", fontWeight: "bold", color: "#1e4a2d", marginTop: 4 }}>
              {formatUptime(uptime_seconds)}
            </div>
          </Card>
        </Col>

        {/* Database & Cache Engine status */}
        <Col xs={24} md={12}>
          <Card 
            bordered={false} 
            className="shadow-sm" 
            style={{ borderRadius: 12, height: "100%", display: "flex", flexDirection: "column" }}
            bodyStyle={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}
            title="Database Engine"
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <Text strong><DatabaseOutlined style={{ marginRight: 8, color: "#1e4a2d" }} /> MySQL Connection</Text>
                <Tag color={database.status === "healthy" ? "success" : "error"}>{database.status.toUpperCase()}</Tag>
              </div>
              <Statistic title="DB Query Latency" value={database.latency_ms} suffix="ms" valueStyle={{ color: database.latency_ms > 100 ? "#cf1322" : "#3f8600" }} />
            </div>
            <Text type="secondary" style={{ fontSize: "11px", display: "block", marginTop: 12 }}>
              Active relational database storage for multi-tenant SaaS schema, order processing, and catalogs.
            </Text>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card 
            bordered={false} 
            className="shadow-sm" 
            style={{ borderRadius: 12, height: "100%", display: "flex", flexDirection: "column" }}
            bodyStyle={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}
            title="Cache Engine"
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <Text strong><BugOutlined style={{ marginRight: 8, color: "#1e4a2d" }} /> Redis Cache</Text>
                <Tag color={redis.status === "healthy" ? "success" : "default"}>{redis.status.toUpperCase()}</Tag>
              </div>
              <Statistic 
                title="Cache Latency" 
                value={redis.status === "healthy" ? 0 : "N/A"} 
                suffix={redis.status === "healthy" ? "ms" : ""} 
                valueStyle={{ color: redis.status === "healthy" ? "#3f8600" : "#888" }} 
              />
            </div>
            <Text type="secondary" style={{ fontSize: "11px", display: "block", marginTop: 12 }}>
              Active memory cache used for API rate limiting, session revocation caching, and blacklists.
            </Text>
          </Card>
        </Col>

        {/* Live Streaming Console Terminal */}
        <Col span={24}>
          <Card 
            bordered={false} 
            className="shadow-sm" 
            style={{ borderRadius: 12, background: "#0a0a0a" }} 
            title={<span style={{ color: "#fff" }}><CodeOutlined style={{ marginRight: 8, color: "#52c41a" }} /><b>Live Telemetry Console Log Stream</b></span>}
          >
            <div style={{ 
              height: "150px", 
              overflowY: "auto", 
              fontFamily: "Consolas, Monaco, monospace", 
              fontSize: "12px", 
              padding: "10px", 
              color: "#aaa",
              background: "#050505",
              borderRadius: 6
            }}>
              {logs.map((log, idx) => (
                <div key={idx} style={{ color: log.color, marginBottom: 4 }}>
                  {log.text}
                </div>
              ))}
              <div ref={terminalEndRef} />
            </div>
          </Card>
        </Col>

      </Row>
    </div>
  );
};

export default InfrastructureMonitoringPage;
