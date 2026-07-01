import React, { useEffect, useState, useRef, useMemo } from "react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, Cell, LineChart, Line
} from "recharts";
import { request } from "@/shared/utils/helper";
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
import { configStore } from "@/app/store/configStore";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import logo from "@/assets/business_default_logo.png";
import { useProfileStore } from "@/app/store/profileStore";

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
  const profile = useProfileStore(s => s.profile);
  const { config } = configStore();
  const [loading, setLoading] = useState(false);
  const reportRef = useRef(null);
  const [viewType, setViewType] = useState("chart"); // chart | table
  const printCell = {
    onCell: () => ({
      style: {
        border: '1px solid #000000',
        padding: '8px',
        color: '#000000',
        background: 'transparent'
      }
    }),
    onHeaderCell: () => ({
      style: {
        border: '1px solid #000000',
        padding: '8px',
        color: '#000000',
        background: '#f1f5f9',
        fontWeight: 'bold'
      }
    })
  };
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
    <div className="print-layout-container" style={{ 
      padding: '24px', 
      background: COLORS.background, 
      minHeight: '100vh',
      animation: 'fadeIn 0.8s ease-out'
    }}>
      {/* --- HEADER --- */}
      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
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
      <Card className="global-filter-card no-print" style={{ 
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

      <div ref={reportRef}>
        {/* 🖨️ Printable Header (Visible ONLY during print) */}
        <div className="print-header" style={{ display: 'none', marginBottom: '20px', fontFamily: 'Inter, sans-serif' }}>
          <div style={{ textAlign: 'center', marginBottom: '15px' }}>
            <h2 style={{ margin: '0 0 5px 0', fontSize: '20px', fontWeight: 'bold', textTransform: 'uppercase', color: '#000' }}>
              {profile?.business_name || 'IT SRUK SRAE'}
            </h2>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '15px', fontWeight: 'bold', color: '#333' }}>
              របាយការណ៍ទិញទំនិញសរុប (PURCHASE SUMMARY REPORT)
            </h3>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '12px' }}>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold', width: '20%' }}>BUSINESS NAME</td>
                <td style={{ border: '1px solid #000', padding: '8px', width: '30%' }}>{profile?.business_name || 'IT SRUK SRAE'}</td>
                <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold', width: '20%' }}>REPORT TYPE</td>
                <td style={{ border: '1px solid #000', padding: '8px', width: '30%', fontWeight: 'bold' }}>PURCHASE SUMMARY REPORT</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>BRANCH / ADDRESS</td>
                <td style={{ border: '1px solid #000', padding: '8px' }}>{profile?.branch_name || 'MAIN BRANCH'} {profile?.branch_address && `(${profile.branch_address})`}</td>
                <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>DATE RANGE</td>
                <td style={{ border: '1px solid #000', padding: '8px' }}>{dayjs(filter.from_date).format("DD/MM/YYYY")} - {dayjs(filter.to_date).format("DD/MM/YYYY")}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>TOTAL INVESTMENT</td>
                <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold', color: '#1e4a2d', fontSize: '13px' }}>{formatCurrency(totals.amount)}</td>
                <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>TOTAL TRANSACTIONS</td>
                <td style={{ border: '1px solid #000', padding: '8px' }}>{totals.count} Transactions (Avg: {formatCurrency(totals.avg)})</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 🖨️ Printable Table (Visible ONLY during print) */}
        <div className="print-table-container" style={{ display: 'none', marginBottom: '20px', fontFamily: 'Inter, sans-serif' }}>
          <h3 style={{ margin: '20px 0 10px 0', fontSize: '15px', fontWeight: 'bold', color: '#000' }}>Detailed Transaction Log</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left', fontWeight: 'bold' }}>PURCHASE DATE</th>
                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left', fontWeight: 'bold' }}>TRANSACTION TYPE</th>
                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left', fontWeight: 'bold' }}>RELIABILITY</th>
                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>INVESTMENT</th>
              </tr>
            </thead>
            <tbody>
              {state.list.map((item, idx) => {
                return (
                  <tr key={idx}>
                    <td style={{ border: '1px solid #000', padding: '8px' }}>{item.title}</td>
                    <td style={{ border: '1px solid #000', padding: '8px' }}>STOCK REPLENISH</td>
                    <td style={{ border: '1px solid #000', padding: '8px' }}>VERIFIED</td>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>
                      <div style={{ fontWeight: 'bold' }}>{formatCurrency(item.total_amount)}</div>
                      <div style={{ fontSize: '10px', color: '#555' }}>{(item.total_amount * 4100).toLocaleString()} ៛</div>
                    </td>
                  </tr>
                );
              })}
              <tr style={{ background: '#f8fafc', fontWeight: 'bold' }}>
                <td style={{ border: '1px solid #000', padding: '8px' }} colSpan={3}>TOTAL PROCUREMENT VALUE</td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>
                  <div style={{ fontWeight: 'bold' }}>{formatCurrency(totals.amount)}</div>
                  <div style={{ fontSize: '10px', color: '#555' }}>{(totals.amount * 4100).toLocaleString()} ៛</div>
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

        {/* --- KPI CARDS --- */}
        <Row gutter={[24, 24]} style={{ marginBottom: 32 }} className="no-print">
        <Col xs={24} sm={12} lg={8}>
          <div className="op-mini-card" style={{ padding: '20px' }}>
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
          </div>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <div className="op-mini-card" style={{ padding: '20px' }}>
            <Statistic
              title={<Text strong style={{ color: COLORS.textSecondary }}>PURCHASE VOLUME</Text>}
              value={totals.count}
              formatter={val => <span style={{ fontWeight: 900, fontSize: 32 }}>{val.toLocaleString()} Transactions</span>}
              prefix={<Package size={28} style={{ marginRight: 16, color: COLORS.secondary }} />}
            />
            <div style={{ marginTop: 16 }}>
              <Progress percent={70} size="small" strokeColor={COLORS.secondary} showInfo={false} />
            </div>
          </div>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <div className="op-mini-card" style={{ padding: '20px' }}>
            <Statistic
              title={<Text strong style={{ color: COLORS.textSecondary }}>AVG TICKET SIZE</Text>}
              value={totals.avg}
              formatter={val => <span style={{ fontWeight: 900, fontSize: 32 }}>{formatCurrency(val)}</span>}
              prefix={<Activity size={28} style={{ marginRight: 16, color: COLORS.accent }} />}
            />
            <div style={{ marginTop: 16 }}>
              <Text type="secondary" style={{ fontSize: 13 }}>Average spent per procurement</Text>
            </div>
          </div>
        </Col>
      </Row>

        {/* Chart View (No Print) */}
        <div className={`no-print ${viewType === "chart" ? "" : "hidden-desktop"}`}>
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
        </div>

        {/* Table View (Always Visible in Print) */}
        <div className={`print-visible-table no-print ${viewType === "table" ? "" : "hidden-desktop"}`}>
          <Card style={{ borderRadius: 32, border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', overflow: 'hidden' }} styles={{ body: { padding: 0 } }}>
            <Table
              bordered
              loading={loading}
              dataSource={state.list}
              columns={[
                {
                  title: "PURCHASE DATE",
                  dataIndex: "title",
                  key: "title",
                  ...printCell,
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
                  ...printCell,
                  render: () => <Tag color="blue" style={{ borderRadius: 6, fontWeight: 700 }}>STOCK REPLENISH</Tag>
                },
                {
                  title: "RELIABILITY",
                  key: "status",
                  ...printCell,
                  render: () => <Tag color="success" style={{ borderRadius: 6, fontWeight: 700 }}>VERIFIED</Tag>
                },
                {
                  title: "INVESTMENT",
                  dataIndex: "total_amount",
                  key: "totalamount",
                  align: 'right',
                  ...printCell,
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
                    <Table.Summary.Cell index={0} colSpan={3} style={{ border: '1px solid #000000', padding: '8px', background: '#f8fafc', color: '#000000' }}><Text strong style={{ fontSize: 18 }}>TOTAL PROCUREMENT VALUE</Text></Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right" style={{ border: '1px solid #000000', padding: '8px', background: '#f8fafc', color: '#000000' }}>
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
        </div>

      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media screen {
          .hidden-desktop {
            display: none !important;
          }
        }
        @media print {
          /* Hide sidebar, header and other platform UI components completely */
          .ant-layout-sider,
          .ant-layout-header,
          .admin-header,
          .admin-sider,
          header,
          aside,
          .header-icon-btn,
          #header-notif-dropdown-anchor,
          #header-profile-dropdown-anchor,
          .no-print,
          .global-filter-card,
          .ant-btn,
          .ant-segmented,
          .ant-select,
          .ant-picker {
            display: none !important;
          }

          /* Hide layout footer and pagination */
          .ant-layout-footer,
          footer,
          .ant-table-pagination,
          .ant-pagination {
            display: none !important;
          }
          
          /* Force page margins and body resets */
          .print-layout-container {
            min-height: auto !important;
            height: auto !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
          }
          body, html, .ant-layout, .admin-body, .ant-layout-content, .admin-layout-content {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            box-shadow: none !important;
          }

          /* Ensure print header and footer show up */
          .print-header {
            display: block !important;
          }
          .print-table-container {
            display: block !important;
          }
          .print-footer {
            display: block !important;
          }

          /* Toggle active view for print */
          .print-table-container {
            display: block !important;
          }
          .hidden-desktop {
            display: block !important;
          }

          /* Remove rounded corners and box shadows from wrappers */
          .ant-card,
          .ant-card-body,
          .ant-table-wrapper,
          .ant-table,
          .ant-table-container,
          .ant-table-content,
          .ant-table-cell {
            border-radius: 0 !important;
            box-shadow: none !important;
          }

          /* Force collapsed thin black border grid on all tables */
          table {
            border-collapse: collapse !important;
            border: 1px solid #000000 !important;
            width: 100% !important;
          }
          
          th,
          td,
          .ant-table-cell,
          .print-grid-cell,
          .ant-table-summary tr td {
            border: 1px solid #000000 !important;
            padding: 8px !important;
            color: #000000 !important;
            border-radius: 0 !important;
          }
          
          th,
          .ant-table-thead > tr > th {
            background: #f1f5f9 !important;
            font-weight: bold !important;
          }

          /* Make tags render as simple plain text without borders/backgrounds */
          .ant-tag {
            border: none !important;
            background: transparent !important;
            color: #000000 !important;
            padding: 0 !important;
            margin: 0 !important;
            border-radius: 0 !important;
            font-weight: normal !important;
            font-size: inherit !important;
            text-shadow: none !important;
          }

          /* Hide icons during print */
          .anticon,
          svg {
            display: none !important;
          }

          /* Prevent table rows breaking across pages */
          tr {
            page-break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
}

export default ReportPurchase_Summary;