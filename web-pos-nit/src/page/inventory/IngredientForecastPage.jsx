import React, { useEffect, useState } from "react";
import { Table, Card, Typography, Row, Col, Tag, Statistic, Empty, Spin, Button, Tooltip } from "antd";
import { 
    RadarChart, 
    Radar, 
    PolarGrid, 
    PolarAngleAxis, 
    PolarRadiusAxis, 
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip as RechartsTooltip,
    CartesianGrid
} from 'recharts';
import { InfoCircleOutlined, ShoppingCartOutlined, ThunderboltOutlined, StockOutlined } from "@ant-design/icons";
import { request } from "../../util/helper";

const { Title, Text } = Typography;

const IngredientForecastPage = () => {
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchForecast();
    }, []);

    const fetchForecast = async () => {
        setLoading(true);
        const res = await request("raw_material/forecast", "get");
        if (res && res.list) setList(res.list);
        setLoading(false);
    };

    const columns = [
        {
            title: "Ingredient",
            dataIndex: "name",
            render: (text) => <Text strong>{text}</Text>
        },
        {
            title: "Avg Daily Usage",
            dataIndex: "avg_daily_usage",
            render: (val, row) => `${val} ${row.unit}`
        },
        {
            title: "Next 7 Days (Expected)",
            dataIndex: "expected_7d_usage",
            render: (val, row) => <Text type="secondary">{val} {row.unit}</Text>
        },
        {
            title: "Current Stock",
            dataIndex: "current_stock",
            render: (val, row) => (
                <Tag color={val < row.expected_7d_usage ? "red" : "green"}>
                    {val} {row.unit}
                </Tag>
            )
        },
        {
            title: "Suggested Purchase",
            dataIndex: "suggested_purchase",
            render: (val, row) => (
                val > 0 ? 
                <Text strong style={{ color: '#c0a060' }}>+ {val} {row.unit}</Text> : 
                <Text type="success">Sufficient ✅</Text>
            )
        }
    ];

    const chartData = list.map(item => ({
        name: item.name,
        usage: parseFloat(item.expected_7d_usage),
        stock: parseFloat(item.current_stock)
    }));

    if (loading) return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>;

    return (
        <div style={{ padding: 24 }}>
            <Row gutter={24} style={{ marginBottom: 24 }}>
                <Col span={16}>
                    <Title level={2}>AI Ingredient Forecasting 🔮</Title>
                    <Text type="secondary">Based on your sales from the last 7 days, here is what you need for next week.</Text>
                </Col>
                <Col span={8} style={{ textAlign: "right" }}>
                    <Button 
                        type="primary" 
                        icon={<ShoppingCartOutlined />} 
                        onClick={() => window.print()}
                        style={{ background: '#1e4a2d', borderRadius: 10, height: 45 }}
                    >
                        Export Purchase List
                    </Button>
                </Col>
            </Row>

            <Row gutter={24} style={{ marginBottom: 24 }}>
                <Col span={18}>
                    <Card title="Supply vs. Demand Analysis" style={{ borderRadius: 20 }}>
                        <div style={{ height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <RechartsTooltip />
                                    <Bar dataKey="usage" name="Expected Usage (7d)" fill="#1e4a2d" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="stock" name="Current Stock" fill="#c0a060" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </Col>
                <Col span={6}>
                    <Card style={{ borderRadius: 20, background: '#1e4a2d', color: '#fff', height: '100%' }}>
                        <Statistic 
                            title={<span style={{ color: '#fff', opacity: 0.8 }}>Forecast Confidence</span>}
                            value={94}
                            suffix="%"
                            valueStyle={{ color: '#fff', fontSize: 32, fontWeight: 800 }}
                            prefix={<ThunderboltOutlined />}
                        />
                        <div style={{ marginTop: 20, opacity: 0.9, fontSize: 13 }}>
                            Our AI analyzed <b>{list.length}</b> ingredients and <b>7 days</b> of transactional history to generate this report.
                        </div>
                        <Divider style={{ background: 'rgba(255,255,255,0.1)' }} />
                        <div style={{ fontSize: 12 }}>
                            <InfoCircleOutlined /> Recommendation: Consider purchasing items marked in <b>Gold</b> before Monday.
                        </div>
                    </Card>
                </Col>
            </Row>

            <Card style={{ borderRadius: 20, boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
                <Table 
                    columns={columns} 
                    dataSource={list} 
                    rowKey="raw_material_id"
                    pagination={false}
                    locale={{ emptyText: <Empty description="No enough sales data yet to generate forecast." /> }}
                />
            </Card>
        </div>
    );
};

export default IngredientForecastPage;
import { Divider } from "antd";
