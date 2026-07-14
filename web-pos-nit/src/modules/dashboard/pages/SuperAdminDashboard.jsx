import React, { useEffect, useState } from "react";
import { request } from "@/shared/utils/helper";
import { Row, Col, Card, Statistic, Table, Tag, Typography, Spin, Badge, Button, Space, Tooltip as AntTooltip, List, Alert } from "antd";
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
  ThunderboltOutlined,
  InfoCircleOutlined
} from "@ant-design/icons";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
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
    { name: "Jul", Standard: 4000, Premium: 2400 },
    { name: "Aug", Standard: 5000, Premium: 3000 },
    { name: "Sep", Standard: 4800, Premium: 3500 },
    { name: "Oct", Standard: 6000, Premium: 4000 },
    { name: "Nov", Standard: 7500, Premium: 4500 },
    { name: "Dec", Standard: 8500, Premium: 5200 },
    { name: "Jan", Standard: 9000, Premium: 5800 },
    { name: "Feb", Standard: 9500, Premium: 6000 },
    { name: "Mar", Standard: 11000, Premium: 7200 },
    { name: "Apr", Standard: 12500, Premium: 8500 },
    { name: "May", Standard: 13000, Premium: 9200 },
    { name: "Jun", Standard: 14500, Premium: 10500 }
  ];

  return (
    <div style={{ padding: "24px 0" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <Title level={2} style={{ margin: 0, color: "#1e4a2d", fontWeight: "bold" }}>
            <CloudServerOutlined style={{ marginRight: "10px" }} />
            Platform Overview
          </Title>
          <Paragraph style={{ color: "#666", margin: "4px 0 0 0" }}>
            Real-time visibility across your global SaaS ecosystem, system alerts, and infrastructure health.
          </Paragraph>
        </div>
        <Button type="primary" icon={<ReloadOutlined />} onClick={fetchAdminData} style={{ backgroundColor: "#1e4a2d", borderColor: "#1e4a2d" }}>
          Refresh Overview
        </Button>
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
                title="Total Locations"
                value={data.bizStats?.total_branches || 0}
                prefix={<DeploymentUnitOutlined style={{ color: "#1890ff" }} />}
                valueStyle={{ color: "#1e4a2d", fontWeight: "bold" }}
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
                valueStyle={{ color: "#1e4a2d", fontWeight: "bold", fontSize: "18px" }}
              />
            </Card>
          </Col>
        </Row>

        {/* Dashboard Main Visual Layout */}
        <Row gutter={[24, 24]}>
          {/* Left Column: Analytics Charts & Tables */}
          <Col xs={24} lg={17}>
            {/* Revenue Analytics Line Chart */}
            <Card bordered={false} className="shadow-sm" style={{ marginBottom: "24px", borderRadius: "12px" }} title={<b>Revenue Analytics (Subscription Sales)</b>}>
              <div style={{ height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} />
                    <Legend />
                    <Line type="monotone" dataKey="Standard" stroke="#1e4a2d" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="Premium" stroke="#c0a060" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
              {/* Plan Distribution Pie Chart */}
              <Col xs={24} md={12}>
                <Card bordered={false} className="shadow-sm" style={{ borderRadius: "12px" }} title={<b>Subscription Distribution</b>}>
                  <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={data.planDist} dataKey="value" nameKey="category" innerRadius={50} outerRadius={75} paddingAngle={4}>
                          {data.planDist.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </Col>

              {/* Industry Category Pie Chart */}
              <Col xs={24} md={12}>
                <Card bordered={false} className="shadow-sm" style={{ borderRadius: "12px" }} title={<b>Business Category Distribution</b>}>
                  <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={data.categoryDist} dataKey="value" nameKey="category" innerRadius={50} outerRadius={75} paddingAngle={4}>
                          {data.categoryDist.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36} />
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
                  <div style={{ fontSize: "20px", fontWeight: "bold", color: "#fa8c16" }}>12</div>
                  <div style={{ fontSize: "10px", color: "#888" }}>Open</div>
                </Col>
                <Col span={8}>
                  <div style={{ fontSize: "20px", fontWeight: "bold", color: "#1890ff" }}>4</div>
                  <div style={{ fontSize: "10px", color: "#888" }}>Pending</div>
                </Col>
                <Col span={8}>
                  <div style={{ fontSize: "20px", fontWeight: "bold", color: "#52c41a" }}>38</div>
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
