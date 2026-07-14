import React, { useEffect, useState } from "react";
import { Table, Tag, Button, Modal, Input, Space, Card, Row, Col, Statistic, Tabs, Form, message, Popconfirm, Typography } from "antd";
import {
  SafetyCertificateOutlined,
  WarningOutlined,
  SearchOutlined,
  BlockOutlined,
  UnlockOutlined,
  ReloadOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined
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

  const handleRefresh = () => {
    fetchLogs(logsPage, logsSearch);
    fetchBlockedIps();
  };

  useEffect(() => {
    fetchLogs(1, "");
    fetchBlockedIps();
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

  // Statistics calculations
  const totalIncidents = logsTotal;
  const rateLimitEvents = logs.filter(l => l.event_type === 'rate_limit_blocked').length;
  const activeBlockedCount = blockedIps.length;

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

  return (
    <div style={{ padding: "24px", minHeight: "100%" }}>
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <Title level={2} style={{ margin: 0, color: "#1e4a2d" }}>
            <SafetyCertificateOutlined style={{ marginRight: "10px" }} />
            {t.security_logs || "Security Management"}
          </Title>
          <Paragraph style={{ color: "#666", margin: "4px 0 0 0" }}>
            Monitor real-time system attacks, review rate-limit blocks, and manage IP blacklist.
          </Paragraph>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
            Refresh
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
        <Col xs={24} sm={8}>
          <Card bordered={false} className="shadow-sm">
            <Card.Meta
              avatar={<WarningOutlined style={{ color: "#d48806", fontSize: "28px" }} />}
              title={<span style={{ color: "#666", fontSize: "14px", fontWeight: "normal" }}>Total Logged Incidents</span>}
              description={<span style={{ color: "#d48806", fontSize: "24px", fontWeight: "bold" }}>{totalIncidents}</span>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} className="shadow-sm">
            <Card.Meta
              avatar={<InfoCircleOutlined style={{ color: "#096dd9", fontSize: "28px" }} />}
              title={<span style={{ color: "#666", fontSize: "14px", fontWeight: "normal" }}>Rate Limit Violations</span>}
              description={<span style={{ color: "#096dd9", fontSize: "24px", fontWeight: "bold" }}>{rateLimitEvents}</span>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} className="shadow-sm">
            <Card.Meta
              avatar={<CheckCircleOutlined style={{ color: "#3f8600", fontSize: "28px" }} />}
              title={<span style={{ color: "#666", fontSize: "14px", fontWeight: "normal" }}>Active IP Blocks</span>}
              description={<span style={{ color: "#3f8600", fontSize: "24px", fontWeight: "bold" }}>{activeBlockedCount}</span>}
            />
          </Card>
        </Col>
      </Row>

      {/* Tabs for Logs and Blocks */}
      <Card bordered={false} className="shadow-sm" style={{ borderRadius: "8px" }}>
        <Tabs defaultActiveKey="1">
          <TabPane tab="Attack & Incident Logs" key="1">
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
          <TabPane tab="IP Blacklist" key="2">
            <Table
              columns={blockedColumns}
              dataSource={blockedIps}
              rowKey="id"
              loading={blockedLoading}
              pagination={{ pageSize: 10 }}
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
