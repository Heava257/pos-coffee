import React, { useEffect, useState } from "react";
import { request } from "@/shared/utils/helper";
import { Row, Col, Card, Statistic, Table, Tag, Typography, Spin, Badge, ConfigProvider, Button } from "antd";
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
  ExclamationCircleOutlined,
  AppstoreOutlined
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

  const [viewStyle, setViewStyle] = useState(1); // 1: Analytical, 2: Operational, 3: Technical

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
    }
  ];

  // --- STYLE 1: ANALYTIACL (PREMIUM WALLET STYLE - Light & Gold) ---
  const renderAnalyticalView = () => (
    <div className="view-fade-in">
      <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <div className="premium-card-stat">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div className="icon-circle gold"><ShopOutlined /></div>
              <Tag color="green" bordered={false}>+12%</Tag>
            </div>
            <div style={{ fontSize: 13, color: '#6b7c6b', fontWeight: 600 }}>Global Tenant Base</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#1e4a2d' }}>{data.bizStats?.total_businesses || 0} Businesses</div>
          </div>
        </Col>
        <Col xs={24} sm={8}>
          <div className="premium-card-stat">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div className="icon-circle green"><TeamOutlined /></div>
              <Tag color="red" bordered={false}>-3%</Tag>
            </div>
            <div style={{ fontSize: 13, color: '#6b7c6b', fontWeight: 600 }}>Ecosystem User Count</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#1e4a2d' }}>{data.bizStats?.total_users || 0} Users</div>
          </div>
        </Col>
        <Col xs={24} sm={8}>
          <div className="premium-card-stat">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div className="icon-circle dark"><DeploymentUnitOutlined /></div>
              <Tag color="gold" bordered={false}>14%</Tag>
            </div>
            <div style={{ fontSize: 13, color: '#6b7c6b', fontWeight: 600 }}>Total System Branches</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#1e4a2d' }}>{data.bizStats?.total_branches || 0} Locations</div>
          </div>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <div className="premium-main-area">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
              <div>
                <div style={{ fontSize: 14, color: '#6b7c6b' }}>Revenue Overview (Simulated)</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: '#1e4a2d' }}>$37,432.77 <span style={{ fontSize: 14, color: '#52c41a' }}>+33%</span></div>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <Badge color="#c0a060" text="Premium" />
                <Badge color="#1e4a2d" text="Standard" />
              </div>
            </div>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.planDist}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="category" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="value" fill="#c0a060" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Col>

        <Col xs={24} lg={8}>
          <div className="premium-card-area">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <Text strong style={{ fontSize: 16 }}>Platform Health Cards</Text>
            </div>
            <div className="mock-card gold">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text style={{ color: '#fff' }}>Platform Integrity</Text>
                <div className="chip" />
              </div>
              <div style={{ marginTop: 12, fontSize: 18, color: '#fff', fontWeight: 700 }}>**** **** **** 1777</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
                <Text style={{ color: '#fff' }}>SUPER ADMIN</Text>
                <Text style={{ color: '#fff' }}>ACTIVE</Text>
              </div>
            </div>
            <div className="mock-card green">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text style={{ color: '#fff' }}>SMTP Master Node</Text>
                <div className="chip" />
              </div>
              <div style={{ marginTop: 12, fontSize: 18, color: '#fff', fontWeight: 700 }}>**** **** **** 5644</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
                <Text style={{ color: '#fff' }}>SYSTEM MAIL</Text>
                <Text style={{ color: '#fff' }}>STABLE</Text>
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );

  // --- STYLE 2: OPERATIONAL (BOLD & SOLID - Heavy Green/Gold Focus) ---
  const renderOperationalView = () => (
    <div className="view-fade-in">
      <Row gutter={[0, 0]} style={{ background: '#fff', borderRadius: 32, overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
        <Col xs={24} sm={12} lg={6} style={{ borderRight: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
          <div className="op-stat-section green">
            <ShopOutlined className="op-icon" />
            <div className="op-val">{data.bizStats?.total_businesses || 0}</div>
            <div className="op-lbl">Total Registered Businesses</div>
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6} style={{ borderRight: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
          <div className="op-stat-section gold">
            <TeamOutlined className="op-icon" />
            <div className="op-val">{data.bizStats?.total_users || 0}</div>
            <div className="op-lbl">Active Ecosystem Users</div>
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6} style={{ borderRight: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
          <div className="op-stat-section dark">
            <DeploymentUnitOutlined className="op-icon" />
            <div className="op-val">{data.bizStats?.total_branches || 0}</div>
            <div className="op-lbl">Distributed Branches</div>
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6} style={{ borderBottom: '1px solid #f1f5f9' }}>
          <div className="op-stat-section blue">
            <SafetyCertificateOutlined className="op-icon" />
            <div className="op-val">99.9%</div>
            <div className="op-lbl">System Operational Uptime</div>
          </div>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card bordered={false} className="op-list-card" title={<div style={{fontWeight: 900, color: '#1e4a2d'}}>Recent Partner Onboarding</div>}>
            <Table columns={bizColumns} dataSource={data.newestBusinesses.slice(0, 5)} pagination={false} rowKey="id" size="small" />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card bordered={false} className="op-list-card" title={<div style={{fontWeight: 900, color: '#c0a060'}}>Latest User Activity</div>}>
            <Table columns={userColumns} dataSource={data.recentUsers.slice(0, 5)} pagination={false} rowKey="id" size="small" />
          </Card>
        </Col>
      </Row>
    </div>
  );

  // --- STYLE 3: TECHNICAL (DATA-INTENSE MONITORING) ---
  const renderTechnicalView = () => (
    <div className="view-fade-in">
      <div className="tech-monitor-wrapper">
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={18}>
            <div className="tech-panel">
              <div className="tech-panel-header">Infrastructure Pulse & Resource Monitor</div>
              <Row gutter={[12, 12]}>
                <Col span={6}>
                  <div className="tech-metric">
                    <Text type="secondary" style={{fontSize: 10}}>DB SIZE</Text>
                    <div className="val">{data.systemHealth?.dbSize || 0} MB</div>
                  </div>
                </Col>
                <Col span={6}>
                  <div className="tech-metric">
                    <Text type="secondary" style={{fontSize: 10}}>ORDERS</Text>
                    <div className="val">{data.systemHealth?.totalRows?.total_orders || 0}</div>
                  </div>
                </Col>
                <Col span={6}>
                  <div className="tech-metric">
                    <Text type="secondary" style={{fontSize: 10}}>PRODUCTS</Text>
                    <div className="val">{data.systemHealth?.totalRows?.total_products || 0}</div>
                  </div>
                </Col>
                <Col span={6}>
                  <div className="tech-metric">
                    <Text type="secondary" style={{fontSize: 10}}>HEALTH</Text>
                    <div className="val" style={{color: '#52c41a'}}>OPTIMAL</div>
                  </div>
                </Col>
              </Row>
              <div style={{ marginTop: 24 }}>
                <Table 
                  columns={bizColumns} 
                  dataSource={data.newestBusinesses} 
                  pagination={false} 
                  size="small" 
                  rowKey="id" 
                  className="tech-table"
                />
              </div>
            </div>
          </Col>
          <Col xs={24} lg={6}>
            <div className="tech-panel side">
              <div className="tech-panel-header">Platform Composition</div>
              <div style={{ height: 180, marginBottom: 16 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.planDist} dataKey="value" innerRadius={40} outerRadius={60} paddingAngle={5}>
                      {data.planDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {data.planDist.map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <Text style={{ fontSize: 11, textTransform: 'uppercase' }}>{p.category}</Text>
                  <Text strong style={{ fontSize: 11 }}>{p.value}</Text>
                </div>
              ))}
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '24px 0' }}>
      {/* Dynamic Header */}
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Title level={2} style={{ color: '#1e4a2d', marginBottom: 4, fontWeight: 900 }}>
            {viewStyle === 1 && "Global Ecosystem Analytics"}
            {viewStyle === 2 && "Platform-wide Operations"}
            {viewStyle === 3 && "Infrastructure & Tenant Health"}
          </Title>
          <Text type="secondary" style={{ fontSize: 14 }}>
            Strategic overview of system growth, global user activity, and performance across all businesses in your ecosystem.
          </Text>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button 
            onClick={() => setViewStyle(viewStyle >= 3 ? 1 : viewStyle + 1)}
            style={{ 
              background: '#1e293b', color: '#fff', border: 'none', borderRadius: '10px',
              height: 40, display: 'flex', alignItems: 'center', gap: 8, padding: '0 20px'
            }}
          >
            Change View <AppstoreOutlined />
          </Button>
        </div>
      </div>

      <Spin spinning={loading}>
        {viewStyle === 1 && renderAnalyticalView()}
        {viewStyle === 2 && renderOperationalView()}
        {viewStyle === 3 && renderTechnicalView()}
      </Spin>

      <style jsx>{`
        .view-fade-in {
          animation: fadeIn 0.4s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* --- STYLE 1: ANALYTICAL --- */
        .premium-card-stat {
          background: #ffffff;
          padding: 24px;
          border-radius: 24px;
          border: 1px solid rgba(0,0,0,0.02);
          box-shadow: 0 4px 20px rgba(30, 74, 45, 0.04);
        }
        .icon-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }
        .icon-circle.gold { background: rgba(192, 160, 96, 0.1); color: #c0a060; }
        .icon-circle.green { background: rgba(30, 74, 45, 0.1); color: #1e4a2d; }
        .icon-circle.dark { background: rgba(30, 41, 59, 0.1); color: #1e293b; }

        .premium-main-area {
          background: #ffffff;
          padding: 32px;
          border-radius: 30px;
          border: 1px solid rgba(0,0,0,0.02);
          box-shadow: 0 4px 20px rgba(30, 74, 45, 0.04);
          height: 100%;
        }
        .premium-card-area {
          background: #ffffff;
          padding: 24px;
          border-radius: 30px;
          border: 1px solid rgba(0,0,0,0.02);
          box-shadow: 0 4px 20px rgba(30, 74, 45, 0.04);
          height: 100%;
        }
        .mock-card {
          padding: 20px;
          border-radius: 18px;
          margin-bottom: 16px;
          position: relative;
        }
        .mock-card.gold { background: linear-gradient(135deg, #c0a060 0%, #d4b47a 100%); color: #fff; }
        .mock-card.green { background: linear-gradient(135deg, #1e4a2d 0%, #2d6a3e 100%); color: #fff; }
        .mock-card .chip { width: 32px; height: 24px; background: rgba(255,255,255,0.2); border-radius: 4px; }

        /* --- STYLE 2: OPERATIONAL --- */
        .op-stat-section {
          padding: 32px 24px;
          text-align: center;
          height: 100%;
          transition: all 0.3s;
        }
        .op-stat-section:hover { background: #f8fafc; }
        .op-icon { font-size: 24px; margin-bottom: 16px; }
        .op-stat-section.green .op-icon { color: #1e4a2d; }
        .op-stat-section.gold .op-icon { color: #c0a060; }
        .op-stat-section.dark .op-icon { color: #1e293b; }
        .op-stat-section.blue .op-icon { color: #1890ff; }
        
        .op-val { font-size: 32px; font-weight: 900; color: #1e293b; line-height: 1; margin-bottom: 8px; }
        .op-lbl { font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
        
        .op-list-card { border-radius: 24px; box-shadow: 0 4px 15px rgba(0,0,0,0.02); }

        /* --- STYLE 3: TECHNICAL --- */
        .tech-monitor-wrapper { background: #f1f5f9; padding: 24px; border-radius: 24px; }
        .tech-panel { background: #fff; border-radius: 16px; padding: 24px; border: 1px solid #e2e8f0; height: 100%; }
        .tech-panel-header { font-weight: 900; font-size: 14px; margin-bottom: 24px; color: #1e293b; text-transform: uppercase; letter-spacing: 1px; }
        .tech-metric { background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0; }
        .tech-metric .val { font-size: 18px; font-weight: 900; color: #1e293b; margin-top: 4px; }
        
        .tech-table .ant-table-thead > tr > th { background: #f8fafc !important; font-size: 11px; }

        /* Global Overrides */
        .ant-table-thead > tr > th {
          background: #f8faf8 !important;
          font-weight: 700 !important;
          color: #1e4a2d !important;
        }
      `}</style>
    </div>
  );
};

export default SuperAdminDashboard;
