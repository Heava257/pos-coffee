import React, { useEffect, useState } from "react";
import { request } from "../../util/helper";
import { Row, Col, Card, Statistic, Table, Tag, Typography, Spin, Badge, ConfigProvider } from "antd";
import { 
  ShopOutlined, 
  TeamOutlined, 
  DeploymentUnitOutlined, 
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  GlobalOutlined,
  HistoryOutlined,
  CrownOutlined,
  MailOutlined,
  ExclamationCircleOutlined
} from "@ant-design/icons";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import moment from "moment";

const { Title, Text } = Typography;

const COLORS = ['#1e4a2d', '#c0a060', '#52c41a', '#1890ff', '#722ed1'];

const SuperAdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    bizStats: {},
    newestBusinesses: [],
    planDist: [],
    recentUsers: [],
    smtpHealth: { summary: { healthy: 0, pending: 0, failed: 0 } }
  });

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const res = await request("admin-dashboard", "get");
      if (res && res.success) {
        // Fetch SMTP Health separately
        const smtpRes = await request("business/smtp-health", "get");
        setData({
          ...res,
          smtpHealth: smtpRes || { summary: { healthy: 0, pending: 0, failed: 0 } }
        });
      }
    } catch (error) {
      console.error("Failed to fetch admin stats", error);
    } finally {
      setLoading(false);
    }
  };

  const bizColumns = [
    {
      title: "Business Name",
      dataIndex: "name",
      key: "name",
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: "Owner",
      dataIndex: "owner_name",
      key: "owner_name"
    },
    {
      title: "Plan",
      dataIndex: "plan_name",
      key: "plan_name",
      render: (p) => <Tag color="gold" style={{ borderRadius: 8 }}>{p?.toUpperCase()}</Tag>
    },
    {
      title: "Onboard Date",
      dataIndex: "created_at",
      key: "created_at",
      render: (d) => moment(d).fromNow()
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (s) => <Badge status={s === 'active' ? 'success' : 'error'} text={s?.toUpperCase()} />
    }
  ];

  const userColumns = [
    {
      title: "User",
      dataIndex: "name",
      key: "name",
      render: (t) => <Text strong>{t}</Text>
    },
    {
      title: "Business",
      dataIndex: "business_name",
      key: "business_name"
    },
    {
      title: "Role",
      dataIndex: "role_name",
      key: "role_name",
      render: (r) => <Tag style={{ borderRadius: 8 }}>{r}</Tag>
    },
    {
      title: "Joined",
      dataIndex: "created_at",
      key: "created_at",
      render: (d) => moment(d).format('MMM DD, HH:mm')
    }
  ];

  return (
    <div style={{ padding: '24px 0' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ color: '#1e4a2d', marginBottom: 4, fontWeight: 900 }}>
          <GlobalOutlined style={{ marginRight: 12 }} /> 
          Platform Ecosystem
        </Title>
        <Text type="secondary" style={{ fontSize: 14 }}>
          Strategic overview of system growth and tenant activity. Financial data is restricted.
        </Text>
      </div>

      <Spin spinning={loading}>
        {/* Stats Section */}
        <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <div className="admin-stat-card">
              <Statistic 
                title="Total Tenants" 
                value={data.bizStats?.total_businesses || 0} 
                prefix={<ShopOutlined style={{ color: '#1e4a2d' }} />} 
                valueStyle={{ color: '#1e4a2d', fontWeight: 900 }}
              />
              <div style={{ marginTop: 8, fontSize: 12, color: '#00c257', fontWeight: 600 }}>
                {data.bizStats?.active_businesses || 0} Active Subscriptions
              </div>
            </div>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <div className="admin-stat-card">
              <Statistic 
                title="Ecosystem Users" 
                value={data.bizStats?.total_users || 0} 
                prefix={<TeamOutlined style={{ color: '#c0a060' }} />} 
                valueStyle={{ color: '#1e4a2d', fontWeight: 900 }}
              />
              <div style={{ marginTop: 8, fontSize: 12, color: '#6b7c6b' }}>Across all businesses</div>
            </div>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <div className="admin-stat-card">
              <Statistic 
                title="Total Branches" 
                value={data.bizStats?.total_branches || 0} 
                prefix={<DeploymentUnitOutlined style={{ color: '#1890ff' }} />} 
                valueStyle={{ color: '#1e4a2d', fontWeight: 900 }}
              />
              <div style={{ marginTop: 8, fontSize: 12, color: '#6b7c6b' }}>Physical locations</div>
            </div>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <div className="admin-stat-card" style={{ 
              background: data.smtpHealth?.summary?.failed > 0 ? 'linear-gradient(135deg, #fff 0%, #fff1f0 100%)' : 'linear-gradient(135deg, #1e4a2d 0%, #2d6a3e 100%)', 
              border: data.smtpHealth?.summary?.failed > 0 ? '1px solid #ffccc7' : 'none' 
            }}>
              <Statistic 
                title={<span style={{ color: data.smtpHealth?.summary?.failed > 0 ? '#ff4d4f' : 'rgba(255,255,255,0.7)' }}>Email System Health</span>} 
                value={`${data.smtpHealth?.summary?.healthy || 0}/${data.smtpHealth?.summary?.total || 0}`} 
                prefix={data.smtpHealth?.summary?.failed > 0 ? <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} /> : <MailOutlined style={{ color: '#52c41a' }} />} 
                valueStyle={{ color: data.smtpHealth?.summary?.failed > 0 ? '#ff4d4f' : '#fff', fontWeight: 900 }}
              />
              <div style={{ marginTop: 8, fontSize: 12, color: data.smtpHealth?.summary?.failed > 0 ? '#ff4d4f' : 'rgba(255,255,255,0.8)' }}>
                {data.smtpHealth?.summary?.healthy || 0} Stores Configured
              </div>
            </div>
          </Col>
        </Row>

        {/* Infrastructure Section */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <SafetyCertificateOutlined style={{ color: '#1e4a2d', fontSize: 18 }} />
            <span style={{ fontWeight: 900, fontSize: 16, color: '#1e4a2d' }}>Infrastructure & Data Health</span>
          </div>
          <Row gutter={[20, 20]}>
            <Col xs={24} sm={12} lg={6}>
              <div className="admin-stat-card" style={{ borderLeft: '4px solid #1e4a2d' }}>
                <Statistic 
                  title="Database Storage" 
                  value={data.systemHealth?.dbSize || 0} 
                  suffix="MB"
                  valueStyle={{ color: '#1e4a2d', fontWeight: 900 }}
                />
                <div style={{ marginTop: 8, fontSize: 12, color: '#6b7c6b' }}>Total data & indexes</div>
              </div>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <div className="admin-stat-card" style={{ borderLeft: '4px solid #c0a060' }}>
                <Statistic 
                  title="Global Order Volume" 
                  value={data.systemHealth?.totalRows?.total_orders || 0} 
                  valueStyle={{ color: '#1e4a2d', fontWeight: 900 }}
                />
                <div style={{ marginTop: 8, fontSize: 12, color: '#6b7c6b' }}>Aggregate transactions</div>
              </div>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <div className="admin-stat-card" style={{ borderLeft: '4px solid #1890ff' }}>
                <Statistic 
                  title="Global Product Catalog" 
                  value={data.systemHealth?.totalRows?.total_products || 0} 
                  valueStyle={{ color: '#1e4a2d', fontWeight: 900 }}
                />
                <div style={{ marginTop: 8, fontSize: 12, color: '#6b7c6b' }}>Items across all tenants</div>
              </div>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <div className="admin-stat-card" style={{ borderLeft: '4px solid #52c41a' }}>
                <Statistic 
                  title="System Uptime" 
                  value="99.9" 
                  suffix="%"
                  valueStyle={{ color: '#52c41a', fontWeight: 900 }}
                />
                <div style={{ marginTop: 8, fontSize: 12, color: '#6b7c6b' }}>Operational efficiency</div>
              </div>
            </Col>
          </Row>
        </div>

        {/* Charts Section */}
        <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={16}>
            <div className="admin-main-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
                <HistoryOutlined style={{ color: '#1e4a2d', fontSize: 18 }} />
                <span style={{ fontWeight: 900, fontSize: 16, color: '#1e4a2d' }}>Recent Onboarding</span>
              </div>
              <Table 
                columns={bizColumns} 
                dataSource={data.newestBusinesses} 
                pagination={false} 
                rowKey="id"
                size="middle"
              />
            </div>
          </Col>
          <Col xs={24} lg={8}>
            <div className="admin-main-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
                <CrownOutlined style={{ color: '#c0a060', fontSize: 18 }} />
                <span style={{ fontWeight: 900, fontSize: 16, color: '#1e4a2d' }}>Plan Distribution</span>
              </div>
              <div style={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.planDist}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      nameKey="category"
                    >
                      {data.planDist.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Col>
        </Row>

        {/* Activity & Performance Row */}
        <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={16}>
            <div className="admin-main-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <HistoryOutlined style={{ color: '#1e4a2d', fontSize: 18 }} />
                <span style={{ fontWeight: 900, fontSize: 16, color: '#1e4a2d' }}>Platform Pulse (Anonymous Activity)</span>
              </div>
              <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                {data.activityFeed?.map((item, index) => (
                  <div key={index} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: '12px 16px', 
                    marginBottom: 8, 
                    borderRadius: 12,
                    background: '#f8faf8',
                    border: '1px solid #edf2ed'
                  }}>
                    <div style={{ 
                      width: 32, 
                      height: 32, 
                      borderRadius: 8, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      background: item.type === 'order' ? '#e6f7ff' : item.type === 'product' ? '#f6ffed' : '#fff7e6',
                      marginRight: 12
                    }}>
                      {item.type === 'order' && <ShopOutlined style={{ color: '#1890ff' }} />}
                      {item.type === 'product' && <DeploymentUnitOutlined style={{ color: '#52c41a' }} />}
                      {item.type === 'staff' && <TeamOutlined style={{ color: '#fa8c16' }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13 }}>
                        <Text strong>{item.business_name}</Text> 
                        {item.type === 'order' && " processed a new transaction"}
                        {item.type === 'product' && ` added a new product: "${item.item_name}"`}
                        {item.type === 'staff' && ` registered a new team member: "${item.item_name}"`}
                      </div>
                      <div style={{ fontSize: 11, color: '#8c8c8c' }}>{moment(item.created_at).fromNow()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Col>
          <Col xs={24} lg={8}>
            <div className="admin-main-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <CrownOutlined style={{ color: '#c0a060', fontSize: 18 }} />
                <span style={{ fontWeight: 900, fontSize: 16, color: '#1e4a2d' }}>High-Volume Tenants (Today)</span>
              </div>
              <div style={{ padding: '0 8px' }}>
                {data.topTenantsByVolume?.map((item, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ fontWeight: 900, color: '#c0a060' }}>#{index + 1}</div>
                      <Text strong style={{ fontSize: 14 }}>{item.name}</Text>
                    </div>
                    <Tag color="cyan" style={{ borderRadius: 6 }}>{item.order_count} Orders</Tag>
                  </div>
                ))}
                {(!data.topTenantsByVolume || data.topTenantsByVolume.length === 0) && (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: '#8c8c8c' }}>
                    No activity recorded today
                  </div>
                )}
              </div>
            </div>
          </Col>
        </Row>

        {/* User Activity */}
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <div className="admin-main-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
                <TeamOutlined style={{ color: '#1e4a2d', fontSize: 18 }} />
                <span style={{ fontWeight: 900, fontSize: 16, color: '#1e4a2d' }}>Newest Ecosystem Members</span>
              </div>
              <Table 
                columns={userColumns} 
                dataSource={data.recentUsers} 
                pagination={false} 
                rowKey="id"
                size="small"
              />
            </div>
          </Col>
        </Row>
      </Spin>

      <style jsx>{`
        .admin-stat-card {
          background: #ffffff;
          border-radius: 20px;
          border: 1px solid rgba(0,0,0,0.03);
          box-shadow: 0 4px 15px rgba(30, 74, 45, 0.03);
          padding: 24px;
          height: 100%;
          transition: all 0.3s ease;
        }
        .admin-stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(30, 74, 45, 0.08);
        }
        .admin-main-card {
          background: #ffffff;
          border-radius: 24px;
          border: 1px solid rgba(0,0,0,0.03);
          box-shadow: 0 8px 30px rgba(0,0,0,0.02);
          padding: 24px;
          height: 100%;
        }
        .ant-statistic-title {
          font-weight: 700;
          color: #6b7c6b;
          font-size: 13px;
        }
      `}</style>
    </div>
  );
};

export default SuperAdminDashboard;
