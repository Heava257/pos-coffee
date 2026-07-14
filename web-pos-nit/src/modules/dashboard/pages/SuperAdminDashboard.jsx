import React, { useEffect, useState } from "react";
import { request } from "@/shared/utils/helper";
import { Row, Col, Card, Statistic, Table, Tag, Typography, Spin, Badge, Button, Space, Input, List, Progress, Tooltip as AntTooltip } from "antd";
import {
  ShopOutlined,
  TeamOutlined,
  DeploymentUnitOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  GlobalOutlined,
  WarningOutlined,
  ReloadOutlined,
  DatabaseOutlined,
  DashboardOutlined,
  UserDeleteOutlined,
  FileTextOutlined,
  AppstoreOutlined,
  CloudServerOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ThunderboltOutlined,
  InfoCircleOutlined,
  SearchOutlined,
  CreditCardOutlined
} from "@ant-design/icons";
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import dayjs from "dayjs";

const { Title, Text, Paragraph } = Typography;

const COLORS = ['#1e4a2d', '#c0a060', '#52c41a', '#1890ff', '#722ed1', '#eb2f96'];

const SuperAdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    bizStats: {},
    newestBusinesses: [],
    planDist: [],
    categoryDist: [],
    criticalAlerts: [],
    recentUsers: [],
    systemHealth: { dbSize: 0, totalRows: {} },
    activityFeed: [],
    topTenantsByVolume: []
  });

  const [serverStatus, setServerStatus] = useState(null);
  const [sessionsCount, setSessionsCount] = useState(0);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const res = await request("admin-dashboard", "get");
      if (res && res.success) {
        setData(res);
      }

      // Fetch server status
      const statusRes = await request("securities/server-status", "get");
      if (statusRes) {
        setServerStatus(statusRes);
      }

      // Fetch active sessions
      const sessionsRes = await request("securities/active-sessions", "get");
      if (sessionsRes && sessionsRes.list) {
        setSessionsCount(sessionsRes.list.length);
      }
    } catch (error) {
      console.error("Failed to fetch admin stats", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const formatUptime = (seconds) => {
    if (!seconds) return "N/A";
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d}d ${h}h ${m}m`;
  };

  // Organizations Table columns
  const bizColumns = [
    {
      title: "Business Name",
      dataIndex: "name",
      key: "name",
      render: (text) => <Text strong style={{ color: "#1e4a2d" }}>{text}</Text>
    },
    {
      title: "Owner",
      dataIndex: "owner_name",
      key: "owner_name"
    },
    {
      title: "Plan Type",
      dataIndex: "plan_name",
      key: "plan_name",
      render: (p) => <Tag color="gold" style={{ borderRadius: 6 }}>{p?.toUpperCase() || "BASIC"}</Tag>
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (s) => (
        <Tag color={s === 'active' ? 'success' : 'error'} style={{ borderRadius: 6 }}>
          {s?.toUpperCase()}
        </Tag>
      )
    },
    {
      title: "Registered Date",
      dataIndex: "created_at",
      key: "created_at",
      render: (time) => dayjs(time).format("YYYY-MM-DD")
    }
  ];

  // simulated line chart data
  const revenueChartData = [
    { name: "Jul", Revenue: 4000, Subscription: 2400 },
    { name: "Aug", Revenue: 5000, Subscription: 3000 },
    { name: "Sep", Revenue: 4800, Subscription: 3500 },
    { name: "Oct", Revenue: 6000, Subscription: 4000 },
    { name: "Nov", Revenue: 7500, Subscription: 4500 },
    { name: "Dec", Revenue: 8500, Subscription: 5200 },
    { name: "Jan", Revenue: 9000, Subscription: 5800 },
    { name: "Feb", Revenue: 9500, Subscription: 6000 },
    { name: "Mar", Revenue: 11000, Subscription: 7200 },
    { name: "Apr", Revenue: 12500, Subscription: 8500 },
    { name: "May", Revenue: 13000, Subscription: 9200 },
    { name: "Jun", Revenue: 14500, Subscription: 10500 }
  ];

  // simulated tenant growth data matching the image
  const tenantGrowthData = [
    { name: "Jul", New: 500, Active: 3000, Banned: 50 },
    { name: "Aug", New: 800, Active: 3800, Banned: 80 },
    { name: "Sep", New: 1200, Active: 5000, Banned: 100 },
    { name: "Oct", New: 1500, Active: 6500, Banned: 120 },
    { name: "Nov", New: 2200, Active: 8700, Banned: 150 },
    { name: "Dec", New: 2800, Active: 11500, Banned: 180 },
    { name: "Jan", New: 3200, Active: 14700, Banned: 220 }
  ];

  // Usage Analytics Table Data matching the image
  const usageMetrics = [
    { key: "1", metric: "Bandwidth", usage: "12.4 TB", trend: "+10.2%", status: "up" },
    { key: "2", metric: "CPU Usage (Avg)", usage: "24.6%", trend: "-4.5%", status: "down" },
    { key: "3", metric: "Database Load", usage: "65.2%", trend: "+7.8%", status: "up" },
    { key: "4", metric: "Email Volume", usage: "3.6M", trend: "+11.0%", status: "up" },
    { key: "5", metric: "Webhook Delivery", usage: "98.7%", trend: "+2.1%", status: "up" }
  ];

  const usageColumns = [
    {
      title: "Metric",
      dataIndex: "metric",
      key: "metric",
      render: (text) => <span style={{ fontWeight: "600" }}>{text}</span>
    },
    {
      title: "Usage",
      dataIndex: "usage",
      key: "usage",
      render: (text) => <Text code>{text}</Text>
    },
    {
      title: "Trend",
      dataIndex: "trend",
      key: "trend",
      render: (text, record) => (
        <span style={{ color: record.status === 'up' ? '#52c41a' : '#ff4d4f', fontWeight: "bold" }}>
          {record.status === 'up' ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {text}
        </span>
      )
    }
  ];

  return (
    <div style={{ padding: "24px 0" }}>
      {/* Top Search Bar & Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <Title level={2} style={{ margin: 0, color: "#1e4a2d", fontWeight: "bold" }}>
            <CloudServerOutlined style={{ marginRight: "10px" }} />
            Platform Overview
          </Title>
          <Paragraph style={{ color: "#666", margin: "4px 0 0 0" }}>
            Real-time visibility across your global SaaS ecosystem.
          </Paragraph>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <Input
            placeholder="Search tenants, users, invoices, logs..."
            prefix={<SearchOutlined />}
            style={{ width: 300, borderRadius: "8px" }}
          />
          <Button type="primary" icon={<ReloadOutlined />} onClick={fetchAdminData} style={{ backgroundColor: "#1e4a2d", borderColor: "#1e4a2d" }}>
            Refresh All
          </Button>
        </div>
      </div>

      <Spin spinning={loading}>
        {/* KPI Grid */}
        <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
          <Col xs={24} sm={8} lg={4}>
            <Card bordered={false} className="shadow-sm border-left-gold">
              <Statistic
                title="Total Organizations"
                value={data.bizStats?.total_businesses || 0}
                prefix={<ShopOutlined style={{ color: "#c0a060" }} />}
                valueStyle={{ color: "#1e4a2d", fontWeight: "bold" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8} lg={4}>
            <Card bordered={false} className="shadow-sm border-left-green">
              <Statistic
                title="Active Users"
                value={data.bizStats?.total_users || 0}
                prefix={<TeamOutlined style={{ color: "#52c41a" }} />}
                valueStyle={{ color: "#1e4a2d", fontWeight: "bold" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8} lg={4}>
            <Card bordered={false} className="shadow-sm border-left-blue">
              <Statistic
                title="Monthly Revenue"
                value={Number(data.bizStats?.mrr || 0)}
                prefix={<CreditCardOutlined style={{ color: "#1890ff" }} />}
                valueStyle={{ color: "#1e4a2d", fontWeight: "bold" }}
                precision={2}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8} lg={4}>
            <Card bordered={false} className="shadow-sm border-left-purple">
              <Statistic
                title="Database Size"
                value={data.systemHealth?.dbSize || 0}
                suffix="MB"
                prefix={<DatabaseOutlined style={{ color: "#722ed1" }} />}
                valueStyle={{ color: "#1e4a2d", fontWeight: "bold" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8} lg={4}>
            <Card bordered={false} className="shadow-sm border-left-red">
              <Statistic
                title="Active Sessions"
                value={sessionsCount}
                prefix={<GlobalOutlined style={{ color: "#ff4d4f" }} />}
                valueStyle={{ color: "#1e4a2d", fontWeight: "bold" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8} lg={4}>
            <Card bordered={false} className="shadow-sm border-left-orange">
              <Statistic
                title="System Uptime"
                value={formatUptime(serverStatus?.uptime_seconds)}
                prefix={<DashboardOutlined style={{ color: "#fa8c16" }} />}
                valueStyle={{ color: "#1e4a2d", fontWeight: "bold", fontSize: "16px" }}
              />
            </Card>
          </Col>
        </Row>

        {/* Dashboard Main Visual Layout */}
        <Row gutter={[24, 24]}>
          {/* Left Column: Analytics Charts & Tables */}
          <Col xs={24} lg={17}>
            {/* Revenue Analytics Line Chart & Tenant Growth side-by-side */}
            <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
              <Col xs={24} md={12}>
                <Card bordered={false} className="shadow-sm" style={{ borderRadius: "12px" }} title={<b>Revenue Analytics</b>}>
                  <div style={{ height: 250 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={revenueChartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} />
                        <Line type="monotone" dataKey="Revenue" stroke="#1e4a2d" strokeWidth={3} dot={false} />
                        <Line type="monotone" dataKey="Subscription" stroke="#c0a060" strokeWidth={3} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </Col>

              <Col xs={24} md={12}>
                <Card bordered={false} className="shadow-sm" style={{ borderRadius: "12px" }} title={<b>Tenant Growth</b>}>
                  <div style={{ height: 250 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={tenantGrowthData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} />
                        <Area type="monotone" dataKey="Active" stackId="1" stroke="#2d6a42" fill="#2d6a42" fillOpacity={0.6} />
                        <Area type="monotone" dataKey="New" stackId="2" stroke="#c0a060" fill="#c0a060" fillOpacity={0.6} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
              {/* Usage Analytics Grid */}
              <Col xs={24} md={12}>
                <Card bordered={false} className="shadow-sm" style={{ borderRadius: "12px" }} title={<b>Usage Analytics</b>}>
                  <Table
                    columns={usageColumns}
                    dataSource={usageMetrics}
                    pagination={false}
                    size="small"
                  />
                </Card>
              </Col>

              {/* Business Category Pie Chart */}
              <Col xs={24} md={12}>
                <Card bordered={false} className="shadow-sm" style={{ borderRadius: "12px" }} title={<b>Business Category Distribution</b>}>
                  <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={data.categoryDist} dataKey="value" nameKey="category" innerRadius={45} outerRadius={65} paddingAngle={4}>
                          {data.categoryDist.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={24} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </Col>
            </Row>

            {/* Organizations Directory Table */}
            <Card bordered={false} className="shadow-sm" style={{ borderRadius: "12px" }} title={<b>All Registered Organizations</b>}>
              <Table
                columns={bizColumns}
                dataSource={data.newestBusinesses}
                rowKey="id"
                pagination={false}
                size="small"
              />
            </Card>
          </Col>

          {/* Right Column: Real-Time Intelligence & Support */}
          <Col xs={24} lg={7}>
            {/* Real-time Intelligence: Critical Security Alerts */}
            <Card bordered={false} className="shadow-sm" style={{ marginBottom: "24px", borderRadius: "12px" }} title={<span><ThunderboltOutlined style={{ color: "#d48806", marginRight: "8px" }} /><b>Real-time Intelligence</b></span>}>
              <div style={{ marginBottom: "16px" }}>
                <Badge count={data.criticalAlerts?.length || 0} style={{ backgroundColor: "#d46b08" }} /> <Text strong style={{ marginLeft: "8px" }}>Critical Alerts</Text>
              </div>
              <List
                dataSource={data.criticalAlerts}
                renderItem={(item) => (
                  <List.Item style={{ padding: "12px 0", borderBottom: "1px solid #f1f5f9" }}>
                    <List.Item.Meta
                      avatar={<WarningOutlined style={{ color: "#cf1322", fontSize: "18px", marginTop: "4px" }} />}
                      title={<Text style={{ fontSize: "13px", fontWeight: "bold" }}>{item.event_type.replace(/_/g, " ").toUpperCase()}</Text>}
                      description={
                        <div style={{ fontSize: "11px", color: "#666" }}>
                          IP: <Text code>{item.ip}</Text>
                          <br />
                          Time: {dayjs(item.created_at).format("HH:mm:ss A")}
                        </div>
                      }
                    />
                  </List.Item>
                )}
                locale={{ emptyText: "No critical alerts detected." }}
              />
            </Card>

            {/* Recent Activities Feed */}
            <Card bordered={false} className="shadow-sm" style={{ marginBottom: "24px", borderRadius: "12px" }} title={<b>Recent Activities</b>}>
              <List
                dataSource={data.activityFeed}
                renderItem={(item) => {
                  let title = "System Event";
                  let color = "blue";
                  if (item.type === "order") {
                    title = `New order processed by ${item.business_name}`;
                    color = "green";
                  } else if (item.type === "product") {
                    title = `${item.item_name || 'Item'} added by ${item.business_name}`;
                    color = "orange";
                  } else if (item.type === "staff") {
                    title = `Staff ${item.item_name || 'User'} registered by ${item.business_name}`;
                    color = "purple";
                  }

                  return (
                    <List.Item style={{ padding: "12px 0", borderBottom: "1px solid #f1f5f9" }}>
                      <List.Item.Meta
                        avatar={<Badge status={color === 'green' ? 'success' : color === 'orange' ? 'warning' : 'processing'} style={{ marginTop: "8px" }} />}
                        title={<span style={{ fontSize: "12px", fontWeight: "bold" }}>{title}</span>}
                        description={<span style={{ fontSize: "10px", color: "#888" }}>{dayjs(item.created_at).format("YYYY-MM-DD HH:mm")}</span>}
                      />
                    </List.Item>
                  );
                }}
              />
            </Card>

            {/* Support Tickets Widget */}
            <Card bordered={false} className="shadow-sm" style={{ borderRadius: "12px" }} title={<b>Support Overview</b>}>
              <Row gutter={8} justify="space-around" style={{ textAlign: "center", marginTop: "10px" }}>
                <Col span={8}>
                  <div style={{ fontSize: "20px", fontWeight: "bold", color: "#fa8c16" }}>128</div>
                  <div style={{ fontSize: "10px", color: "#888" }}>Open</div>
                </Col>
                <Col span={8}>
                  <div style={{ fontSize: "20px", fontWeight: "bold", color: "#1890ff" }}>42</div>
                  <div style={{ fontSize: "10px", color: "#888" }}>Pending</div>
                </Col>
                <Col span={8}>
                  <div style={{ fontSize: "20px", fontWeight: "bold", color: "#52c41a" }}>86</div>
                  <div style={{ fontSize: "10px", color: "#888" }}>Resolved</div>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </Spin>

      <style jsx>{`
        .border-left-gold { border-left: 4px solid #c0a060; }
        .border-left-green { border-left: 4px solid #52c41a; }
        .border-left-blue { border-left: 4px solid #1890ff; }
        .border-left-purple { border-left: 4px solid #722ed1; }
        .border-left-red { border-left: 4px solid #ff4d4f; }
        .border-left-orange { border-left: 4px solid #fa8c16; }
      `}</style>
    </div>
  );
};

export default SuperAdminDashboard;
