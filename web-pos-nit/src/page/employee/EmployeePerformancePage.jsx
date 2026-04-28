import React, { useEffect, useState } from "react";
import { Row, Col, Card, Statistic, Table, DatePicker, Space, Typography, Tag, Progress, Avatar } from "antd";
import { 
    UserOutlined, 
    LineChartOutlined, 
    TrophyOutlined, 
    DollarCircleOutlined,
    ShoppingOutlined,
    ThunderboltOutlined
} from "@ant-design/icons";
import { request, formatDateClient } from "../../util/helper";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

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
        const res = await request(`employee-performance?from_date=${from}&to_date=${to}`, "get");
        if (res && res.list) setData(res.list);
        setLoading(false);
    };

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    const columns = [
        {
            title: "Staff Name",
            dataIndex: "staff_name",
            key: "staff_name",
            render: (text) => (
                <Space>
                    <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
                    <Text strong>{text}</Text>
                </Space>
            )
        },
        {
            title: "Total Orders",
            dataIndex: "total_orders",
            key: "total_orders",
            sorter: (a, b) => a.total_orders - b.total_orders,
            render: (val) => <Tag color="blue">{val} orders</Tag>
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
            render: (val) => <Tag color="gold">${Number(val).toFixed(2)}</Tag>,
            sorter: (a, b) => a.commission_earned - b.commission_earned,
        },
        {
            title: "Performance",
            key: "performance",
            render: (_, record) => {
                const maxSales = Math.max(...data.map(i => i.total_sales)) || 1;
                const percent = (record.total_sales / maxSales) * 100;
                return <Progress percent={Math.round(percent)} size="small" status="active" strokeColor="#52c41a" />
            }
        }
    ];

    const totalStats = data.reduce((acc, curr) => ({
        sales: acc.sales + Number(curr.total_sales),
        orders: acc.orders + Number(curr.total_orders),
        commission: acc.commission + Number(curr.commission_earned)
    }), { sales: 0, orders: 0, commission: 0 });

    return (
        <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>
            <Row gutter={[24, 24]} align="middle" style={{ marginBottom: 24 }}>
                <Col span={12}>
                    <Title level={2} style={{ margin: 0 }}>Employee Performance 🏆</Title>
                    <Text type="secondary">Track staff sales efficiency and commissions.</Text>
                </Col>
                <Col span={12} style={{ textAlign: 'right' }}>
                    <RangePicker 
                        value={dates} 
                        onChange={setDates} 
                        style={{ borderRadius: 8 }}
                    />
                </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={8}>
                    <Card bordered={false} className="stat-card">
                        <Statistic 
                            title="Total Sales via Staff" 
                            value={totalStats.sales} 
                            prefix={<DollarCircleOutlined style={{ color: '#52c41a' }} />} 
                            precision={2}
                            suffix="$"
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card bordered={false} className="stat-card">
                        <Statistic 
                            title="Total Orders Processed" 
                            value={totalStats.orders} 
                            prefix={<ShoppingOutlined style={{ color: '#1890ff' }} />} 
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card bordered={false} className="stat-card">
                        <Statistic 
                            title="Total Commissions" 
                            value={totalStats.commission} 
                            prefix={<TrophyOutlined style={{ color: '#faad14' }} />} 
                            precision={2}
                            suffix="$"
                        />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[24, 24]}>
                <Col xs={24} lg={16}>
                    <Card title={<><LineChartOutlined /> Sales Contribution by Staff</>} bordered={false} style={{ borderRadius: 16 }}>
                        <div style={{ height: 350 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="staff_name" />
                                    <YAxis />
                                    <RechartsTooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} />
                                    <Bar dataKey="total_sales" fill="#1890ff" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} lg={8}>
                    <Card title={<><ThunderboltOutlined /> Order Share (%)</>} bordered={false} style={{ borderRadius: 16 }}>
                        <div style={{ height: 350 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="total_orders"
                                        nameKey="staff_name"
                                    >
                                        {data.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </Col>

                <Col span={24}>
                    <Card bordered={false} style={{ borderRadius: 16 }}>
                        <Table 
                            dataSource={data} 
                            columns={columns} 
                            rowKey="user_id" 
                            loading={loading}
                            pagination={false}
                        />
                    </Card>
                </Col>
            </Row>

            <style jsx global>{`
                .stat-card {
                    border-radius: 16px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                }
                .ant-statistic-title {
                    font-size: 14px;
                    font-weight: 500;
                }
                .ant-statistic-content {
                    font-weight: 700;
                }
            `}</style>
        </div>
    );
};

export default EmployeePerformancePage;
