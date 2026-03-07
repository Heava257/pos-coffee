import { useEffect, useState, useRef } from "react";
import { request } from "../../util/helper";
import {
  Button,
  Card,
  Row,
  Col,
  Statistic,
  Divider,
  DatePicker,
  Empty,
  Spin,
  Typography,
  Space,
  Badge,
  List,
  Avatar,
  Tag
} from "antd";
import {
  DownloadOutlined,
  PrinterOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  UserOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  CreditCardOutlined,
  CalendarOutlined,
  FilterOutlined,
  ArrowUpOutlined,
  RiseOutlined,
  FallOutlined,
  HistoryOutlined,
  ShopOutlined,
  CrownOutlined
} from "@ant-design/icons";
import {
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from "recharts";
import moment from "moment";

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

const COLORS = ['#1e4a2d', '#c0a060', '#3e6a4b', '#e6c887', '#14331f'];
const GRADIENTS = [
  'linear-gradient(135deg, #1e4a2d 0%, #3e6a4b 100%)',
  'linear-gradient(135deg, #c0a060 0%, #e6c887 100%)',
  'linear-gradient(135deg, #14331f 0%, #2d5a3c 100%)',
  'linear-gradient(135deg, #8a7041 0%, #c0a060 100%)'
];

function HomePage() {
  const [dashboard, setDashboard] = useState([]);
  const [saleByMonth, setSaleByMonth] = useState([]);
  const [expenseByMonth, setExpenseByMonth] = useState([]);
  const [topSales, setTopSales] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [dateRange, setDateRange] = useState([moment().startOf('year'), moment()]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      let apiUrl = 'dashbaord';
      if (dateRange && dateRange[0] && dateRange[1]) {
        const [fromDate, toDate] = dateRange;
        apiUrl += `?from_date=${fromDate.format('YYYY-MM-DD')}&to_date=${toDate.format('YYYY-MM-DD')}`;
      }

      const res = await request(apiUrl, "get");
      if (res && res.success) {
        setDashboard(res.dashboard || []);
        setRecentOrders(res.recentOrders || []);

        if (res.Sale_Summary_By_Month) {
          setSaleByMonth(res.Sale_Summary_By_Month.map(item => ({
            month: item.title,
            sale: Number(item.total) || 0
          })));
        }

        if (res.Expense_Summary_By_Month) {
          setExpenseByMonth(res.Expense_Summary_By_Month.map(item => ({
            month: item.title,
            expense: Number(item.total) || 0
          })));
        }

        if (res.Top_Sale) {
          setTopSales(res.Top_Sale.map(item => ({
            name: item.product_name,
            value: Number(item.total_sale_amount)
          })));
        }
      }
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const combinedChartData = saleByMonth.map(sale => {
    const expenseEntry = expenseByMonth.find(exp => exp.month === sale.month);
    return {
      month: sale.month,
      sale: sale.sale,
      expense: expenseEntry ? expenseEntry.expense : 0,
      profit: sale.sale - (expenseEntry ? expenseEntry.expense : 0)
    };
  });

  return (
    <div style={{ padding: '24px', background: '#f4f1eb', minHeight: '100vh' }}>
      {/* Header Section */}
      <div style={{
        background: '#1e4a2d',
        padding: '40px',
        borderRadius: '24px',
        marginBottom: '32px',
        boxShadow: '0 20px 40px rgba(30, 74, 45, 0.2)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background Coffee Pattern Decor */}
        <div style={{ position: 'absolute', right: '-50px', top: '-50px', opacity: 0.1, fontSize: '150px' }}>☕</div>

        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2} style={{ color: '#fff', margin: 0, fontWeight: 700 }}>
              <CrownOutlined style={{ color: '#c0a060', marginRight: '12px' }} />
              Executive Insights Dashboard
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: '16px' }}>
              Real-time performance metrics for your coffee business network
            </Text>
          </Col>
          <Col>
            <Space size="large">
              <RangePicker
                value={dateRange}
                onChange={setDateRange}
                style={{ borderRadius: '12px', height: '45px', border: 'none' }}
              />
              <Button
                type="primary"
                onClick={fetchAllData}
                icon={<FilterOutlined />}
                style={{ background: '#c0a060', borderColor: '#c0a060', height: '45px', borderRadius: '12px', fontWeight: 600 }}
              >
                Apply Filters
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      <Spin spinning={isLoading}>
        {/* Metric Cards */}
        <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
          {dashboard.map((item, index) => (
            <Col xs={24} md={8} key={index}>
              <Card
                style={{
                  borderRadius: '20px',
                  border: 'none',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                  background: index === 1 ? GRADIENTS[0] : '#fff',
                  color: index === 1 ? '#fff' : 'inherit'
                }}
                bodyStyle={{ padding: '24px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <Title level={4} style={{ margin: 0, color: index === 1 ? '#fff' : '#1e4a2d', fontSize: '18px' }}>
                    {item.title}
                  </Title>
                  <Avatar
                    style={{ background: index === 1 ? 'rgba(255,255,255,0.2)' : 'rgba(30, 74, 45, 0.1)' }}
                    icon={index === 0 ? <UserOutlined /> : index === 1 ? <DollarOutlined /> : <RiseOutlined />}
                  />
                </div>

                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  {Object.entries(item.Summary).map(([label, value], idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <Text style={{ color: index === 1 ? 'rgba(255,255,255,0.6)' : '#666' }}>{label}</Text>
                      <Text style={{
                        fontSize: idx === 0 ? '24px' : '16px',
                        fontWeight: 700,
                        color: index === 1 ? '#fff' : '#1e4a2d'
                      }}>
                        {value}
                      </Text>
                    </div>
                  ))}
                </Space>
              </Card>
            </Col>
          ))}
        </Row>

        <Row gutter={[24, 24]}>
          {/* Main Visualizations */}
          <Col xs={24} lg={16}>
            <Card
              title={<Space><BarChartOutlined style={{ color: '#c0a060' }} /><span>Performance Trends</span></Space>}
              style={{ borderRadius: '24px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', marginBottom: '24px' }}
            >
              <ResponsiveContainer width="100%" height={380}>
                <AreaChart data={combinedChartData}>
                  <defs>
                    <linearGradient id="colorSale" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1e4a2d" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#1e4a2d" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
                  />
                  <Area type="monotone" dataKey="sale" name="Revenue" stroke="#1e4a2d" strokeWidth={3} fillOpacity={1} fill="url(#colorSale)" />
                  <Area type="monotone" dataKey="profit" name="Net Profit" stroke="#c0a060" strokeWidth={3} fill="none" />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            <Row gutter={[24, 24]}>
              <Col xs={24} md={12}>
                <Card
                  title="Top Selling Products"
                  style={{ borderRadius: '24px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
                >
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={topSales}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {topSales.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ marginTop: '16px' }}>
                    {topSales.slice(0, 3).map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <Space><Badge color={COLORS[i]} /> <Text size="small">{item.name}</Text></Space>
                        <Text strong>${item.value.toLocaleString()}</Text>
                      </div>
                    ))}
                  </div>
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card
                  title="System Distribution"
                  style={{ borderRadius: '24px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
                >
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <Statistic title="Total Revenue Growth" value={11.28} precision={2} valueStyle={{ color: '#3f8600' }} prefix={<ArrowUpOutlined />} suffix="%" />
                    <Divider />
                    <Statistic title="Customer Retention" value={93} suffix="/ 100" />
                  </div>
                </Card>
              </Col>
            </Row>
          </Col>

          {/* Right-Side Live Stream */}
          <Col xs={24} lg={8}>
            <Card
              title={
                <Space>
                  <HistoryOutlined style={{ color: '#c0a060' }} />
                  <span>Recent Activity</span>
                  <Tag color="green">Live</Tag>
                </Space>
              }
              bodyStyle={{ padding: '0 24px 24px' }}
              style={{ borderRadius: '24px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', height: '100%' }}
            >
              <List
                itemLayout="horizontal"
                dataSource={recentOrders}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar style={{ background: '#f4f1eb', color: '#1e4a2d' }} icon={<ShoppingCartOutlined />} />}
                      title={<div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Text strong>{item.order_no}</Text>
                        <Text type="success" strong>${item.total_amount}</Text>
                      </div>}
                      description={
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                          <span><ShopOutlined /> {item.branch_name}</span>
                          <span>{moment(item.created_at).fromNow()}</span>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
              {recentOrders.length === 0 && <Empty style={{ marginTop: '50px' }} description="No recent transactions" />}
              <Button ghost type="primary" block style={{ marginTop: '20px', borderRadius: '10px' }}>
                View All Orders
              </Button>
            </Card>
          </Col>
        </Row>
      </Spin>

      <style jsx>{`
        .ant-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .ant-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.08) !important;
        }
      `}</style>
    </div>
  );
}

export default HomePage;