import React, { useEffect, useState } from "react";
import { request } from "../../util/helper";
import { useNavigate } from "react-router-dom";
import { Card, Row, Col, Typography, Select, Table, Badge, Spin, Button, Space, DatePicker, Divider, Tooltip as AntTooltip, Tag, Modal } from "antd";
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
  ShoppingCartOutlined
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
import { useLanguage, translations } from "../../store/language.store";
import { useProfileStore } from "../../store/profileStore";
import { DollarSign, ShoppingBag, TrendingUp, Wallet, Package, AlertCircle } from "lucide-react";

import SuperAdminDashboard from "./SuperAdminDashboard";

const { Title, Text } = Typography;
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

  useEffect(() => {
    if (!isPlatformAdmin) {
      fetchAllData();
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

  return (
    <div style={{ padding: '0 0 24px 0' }}>

      {/* Header & Date Filter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={4} style={{ margin: 0, color: '#1e4a2d', fontWeight: 800 }}>
            {lang === 'en' ? 'Welcome back' : 'ស្វាគមន៍ការត្រឡប់មកវិញ'}, {profile?.name || 'Partner'}!
          </Title>
          <Text type="secondary">{lang === 'en' ? "Here's what's happening with your store today." : "នេះគឺជាអ្វីដែលកំពុងកើតឡើងនៅក្នុងហាងរបស់អ្នកថ្ងៃនេះ"}</Text>
        </div>
        <Space direction="vertical" align="end">
          <RangePicker
            value={dates}
            onChange={(v) => v && setDates(v)}
            style={{ borderRadius: 8, border: '1px solid #e6f2eb', padding: '8px 16px' }}
            presets={[
              { label: 'Today', value: [dayjs(), dayjs()] },
              { label: 'This Week', value: [dayjs().startOf('week'), dayjs()] },
              { label: 'This Month', value: [dayjs().startOf('month'), dayjs()] },
            ]}
          />
        </Space>
      </div>

      <Spin spinning={isLoading}>
        {/* Row 1: Range Summary (Filterable) */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <div className="dash-card primary">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="icon-box"><DollarSign size={20} color="#1e4a2d" /></div>
                <AntTooltip title="Total Sales in selected period"><InfoCircleOutlined style={{ color: '#c0a060' }} /></AntTooltip>
              </div>
              <div style={{ marginTop: 16 }}>
                <Text type="secondary" style={{ fontSize: 12, fontWeight: 600 }}>{translations[lang].period_revenue}</Text>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#1e4a2d' }}>{formatCurrency(rangeSummary.total_sale)}</div>
              </div>
            </div>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <div className="dash-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="icon-box expense"><Wallet size={20} color="#f5222d" /></div>
              </div>
              <div style={{ marginTop: 16 }}>
                <Text type="secondary" style={{ fontSize: 12, fontWeight: 600 }}>{translations[lang].period_expenses}</Text>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#f5222d' }}>{formatCurrency(rangeSummary.total_expense)}</div>
              </div>
            </div>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <div className="dash-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="icon-box profit"><TrendingUp size={20} color="#52c41a" /></div>
              </div>
              <div style={{ marginTop: 16 }}>
                <Text type="secondary" style={{ fontSize: 12, fontWeight: 600 }}>{translations[lang].net_profit}</Text>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#52c41a' }}>{formatCurrency(rangeSummary.net_profit)}</div>
              </div>
            </div>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <div className="dash-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="icon-box inventory"><Package size={20} color="#c0a060" /></div>
              </div>
              <div style={{ marginTop: 16 }}>
                <Text type="secondary" style={{ fontSize: 12, fontWeight: 600 }}>{translations[lang].stock_valuation}</Text>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#c0a060' }}>{formatCurrency(stockSummary.total_stock_value)}</div>
              </div>
            </div>
          </Col>
        </Row>

        {/* Row 2: Charts & Live Today */}
        <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
          {/* Main Chart */}
          <Col xs={24} lg={16}>
            <Card
              title={<Space><BarChartOutlined /> {translations[lang].financial_trend}</Space>}
              style={{ borderRadius: 20, boxShadow: '0 4px 15px rgba(0,0,0,0.02)', border: '1px solid #f0f0f0' }}
            >
              <div style={{ height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#c0c0c0', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#c0c0c0', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                    />
                    <Line type="monotone" dataKey="Sale" stroke="#1e4a2d" strokeWidth={3} dot={{ r: 4, fill: '#1e4a2d' }} />
                    <Line type="monotone" dataKey="Expense" stroke="#f5222d" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>

          {/* Side Widgets: Today & Stock */}
          <Col xs={24} lg={8}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Today's Live Info */}
              <Card
                title={<Space><SyncOutlined spin={isLoading} /> {translations[lang].live_summary_today}</Space>}
                style={{ borderRadius: 20, border: '1px solid #e6f2eb', background: '#fdfdfd' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div>
                    <Text type="secondary" style={{ fontSize: 11, fontWeight: 700 }}>{translations[lang].todays_income}</Text>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#1e4a2d' }}>{formatCurrency(todaySummary.income)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <Text type="secondary" style={{ fontSize: 11, fontWeight: 700 }}>{translations[lang].todays_expense}</Text>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#f5222d' }}>{formatCurrency(todaySummary.expense)}</div>
                  </div>
                </div>
                <Divider style={{ margin: '12px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text strong>{translations[lang].net_daily_profit}</Text>
                  <Tag color={todaySummary.income - todaySummary.expense >= 0 ? "green" : "red"} style={{ borderRadius: 20 }}>
                    {formatCurrency(todaySummary.income - todaySummary.expense)}
                  </Tag>
                </div>
              </Card>

              {/* Stock Warning Widget */}
              <Card
                title={<Space><Package color="#c0a060" size={18} /> {translations[lang].stock_insights}</Space>}
                style={{ borderRadius: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <div style={{ textAlign: 'center', background: '#f9f9f9', padding: '12px', borderRadius: 12 }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: '#1e4a2d' }}>{stockSummary.total_items}</div>
                      <Text type="secondary" style={{ fontSize: 10 }}>{translations[lang].total_items}</Text>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ textAlign: 'center', background: stockSummary.low_stock_count > 0 ? '#fff1f0' : '#f9f9f9', padding: '12px', borderRadius: 12, border: stockSummary.low_stock_count > 0 ? '1px solid #ffa39e' : 'none' }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: stockSummary.low_stock_count > 0 ? '#f5222d' : '#1e4a2d' }}>
                        {stockSummary.low_stock_count}
                      </div>
                      <Text type="secondary" style={{ fontSize: 10, color: stockSummary.low_stock_count > 0 ? '#f5222d' : '' }}>{translations[lang].low_stock}</Text>
                    </div>
                  </Col>
                </Row>

                {stockSummary.expiry_alerts?.length > 0 && (
                  <div style={{ marginTop: 16, padding: '12px', background: '#fff7e6', borderRadius: 12, border: '1px solid #ffd591' }}>
                    <Text strong style={{ fontSize: 12, color: '#d46b08' }}><AlertCircle size={14} style={{ marginRight: 4 }} /> {translations[lang].expiring_soon}:</Text>
                    {stockSummary.expiry_alerts.map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                        <Text style={{ fontSize: 11 }}>{item.name}</Text>
                        <Tag color="orange" style={{ fontSize: 9, margin: 0 }}>{dayjs(item.expiry_date).format('MMM DD')}</Tag>
                      </div>
                    ))}
                  </div>
                )}

                {stockSummary.low_stock_list?.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <Text type="secondary" style={{ fontSize: 11, fontWeight: 700 }}>{translations[lang].reorder_needed}:</Text>
                    {stockSummary.low_stock_list.map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                        <Text style={{ fontSize: 12 }}>{item.name}</Text>
                        <Badge count={item.qty} color="#f5222d" size="small" />
                      </div>
                    ))}
                    <Button type="link" size="small" style={{ padding: 0, marginTop: 8 }} onClick={() => navigate('/stock')}>{translations[lang].view_inventory}</Button>
                  </div>
                )}
              </Card>
            </div>
          </Col>
        </Row>

        {/* Row 3: Recent Transactions */}
        <Card
          title={<Space><CalendarOutlined /> {translations[lang].recent_activity}</Space>}
          style={{ borderRadius: 20 }}
          extra={<Button type="link" onClick={() => navigate('/order')}>{translations[lang].view_all_orders}</Button>}
        >
          <Table
            dataSource={transactionData}
            pagination={false}
            size="middle"
            columns={[
              { title: 'Order ID', dataIndex: 'id', key: 'id', render: (val) => <Text strong>#{val}</Text> },
              { title: 'Branch', dataIndex: 'branch_name', key: 'branch_name' },
              { title: 'Date', dataIndex: 'created_at', key: 'created_at', render: (val) => dayjs(val).format('YYYY-MM-DD HH:mm') },
              {
                title: 'Amount',
                dataIndex: 'total_amount',
                key: 'total_amount',
                align: 'right',
                render: (val) => <span style={{ fontWeight: 800, color: '#1e4a2d' }}>{formatCurrency(val)}</span>
              },
              {
                title: 'Status',
                key: 'status',
                render: () => <Badge status="success" text="Completed" />
              }
            ]}
          />
        </Card>
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
        .dash-card {
          background: #ffffff;
          border-radius: 20px;
          padding: 20px;
          border: 1px solid #f0f0f0;
          height: 100%;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        .dash-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(30, 74, 45, 0.12);
          border-color: #c0a060;
        }
        .dash-card.primary {
           border-bottom: 4px solid #c0a060;
        }
        .icon-box {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: #f4f1eb;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .icon-box.expense { background: #fff1f0; }
        .icon-box.profit { background: #f6ffed; }
        .icon-box.order { background: #e6f7ff; }
        
        .ant-table-thead > tr > th {
            background: #fafafa !important;
            font-weight: 700 !important;
            font-size: 13px;
        }
      `}</style>
    </div>
  );
}

export default HomePage;