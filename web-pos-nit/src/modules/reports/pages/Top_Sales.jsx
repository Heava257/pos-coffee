import React, { useEffect, useState, useRef, useMemo } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, Legend, ComposedChart, Line, Area
} from "recharts";
import { 
  Button, Form, Image, Space, Table, Tag, Typography, Card, 
  Divider, Tooltip as AntTooltip, Row, Col, Statistic, Empty,
  Progress, Avatar, Badge, Segmented, Skeleton
} from "antd";
import { request } from "@/shared/utils/helper";
import { 
  PrinterOutlined, FilePdfOutlined, ReloadOutlined,
  TrophyOutlined, FireOutlined, ShoppingOutlined,
  ArrowUpOutlined, StarOutlined, BarChartOutlined,
  PieChartOutlined, DownloadOutlined, FilterOutlined
} from "@ant-design/icons";
import { 
  TrendingUp, Package, Award, Target, 
  Zap, ShoppingBag, Eye, RefreshCcw,
  ArrowRight, Crown, Medal
} from "lucide-react";
import MainPage from "@/app/layouts/MainPage";
import { configStore } from "@/app/store/configStore";
import { Config } from "@/shared/utils/config";
import jsPDF from "jspdf";
import dayjs from "dayjs";
import { useProfileStore } from "@/app/store/profileStore";

const { Title, Text } = Typography;

// World Class Color Palette (Premium Gold/Purple Theme)
const COLORS = {
  primary: "#8b5cf6", // Violet 500
  secondary: "#4f46e5", // Indigo 600
  gold: "#fbbf24", // Gold
  silver: "#94a3b8", // Silver
  bronze: "#d97706", // Bronze
  background: "#f8fafc",
  textPrimary: "#1e293b",
  textSecondary: "#64748b",
  success: "#10b981",
  chart: ["#8b5cf6", "#4f46e5", "#3b82f6", "#06b6d4", "#10b981", "#f59e0b"]
};

