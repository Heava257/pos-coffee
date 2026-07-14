import React, { useEffect, useState } from "react";
import { Table, Tag, Button, Modal, Input, Space, Card, Row, Col, Statistic, Tabs, Form, message, Popconfirm, Typography, Progress, Tooltip } from "antd";
import {
  SafetyCertificateOutlined,
  WarningOutlined,
  SearchOutlined,
  BlockOutlined,
  UnlockOutlined,
  ReloadOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  DesktopOutlined,
  DatabaseOutlined,
  DashboardOutlined,
  GlobalOutlined,
  UserDeleteOutlined,
  LaptopOutlined
} from "@ant-design/icons";
import { request } from "@/shared/utils/helper";
import { useLanguage, translations } from "@/app/store/language.store";
import dayjs from "dayjs";

const { Title, Paragraph, Text } = Typography;
const { TabPane } = Tabs;

const SecurityDashboardPage = () => {
  const { lang } = useLanguage();
  const t = translations[lang];

  // States
  const [logs, setLogs] = useState([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsPage, setLogsPage] = useState(1);
  const [logsLimit] = useState(15);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsSearch, setLogsSearch] = useState("");

  const [blockedIps, setBlockedIps] = useState([]);
  const [blockedLoading, setBlockedLoading] = useState(false);

  // New States for Server Status and Sessions
  const [serverStatus, setServerStatus] = useState(null);
  const [serverLoading, setServerLoading] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // Modal State for blocking IP
  const [blockModalVisible, setBlockModalVisible] = useState(false);
  const [blockForm] = Form.useForm();

  // Load Data
  const fetchLogs = async (page = 1, search = "") => {
    setLogsLoading(true);
    try {
      const res = await request(`securities/logs?page=${page}&limit=${logsLimit}&search=${search}`, "get");
      if (res && res.list) {
        setLogs(res.list);
        setLogsTotal(res.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLogsLoading(false);
    }
  };

  const fetchBlockedIps = async () => {
    setBlockedLoading(true);
    try {
      const res = await request("securities/blocked-ips", "get");
      if (res && res.list) {
        setBlockedIps(res.list);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBlockedLoading(false);
    }
  };

  const fetchServerStatus = async () => {
    setServerLoading(true);
    try {
      const res = await request("securities/server-status", "get");
      if (res) {
        setServerStatus(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setServerLoading(false);
    }
  };

  const fetchSessions = async () => {
    setSessionsLoading(true);
    try {
      const res = await request("securities/active-sessions", "get");
      if (res && res.list) {
        setSessions(res.list);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSessionsLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchLogs(logsPage, logsSearch);
    fetchBlockedIps();
    fetchServerStatus();
    fetchSessions();
  };

  useEffect(() => {
    fetchLogs(1, "");
    fetchBlockedIps();
    fetchServerStatus();
    fetchSessions();
  }, []);

  const handleLogsPageChange = (page) => {
    setLogsPage(page);
    fetchLogs(page, logsSearch);
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setLogsSearch(val);
    setLogsPage(1);
    fetchLogs(1, val);
  };

  // Block/Unblock Actions
  const handleBlockIp = async (values) => {
    try {
      const res = await request("securities/block-ip", "post", values);
      if (res && res.success) {
        message.success(res.message);
        setBlockModalVisible(false);
        blockForm.resetFields();
        handleRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnblockIp = async (ip) => {
    try {
      const res = await request("securities/unblock-ip", "post", { ip });
      if (res && res.success) {
        message.success(res.message);
        handleRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Revoke User Session (Force Logout)
  const handleRevokeSession = async (tokenUuid) => {
    try {
      const res = await request("securities/revoke-session", "post", { token_uuid: tokenUuid });
      if (res && res.success) {
        message.success(res.message);
        fetchSessions();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Format uptime to readable string
  const formatUptime = (seconds) => {
    if (!seconds) return "N/A";
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d}d ${h}h ${m}m`;
  };

  // Log Columns
  const logColumns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 60,
    },
    {
      title: "IP Address",
      dataIndex: "ip",
      key: "ip",
      render: (ip) => (
        <Text copyable code style={{ color: "#1e4a2d", fontWeight: "bold" }}>
          {ip}
        </Text>
      ),
    },
    {
      title: "Event Type",
      dataIndex: "event_type",
      key: "event_type",
      render: (type) => {
        let color = "blue";
        if (type === "rate_limit_blocked") color = "orange";
        if (type === "blocked_ip_access_attempt") color = "red";
        return <Tag color={color}>{type.toUpperCase().replace(/_/g, " ")}</Tag>;
      },
    },
    {
      title: "Endpoint",
      dataIndex: "endpoint",
      key: "endpoint",
      render: (end) => <Text code>{end || "N/A"}</Text>,
    },
    {
      title: "User Agent",
      dataIndex: "user_agent",
      key: "user_agent",
      ellipsis: true,
      render: (ua) => <span style={{ fontSize: "12px", color: "#666" }}>{ua || "N/A"}</span>,
    },
    {
      title: "Details",
      dataIndex: "details",
      key: "details",
      ellipsis: true,
      render: (det) => <span style={{ fontFamily: "monospace", fontSize: "11px" }}>{det || "N/A"}</span>,
    },
    {
      title: "Time",
      dataIndex: "created_at",
      key: "created_at",
      render: (time) => dayjs(time).format("YYYY-MM-DD HH:mm:ss"),
    },
    {
      title: "Action",
      key: "action",
      width: 100,
      render: (_, record) => {
        const isBlocked = blockedIps.some((b) => b.ip === record.ip);
        if (isBlocked) {
          return <Tag color="error">Blocked</Tag>;
        }
        return (
          <Button
            type="primary"
            danger
            size="small"
            icon={<BlockOutlined />}
            onClick={() => {
              blockForm.setFieldsValue({ ip: record.ip });
              setBlockModalVisible(true);
            }}
          >
            Block
          </Button>
        );
      },
    },
  ];

  // Blocked Columns
  const blockedColumns = [
    {
      title: "IP Address",
      dataIndex: "ip",
      key: "ip",
      render: (ip) => (
        <Text copyable code style={{ color: "#d32f2f", fontWeight: "bold" }}>
          {ip}
        </Text>
      ),
    },
    {
      title: "Reason",
      dataIndex: "reason",
      key: "reason",
      render: (reason) => reason || "Manual block",
    },
    {
      title: "Blocked Time",
      dataIndex: "created_at",
      key: "created_at",
      render: (time) => dayjs(time).format("YYYY-MM-DD HH:mm:ss"),
    },
    {
      title: "Action",
      key: "action",
      width: 150,
      render: (_, record) => (
        <Popconfirm
          title="Are you sure you want to unblock this IP?"
          onConfirm={() => handleUnblockIp(record.ip)}
          okText="Yes"
          cancelText="No"
        >
          <Button type="primary" size="small" icon={<UnlockOutlined />} style={{ backgroundColor: "#2e7d32", borderColor: "#2e7d32" }}>
            Unblock
          </Button>
        </Popconfirm>
      ),
    },
  ];

  // Active Sessions Columns
  const sessionColumns = [
    {
      title: "User",
      key: "user",
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: "bold", color: "#1e4a2d" }}>{record.user_name}</div>
          <div style={{ fontSize: "12px", color: "#666" }}>{record.user_email}</div>
        </div>
      ),
    },
    {
      title: "Business / Shop",
      dataIndex: "business_name",
      key: "business_name",
      render: (name) => <Tag color="purple">{name || "System"}</Tag>,
    },
    {
      title: "Role",
      dataIndex: "role_name",
      key: "role_name",
      render: (role) => <Tag color="blue">{role}</Tag>,
    },
    {
      title: "IP Address",
      dataIndex: "ip_address",
      key: "ip_address",
      render: (ip) => <Text code copyable>{ip}</Text>,
    },
    {
      title: "Device / Browser",
      dataIndex: "user_agent",
      key: "user_agent",
      ellipsis: true,
      render: (ua) => {
        let os = "Desktop/Browser";
        if (ua.toLowerCase().includes("android")) os = "Android App/Mobile";
        else if (ua.toLowerCase().includes("iphone") || ua.toLowerCase().includes("ipad")) os = "iOS App/Mobile";
        return (
          <Tooltip title={ua}>
            <span>
              <LaptopOutlined style={{ marginRight: "6px" }} />
              {os}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: "Login Time",
      dataIndex: "created_at",
      key: "created_at",
      render: (time) => dayjs(time).format("YYYY-MM-DD HH:mm:ss"),
    },
    {
      title: "Last Active",
      dataIndex: "last_activity",
      key: "last_activity",
      render: (time) => dayjs(time).format("HH:mm:ss"),
    },
    {
      title: "Force Action",
      key: "action",
      width: 150,
      render: (_, record) => (
        <Popconfirm
          title="Force logout this user and terminate session?"
          onConfirm={() => handleRevokeSession(record.token_uuid)}
          okText="Yes, Log out"
          okButtonProps={{ danger: true }}
          cancelText="No"
        >
          <Button type="primary" danger size="small" icon={<UserDeleteOutlined />}>
            Force Logout
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px", minHeight: "100%" }}>
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <Title level={2} style={{ margin: 0, color: "#1e4a2d" }}>
            <SafetyCertificateOutlined style={{ marginRight: "10px" }} />
            {t.security_logs || "Security & System Management"}
          </Title>
          <Paragraph style={{ color: "#666", margin: "4px 0 0 0" }}>
            Real-time server infrastructure status, security block tracking, and live active session management.
          </Paragraph>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
            Refresh All
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            style={{ backgroundColor: "#1e4a2d", borderColor: "#1e4a2d" }}
            onClick={() => {
              blockForm.resetFields();
              setBlockModalVisible(true);
            }}
          >
            Block IP Manually
          </Button>
        </Space>
      </div>

      {/* Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
        <Col xs={24} sm={6}>
          <Card bordered={false} className="shadow-sm">
            <Statistic
              title="Total Logged Incidents"
              value={logsTotal}
              prefix={<WarningOutlined style={{ color: "#d48806" }} />}
              valueStyle={{ color: "#d48806", fontWeight: "bold" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card bordered={false} className="shadow-sm">
            <Statistic
              title="Active IP Blocks"
              value={blockedIps.length}
              prefix={<CheckCircleOutlined style={{ color: "#cf1322" }} />}
              valueStyle={{ color: "#cf1322", fontWeight: "bold" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card bordered={false} className="shadow-sm">
            <Statistic
              title="Live Online Sessions"
              value={sessions.length}
              prefix={<GlobalOutlined style={{ color: "#3f8600" }} />}
              valueStyle={{ color: "#3f8600", fontWeight: "bold" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card bordered={false} className="shadow-sm">
            <Statistic
              title="Server Uptime"
              value={formatUptime(serverStatus?.uptime_seconds)}
              prefix={<DesktopOutlined style={{ color: "#096dd9" }} />}
              valueStyle={{ color: "#096dd9", fontWeight: "bold", fontSize: "20px" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Tabbed Panel */}
      <Card bordered={false} className="shadow-sm" style={{ borderRadius: "8px" }}>
        <Tabs defaultActiveKey="1">
          {/* Tab 1: Server Status Dashboard */}
          <TabPane tab={<span><DashboardOutlined /> Server Infrastructure Health</span>} key="1">
            <Row gutter={[24, 24]} style={{ padding: "16px 0" }}>
              <Col xs={24} md={12}>
                <Card title="System Performance Gauges" loading={serverLoading}>
                  <Row gutter={16} justify="space-around" align="middle" style={{ textAlign: "center" }}>
                    <Col span={12}>
                      <Progress
                        type="dashboard"
                        percent={serverStatus?.cpu?.usage_pct || 0}
                        strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
                        width={130}
                      />
                      <div style={{ marginTop: "10px", fontWeight: "bold" }}>CPU Core Load</div>
                      <div style={{ color: "#666" }}>{serverStatus?.cpu?.cores || 1} Cores Available</div>
                    </Col>
                    <Col span={12}>
                      <Progress
                        type="dashboard"
                        percent={serverStatus?.ram?.usage_pct || 0}
                        strokeColor={{ '0%': '#108ee9', '100%': '#ff4d4f' }}
                        width={130}
                      />
                      <div style={{ marginTop: "10px", fontWeight: "bold" }}>RAM Usage</div>
                      <div style={{ color: "#666" }}>
                        {serverStatus?.ram?.used_mb || 0} MB / {serverStatus?.ram?.total_mb || 0} MB
                      </div>
                    </Col>
                  </Row>
                </Card>
              </Col>

              <Col xs={24} md={12}>
                <Card title="Infrastructure Services" loading={serverLoading}>
                  <div style={{ marginBottom: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span style={{ fontWeight: "bold" }}><DatabaseOutlined style={{ marginRight: "8px" }} /> MySQL Database Health</span>
                      <Tag color={serverStatus?.database?.status === 'healthy' ? "success" : "error"}>
                        {serverStatus?.database?.status?.toUpperCase() || "UNKNOWN"}
                      </Tag>
                    </div>
                    <div style={{ color: "#666", fontSize: "13px" }}>
                      Latency: <Text code>{serverStatus?.database?.latency_ms || 0} ms</Text> (Live connection response latency)
                    </div>
                  </div>

                  <div style={{ marginBottom: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span style={{ fontWeight: "bold" }}><GlobalOutlined style={{ marginRight: "8px" }} /> Redis Memory Caching</span>
                      <Tag color={serverStatus?.redis?.status === 'healthy' ? "success" : "error"}>
                        {serverStatus?.redis?.status?.toUpperCase() || "UNKNOWN"}
                      </Tag>
                    </div>
                    <div style={{ color: "#666", fontSize: "13px" }}>
                      Cache Status: <Text code>{serverStatus?.redis?.status === 'healthy' ? 'Active' : 'Fallback Mode (Memory Mock)'}</Text>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontWeight: "bold", marginBottom: "8px" }}>Process Runtime (RSS)</div>
                    <div style={{ fontSize: "14px" }}>
                      NodeJS memory footprint: <Text code>{serverStatus?.ram?.process_rss_mb || 0} MB</Text>
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>
          </TabPane>

          {/* Tab 2: Live Active User Sessions */}
          <TabPane tab={<span><DesktopOutlined /> Active User Sessions</span>} key="2">
            <Table
              columns={sessionColumns}
              dataSource={sessions}
              rowKey="token_uuid"
              loading={sessionsLoading}
              pagination={{ pageSize: 15 }}
            />
          </TabPane>

          {/* Tab 3: Security & Incident Logs */}
          <TabPane tab={<span><WarningOutlined /> Incident Logs</span>} key="3">
            <div style={{ marginBottom: "16px", display: "flex", justifyContent: "flex-end" }}>
              <Input
                placeholder="Search IP Address..."
                prefix={<SearchOutlined />}
                style={{ width: 250 }}
                value={logsSearch}
                onChange={handleSearchChange}
                allowClear
              />
            </div>
            <Table
              columns={logColumns}
              dataSource={logs}
              rowKey="id"
              loading={logsLoading}
              pagination={{
                current: logsPage,
                pageSize: logsLimit,
                total: logsTotal,
                onChange: handleLogsPageChange,
                showSizeChanger: false,
              }}
            />
          </TabPane>

          {/* Tab 4: IP Blacklist */}
          <TabPane tab={<span><BlockOutlined /> IP Blacklist</span>} key="4">
            <Table
              columns={blockedColumns}
              dataSource={blockedIps}
              rowKey="id"
              loading={blockedLoading}
              pagination={{ pageSize: 15 }}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* Manual Block IP Modal */}
      <Modal
        title={<b>Manual IP Blacklist</b>}
        open={blockModalVisible}
        onCancel={() => setBlockModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={blockForm} layout="vertical" onFinish={handleBlockIp}>
          <Form.Item
            name="ip"
            label="IP Address"
            rules={[
              { required: true, message: "Please input the IP address." },
              {
                pattern: /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^([\da-fA-F]{1,4}:){7}[\da-fA-F]{1,4}$/,
                message: "Please enter a valid IPv4 or IPv6 address.",
              },
            ]}
          >
            <Input placeholder="e.g. 192.168.1.1 or 2001:db8::1" />
          </Form.Item>

          <Form.Item
            name="reason"
            label="Block Reason"
            rules={[{ required: true, message: "Please enter the reason for blocking this IP." }]}
          >
            <Input.TextArea placeholder="e.g. Repeated authentication attempts, scraping, etc." rows={3} />
          </Form.Item>

          <Form.Item style={{ display: "flex", justifyContent: "flex-end", marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setBlockModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" danger icon={<BlockOutlined />} style={{ display: 'inline-flex', alignItems: 'center' }}>
                Block IP
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SecurityDashboardPage;
