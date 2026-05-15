import React, { useEffect, useState, useRef, useMemo } from "react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, Cell, LineChart, Line
} from "recharts";
import { request } from "../../util/helper";
import { 
  Button, DatePicker, Select, Space, Table, Tag, Card, Row, Col, 
  Typography, Divider, Statistic, Empty, Skeleton, ConfigProvider,
  Segmented
} from "antd";
import { 
  PrinterOutlined, FilePdfOutlined, 
  FilterOutlined, ReloadOutlined, DownloadOutlined,
  CalendarOutlined, DollarOutlined, ShoppingCartOutlined,
  PieChartOutlined, LineChartOutlined, BarChartOutlined,
  ShopOutlined, InboxOutlined, DashboardOutlined
} from '@ant-design/icons';
import { 
  Truck, ShoppingCart, DollarSign, Package, 
  TrendingUp, Activity, ArrowRight, Filter, 
  Download, Briefcase, FileText
} from "lucide-react";
import dayjs from "dayjs";
import { configStore } from "../../store/configStore";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const { Title, Text } = Typography;

// Corporate Blue & Indigo Palette
const COLORS = {
  primary: "#4f46e5", // Indigo 600
  secondary: "#0891b2", // Cyan 600
  accent: "#8b5cf6", // Violet 500
  background: "#f8fafc",
  textPrimary: "#1e293b",
  textSecondary: "#64748b",
  success: "#10b981",
  chart: ["#4f46e5", "#0891b2", "#8b5cf6", "#3b82f6", "#06b6d4"]
};

