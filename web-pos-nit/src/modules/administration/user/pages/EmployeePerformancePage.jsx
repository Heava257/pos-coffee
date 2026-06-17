import React, { useEffect, useState } from "react";
import { Row, Col, Card, Statistic, Table, DatePicker, Space, Typography, Tag, Progress, Avatar } from "antd";
import { 
    UserOutlined, 
    LineChartOutlined, 
    TrophyOutlined, 
    DollarCircleOutlined,
    ShoppingOutlined,
    ThunderboltOutlined,
    TeamOutlined
} from "@ant-design/icons";
import { request, formatDateClient } from "@/shared/utils/helper";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const COLORS = {
  bg: "#f4f1eb",
  darkGreen: "#1e4a2d",
  midGreen: "#2d6a42",
  accentGreen: "#3a7d52",
  white: "#ffffff",
  textPrimary: "#1a2e1a",
  textSecondary: "#6b7c6b",
  softBorder: "#e8e3d8",
  gold: "#d4af37",
  chart: ['#1e4a2d', '#d4af37', '#2d6a42', '#3a7d52', '#a47148']
};

const EmployeePerformancePage = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dates, setDates] = useState([dayjs().startOf('month'), dayjs()]);

    useEffect(() => {
        fetchPerformance();
    }, [dates]);

    const fetchPerformance = async () => {
        setLoading(true);
        const from = dates[0].format("YYYY-MM-DD");
        const to = dates[1].format("YYYY-MM-DD");
        // Supporting both hyphen and underscore routes
        const res = await request(`employee-performance?from_date=${from}&to_date=${to}`, "get");
        if (res && res.list) setData(res.list);
        setLoading(false);
    };

    const columns = [
        {
            title: "Staff Name",
            dataIndex: "staff_name",
            key: "staff_name",
            render: (text) => (
                <Space>
                    <Avatar icon={<UserOutlined />} style={{ backgroundColor: COLORS.darkGreen }} />
                    <Text strong style={{ color: COLORS.darkGreen }}>{text}</Text>
                </Space>
            )
        },
        {
            title: "Total Orders",
            dataIndex: "total_orders",
            key: "total_orders",
            sorter: (a, b) => a.total_orders - b.total_orders,
            render: (val) => <Tag color="blue" bordered={false} style={{ borderRadius: '6px', padding: '0 8px' }}>{val} orders</Tag>
        },
        {
            title: "Items Sold",
            dataIndex: "total_items",
            key: "total_items",
            sorter: (a, b) => a.total_items - b.total_items,
        },
        {
            title: "Sales Vol.",
            dataIndex: "total_sales",
            key: "total_sales",
            render: (val) => <Text strong>${Number(val).toFixed(2)}</Text>,
            sorter: (a, b) => a.total_sales - b.total_sales,
        },
        {
            title: "Commission",
            dataIndex: "commission_earned",
            key: "commission_earned",
            render: (val) => <Tag color="gold" bordered={false} style={{ borderRadius: '6px', fontWeight: 700 }}>${Number(val).toFixed(2)}</Tag>,
            sorter: (a, b) => a.commission_earned - b.commission_earned,
        },
        {
            title: "Performance",
            key: "performance",
            render: (_, record) => {
                const maxSales = Math.max(...data.map(i => i.total_sales)) || 1;
                const percent = (record.total_sales / maxSales) * 100;
                return <Progress percent={Math.round(percent)} size="small" status="active" strokeColor={COLORS.darkGreen} />
            }
        }
    ];

    const totalStats = data.reduce((acc, curr) => ({
        sales: acc.sales + Number(curr.total_sales),
        orders: acc.orders + Number(curr.total_orders),
        commission: acc.commission + Number(curr.commission_earned)
    }), { sales: 0, orders: 0, commission: 0 });

    return (
        <div style={{ padding: 32, background: COLORS.bg, minHeight: '100vh' }}>
            <Row gutter={[24, 24]} align="middle" style={{ marginBottom: 32 }}>
                <Col span={14}>
                    <Title level={2} style={{ margin: 0, color: COLORS.darkGreen, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <TeamOutlined /> Employee Performance 🏆
                    </Title>
                    <Text style={{ color: COLORS.textSecondary }}>Track staff sales efficiency and real-time commissions.</Text>
                </Col>
                <Col span={10} style={{ textAlign: 'right' }}>
                    <RangePicker 
                        value={dates} 
                        onChange={setDates} 
                        style={{ borderRadius: 12, padding: '8px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: 'none' }}
                    />
                </Col>
            </Row>

            <Row gutter={[20, 20]} style={{ marginBottom: 32 }}>
                <Col xs={24} sm={8}>
                    <div className="op-mini-card" style={{ padding: '20px' }}>
                        <Statistic 
                            title={<Text strong style={{ color: COLORS.textSecondary, fontSize: '12px', textTransform: 'uppercase' }}>Total Sales via Staff</Text>}
                            value={totalStats.sales} 
                            prefix={<DollarCircleOutlined style={{ color: COLORS.darkGreen }} />} 
                            precision={2}
                            suffix="$"
                            valueStyle={{ color: COLORS.darkGreen, fontWeight: 900 }}
                        />
                    </div>
                </Col>
                <Col xs={24} sm={8}>
                    <div className="op-mini-card" style={{ padding: '20px' }}>
                        <Statistic 
                            title={<Text strong style={{ color: COLORS.textSecondary, fontSize: '12px', textTransform: 'uppercase' }}>Total Orders Processed</Text>}
                            value={totalStats.orders} 
                            prefix={<ShoppingOutlined style={{ color: COLORS.midGreen }} />} 
                            valueStyle={{ color: COLORS.midGreen, fontWeight: 900 }}
                        />
                    </div>
                </Col>
                <Col xs={24} sm={8}>
                    <div className="op-mini-card" style={{ padding: '20px' }}>
                        <Statistic 
                            title={<Text strong style={{ color: COLORS.textSecondary, fontSize: '12px', textTransform: 'uppercase' }}>Total Commissions</Text>}
                            value={totalStats.commission} 
                            prefix={<TrophyOutlined style={{ color: COLORS.gold }} />} 
                            precision={2}
                            suffix="$"
                            valueStyle={{ color: COLORS.gold, fontWeight: 900 }}
                        />
                    </div>
                </Col>
            </Row>

            <Row gutter={[24, 24]}>
                <Col xs={24} lg={16}>
                    <Card 
                        title={<Space><LineChartOutlined style={{ color: COLORS.darkGreen }} /><span style={{ color: COLORS.darkGreen }}>Sales Contribution by Staff</span></Space>} 
                        bordered={false} 
                        style={{ borderRadius: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}
                    >
                        <div style={{ height: 350 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="staff_name" axisLine={false} tickLine={false} tick={{ fill: COLORS.textSecondary }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: COLORS.textSecondary }} />
                                    <RechartsTooltip 
                                        cursor={{fill: 'rgba(30, 74, 45, 0.05)'}} 
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Bar dataKey="total_sales" fill={COLORS.darkGreen} radius={[8, 8, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} lg={8}>
                    <Card 
                        title={<Space><ThunderboltOutlined style={{ color: COLORS.gold }} /><span style={{ color: COLORS.darkGreen }}>Order Share (%)</span></Space>} 
                        bordered={false} 
                        style={{ borderRadius: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}
                    >
                        <div style={{ height: 350 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={100}
                                        paddingAngle={8}
                                        dataKey="total_orders"
                                        nameKey="staff_name"
                                    >
                                        {data.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS.chart[index % COLORS.chart.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </Col>

                <Col span={24}>
                    <Card bordered={false} style={{ borderRadius: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
                        <Table 
                            dataSource={data} 
                            columns={columns} 
                            rowKey="user_id" 
                            loading={loading}
                            pagination={false}
                            className="executive-table"
                        />
                    </Card>
                </Col>
            </Row>

            <style jsx global>{`
                .stat-card {
                    border-radius: 20px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.03);
                    transition: transform 0.3s ease;
                }
                .stat-card:hover {
                    transform: translateY(-5px);
                }
                 .ant-progress-text {
                    color: ${COLORS.darkGreen};
                    font-weight: 700;
                }
            `}</style>
        </div>
    );
};

export default EmployeePerformancePage;
