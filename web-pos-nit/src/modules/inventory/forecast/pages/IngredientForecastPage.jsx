import React, { useEffect, useState } from "react";
import { Table, Card, Typography, Row, Col, Tag, Statistic, Empty, Spin, Button, Tooltip, Divider } from "antd";
import { 
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip as RechartsTooltip,
    CartesianGrid
} from 'recharts';
import { InfoCircleOutlined, ShoppingCartOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { request } from "@/shared/utils/helper";
import { useLanguage, translations } from "@/app/store/language.store";

const { Title, Text } = Typography;

const IngredientForecastPage = () => {
    const { lang } = useLanguage();
    const t = translations[lang];
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
            title: t.ingredient || "Ingredient",
            dataIndex: "name",
            render: (text) => <Text strong>{text}</Text>
        },
        {
            title: t.avg_daily_usage,
            dataIndex: "avg_daily_usage",
            render: (val, row) => `${val} ${row.unit}`
        },
        {
            title: t.next_7_days_expected,
            dataIndex: "expected_7d_usage",
            render: (val, row) => <Text type="secondary">{val} {row.unit}</Text>
        },
        {
            title: t.current_stock,
            dataIndex: "current_stock",
            render: (val, row) => (
                <Tag color={val < row.expected_7d_usage ? "red" : "green"}>
                    {val} {row.unit}
                </Tag>
            )
        },
        {
            title: t.suggested_purchase,
            dataIndex: "suggested_purchase",
            render: (val, row) => (
                val > 0 ? 
                <Text strong style={{ color: '#c0a060' }}>+ {val} {row.unit}</Text> : 
                <Text type="success">{t.sufficient} ✅</Text>
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
                    <Title level={2}>{t.forecast_title} 🔮</Title>
                    <Text type="secondary">{t.forecast_subtitle}</Text>
                </Col>
                <Col span={8} style={{ textAlign: "right" }}>
                    <Button 
                        type="primary" 
                        icon={<ShoppingCartOutlined />} 
                        onClick={() => window.print()}
                        style={{ background: '#1e4a2d', borderRadius: 10, height: 45 }}
                    >
                        {t.export_purchase_list}
                    </Button>
                </Col>
            </Row>

            <Row gutter={24} style={{ marginBottom: 24 }}>
                <Col span={18}>
                    <Card title={t.supply_demand_analysis} style={{ borderRadius: 20 }}>
                        <div style={{ height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <RechartsTooltip />
                                    <Bar dataKey="usage" name={t.expected_usage_7d} fill="#1e4a2d" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="stock" name={t.current_stock} fill="#c0a060" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </Col>
                <Col span={6}>
                    <Card style={{ borderRadius: 20, background: '#1e4a2d', color: '#fff', height: '100%' }}>
                        <Statistic 
                            title={<span style={{ color: '#fff', opacity: 0.8 }}>{t.forecast_confidence}</span>}
                            value={94}
                            suffix="%"
                            valueStyle={{ color: '#fff', fontSize: 32, fontWeight: 800 }}
                            prefix={<ThunderboltOutlined />}
                        />
                        <div style={{ marginTop: 20, opacity: 0.9, fontSize: 13 }}>
                            {lang === 'kh' 
                                ? `AI របស់យើងបានវិភាគគ្រឿងផ្សំចំនួន ${list.length} និងប្រវត្តិនៃការលក់ ៧ ថ្ងៃ ដើម្បីបង្កើតរបាយការណ៍នេះ។`
                                : `Our AI analyzed ${list.length} ingredients and 7 days of transactional history to generate this report.`
                            }
                        </div>
                        <Divider style={{ background: 'rgba(255,255,255,0.1)' }} />
                        <div style={{ fontSize: 12 }}>
                            <InfoCircleOutlined /> {t.forecast_recommendation}
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
                    locale={{ emptyText: <Empty description={t.no_forecast_data} /> }}
                />
            </Card>
        </div>
    );
};

export default IngredientForecastPage;