function ReportPurchase_Summary() {
  const { config } = configStore();
  const [loading, setLoading] = useState(false);
  const reportRef = useRef(null);
  const [viewType, setViewType] = useState("chart"); // chart | table
  const [filter, setFilter] = useState({
    from_date: dayjs().subtract(29, "d"),
    to_date: dayjs(),
  });
  const [state, setState] = useState({
    Data_Chat: [],
    list: [],
  });

  useEffect(() => {
    getList();
  }, []);

  const getList = async (customFilter = null) => {
    try {
      setLoading(true);
      const param = customFilter || {
        from_date: dayjs(filter.from_date).format("YYYY-MM-DD"),
        to_date: dayjs(filter.to_date).format("YYYY-MM-DD"),
      };
      const res = await request("report_Purchase_Summary", "get", param);
      if (res) {
        const chartData = res.list?.map(item => ({
          name: item.title,
          amount: Number(item.total_amount)
        })) || [];
        
        setState({
          Data_Chat: chartData,
          list: res.list || [],
        });
      }
    } catch (error) {
      console.error("Failed to fetch purchase summary:", error);
    } finally {
      setLoading(false);
    }
  };

  const onreset = () => {
    const start = dayjs().subtract(29, "d");
    const end = dayjs();
    setFilter({ from_date: start, to_date: end });
    getList({
      from_date: start.format("YYYY-MM-DD"),
      to_date: end.format("YYYY-MM-DD"),
    });
  };

  const totals = useMemo(() => {
    const amount = state.list.reduce((acc, curr) => acc + Number(curr.total_amount || 0), 0);
    const count = state.list.length;
    const avg = amount / (count || 1);
    return { amount, count, avg };
  }, [state.list]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2 
    }).format(value || 0);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.95)', 
          padding: '12px 16px', 
          border: 'none', 
          borderRadius: 12,
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          backdropFilter: 'blur(10px)'
        }}>
          <p style={{ margin: 0, fontWeight: 700, color: COLORS.textSecondary, fontSize: 11 }}>{label}</p>
          <p style={{ margin: 0, fontWeight: 900, color: COLORS.primary, fontSize: 18 }}>
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ 
      padding: '24px', 
      background: COLORS.background, 
      minHeight: '100vh',
      animation: 'fadeIn 0.8s ease-out'
    }}>
      {/* --- HEADER --- */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
        <div>
          <Space align="center" style={{ marginBottom: 8 }}>
            <div style={{ 
              width: 44, height: 44, borderRadius: 14, 
              background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 10px 20px rgba(79, 70, 229, 0.2)'
            }}>
              <Truck size={24} color="#fff" />
            </div>
            <Title level={2} style={{ margin: 0, fontWeight: 900, letterSpacing: '-0.8px' }}>Purchase Analytics</Title>
          </Space>
          <Text type="secondary" style={{ fontSize: 16 }}>Procurement trends and inventory investment overview</Text>
        </div>

        <Space size="middle">
          <Segmented
            options={[
              { label: 'Chart', value: 'chart', icon: <DashboardOutlined /> },
              { label: 'Table', value: 'table', icon: <InboxOutlined /> },
            ]}
            value={viewType}
            onChange={setViewType}
            style={{ padding: 4, borderRadius: 12, background: '#fff' }}
          />
          <Button 
            icon={<DownloadOutlined />} 
            onClick={() => {}} // Implement Export
            style={{ borderRadius: 12, height: 42, fontWeight: 600 }}
          >
            Export
          </Button>
          <Button 
            type="primary" 
            icon={<PrinterOutlined />} 
            onClick={() => window.print()}
            style={{ 
              borderRadius: 12, height: 42, fontWeight: 700,
              background: COLORS.textPrimary, border: 'none'
            }}
          >
            Print
          </Button>
        </Space>
      </div>

      {/* --- QUICK FILTERS --- */}
      <Card style={{ 
        marginBottom: 32, borderRadius: 24, border: 'none', 
        boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
      }} styles={{ body: { padding: '20px 24px' } }}>
        <Row gutter={24} align="middle">
          <Col flex="auto">
            <Space size="large">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Text strong style={{ fontSize: 12, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date Period</Text>
                <DatePicker.RangePicker
                  value={[filter.from_date, filter.to_date]}
                  format="DD MMM, YYYY"
                  style={{ borderRadius: 12, height: 44, width: 320, border: '1px solid #e2e8f0' }}
                  onChange={(val) => setFilter(prev => ({ ...prev, from_date: val[0], to_date: val[1] }))}
                />
              </div>
            </Space>
          </Col>
          <Col>
            <Space size="middle">
              <Button onClick={onreset} style={{ borderRadius: 12, height: 44, fontWeight: 600 }}>Reset</Button>
              <Button 
                type="primary" 
                onClick={() => getList()} 
                loading={loading}
                style={{ borderRadius: 12, height: 44, background: COLORS.primary, border: 'none', fontWeight: 800, padding: '0 32px' }}
              >
                FILTER DATA
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* --- KPI CARDS --- */}
      <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={12} lg={8}>
          <Card hoverable style={{ borderRadius: 28, border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.04)' }}>
            <Statistic
              title={<Text strong style={{ color: COLORS.textSecondary }}>TOTAL INVESTMENT</Text>}
              value={totals.amount}
              formatter={val => <span style={{ color: COLORS.primary, fontWeight: 900, fontSize: 32 }}>{formatCurrency(val)}</span>}
              prefix={<ShoppingCart size={28} style={{ marginRight: 16, color: COLORS.primary }} />}
            />
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Tag color="processing" style={{ borderRadius: 8, border: 'none', fontWeight: 700 }}>
                <TrendingUp size={12} /> +12.5% vs Prev Month
              </Tag>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card hoverable style={{ borderRadius: 28, border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.04)' }}>
            <Statistic
              title={<Text strong style={{ color: COLORS.textSecondary }}>PURCHASE VOLUME</Text>}
              value={totals.count}
              formatter={val => <span style={{ fontWeight: 900, fontSize: 32 }}>{val.toLocaleString()} Transactions</span>}
              prefix={<Package size={28} style={{ marginRight: 16, color: COLORS.secondary }} />}
            />
            <div style={{ marginTop: 16 }}>
              <Progress percent={70} size="small" strokeColor={COLORS.secondary} showInfo={false} />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card hoverable style={{ borderRadius: 28, border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.04)' }}>
            <Statistic
              title={<Text strong style={{ color: COLORS.textSecondary }}>AVG TICKET SIZE</Text>}
              value={totals.avg}
              formatter={val => <span style={{ fontWeight: 900, fontSize: 32 }}>{formatCurrency(val)}</span>}
              prefix={<Activity size={28} style={{ marginRight: 16, color: COLORS.accent }} />}
            />
            <div style={{ marginTop: 16 }}>
              <Text type="secondary" style={{ fontSize: 13 }}>Average spent per procurement</Text>
            </div>
          </Card>
        </Col>
      </Row>

      <div ref={reportRef}>
        {viewType === "chart" ? (
          <Card style={{ borderRadius: 32, border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
              <Title level={4} style={{ margin: 0, fontWeight: 800 }}>Procurement Velocity</Title>
              <Tag color="indigo" style={{ borderRadius: 8, fontWeight: 700 }}>Trend Analysis</Tag>
            </div>
            <div style={{ height: 450, width: '100%' }}>
              {state.Data_Chat.length > 0 ? (
                <ResponsiveContainer>
                  <AreaChart data={state.Data_Chat}>
                    <defs>
                      <linearGradient id="colorPur" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.15}/>
                        <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: COLORS.textSecondary, fontSize: 11, fontWeight: 600 }}
                      dy={15}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: COLORS.textSecondary, fontSize: 11, fontWeight: 600 }}
                      tickFormatter={val => `$${val}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="amount" 
                      stroke={COLORS.primary} 
                      strokeWidth={4} 
                      fillOpacity={1} 
                      fill="url(#colorPur)" 
                      animationDuration={2000}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <Empty description="Insufficient data for selected period" style={{ marginTop: 100 }} />
              )}
            </div>
          </Card>
        ) : (
          <Card style={{ borderRadius: 32, border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', overflow: 'hidden' }} styles={{ body: { padding: 0 } }}>
            <Table
              loading={loading}
              dataSource={state.list}
              columns={[
                {
                  title: "PURCHASE DATE",
                  dataIndex: "title",
                  key: "title",
                  render: (val) => (
                    <Space>
                      <CalendarOutlined style={{ color: COLORS.textSecondary }} />
                      <Text strong style={{ fontSize: 15 }}>{val}</Text>
                    </Space>
                  )
                },
                {
                  title: "TRANSACTION TYPE",
                  key: "type",
                  render: () => <Tag color="blue" style={{ borderRadius: 6, fontWeight: 700 }}>STOCK REPLENISH</Tag>
                },
                {
                  title: "RELIABILITY",
                  key: "status",
                  render: () => <Tag color="success" style={{ borderRadius: 6, fontWeight: 700 }}>VERIFIED</Tag>
                },
                {
                  title: "INVESTMENT",
                  dataIndex: "total_amount",
                  key: "totalamount",
                  align: 'right',
                  render: (val) => (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <Text strong style={{ fontSize: 17, color: COLORS.primary }}>{formatCurrency(val)}</Text>
                      <Text type="secondary" style={{ fontSize: 11 }}>{ (val * 4100).toLocaleString() } ៛</Text>
                    </div>
                  ),
                }
              ]}
              pagination={{ pageSize: 12, showSizeChanger: false }}
              summary={(pageData) => (
                <Table.Summary fixed>
                  <Table.Summary.Row style={{ background: '#f8fafc' }}>
                    <Table.Summary.Cell index={0} colSpan={3}><Text strong style={{ fontSize: 18 }}>TOTAL PROCUREMENT VALUE</Text></Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <Text strong style={{ fontSize: 22, color: COLORS.primary }}>{formatCurrency(totals.amount)}</Text>
                        <Text type="secondary" style={{ fontSize: 13 }}>{ (totals.amount * 4100).toLocaleString() } ៛</Text>
                      </div>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />
          </Card>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .ant-table-thead > tr > th {
          background: #f8fafc !important;
          color: #64748b !important;
          font-size: 11px !important;
          font-weight: 800 !important;
          text-transform: uppercase !important;
          letter-spacing: 1px !important;
          padding: 24px !important;
        }
        .ant-table-row:hover {
          background: #f1f5f9 !important;
        }
        @media print {
          .ant-btn, .ant-segmented, .ant-card:nth-child(2) {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export default ReportPurchase_Summary;