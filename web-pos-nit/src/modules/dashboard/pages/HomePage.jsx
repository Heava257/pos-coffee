import React, { useEffect, useState } from "react";
import { request } from "@/shared/utils/helper";
import { useNavigate } from "react-router-dom";
import { Card, Row, Col, Typography, Select, Table, Badge, Spin, Button, Space, DatePicker, Divider, Tooltip as AntTooltip, Tag, Modal, Alert } from "antd";
import {
  MoreOutlined,
  SearchOutlined,
  SyncOutlined,
  BarChartOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  InfoCircleOutlined,
  CalendarOutlined,
  WarningOutlined,
  DollarOutlined,
  TrophyOutlined,
  TeamOutlined,
  ShoppingCartOutlined,
  AppstoreOutlined,
  RobotOutlined
} from "@ant-design/icons";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import dayjs from "dayjs";
import { useLanguage, translations } from "@/app/store/language.store";
import { useProfileStore } from "@/app/store/profileStore";
import { DollarSign, ShoppingBag, TrendingUp, Wallet, Package, AlertCircle, FileText, HelpCircle } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import PrintZReport from "@/modules/pos/components/PrintZReport";

import SuperAdminDashboard from "@/modules/dashboard/pages/SuperAdminDashboard";

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;

const COLORS = {
  darkGreen: "#1e4a2d",
  midGreen: "#2d6a42",
  accentGreen: "#3a7d52",
  gold: "#c0a060",
  textPrimary: "#1a1a1a",
  textSecondary: "#64748b",
  bgLight: "#f8fafc",
};
function HomePage() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const profile = useProfileStore(s => s.profile);
  const isPlatformAdmin = profile?.business_id === 1;

  const [isLoading, setIsLoading] = useState(false);
  const [dates, setDates] = useState([dayjs().startOf('month'), dayjs()]);

  // Data States
  const [todaySummary, setTodaySummary] = useState({ income: 0, expense: 0 });
  const [stockSummary, setStockSummary] = useState({ total_items: 0, low_stock_count: 0, total_stock_value: 0, low_stock_list: [], expiry_alerts: [] });
  const [rangeSummary, setRangeSummary] = useState({ total_sale: 0, total_expense: 0, net_profit: 0, order_count: 0 });
  const [salesData, setSalesData] = useState([]);
  const [transactionData, setTransactionData] = useState([]);
  const [briefingVisible, setBriefingVisible] = useState(false);
  const [briefingData, setBriefingData] = useState(null);

  const [aiForecast, setAiForecast] = useState(null);
  const [aiError, setAiError] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const [viewStyle, setViewStyle] = useState(1); // 1: Analytical, 2: Operational, 3: Inventory
  const [showGuide, setShowGuide] = useState(false);

  const refZReport = React.useRef(null);
  const handlePrintZReport = useReactToPrint({
    contentRef: refZReport,
    documentTitle: `Z-Report-${dayjs().format("YYYYMMDD")}`,
  });

  const fetchAiForecast = async () => {
    setAiLoading(true);
    setAiError("");
    try {
      const res = await request("dashboard/ai-forecast", "get");
      if (res && res.success) {
        setAiForecast(res);
      } else {
        setAiError(res?.message || "AI Forecasting is disabled.");
        setAiForecast(null);
      }
    } catch (err) {
      setAiError(err.response?.data?.message || "AI Sales Forecasting is currently disabled by the Platform Owner.");
      setAiForecast(null);
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    if (!isPlatformAdmin) {
      fetchAllData();
      fetchAiForecast();
      checkMorningBriefing();
    }
  }, [dates, isPlatformAdmin]);

  const checkMorningBriefing = async () => {
    const today = dayjs().format("YYYY-MM-DD");
    const lastShown = localStorage.getItem("last_briefing_shown");

    if (lastShown !== today) {
      try {
        const res = await request("dashboard/morning-briefing", "get");
        if (res && res.success) {
          setBriefingData(res.data);
          setBriefingVisible(true);
          localStorage.setItem("last_briefing_shown", today);
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  if (isPlatformAdmin) {
    return <SuperAdminDashboard />;
  }

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const params = {
        from_date: dates[0].format("YYYY-MM-DD"),
        to_date: dates[1].format("YYYY-MM-DD")
      };

      const res = await request('dashboard', "get", params);
      if (res && res.success) {
        setTodaySummary({
          income: Number(res.today_summary?.income || 0),
          expense: Number(res.today_summary?.expense || 0)
        });
        setStockSummary(res.stock_summary ? {
          ...res.stock_summary,
          total_stock_value: Number(res.stock_summary.total_stock_value || 0),
          total_items: Number(res.stock_summary.total_items || 0),
          low_stock_count: Number(res.stock_summary.low_stock_count || 0)
        } : { total_items: 0, low_stock_count: 0, total_stock_value: 0, low_stock_list: [], expiry_alerts: [] });
        setRangeSummary({
          total_sale: Number(res.range_summary?.total_sale || 0),
          total_expense: Number(res.range_summary?.total_expense || 0),
          net_profit: Number(res.range_summary?.net_profit || 0),
          order_count: Number(res.range_summary?.order_count || 0)
        });

        if (res.recentOrders) {
          setTransactionData(res.recentOrders.map((item, idx) => ({ ...item, key: idx })));
        }

        if (res.Sale_Summary_By_Month) {
          const lineData = res.Sale_Summary_By_Month.map((item) => {
            const expenseItem = res.Expense_Summary_By_Month?.find(e => e.title === item.title);
            return {
              name: item.title,
              Sale: Number(item.total),
              Expense: Number(expenseItem?.total || 0),
              Profit: Number(item.total) - Number(expenseItem?.total || 0),
            };
          });
          setSalesData(lineData);
        }
      }
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (val) => {
    const num = Number(val);
    if (isNaN(num)) return "$0.00";
    return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  };

  // --- STYLE 1: ANALYTICAL (Finance & Trends) ---
  const renderAnalyticalView = () => (
    <div className="view-fade-in">
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <div className="owner-stat-card analytical gold">
            <div className="card-icon"><DollarSign size={20} /></div>
            <div className="card-label">{translations[lang].period_revenue}</div>
            <div className="card-value">{formatCurrency(rangeSummary.total_sale)}</div>
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div className="owner-stat-card analytical dark">
            <div className="card-icon"><Wallet size={20} /></div>
            <div className="card-label">{translations[lang].period_expenses}</div>
            <div className="card-value">{formatCurrency(rangeSummary.total_expense)}</div>
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div className="owner-stat-card analytical green">
            <div className="card-icon"><TrendingUp size={20} /></div>
            <div className="card-label">{translations[lang].net_profit}</div>
            <div className="card-value">{formatCurrency(rangeSummary.net_profit)}</div>
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div className="owner-stat-card analytical secondary">
            <div className="card-icon"><Package size={20} /></div>
            <div className="card-label">{translations[lang].stock_valuation}</div>
            <div className="card-value">{formatCurrency(stockSummary.total_stock_value)}</div>
          </div>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card bordered={false} className="premium-main-card" title={<Space><BarChartOutlined /> {translations[lang].financial_trend}</Space>}>
            <div style={{ height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                  <Line type="monotone" dataKey="Sale" stroke="#c0a060" strokeWidth={4} dot={{ r: 6, fill: '#c0a060' }} />
                  <Line type="monotone" dataKey="Expense" stroke="#1e4a2d" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card bordered={false} className="premium-main-card" title={<Space><SyncOutlined /> {translations[lang].live_summary_today}</Space>}>
            <div className="live-today-box">
              <div className="live-row">
                <Text type="secondary">{translations[lang].todays_income}</Text>
                <Text strong style={{ color: '#52c41a' }}>{formatCurrency(todaySummary.income)}</Text>
              </div>
              <div className="live-row">
                <Text type="secondary">{translations[lang].todays_expense}</Text>
                <Text strong style={{ color: '#f5222d' }}>{formatCurrency(todaySummary.expense)}</Text>
              </div>
              <Divider style={{ margin: '12px 0' }} />
              <div className="live-row total">
                <Text strong>{translations[lang].net_daily_profit}</Text>
                <Tag color="gold" style={{ borderRadius: 8 }}>{formatCurrency(todaySummary.income - todaySummary.expense)}</Tag>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 🚀 AI Sales Forecasting Widget */}
      {aiForecast && (
        <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
          <Col span={24}>
            <Card 
              bordered={false} 
              className="premium-main-card" 
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <Space><RobotOutlined style={{ color: '#1890ff' }} /> <strong style={{ fontWeight: 900 }}>AI Sales Forecasting & Demand Analytics</strong></Space>
                  <Tag color="processing">{aiForecast.model_type}</Tag>
                </div>
              }
            >
              <Paragraph style={{ color: '#666', fontSize: 13, marginBottom: 20 }}>
                Next week's predicted product category demand calculated using AutoRegressive Moving Average (ARMA-1) models trained on historical sales logs.
              </Paragraph>
              <Row gutter={[16, 16]}>
                {aiForecast.predictions && aiForecast.predictions.length > 0 ? (
                  aiForecast.predictions.map((pred, pIdx) => (
                    <Col xs={24} md={8} key={pIdx}>
                      <div style={{ background: '#f8fafc', padding: 18, borderRadius: 16, border: '1px solid #edf2f7', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <Text strong style={{ fontSize: 14 }}>{pred.category}</Text>
                            <Tag color={pred.confidence.startsWith("High") ? "success" : "warning"}>{pred.confidence}</Tag>
                          </div>
                          <Text type="secondary" style={{ fontSize: 11 }}>Historical Daily Avg: {formatCurrency(pred.average_daily)}</Text>
                        </div>
                        <div style={{ marginTop: 12 }}>
                          <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>Predicted Weekly Demand</Text>
                          <div style={{ fontSize: 20, fontWeight: 900, color: '#1e4a2d' }}>{formatCurrency(pred.predicted_weekly)}</div>
                        </div>
                      </div>
                    </Col>
                  ))
                ) : (
                  <Col span={24}>
                    <Alert message="Insufficient Data" description="Not enough sales history logs found to run AI demand forecasting. Please register orders first!" type="info" showIcon />
                  </Col>
                )}
              </Row>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );

  // --- STYLE 2: OPERATIONAL (Solid & Action-focused) ---
  const renderOperationalView = () => (
    <div className="view-fade-in">
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <div className="op-summary-panel gold">
            <div style={{ fontSize: 14, opacity: 0.8 }}>Live Sales Today</div>
            <div style={{ fontSize: 36, fontWeight: 900 }}>{formatCurrency(todaySummary.income)}</div>
            <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
              <Tag color="white" style={{color: '#c0a060', border: 'none', margin: 0}}>Real-time Update</Tag>
              <Button 
                size="small" 
                icon={<FileText size={14} />} 
                style={{ 
                  background: 'rgba(255,255,255,0.2)', 
                  border: 'none', 
                  color: '#fff', 
                  fontSize: 11, 
                  fontWeight: 700,
                  height: 24,
                  borderRadius: 6
                }}
                onClick={handlePrintZReport}
              >
                PRINT Z-REPORT
              </Button>
            </div>
          </div>
        </Col>
        <Col xs={24} lg={16}>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <div className="op-mini-card">
                <Text type="secondary">Period Orders</Text>
                <div style={{ fontSize: 24, fontWeight: 800 }}>{rangeSummary.order_count}</div>
              </div>
            </Col>
            <Col span={12}>
              <div className="op-mini-card">
                <Text type="secondary">Low Stock Warning</Text>
                <div style={{ fontSize: 24, fontWeight: 800, color: stockSummary.low_stock_count > 0 ? '#f5222d' : '#52c41a' }}>
                  {stockSummary.low_stock_count}
                </div>
              </div>
            </Col>
            <Col span={12}>
              <div className="op-mini-card">
                <Text type="secondary">System Status</Text>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#52c41a' }}>ONLINE</div>
              </div>
            </Col>
            <Col span={12}>
              <div className="op-mini-card">
                <Text type="secondary">Active Shift</Text>
                <div style={{ fontSize: 18, fontWeight: 800 }}>YES</div>
              </div>
            </Col>
          </Row>
        </Col>
      </Row>

      <Card bordered={false} style={{ marginTop: 24, borderRadius: 24, boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }} title={<div style={{fontWeight: 900}}>{translations[lang].recent_activity}</div>}>
        <Table
          dataSource={transactionData.slice(0, 5)}
          pagination={false}
          columns={[
            { title: 'Order ID', dataIndex: 'id', key: 'id', render: (val) => <Text strong>#{val}</Text> },
            { title: 'Branch', dataIndex: 'branch_name', key: 'branch_name' },
            { title: 'Amount', dataIndex: 'total_amount', key: 'total_amount', align: 'right', render: (val) => <Text strong>{formatCurrency(val)}</Text> },
            { title: 'Status', key: 'status', render: () => <Badge status="success" text="Completed" /> }
          ]}
        />
      </Card>
    </div>
  );

  // --- STYLE 3: INVENTORY & DATA (Technical Focus) ---
  const renderInventoryView = () => (
    <div className="view-fade-in">
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <div className="tech-inventory-card">
            <div className="header">
              <Package size={20} color="#c0a060" />
              <Text strong style={{ marginLeft: 8 }}>Inventory Audit</Text>
            </div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div className="stat-box">
                  <Text type="secondary" style={{ fontSize: 10 }}>TOTAL ITEMS</Text>
                  <div className="val">{stockSummary.total_items}</div>
                </div>
              </Col>
              <Col span={12}>
                <div className="stat-box">
                  <Text type="secondary" style={{ fontSize: 10 }}>TOTAL VALUE</Text>
                  <div className="val">{formatCurrency(stockSummary.total_stock_value)}</div>
                </div>
              </Col>
            </Row>
            
            <div style={{ marginTop: 24 }}>
              <Text strong style={{ fontSize: 12 }}>Stock Alerts</Text>
              <div style={{ maxHeight: 200, overflowY: 'auto', marginTop: 12 }}>
                {stockSummary.low_stock_list?.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <Text style={{ fontSize: 12 }}>{item.name}</Text>
                    <Tag color="red" style={{ margin: 0 }}>Qty: {item.qty}</Tag>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Col>
        <Col xs={24} lg={12}>
          <div className="tech-inventory-card">
            <div className="header">
              <BarChartOutlined style={{ color: '#1e4a2d' }} />
              <Text strong style={{ marginLeft: 8 }}>Profitability Analysis</Text>
            </div>
            <div style={{ height: 200, marginBottom: 20 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesData.slice(-7)}>
                  <Line type="stepAfter" dataKey="Profit" stroke="#1e4a2d" strokeWidth={3} dot={false} />
                  <XAxis dataKey="name" hide />
                  <Tooltip />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ padding: '16px', background: '#f8fafc', borderRadius: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">Net Profit (Period)</Text>
                <Text strong style={{ color: '#52c41a' }}>{formatCurrency(rangeSummary.net_profit)}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                <Text type="secondary">Expense Ratio</Text>
                <Text strong>{((rangeSummary.total_expense / (rangeSummary.total_sale || 1)) * 100).toFixed(1)}%</Text>
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );

  return (
    <div style={{ padding: '0 0 24px 0' }}>
      {/* Header & Date Filter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Title level={4} style={{ margin: 0, color: '#1e4a2d', fontWeight: 900, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span>{lang === 'en' ? 'Welcome back' : 'ស្វាគមន៍ការត្រឡប់មកវិញ'}, {profile?.name || 'Partner'}!</span>
            <Button
              type="text"
              icon={<HelpCircle size={15} style={{ color: "#1e4a2d", marginRight: 4 }} />}
              onClick={() => setShowGuide(!showGuide)}
              style={{
                background: showGuide ? "rgba(30, 74, 45, 0.15)" : "rgba(30, 74, 45, 0.08)",
                color: "#1e4a2d",
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 12,
                display: "inline-flex",
                alignItems: "center",
                height: 32,
              }}
            >
              {showGuide ? "លាក់ការណែនាំ" : "របៀបប្រើប្រាស់"}
            </Button>
          </Title>
          <Text type="secondary">
            {viewStyle === 1 && (lang === 'en' ? "Analytical overview of your business performance." : "ទិដ្ឋភាពទូទៅនៃការវិភាគលើអាជីវកម្មរបស់អ្នក។")}
            {viewStyle === 2 && (lang === 'en' ? "Operational live stats and recent activity." : "ស្ថិតិប្រតិបត្តិការបន្តផ្ទាល់ និងសកម្មភាពចុងក្រោយ។")}
            {viewStyle === 3 && (lang === 'en' ? "Inventory audit and profitability insights." : "ការធ្វើសវនកម្មស្តុក និងការយល់ដឹងពីប្រាក់ចំណេញ។")}
          </Text>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <RangePicker
            value={dates}
            onChange={(v) => v && setDates(v)}
            style={{ borderRadius: 10, border: '1px solid #e6f2eb', height: 40 }}
          />
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

      {showGuide && (
        <Alert
          message={<strong>💡 របៀបអានរបាយការណ៍ Dashboard (Dashboard Quick Guide)</strong>}
          description={
            <div style={{ fontSize: 13, marginTop: 4, color: '#333' }}>
              <p style={{ margin: '3px 0' }}>1. <strong>របាយការណ៍សង្ខេប៖</strong> បង្ហាញពីផលចំណេញសុទ្ធ ចំណូល និងចំណាយសរុបក្នុងកំឡុងពេលដែលបងបានជ្រើសរើស។</p>
              <p style={{ margin: '3px 0' }}>2. <strong>ការប្តូរទិដ្ឋភាព (Change View)៖</strong> ចុចប៊ូតុង Change View ដើម្បីប្តូររវាង៖ <em>ទិដ្ឋភាពហិរញ្ញវត្ថុ (Analytical)</em>, <em>ទិដ្ឋភាពប្រតិបត្តិការលក់ (Operational)</em> ឬ <em>ទិដ្ឋភាពស្តុកទំនិញ (Inventory)</em>។</p>
              <p style={{ margin: '3px 0' }}>3. <strong>តម្រងកាលបរិច្ឆេទ (Date Filter)៖</strong> បងអាចជ្រើសរើសចន្លោះថ្ងៃខែឆ្នាំដែលចង់មើល ដើម្បីឱ្យតារាង និងទិន្នន័យទាំងអស់ផ្លាស់ប្តូរទៅតាមនោះ។</p>
            </div>
          }
          type="info"
          closable
          onClose={() => setShowGuide(false)}
          style={{ borderRadius: 16, marginBottom: 24, border: '1px solid #bae7ff', background: '#e6f7ff' }}
        />
      )}

      <Spin spinning={isLoading}>
        {viewStyle === 1 && renderAnalyticalView()}
        {viewStyle === 2 && renderOperationalView()}
        {viewStyle === 3 && renderInventoryView()}
      </Spin>

      {/* AI EXECUTIVE MORNING BRIEFING MODAL */}
      <Modal
        title={null}
        open={briefingVisible}
        onCancel={() => setBriefingVisible(false)}
        footer={null}
        centered
        width={500}
        styles={{ content: { borderRadius: 30, padding: 0, overflow: 'hidden', border: 'none' } }}
      >
        <div style={{
          padding: '40px 30px',
          background: `linear-gradient(135deg, #1e4a2d 0%, #112919 100%)`,
          color: '#fff',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Decorative elements */}
          <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(192,160,96,0.1)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 10 }}>
            <div style={{ background: 'rgba(192,160,96,0.2)', padding: 10, borderRadius: 12 }}>
              <TrendingUp size={24} color="#c0a060" />
            </div>
            <Typography.Title level={3} style={{ margin: 0, color: '#fff', fontWeight: 800 }}>
              {translations[lang].morning_briefing}
            </Typography.Title>
          </div>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
            {translations[lang].morning_briefing_desc}
          </Text>
        </div>

        <div style={{ padding: '30px', background: '#fff' }}>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <div style={{ background: '#f8fafc', padding: 20, borderRadius: 20, border: '1px solid #edf2f7' }}>
                <Text type="secondary" style={{ fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 5 }}>
                  {translations[lang].yesterday_revenue}
                </Text>
                <Title level={4} style={{ margin: 0, color: '#1e4a2d', fontWeight: 900 }}>
                  {formatCurrency(briefingData?.revenue || 0)}
                </Title>
              </div>
            </Col>
            <Col span={12}>
              <div style={{ background: '#f6ffed', padding: 20, borderRadius: 20, border: '1px solid #d9f7be' }}>
                <Text type="secondary" style={{ fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 5 }}>
                  {translations[lang].yesterday_profit}
                </Text>
                <Title level={4} style={{ margin: 0, color: '#52c41a', fontWeight: 900 }}>
                  {formatCurrency(briefingData?.profit || 0)}
                </Title>
              </div>
            </Col>

            <Col span={24}>
              <Divider style={{ margin: '10px 0' }} />
            </Col>

            <Col span={24}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 15, padding: '5px 0' }}>
                <div style={{ background: '#fff7e6', padding: 8, borderRadius: 10 }}><ShoppingBag size={18} color="#fa8c16" /></div>
                <div style={{ flex: 1 }}>
                  <Text type="secondary" style={{ fontSize: 11, fontWeight: 700 }}>{translations[lang].best_selling_item}</Text>
                  <div style={{ fontWeight: 700, color: '#1e4a2d' }}>{briefingData?.top_item || "N/A"}</div>
                </div>
                <Tag color="orange" style={{ borderRadius: 10 }}>{briefingData?.top_item_qty || 0} items</Tag>
              </div>
            </Col>

            <Col span={24}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 15, padding: '5px 0' }}>
                <div style={{ background: '#f0f5ff', padding: 8, borderRadius: 10 }}><TrendingUp size={18} color="#2f54eb" /></div>
                <div style={{ flex: 1 }}>
                  <Text type="secondary" style={{ fontSize: 11, fontWeight: 700 }}>{translations[lang].top_performer}</Text>
                  <div style={{ fontWeight: 700, color: '#1e4a2d' }}>{briefingData?.top_staff || "N/A"}</div>
                </div>
                <Tag color="blue" style={{ borderRadius: 10 }}>Champion 🏆</Tag>
              </div>
            </Col>

            <Col span={24}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 15, padding: '5px 0' }}>
                <div style={{ background: '#f9f0ff', padding: 8, borderRadius: 10 }}><Wallet size={18} color="#722ed1" /></div>
                <div style={{ flex: 1 }}>
                  <Text type="secondary" style={{ fontSize: 11, fontWeight: 700 }}>{translations[lang].new_vips}</Text>
                  <div style={{ fontWeight: 700, color: '#1e4a2d' }}>{briefingData?.new_vips || 0} Members</div>
                </div>
                <Tag color="purple" style={{ borderRadius: 10 }}>Growing 🚀</Tag>
              </div>
            </Col>
          </Row>

          <Button
            type="primary"
            block
            size="large"
            onClick={() => setBriefingVisible(false)}
            style={{
              height: 55,
              borderRadius: 18,
              background: COLORS.darkGreen,
              marginTop: 30,
              fontSize: 16,
              fontWeight: 800,
              boxShadow: '0 8px 20px rgba(30,74,45,0.2)'
            }}
          >
            {translations[lang].done_btn}
          </Button>
        </div>
      </Modal>

      <style jsx global>{`
        .view-fade-in {
          animation: fadeIn 0.4s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* --- STYLE 1: ANALYTICAL --- */
        .owner-stat-card.analytical {
          background: #fff;
          padding: 24px;
          border-radius: 24px;
          border: 1px solid #f1f5f9;
          box-shadow: 0 4px 15px rgba(0,0,0,0.02);
        }
        .owner-stat-card.analytical.gold { border-bottom: 4px solid #c0a060; }
        .owner-stat-card.analytical.green { border-bottom: 4px solid #1e4a2d; }
        .owner-stat-card.analytical.dark { border-bottom: 4px solid #0f172a; }
        .owner-stat-card.analytical.secondary { border-bottom: 4px solid #64748b; }
        
        .owner-stat-card .card-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }
        .gold .card-icon { background: rgba(192, 160, 96, 0.1); color: #c0a060; }
        .green .card-icon { background: rgba(30, 74, 45, 0.1); color: #1e4a2d; }
        .dark .card-icon { background: rgba(15, 23, 42, 0.1); color: #0f172a; }
        .secondary .card-icon { background: rgba(100, 116, 139, 0.1); color: #64748b; }
        
        .card-label { font-size: 12px; color: #64748b; font-weight: 600; margin-bottom: 4px; }
        .card-value { font-size: 24px; font-weight: 900; color: #1e293b; }

        .premium-main-card { border-radius: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); }
        .live-today-box .live-row { display: flex; justify-content: space-between; margin-bottom: 12px; }
        .live-today-box .live-row.total { font-size: 16px; }

        /* --- STYLE 2: OPERATIONAL --- */
        .op-summary-panel {
          padding: 40px 32px;
          border-radius: 32px;
          color: #fff;
          height: 100%;
        }
        .op-summary-panel.gold { background: linear-gradient(135deg, #c0a060 0%, #d4b47a 100%); }
        .op-mini-card {
          padding: 20px;
          background: #fff;
          border-radius: 20px;
          border: 1px solid #f1f5f9;
          height: 100%;
        }

        /* --- STYLE 3: INVENTORY --- */
        .tech-inventory-card {
          background: #fff;
          border-radius: 24px;
          padding: 24px;
          border: 1px solid #e2e8f0;
          height: 100%;
        }
        .tech-inventory-card .header { display: flex; align-items: center; margin-bottom: 24px; }
        .tech-inventory-card .stat-box { background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0; }
        .tech-inventory-card .stat-box .val { font-size: 18px; font-weight: 900; margin-top: 4px; }

        .ant-table-thead > tr > th {
            background: #fafafa !important;
            font-weight: 800 !important;
        }
      `}</style>
    </div>
  );
}

export default HomePage;