function Top_Sales() {
  const profile = useProfileStore(s => s.profile);
  const { config } = configStore();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewType, setViewType] = useState("table"); // table | analytics
  const printComponentRef = useRef(null);

  useEffect(() => {
    getList();
  }, []);

  const getList = async () => {
    try {
      setLoading(true);
      const res = await request("top_sales", "get");
      if (res) {
        setList(res.list || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const totals = useMemo(() => {
    const revenue = list.reduce((acc, curr) => acc + Number(curr.total_sale_amount || 0), 0);
    const avg = revenue / (list.length || 1);
    const topCategory = list.length > 0 ? list[0].category_name : "N/A";
    return { revenue, avg, topCategory };
  }, [list]);

  const chartData = useMemo(() => {
    return list.slice(0, 10).map(item => ({
      name: item.product_name,
      revenue: Number(item.total_sale_amount)
    }));
  }, [list]);

  const columns = [
    {
      title: "RANK",
      key: "rank",
      align: "center",
      width: 80,
      render: (_, __, index) => {
        if (index === 0) return <Avatar size="small" style={{ backgroundColor: COLORS.gold, fontWeight: 900 }}>1</Avatar>;
        if (index === 1) return <Avatar size="small" style={{ backgroundColor: COLORS.silver, fontWeight: 900 }}>2</Avatar>;
        if (index === 2) return <Avatar size="small" style={{ backgroundColor: COLORS.bronze, fontWeight: 900 }}>3</Avatar>;
        return <Text strong type="secondary">{index + 1}</Text>;
      }
    },
    {
      title: "PRODUCT",
      key: "product",
      render: (record) => (
        <Space size="middle">
          <Badge count={record.product_image ? null : <Package size={14} color="#ccc" />}>
            <Avatar 
              shape="square" 
              size={54} 
              src={record.product_image ? (Config.image_path + record.product_image) : null} 
              style={{ borderRadius: 12, border: '1px solid #f1f5f9' }}
            />
          </Badge>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Text strong style={{ fontSize: 15, color: COLORS.textPrimary }}>{record.product_name}</Text>
            <Tag color="blue" style={{ width: 'fit-content', borderRadius: 4, fontSize: 10, fontWeight: 700, marginTop: 4 }}>
              {record.category_name.toUpperCase()}
            </Tag>
          </div>
        </Space>
      )
    },
    {
      title: "PERFORMANCE",
      key: "performance",
      width: 250,
      render: (record) => {
        const pct = ((Number(record.total_sale_amount) / (totals.revenue || 1)) * 100).toFixed(1);
        return (
          <div style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text type="secondary" style={{ fontSize: 11 }}>Revenue Share</Text>
              <Text strong style={{ fontSize: 11 }}>{pct}%</Text>
            </div>
            <Progress 
              percent={pct} 
              showInfo={false} 
              strokeColor={Number(pct) > 20 ? COLORS.gold : COLORS.primary} 
              size="small" 
              trailColor="#f1f5f9"
            />
          </div>
        );
      }
    },
    {
      title: "TOTAL REVENUE",
      dataIndex: "total_sale_amount",
      key: "revenue",
      align: "right",
      sorter: (a, b) => a.total_sale_amount - b.total_sale_amount,
      render: (val) => (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <Text strong style={{ fontSize: 17, color: COLORS.secondary }}>${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>{ (val * 4100).toLocaleString() } ៛</Text>
        </div>
      )
    }
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ 
          background: 'rgba(30, 41, 59, 0.95)', 
          padding: '12px 16px', 
          borderRadius: 12,
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          border: 'none'
        }}>
          <p style={{ margin: 0, fontWeight: 700, color: '#fff', fontSize: 13 }}>{label}</p>
          <p style={{ margin: 0, fontWeight: 900, color: COLORS.gold, fontSize: 18 }}>
            ${payload[0].value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <MainPage loading={loading}>
      <div className="print-layout-container" style={{ 
        padding: '12px 24px 24px', 
        background: COLORS.background, 
        minHeight: '100vh',
        animation: 'fadeIn 0.8s ease-out'
      }}>
        {/* --- TOP BAR --- */}
        <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
          <div>
            <Space align="center" style={{ marginBottom: 8 }}>
              <div style={{ 
                width: 44, height: 44, borderRadius: 14, 
                background: 'linear-gradient(135deg, #8b5cf6 0%, #4f46e5 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 10px 20px rgba(139, 92, 246, 0.2)'
              }}>
                <TrophyOutlined style={{ fontSize: 22, color: '#fff' }} />
              </div>
              <Title level={2} style={{ margin: 0, fontWeight: 900, letterSpacing: '-0.8px' }}>Best Sellers Insights</Title>
            </Space>
            <Text type="secondary" style={{ fontSize: 16 }}>Identifying your most profitable menu items and products</Text>
          </div>

          <Space size="middle">
            <Segmented
              options={[
                { label: 'Table', value: 'table', icon: <Medal size={14} /> },
                { label: 'Analytics', value: 'analytics', icon: <TrendingUp size={14} /> },
              ]}
              value={viewType}
              onChange={setViewType}
              style={{ padding: 4, borderRadius: 12, background: '#fff' }}
            />
            <Button 
              type="primary" 
              icon={<PrinterOutlined />} 
              onClick={() => window.print()}
              style={{ 
                borderRadius: 12, height: 42, fontWeight: 700,
                background: COLORS.textPrimary, border: 'none', padding: '0 20px'
              }}
            >
              Print Report
            </Button>
            <AntTooltip title="Refresh Live Data">
              <Button 
                shape="circle" 
                icon={<RefreshCcw size={18} />} 
                onClick={getList} 
                style={{ height: 42, width: 42, borderRadius: 12 }} 
              />
            </AntTooltip>
          </Space>
        </div>

        {/* --- HERO KPI CARDS --- */}
        <Row className="no-print" gutter={[24, 24]} style={{ marginBottom: 32 }}>
          <Col xs={24} lg={16}>
            <Card style={{ borderRadius: 28, border: 'none', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', overflow: 'hidden' }}>
              <Row gutter={24} align="middle">
                <Col span={14}>
                  <div style={{ padding: '10px 20px' }}>
                    <Tag color="gold" style={{ borderRadius: 6, fontWeight: 800, marginBottom: 12, border: 'none' }}>PREMIUM ANALYTICS</Tag>
                    <Title level={2} style={{ color: '#fff', margin: 0, fontWeight: 900 }}>Performance Leaderboard</Title>
                    <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, display: 'block', marginTop: 10 }}>
                      Your top products contributed to <strong>{((totals.revenue / 20000) * 100).toFixed(1)}%</strong> of total business growth this cycle.
                    </Text>
                    <Button 
                      ghost 
                      style={{ marginTop: 24, borderRadius: 10, borderColor: COLORS.gold, color: COLORS.gold, fontWeight: 700 }}
                      icon={<Award size={16} />}
                    >
                      View Full Strategy
                    </Button>
                  </div>
                </Col>
                <Col span={10} style={{ position: 'relative' }}>
                  <div style={{ opacity: 0.2, position: 'absolute', right: -20, top: -40 }}>
                    <TrophyOutlined style={{ fontSize: 200, color: COLORS.gold }} />
                  </div>
                  <Statistic
                    title={<Text style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>TOTAL REVENUE</Text>}
                    value={totals.revenue}
                    formatter={val => <span style={{ color: COLORS.gold, fontSize: 36, fontWeight: 900 }}>${Number(val).toLocaleString()}</span>}
                  />
                </Col>
              </Row>
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Row gutter={[0, 24]}>
              <Col span={24}>
                <div className="op-mini-card" style={{ padding: '20px' }}>
                  <Statistic
                    title={<Text strong style={{ color: COLORS.textSecondary }}>AVG REVENUE / ITEM</Text>}
                    value={totals.avg}
                    formatter={val => <span style={{ color: COLORS.primary, fontSize: 28, fontWeight: 900 }}>${Number(val).toLocaleString()}</span>}
                    prefix={<Target size={24} style={{ marginRight: 12, color: COLORS.primary }} />}
                  />
                </div>
              </Col>
              <Col span={24}>
                <div className="op-mini-card" style={{ padding: '20px' }}>
                  <Statistic
                    title={<Text strong style={{ color: COLORS.textSecondary }}>HOT CATEGORY</Text>}
                    value={totals.topCategory}
                    formatter={val => <span style={{ color: COLORS.success, fontSize: 24, fontWeight: 900 }}>{val}</span>}
                    prefix={<FireOutlined style={{ marginRight: 12, color: COLORS.error }} />}
                  />
                </div>
              </Col>
            </Row>
          </Col>
        </Row>

        {/* --- MAIN ANALYTICS VIEW --- */}
        <div className="no-print">
          {viewType === "analytics" ? (
          <Row gutter={[24, 24]}>
            <Col span={24}>
              <Card style={{ borderRadius: 32, border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', padding: 12 }}>
                <Title level={4} style={{ marginBottom: 32, fontWeight: 800 }}>Top 10 Product Velocity</Title>
                <div style={{ height: 450 }}>
                  <ResponsiveContainer>
                    <BarChart data={chartData} layout="vertical" margin={{ left: 40, right: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" axisLine={false} tickLine={false} hide />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: COLORS.textPrimary, fontSize: 12, fontWeight: 700 }}
                        width={150}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                      <Bar dataKey="revenue" radius={[0, 10, 10, 0]} barSize={32} animationDuration={1500}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? COLORS.gold : (index < 3 ? COLORS.primary : COLORS.secondary)} fillOpacity={0.8} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>
          </Row>
        ) : (
          /* --- TABLE VIEW --- */
          <Card style={{ borderRadius: 32, border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', overflow: 'hidden' }} styles={{ body: { padding: 0 } }}>
            <Table
              dataSource={list}
              columns={columns}
              pagination={{ pageSize: 10, showSizeChanger: false }}
              scroll={{ x: 800 }}
              style={{ background: '#fff' }}
            />
          </Card>
        )}
      </div>

        {/* 🖨️ Printable Header (Visible ONLY during print) */}
        <div className="print-header" style={{ display: 'none', marginBottom: '20px', fontFamily: 'Inter, sans-serif' }}>
          <div style={{ textAlign: 'center', marginBottom: '15px' }}>
            <h2 style={{ margin: '0 0 5px 0', fontSize: '20px', fontWeight: 'bold', textTransform: 'uppercase', color: '#000' }}>
              {profile?.business_name || 'IT SRUK SRAE'}
            </h2>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '15px', fontWeight: 'bold', color: '#333' }}>
              របាយការណ៍ទំនិញលក់ដាច់បំផុត (BEST SELLERS REPORT)
            </h3>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '12px' }}>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold', width: '20%' }}>BUSINESS NAME</td>
                <td style={{ border: '1px solid #000', padding: '8px', width: '30%' }}>{profile?.business_name || 'IT SRUK SRAE'}</td>
                <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold', width: '20%' }}>REPORT TYPE</td>
                <td style={{ border: '1px solid #000', padding: '8px', width: '30%', fontWeight: 'bold' }}>BEST SELLERS REPORT</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>BRANCH / ADDRESS</td>
                <td style={{ border: '1px solid #000', padding: '8px' }}>{profile?.branch_name || 'MAIN BRANCH'} {profile?.branch_address && `(${profile.branch_address})`}</td>
                <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>DATE GENERATED</td>
                <td style={{ border: '1px solid #000', padding: '8px' }}>{dayjs().format("DD/MM/YYYY HH:mm")}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>TOTAL REVENUE</td>
                <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold', color: '#1e4a2d', fontSize: '13px' }}>
                  ${totals.revenue?.toLocaleString(undefined, { minimumFractionDigits: 2 })} ({(totals.revenue * 4100).toLocaleString()}៛)
                </td>
                <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>TOTAL ITEMS</td>
                <td style={{ border: '1px solid #000', padding: '8px' }}>{list.length} Items (Avg: ${totals.avg?.toFixed(2)}/item)</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 🖨️ Printable Table (Visible ONLY during print) */}
        <div className="print-table-container" style={{ display: 'none', marginBottom: '20px', fontFamily: 'Inter, sans-serif' }}>
          <h3 style={{ margin: '20px 0 10px 0', fontSize: '15px', fontWeight: 'bold', color: '#000' }}>Detailed Product Performance</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: 'bold', width: '80px' }}>RANK</th>
                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left', fontWeight: 'bold' }}>PRODUCT NAME</th>
                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left', fontWeight: 'bold' }}>CATEGORY</th>
                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: 'bold', width: '120px' }}>SHARE</th>
                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', fontWeight: 'bold', width: '180px' }}>REVENUE</th>
              </tr>
            </thead>
            <tbody>
              {list.map((item, idx) => {
                const pct = ((Number(item.total_sale_amount) / (totals.revenue || 1)) * 100).toFixed(1);
                return (
                  <tr key={idx}>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>#{idx + 1}</td>
                    <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>{item.product_name}</td>
                    <td style={{ border: '1px solid #000', padding: '8px' }}>{item.category_name?.toUpperCase()}</td>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{pct}%</td>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>
                      <div style={{ fontWeight: 'bold' }}>${Number(item.total_sale_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                      <div style={{ fontSize: '10px', color: '#555' }}>{(Number(item.total_sale_amount) * 4100).toLocaleString()} ៛</div>
                    </td>
                  </tr>
                );
              })}
              <tr style={{ background: '#f8fafc', fontWeight: 'bold' }}>
                <td style={{ border: '1px solid #000', padding: '8px' }} colSpan={3}>TOTAL BUSINESS REVENUE</td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>100%</td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>
                  <div style={{ fontWeight: 'bold' }}>${totals.revenue?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                  <div style={{ fontSize: '10px', color: '#555' }}>{(totals.revenue * 4100).toLocaleString()} ៛</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 🖨️ Printable Footer (Visible ONLY during print) */}
        <div className="print-footer" style={{ display: 'none', marginTop: '20px', fontFamily: 'Inter, sans-serif', pageBreakInside: 'avoid' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 50px 0 50px', marginTop: '10px' }}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '13px', display: 'block', fontWeight: 700, color: '#000' }}>រៀបចំដោយ (Prepared By)</span>
              <div style={{ height: '35px' }}></div>
              <span style={{ fontSize: '12px', display: 'block', color: '#000' }}>..........................................</span>
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '13px', display: 'block', fontWeight: 700, color: '#000' }}>ពិនិត្យ និងអនុម័តដោយ (Approved By)</span>
              <div style={{ height: '35px' }}></div>
              <span style={{ fontSize: '12px', display: 'block', color: '#000' }}>..........................................</span>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #000', padding: '8px 0', display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginTop: '15px' }}>
            <div>📍 {profile?.branch_address || 'Phnom Penh, Cambodia'}</div>
            <div>បោះពុម្ពដោយប្រព័ន្ធ POS៖ {dayjs().format("DD/MM/YYYY HH:mm")}</div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media print {
          .print-layout-container {
            min-height: auto !important;
            height: auto !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
          }
          .no-print {
            display: none !important;
          }
          .print-header {
            display: block !important;
          }
          .print-table-container {
            display: block !important;
          }
          .print-footer {
            display: block !important;
          }
          /* Reset page margins and body */
          body, html, .ant-layout, .admin-body, .ant-layout-content, .admin-layout-content {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            box-shadow: none !important;
          }
          .ant-layout-sider,
          .ant-layout-header,
          .admin-header,
          .admin-sider,
          header,
          aside {
            display: none !important;
          }
          .ant-layout-footer,
          footer {
            display: none !important;
          }
        }
      `}</style>
    </MainPage>
  );
}

export default Top_Sales;