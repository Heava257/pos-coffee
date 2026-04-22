import React, { useEffect, useState } from "react";
import { request } from "../../util/helper";
import { useNavigate } from "react-router-dom";
import { Card, Row, Col, Typography, Select, Table, Badge, Spin, Button, Space, DatePicker, Divider, Tooltip as AntTooltip, Tag } from "antd";
import {
  MoreOutlined,
  SearchOutlined,
  SyncOutlined,
  BarChartOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  InfoCircleOutlined,
  CalendarOutlined,
  WarningOutlined
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

function HomePage() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const profile = useProfileStore(s => s.profile);
  const isPlatformAdmin = profile?.business_id === 1;

  const [isLoading, setIsLoading] = useState(false);
  const [dates, setDates] = useState([dayjs().startOf('month'), dayjs()]);

  // Data States
  const [todaySummary, setTodaySummary] = useState({ income: 0, expense: 0 });
  const [stockSummary, setStockSummary] = useState({ total_items: 0, low_stock_count: 0, total_stock_value: 0, low_stock_list: [] });
  const [rangeSummary, setRangeSummary] = useState({ total_sale: 0, total_expense: 0, net_profit: 0, order_count: 0 });
  const [salesData, setSalesData] = useState([]);
  const [transactionData, setTransactionData] = useState([]);

  useEffect(() => {
    if (!isPlatformAdmin) {
      fetchAllData();
    }
  }, [dates, isPlatformAdmin]);

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
        setTodaySummary(res.today_summary || { income: 0, expense: 0 });
        setStockSummary(res.stock_summary || { total_items: 0, low_stock_count: 0, total_stock_value: 0, low_stock_list: [] });
        setRangeSummary(res.range_summary || { total_sale: 0, total_expense: 0, net_profit: 0, order_count: 0 });

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

  const formatCurrency = (val) => `$${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  return (
    <div style={{ padding: '0 0 24px 0' }}>

      {/* Header & Date Filter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={4} style={{ margin: 0, color: '#1e4a2d', fontWeight: 800 }}>
            Welcome back, {profile?.name || 'Partner'}!
          </Title>
          <Text type="secondary">Here's what's happening with your store today.</Text>
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
                <Text type="secondary" style={{ fontSize: 12, fontWeight: 600 }}>PERIOD REVENUE</Text>
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
                <Text type="secondary" style={{ fontSize: 12, fontWeight: 600 }}>PERIOD EXPENSES</Text>
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
                <Text type="secondary" style={{ fontSize: 12, fontWeight: 600 }}>NET PROFIT</Text>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#52c41a' }}>{formatCurrency(rangeSummary.net_profit)}</div>
              </div>
            </div>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <div className="dash-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="icon-box order"><ShoppingBag size={20} color="#1890ff" /></div>
              </div>
              <div style={{ marginTop: 16 }}>
                <Text type="secondary" style={{ fontSize: 12, fontWeight: 600 }}>ORDERS</Text>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#1e4a2d' }}>{rangeSummary.order_count}</div>
              </div>
            </div>
          </Col>
        </Row>

        {/* Row 2: Charts & Live Today */}
        <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
          {/* Main Chart */}
          <Col xs={24} lg={16}>
            <Card
              title={<Space><BarChartOutlined /> Financial Trend</Space>}
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
                title={<Space><SyncOutlined spin={isLoading} /> Live Summary (Today)</Space>}
                style={{ borderRadius: 20, border: '1px solid #e6f2eb', background: '#fdfdfd' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div>
                    <Text type="secondary" style={{ fontSize: 11, fontWeight: 700 }}>TODAY'S INCOME</Text>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#1e4a2d' }}>{formatCurrency(todaySummary.income)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <Text type="secondary" style={{ fontSize: 11, fontWeight: 700 }}>TODAY'S EXPENSE</Text>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#f5222d' }}>{formatCurrency(todaySummary.expense)}</div>
                  </div>
                </div>
                <Divider style={{ margin: '12px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text strong>Net Daily Profit</Text>
                  <Tag color={todaySummary.income - todaySummary.expense >= 0 ? "green" : "red"} style={{ borderRadius: 20 }}>
                    {formatCurrency(todaySummary.income - todaySummary.expense)}
                  </Tag>
                </div>
              </Card>

              {/* Stock Warning Widget */}
              <Card
                title={<Space><Package color="#c0a060" size={18} /> Stock Inventory</Space>}
                style={{ borderRadius: 20 }}
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <div style={{ textAlign: 'center', background: '#f9f9f9', padding: '12px', borderRadius: 12 }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: '#1e4a2d' }}>{stockSummary.total_items}</div>
                      <Text type="secondary" style={{ fontSize: 10 }}>TOTAL PRODUCTS</Text>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ textAlign: 'center', background: stockSummary.low_stock_count > 0 ? '#fff1f0' : '#f9f9f9', padding: '12px', borderRadius: 12, border: stockSummary.low_stock_count > 0 ? '1px solid #ffa39e' : 'none' }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: stockSummary.low_stock_count > 0 ? '#f5222d' : '#1e4a2d' }}>
                        {stockSummary.low_stock_count}
                      </div>
                      <Text type="secondary" style={{ fontSize: 10, color: stockSummary.low_stock_count > 0 ? '#f5222d' : '' }}>LOW STOCK!</Text>
                    </div>
                  </Col>
                </Row>

                {stockSummary.low_stock_list?.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <Text type="secondary" style={{ fontSize: 11, fontWeight: 700 }}>URGENT RESTOCK:</Text>
                    {stockSummary.low_stock_list.map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                        <Text style={{ fontSize: 12 }}>{item.name}</Text>
                        <Badge count={item.qty} color="#f5222d" size="small" />
                      </div>
                    ))}
                    <Button type="link" size="small" style={{ padding: 0, marginTop: 8 }} onClick={() => navigate('/stock')}>Manage Stock</Button>
                  </div>
                )}
              </Card>
            </div>
          </Col>
        </Row>

        {/* Row 3: Recent Transactions */}
        <Card
          title={<Space><CalendarOutlined /> Recent Transactions</Space>}
          style={{ borderRadius: 20 }}
          extra={<Button type="link" onClick={() => navigate('/order')}>View All</Button>}
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
          box-shadow: 0 10px 30px rgba(30, 74, 45, 0.08);
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