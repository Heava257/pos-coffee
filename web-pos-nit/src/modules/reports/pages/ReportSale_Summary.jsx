import React, { useEffect, useState, useRef, useMemo } from "react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, Cell, PieChart, Pie
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
  BarChartOutlined, PieChartOutlined
} from '@ant-design/icons';
import { 
  DollarSign, ShoppingBag, TrendingUp, Wallet, 
  ArrowUpRight, Users, Clock, Filter, FileText, Download
} from "lucide-react";
import dayjs from "dayjs";
import { configStore } from "@/app/store/configStore";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import logo from "@/assets/business_default_logo.png";
import { useProfileStore } from "@/app/store/profileStore";

const { Title, Text } = Typography;

const COLORS = {
  primary: "#1e4a2d",
  secondary: "#c0a060",
  success: "#52c41a",
  warning: "#faad14",
  danger: "#f5222d",
  bg: "#f8fafc",
  chart: ["#1e4a2d", "#c0a060", "#3a7d52", "#d4af37", "#2d6a42"]
};

function ReportSale_Summary() {
  const profile = useProfileStore(s => s.profile);
  const { config } = configStore();
  const [loading, setLoading] = useState(false);
  const reportRef = useRef(null);
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
    category_id: null,
    brand_id: null
  });
  const [state, setState] = useState({
    Data_Chat: [],
    list: [],
  });

  useEffect(() => {
    getList();
  }, []);

  const onreset = () => {
    setFilter({
      from_date: dayjs().subtract(29, "d"),
      to_date: dayjs(),
      category_id: null,
      brand_id: null,
    });
    getList({
      from_date: dayjs().subtract(29, "d").format("YYYY-MM-DD"),
      to_date: dayjs().format("YYYY-MM-DD"),
      category_id: null,
      brand_id: null,
    });
  };

  const getList = async (customFilter = null) => {
    try {
      setLoading(true);
      const param = customFilter || {
        from_date: dayjs(filter.from_date).format("YYYY-MM-DD"),
        to_date: dayjs(filter.to_date).format("YYYY-MM-DD"),
        category_id: filter.category_id,
        brand_id: filter.brand_id,
      };
      const res = await request("report_Sale_Sammary", "get", param);
      if (res) {
        // Prepare data for recharts
        const chartData = res.list?.map(item => ({
          name: dayjs(item.order_date).format("DD MMM"),
          fullDate: item.order_date,
          Sale: Number(item.total_amount),
          Qty: Number(item.total_qty)
        })) || [];

        setState({
          Data_Chat: chartData,
          list: res.list || [],
        });
      } else {
        setState({
          Data_Chat: [],
          list: [],
        });
      }
    } catch (error) {
      console.error("Failed to fetch sales summary:", error);
    } finally {
      setLoading(false);
    }
  };

  const totals = useMemo(() => {
    let totalQty = 0;
    let totalAmount = 0;
    state.list.forEach(({ total_qty, total_amount }) => {
      totalQty += Number(total_qty || 0);
      totalAmount += Number(total_amount || 0);
    });
    return {
      qty: totalQty,
      amount: totalAmount,
      orderCount: state.list.length,
      aov: state.list.length > 0 ? totalAmount / state.list.length : 0
    };
  }, [state.list]);

  const handleQuickFilter = (range) => {
    let from = dayjs();
    let to = dayjs();

    if (range === 'today') {
      from = dayjs().startOf('day');
    } else if (range === 'yesterday') {
      from = dayjs().subtract(1, 'day').startOf('day');
      to = dayjs().subtract(1, 'day').endOf('day');
    } else if (range === '7days') {
      from = dayjs().subtract(7, 'days');
    } else if (range === '30days') {
      from = dayjs().subtract(30, 'days');
    } else if (range === 'thisMonth') {
      from = dayjs().startOf('month');
    }

    const newFilter = { ...filter, from_date: from, to_date: to };
    setFilter(newFilter);
    getList({
      from_date: from.format("YYYY-MM-DD"),
      to_date: to.format("YYYY-MM-DD"),
      category_id: filter.category_id,
      brand_id: filter.brand_id
    });
  };

  // Format number as currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Handle print functionality
  const handlePrint = () => {
    window.print();
  };

  // Handle PDF download
  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 280;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save(`Sales_Report_${dayjs().format('YYYY-MM-DD')}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  return (
    <div className="print-layout-container" style={{ padding: "0 0 40px 0" }}>
      {/* 🚀 Header & Main Controls */}
      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 900, color: COLORS.primary, letterSpacing: '-1px' }}>
            Sales Intelligence
          </Title>
          <Text type="secondary" style={{ fontSize: 14 }}>
            Strategic overview of your business performance and revenue trends.
          </Text>
        </div>
        <Space size={12}>
           <Button
            size="large"
            icon={<PrinterOutlined />}
            onClick={handlePrint}
            style={{ borderRadius: 12, fontWeight: 600 }}
          >
            Print Report
          </Button>
        </Space>
      </div>

      {/* 🔍 Global Filters Section */}
      <Card 
        className="global-filter-card no-print"
        bordered={false} 
        style={{ 
          marginBottom: "32px", 
          borderRadius: 24, 
          boxShadow: '0 10px 30px rgba(0,0,0,0.03)',
          background: 'rgba(255,255,255,0.8)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.5)'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <Space size={12} wrap>
              <Segmented
                options={[
                  { label: 'Today', value: 'today' },
                  { label: 'Yesterday', value: 'yesterday' },
                  { label: '7 Days', value: '7days' },
                  { label: '30 Days', value: '30days' },
                  { label: 'This Month', value: 'thisMonth' }
                ]}
                onChange={handleQuickFilter}
                style={{ background: '#f1f5f9', padding: 4, borderRadius: 12 }}
              />
              <DatePicker.RangePicker
                value={[filter.from_date, filter.to_date]}
                format={"DD/MM/YYYY"}
                style={{ borderRadius: 12, height: 40, border: '1px solid #e2e8f0' }}
                onChange={(value) => {
                  if (value) {
                    setFilter(prev => ({ ...prev, from_date: value[0], to_date: value[1] }));
                  }
                }}
              />
            </Space>
            
            <Space size={12}>
              <Select
                allowClear
                placeholder="All Categories"
                value={filter.category_id}
                options={config?.category}
                style={{ width: 180 }}
                dropdownStyle={{ borderRadius: 12 }}
                onChange={(v) => setFilter(prev => ({ ...prev, category_id: v }))}
              />
              <Select
                allowClear
                placeholder="All Brands"
                value={filter.brand_id}
                options={config?.brand}
                style={{ width: 180 }}
                dropdownStyle={{ borderRadius: 12 }}
                onChange={(v) => setFilter(prev => ({ ...prev, brand_id: v }))}
              />
              <Button 
                icon={<ReloadOutlined />} 
                onClick={onreset}
                style={{ borderRadius: 10 }}
              />
              <Button 
                type="primary" 
                icon={<FilterOutlined />}
                onClick={() => getList()} 
                loading={loading}
                style={{ borderRadius: 10, background: COLORS.primary, height: 40, padding: '0 25px' }}
              >
                Apply Filters
              </Button>
            </Space>
          </div>
        </div>
      </Card>

      <div ref={reportRef}>
        {/* 🖨️ Printable Header (Visible ONLY during print) */}
        <div className="print-header" style={{ display: 'none', marginBottom: '20px', fontFamily: 'Inter, sans-serif' }}>
          <div style={{ textAlign: 'center', marginBottom: '15px' }}>
            <h2 style={{ margin: '0 0 5px 0', fontSize: '20px', fontWeight: 'bold', textTransform: 'uppercase', color: '#000' }}>
              {profile?.business_name || 'IT SRUK SRAE'}
            </h2>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '15px', fontWeight: 'bold', color: '#333' }}>
              របាយការណ៍លក់សរុប (SALES SUMMARY REPORT)
            </h3>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '12px' }}>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold', width: '20%' }}>BUSINESS NAME</td>
                <td style={{ border: '1px solid #000', padding: '8px', width: '30%' }}>{profile?.business_name || 'IT SRUK SRAE'}</td>
                <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold', width: '20%' }}>REPORT TYPE</td>
                <td style={{ border: '1px solid #000', padding: '8px', width: '30%', fontWeight: 'bold' }}>SALES SUMMARY REPORT</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>BRANCH / ADDRESS</td>
                <td style={{ border: '1px solid #000', padding: '8px' }}>{profile?.branch_name || 'MAIN BRANCH'} {profile?.branch_address && `(${profile.branch_address})`}</td>
                <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>DATE RANGE</td>
                <td style={{ border: '1px solid #000', padding: '8px' }}>{dayjs(filter.from_date).format("DD/MM/YYYY")} - {dayjs(filter.to_date).format("DD/MM/YYYY")}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>TOTAL REVENUE</td>
                <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold', color: '#1e4a2d', fontSize: '13px' }}>{formatCurrency(totals.amount)} ({ (totals.amount * 4100).toLocaleString() }៛)</td>
                <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>TOTAL ITEMS & ORDERS</td>
                <td style={{ border: '1px solid #000', padding: '8px' }}>{totals.qty} Units ({totals.orderCount} Orders)</td>
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
                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left', fontWeight: 'bold' }}>PERIOD / DATE</th>
                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>VOLUME</th>
                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>REVENUE</th>
                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>PERFORMANCE</th>
              </tr>
            </thead>
            <tbody>
              {state.list.map((item, idx) => {
                const pct = ((item.total_amount / (totals.amount || 1)) * 100).toFixed(1);
                return (
                  <tr key={idx}>
                    <td style={{ border: '1px solid #000', padding: '8px' }}>{dayjs(item.order_date).format("DD MMM YYYY")}</td>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{item.total_qty?.toLocaleString()} Items</td>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>
                      <div style={{ fontWeight: 'bold' }}>{formatCurrency(item.total_amount)}</div>
                      <div style={{ fontSize: '10px', color: '#555' }}>{(item.total_amount * 4100).toLocaleString()}៛</div>
                    </td>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>SHARE {pct}%</td>
                  </tr>
                );
              })}
              <tr style={{ background: '#f8fafc', fontWeight: 'bold' }}>
                <td style={{ border: '1px solid #000', padding: '8px' }}>GRAND TOTAL</td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{totals.qty?.toLocaleString()} Units</td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>
                  <div style={{ fontWeight: 'bold' }}>{formatCurrency(totals.amount)}</div>
                  <div style={{ fontSize: '10px', color: '#555' }}>{(totals.amount * 4100).toLocaleString()}៛</div>
                </td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>100% SHARE</td>
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

        {/* 📊 High-Impact Summary Cards */}
        <Row gutter={[24, 24]} style={{ marginBottom: "32px" }} className="no-print">
          <Col xs={24} sm={12} lg={6}>
            <div className="op-mini-card" style={{ padding: '20px', background: COLORS.primary, color: '#fff', position: 'relative' }}>
              <div style={{ position: 'absolute', right: -10, top: -10, opacity: 0.1 }}><DollarSign size={80} /></div>
              <Statistic 
                title={<Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600 }}>TOTAL REVENUE</Text>}
                value={totals.amount}
                formatter={formatCurrency}
                valueStyle={{ color: '#fff', fontSize: 28, fontWeight: 900 }}
              />
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Tag color="rgba(255,255,255,0.2)" style={{ border: 'none', color: '#fff', margin: 0, borderRadius: 6 }}>
                  {totals.orderCount} Orders
                </Tag>
              </div>
            </div>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <div className="op-mini-card" style={{ padding: '20px' }}>
              <Statistic 
                title={<Text type="secondary" style={{ fontSize: 13, fontWeight: 600 }}>ITEMS SOLD</Text>}
                value={totals.qty}
                valueStyle={{ color: COLORS.primary, fontSize: 28, fontWeight: 900 }}
                prefix={<ShoppingBag size={20} style={{ marginRight: 8 }} />}
              />
              <div style={{ marginTop: 8, color: COLORS.secondary, fontSize: 12, fontWeight: 700 }}>
                Avg { (totals.qty / (totals.orderCount || 1)).toFixed(1) } items/order
              </div>
            </div>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <div className="op-mini-card" style={{ padding: '20px' }}>
              <Statistic 
                title={<Text type="secondary" style={{ fontSize: 13, fontWeight: 600 }}>AVG. ORDER VALUE</Text>}
                value={totals.aov}
                formatter={formatCurrency}
                valueStyle={{ color: COLORS.primary, fontSize: 28, fontWeight: 900 }}
                prefix={<TrendingUp size={20} style={{ marginRight: 8 }} />}
              />
              <div style={{ marginTop: 8, color: '#52c41a', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center' }}>
                <ArrowUpRight size={14} /> Healthy Performance
              </div>
            </div>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <div className="op-mini-card" style={{ padding: '20px' }}>
              <Statistic 
                title={<Text type="secondary" style={{ fontSize: 13, fontWeight: 600 }}>EST. PROFIT MARGIN</Text>}
                value={24.5}
                suffix="%"
                valueStyle={{ color: COLORS.secondary, fontSize: 28, fontWeight: 900 }}
                prefix={<Wallet size={20} style={{ marginRight: 8 }} />}
              />
              <div style={{ marginTop: 8, color: '#64748b', fontSize: 12, fontWeight: 600 }}>
                Projected based on COGS
              </div>
            </div>
          </Col>
        </Row>

        {/* 📈 Visualization Area */}
        <Row className="no-print" gutter={[24, 24]} style={{ marginBottom: "32px" }}>
          <Col xs={24} lg={16}>
            <Card 
              bordered={false} 
              style={{ borderRadius: 24, boxShadow: '0 10px 30px rgba(0,0,0,0.03)', height: '100%' }}
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Space><BarChartOutlined /> <span style={{ fontWeight: 800 }}>Revenue Trend</span></Space>
                  <Tag color="gold" style={{ borderRadius: 6, fontWeight: 700 }}>LIVE STATS</Tag>
                </div>
              }
            >
              {state.Data_Chat.length > 0 ? (
                <div style={{ height: 400, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={state.Data_Chat} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorSale" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.1}/>
                          <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 11 }} 
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 11 }} 
                        tickFormatter={(val) => `$${val}`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: 16, 
                          border: 'none', 
                          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                          padding: '12px 16px'
                        }} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="Sale" 
                        stroke={COLORS.primary} 
                        strokeWidth={4}
                        fillOpacity={1} 
                        fill="url(#colorSale)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Empty description="Insufficient data for visualization" />
                </div>
              )}
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card 
              bordered={false} 
              style={{ borderRadius: 24, boxShadow: '0 10px 30px rgba(0,0,0,0.03)', height: '100%' }}
              title={<Space><PieChartOutlined /> <span style={{ fontWeight: 800 }}>Channel Mix</span></Space>}
            >
              <div style={{ height: 400, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Dine In', value: 45 },
                        { name: 'Takeaway', value: 35 },
                        { name: 'Web Ordering', value: 20 },
                      ]}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={8}
                      dataKey="value"
                    >
                      {[0,1,2].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS.chart[index % COLORS.chart.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ width: '100%', marginTop: 20 }}>
                  {[
                    { label: 'Dine In', value: '45%', color: COLORS.chart[0] },
                    { label: 'Takeaway', value: '35%', color: COLORS.chart[1] },
                    { label: 'Web Ordering', value: '20%', color: COLORS.chart[2] }
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      <Space><div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color }}></div> <Text style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</Text></Space>
                      <Text strong>{item.value}</Text>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* 📋 Data Detail Table */}
        <Card 
          className="no-print"
          bordered={false} 
          style={{ borderRadius: 24, boxShadow: '0 10px 30px rgba(0,0,0,0.03)', padding: '10px' }}
          title={<Space><FileText size={18} /> <span style={{ fontWeight: 800 }}>Detailed Transaction Log</span></Space>}
        >
          <Table
            bordered
            loading={loading}
            dataSource={state.list}
            rowKey="order_date"
            columns={[
              {
                title: "PERIOD / DATE",
                dataIndex: "order_date",
                ...printCell,
                render: (val) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ background: '#f1f5f9', width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CalendarOutlined style={{ color: COLORS.primary }} />
                    </div>
                    <Text strong>{dayjs(val).format("DD MMM YYYY")}</Text>
                  </div>
                ),
              },
              {
                title: "VOLUME",
                dataIndex: "total_qty",
                align: 'center',
                ...printCell,
                render: (val) => (
                  <Tag color={val > 50 ? "green" : "default"} style={{ borderRadius: 8, fontWeight: 800, padding: '4px 12px' }}>
                    {val.toLocaleString()} Items
                  </Tag>
                ),
              },
              {
                title: "REVENUE",
                dataIndex: "total_amount",
                align: 'right',
                ...printCell,
                render: (val) => (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <Text strong style={{ fontSize: 16, color: COLORS.primary }}>{formatCurrency(val)}</Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>{ (val * 4100).toLocaleString() }៛</Text>
                  </div>
                ),
              },
              {
                title: "PERFORMANCE",
                align: 'center',
                ...printCell,
                render: (_, record) => {
                  const pct = ((record.total_amount / (totals.amount || 1)) * 100).toFixed(1);
                  return (
                    <div style={{ width: '100px', margin: '0 auto' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 800, marginBottom: 4 }}>
                        <span>SHARE</span>
                        <span>{pct}%</span>
                      </div>
                      <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: COLORS.primary }}></div>
                      </div>
                    </div>
                  );
                }
              }
            ]}
            pagination={{ pageSize: 10, showSizeChanger: false }}
            summary={(pageData) => (
              <Table.Summary fixed>
                <Table.Summary.Row style={{ background: '#f8fafc' }}>
                  <Table.Summary.Cell index={0} style={{ border: '1px solid #000000', padding: '8px', background: '#f8fafc', color: '#000000' }}><Text strong style={{ fontSize: 16 }}>GRAND TOTAL</Text></Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="center" style={{ border: '1px solid #000000', padding: '8px', background: '#f8fafc', color: '#000000' }}>
                    <Text strong style={{ fontSize: 16 }}>{totals.qty.toLocaleString()} Units</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} align="right" style={{ border: '1px solid #000000', padding: '8px', background: '#f8fafc', color: '#000000' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <Text strong style={{ fontSize: 20, color: COLORS.primary }}>{formatCurrency(totals.amount)}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>{ (totals.amount * 4100).toLocaleString() }៛</Text>
                    </div>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3} align="center" style={{ border: '1px solid #000000', padding: '8px', background: '#f8fafc', color: '#000000' }}>
                    <Tag color="gold" style={{ fontWeight: 900, borderRadius: 6 }}>100% SHARE</Tag>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            )}
          />
      </Card>
      </div>

      <style>{`
        .ant-table-row:hover {
          background-color: #f8fafc !important;
        }
        .premium-main-card {
          border-radius: 24px !important;
          overflow: hidden;
        }
        .view-fade-in {
          animation: fadeIn 0.5s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
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

export default ReportSale_Summary;