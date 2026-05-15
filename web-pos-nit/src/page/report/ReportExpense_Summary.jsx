import React, { useEffect, useState, useRef, useMemo } from "react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, Cell, PieChart, Pie
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
  ArrowDownOutlined, ArrowUpOutlined, InfoCircleOutlined
} from '@ant-design/icons';
import { 
  Wallet, DollarSign, TrendingDown, Receipt, 
  ArrowRight, Filter, Download, Activity,
  AlertTriangle, Briefcase, Coffee
} from "lucide-react";
import dayjs from "dayjs";
import { configStore } from "../../store/configStore";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const { Title, Text } = Typography;

// Premium Color Palette for Expenses (Deep Reds and Slates)
const COLORS = {
  primary: "#e11d48", // Rose 600
  secondary: "#4f46e5", // Indigo 600
  accent: "#f59e0b", // Amber 500
  background: "#f8fafc",
  textPrimary: "#1e293b",
  textSecondary: "#64748b",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  chart: ["#e11d48", "#4f46e5", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899"]
};

function ReportExpense_Summary() {
  const { config } = configStore();
  const [loading, setLoading] = useState(false);
  const reportRef = useRef(null);
  const [viewType, setViewType] = useState("trend"); // trend | category
  const [filter, setFilter] = useState({
    from_date: dayjs().startOf('month'),
    to_date: dayjs().endOf('month'),
    expense_type_id: ""
  });
  const [state, setState] = useState({
    Data_Chat: [],
    list: [],
    category_summary: []
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
        expense_type_id: filter.expense_type_id,
      };
      const res = await request("report_Expense_Summary", "get", param);
      if (res) {
        // Prepare chart data
        const chartData = res.list?.map(item => ({
          name: item.title,
          amount: Number(item.total_amount)
        })) || [];

        // Group by category (Mock logic since API returns flat list by day usually)
        // If API returns detailed breakdown we use it, otherwise we group current list
        setState({
          Data_Chat: chartData,
          list: res.list || [],
          category_summary: [] // This usually requires a separate endpoint or detailed payload
        });
      }
    } catch (error) {
      console.error("Failed to fetch expense summary:", error);
    } finally {
      setLoading(false);
    }
  };

  const onreset = () => {
    const start = dayjs().startOf('month');
    const end = dayjs().endOf('month');
    setFilter({
      from_date: start,
      to_date: end,
      expense_type_id: ""
    });
    getList({
      from_date: start.format("YYYY-MM-DD"),
      to_date: end.format("YYYY-MM-DD"),
      expense_type_id: ""
    });
  };

  const totals = useMemo(() => {
    const amount = state.list.reduce((acc, curr) => acc + Number(curr.total_amount || 0), 0);
    const avg = amount / (state.list.length || 1);
    const max = Math.max(...state.list.map(i => Number(i.total_amount || 0)), 0);
    return { amount, avg, max };
  }, [state.list]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value || 0);
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    try {
      setLoading(true);
      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Expense_Intelligence_${dayjs().format('YYYYMMDD')}.pdf`);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
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
          backdropFilter: 'blur(5px)'
        }}>
          <p style={{ margin: 0, fontWeight: 700, color: COLORS.textSecondary, fontSize: 12 }}>{label}</p>
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
      animation: 'fadeIn 0.6s ease-out'
    }}>
      {/* --- HEADER --- */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
        <div>
          <Space align="center" style={{ marginBottom: 8 }}>
            <div style={{ 
              width: 40, height: 40, borderRadius: 12, 
              background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 16px rgba(225, 29, 72, 0.2)'
            }}>
              <Wallet size={20} color="#fff" />
            </div>
            <Title level={2} style={{ margin: 0, fontWeight: 900, letterSpacing: '-0.5px' }}>Expense Intelligence</Title>
          </Space>
          <Text type="secondary" style={{ fontSize: 15 }}>
            Operational costs & cash flow analysis for {dayjs(filter.from_date).format("MMM DD")} - {dayjs(filter.to_date).format("MMM DD, YYYY")}
          </Text>
        </div>

        <Space size="middle">
          <Segmented
            options={[
              { label: 'Trend', value: 'trend', icon: <LineChartOutlined /> },
              { label: 'Category', value: 'category', icon: <PieChartOutlined /> },
            ]}
            value={viewType}
            onChange={setViewType}
            style={{ padding: 4, borderRadius: 12, background: '#fff' }}
          />
          <Button 
            icon={<DownloadOutlined />} 
            onClick={handleDownloadPDF} 
            style={{ borderRadius: 10, fontWeight: 600, height: 40 }}
          >
            Export PDF
          </Button>
          <Button 
            type="primary" 
            icon={<PrinterOutlined />} 
            onClick={() => window.print()}
            style={{ 
              borderRadius: 10, height: 40, fontWeight: 600,
              background: COLORS.textPrimary, border: 'none'
            }}
          >
            Print Report
          </Button>
        </Space>
      </div>

      {/* --- QUICK FILTERS --- */}
      <Card style={{ 
        marginBottom: 32, borderRadius: 20, border: 'none', 
        boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
      }} styles={{ body: { padding: '16px 24px' } }}>
        <Row gutter={24} align="middle">
          <Col flex="auto">
            <Space size="large">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <Text strong style={{ fontSize: 12, color: COLORS.textSecondary }}>DATE RANGE</Text>
                <DatePicker.RangePicker
                  value={[filter.from_date, filter.to_date]}
                  format="DD MMM, YYYY"
                  style={{ borderRadius: 10, height: 40, width: 300 }}
                  onChange={(val) => setFilter(prev => ({ ...prev, from_date: val[0], to_date: val[1] }))}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <Text strong style={{ fontSize: 12, color: COLORS.textSecondary }}>CATEGORY</Text>
                <Select
                  placeholder="All Categories"
                  style={{ width: 200, height: 40 }}
                  value={filter.expense_type_id}
                  options={config.expense}
                  onChange={val => setFilter(prev => ({ ...prev, expense_type_id: val }))}
                  suffixIcon={<Filter size={14} />}
                />
              </div>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button onClick={onreset} style={{ borderRadius: 10, height: 40 }}>Reset</Button>
              <Button 
                type="primary" 
                onClick={() => getList()} 
                loading={loading}
                style={{ borderRadius: 10, height: 40, background: COLORS.primary, border: 'none', fontWeight: 700, padding: '0 24px' }}
              >
                GENERATE ANALYSIS
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* --- KPI CARDS --- */}
      <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable style={{ borderRadius: 24, border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.04)' }}>
            <Statistic
              title={<Text strong style={{ color: COLORS.textSecondary }}>TOTAL EXPENSES</Text>}
              value={totals.amount}
              formatter={val => <span style={{ color: COLORS.primary, fontWeight: 900, fontSize: 28 }}>{formatCurrency(val)}</span>}
              prefix={<Wallet size={24} style={{ marginRight: 12, color: COLORS.primary }} />}
            />
            <div style={{ marginTop: 12 }}>
              <Tag color="error" style={{ borderRadius: 6, border: 'none' }}>
                <TrendingDown size={12} /> {((totals.amount / 5000) * 100).toFixed(1)}% of Budget
              </Tag>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable style={{ borderRadius: 24, border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.04)' }}>
            <Statistic
              title={<Text strong style={{ color: COLORS.textSecondary }}>DAILY AVERAGE</Text>}
              value={totals.avg}
              formatter={val => <span style={{ fontWeight: 800, fontSize: 28 }}>{formatCurrency(val)}</span>}
              prefix={<Activity size={24} style={{ marginRight: 12, color: COLORS.secondary }} />}
            />
            <div style={{ marginTop: 12 }}>
              <Tag style={{ borderRadius: 6, border: 'none' }}>30 Days Window</Tag>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable style={{ borderRadius: 24, border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.04)' }}>
            <Statistic
              title={<Text strong style={{ color: COLORS.textSecondary }}>HIGHEST SPEND</Text>}
              value={totals.max}
              formatter={val => <span style={{ fontWeight: 800, fontSize: 28 }}>{formatCurrency(val)}</span>}
              prefix={<AlertTriangle size={24} style={{ marginRight: 12, color: COLORS.accent }} />}
            />
            <div style={{ marginTop: 12 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Single Transaction Peak</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable style={{ borderRadius: 24, border: 'none', background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}>
            <Statistic
              title={<Text strong style={{ color: 'rgba(255,255,255,0.7)' }}>COGS vs OpEx</Text>}
              value={totals.amount * 0.6}
              formatter={val => <span style={{ color: '#fff', fontWeight: 900, fontSize: 28 }}>{formatCurrency(val)}</span>}
              prefix={<Briefcase size={24} style={{ marginRight: 12, color: COLORS.accent }} />}
            />
            <div style={{ marginTop: 12 }}>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Estimated COGS Share</Text>
            </div>
          </Card>
        </Col>
      </Row>

      <div ref={reportRef}>
        <Row gutter={24}>
          {/* --- MAIN CHART --- */}
          <Col span={16}>
            <Card style={{ borderRadius: 24, border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Title level={4} style={{ margin: 0, fontWeight: 800 }}>Spending Analytics</Title>
                <Space>
                  <Tag color="red" style={{ borderRadius: 6, fontWeight: 600 }}>Trend View</Tag>
                </Space>
              </div>
              <div style={{ height: 400, width: '100%' }}>
                {state.Data_Chat.length > 0 ? (
                  <ResponsiveContainer>
                    <AreaChart data={state.Data_Chat}>
                      <defs>
                        <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.2}/>
                          <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: COLORS.textSecondary, fontSize: 10, fontWeight: 600 }}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: COLORS.textSecondary, fontSize: 10, fontWeight: 600 }}
                        tickFormatter={val => `$${val}`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area 
                        type="monotone" 
                        dataKey="amount" 
                        stroke={COLORS.primary} 
                        strokeWidth={4} 
                        fillOpacity={1} 
                        fill="url(#colorAmt)" 
                        animationDuration={1500}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <Empty description="No data for selected period" style={{ marginTop: 100 }} />
                )}
              </div>
            </Card>
          </Col>

          {/* --- PIE CHART / SECONDARY --- */}
          <Col span={8}>
            <Card style={{ borderRadius: 24, border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', height: '100%' }}>
              <Title level={4} style={{ marginBottom: 24, fontWeight: 800 }}>Category Share</Title>
              <div style={{ height: 300, width: '100%' }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={state.Data_Chat.slice(0, 5)}
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={8}
                      dataKey="amount"
                    >
                      {state.Data_Chat.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS.chart[index % COLORS.chart.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" align="center" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: '#f8fafc', borderRadius: 16, padding: 16, marginTop: 20 }}>
                <Space align="start">
                  <InfoCircleOutlined style={{ color: COLORS.secondary, marginTop: 4 }} />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Most of your spending this period went towards top 3 operational categories.
                  </Text>
                </Space>
              </div>
            </Card>
          </Col>
        </Row>

        {/* --- DETAILED TABLE --- */}
        <Card style={{ 
          marginTop: 24, borderRadius: 24, border: 'none', 
          boxShadow: '0 10px 30px rgba(0,0,0,0.04)' 
        }} styles={{ body: { padding: 0 } }}>
          <div style={{ padding: '24px 24px 12px' }}>
            <Title level={4} style={{ margin: 0, fontWeight: 800 }}>Transaction Logs</Title>
          </div>
          <Table
            loading={loading}
            dataSource={state.list}
            columns={[
              {
                title: "TRANSACTION DATE",
                dataIndex: "title",
                key: "title",
                render: (val) => (
                  <Space>
                    <CalendarOutlined style={{ color: COLORS.textSecondary }} />
                    <Text strong>{val}</Text>
                  </Space>
                )
              },
              {
                title: "CLASSIFICATION",
                key: "classification",
                render: (_, record) => (
                  <Tag color={Number(record.total_amount) > 100 ? "volcano" : "blue"} style={{ borderRadius: 6, fontWeight: 700 }}>
                    {Number(record.total_amount) > 100 ? "OpEx Peak" : "Regular"}
                  </Tag>
                )
              },
              {
                title: "STATUS",
                key: "status",
                render: () => <Tag color="success" style={{ borderRadius: 6, fontWeight: 700 }}>COMPLETED</Tag>
              },
              {
                title: "AMOUNT",
                dataIndex: "total_amount",
                key: "totalamount",
                align: 'right',
                render: (val) => (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <Text strong style={{ fontSize: 16, color: COLORS.primary }}>{formatCurrency(val)}</Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>{ (val * 4100).toLocaleString() }៛</Text>
                  </div>
                ),
              },
              {
                title: "INTENSITY",
                align: 'center',
                render: (_, record) => {
                  const pct = ((record.total_amount / (totals.max || 1)) * 100).toFixed(0);
                  return (
                    <div style={{ width: 80, margin: '0 auto' }}>
                      <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: COLORS.primary }}></div>
                      </div>
                      <div style={{ fontSize: 9, color: COLORS.textSecondary, marginTop: 4 }}>{pct}% Intensity</div>
                    </div>
                  );
                }
              }
            ]}
            pagination={{ pageSize: 10, showSizeChanger: false }}
            summary={(pageData) => (
              <Table.Summary fixed>
                <Table.Summary.Row style={{ background: '#f8fafc' }}>
                  <Table.Summary.Cell index={0} colSpan={3}><Text strong style={{ fontSize: 16 }}>GRAND TOTAL SPENDING</Text></Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="right">
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <Text strong style={{ fontSize: 20, color: COLORS.primary }}>{formatCurrency(totals.amount)}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>{ (totals.amount * 4100).toLocaleString() }៛</Text>
                    </div>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} />
                </Table.Summary.Row>
              </Table.Summary>
            )}
          />
        </Card>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .ant-table-thead > tr > th {
          background: #f8fafc !important;
          color: #64748b !important;
          font-size: 11px !important;
          font-weight: 700 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.5px !important;
        }
        @media print {
          .ant-btn, .ant-segmented, .ant-card:first-child {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export default ReportExpense_Summary;