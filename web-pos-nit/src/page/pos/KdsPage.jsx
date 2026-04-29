import React, { useEffect, useState, useRef } from "react";
import { Row, Col, Card, Tag, Button, Space, Typography, Badge, Spin, Empty, message, Segmented } from "antd";
import { 
    ClockCircleOutlined, 
    CheckCircleOutlined, 
    FireOutlined, 
    BellOutlined,
    HistoryOutlined,
    ThunderboltOutlined
} from "@ant-design/icons";
import { request } from "../../util/helper";
import dayjs from "dayjs";

import { useLanguage, translations } from "../../store/language.store";

const { Title, Text } = Typography;

const KdsPage = () => {
    const { lang } = useLanguage();
    const t = translations[lang];
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState("active"); // active | history
    const refreshInterval = useRef(null);

    useEffect(() => {
        fetchOrders();
        // Auto-refresh every 10 seconds for real-time feel
        refreshInterval.current = setInterval(fetchOrders, 10000);
        return () => {
            if (refreshInterval.current) clearInterval(refreshInterval.current);
        };
    }, [viewMode]);

    const fetchOrders = async () => {
        // setLoading(true); // Don't show full spin on auto-refresh to avoid flickering
        const res = await request(`order-kds?is_history=${viewMode === 'history' ? 1 : 0}`, "get");
        if (res && res.list) setOrders(res.list);
        setLoading(false);
    };

    const updateStatus = async (id, batchId, status) => {
        const res = await request("order-kitchen-status", "put", { 
            order_id: id, 
            kitchen_batch_id: batchId,
            kitchen_status: status 
        });
        if (res && res.success) {
            message.success(`Order #${id} is now ${status}`);
            fetchOrders();
        }
    };

    const getWaitTimeColor = (createdAt) => {
        const minutes = dayjs().diff(dayjs(createdAt), 'minute');
        if (minutes > 15) return '#e74c3c'; // Red - Urgent
        if (minutes > 8) return '#f39c12';  // Orange - Warning
        return '#2ecc71';                   // Green - Good
    };

    const renderOrderCard = (order) => {
        const items = order.items_summary ? order.items_summary.split('\n') : [];
        
        return (
            <Card 
                key={`${order.order_id}-${order.kitchen_batch_id}`}
                className="kds-card"
                style={{ 
                    borderRadius: 16, 
                    borderLeft: `6px solid ${getWaitTimeColor(order.order_date)}`,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    marginBottom: 16
                }}
                title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>
                            <Text strong style={{ fontSize: 18 }}>#{order.order_id}</Text>
                            <Tag color="blue" style={{ marginLeft: 8 }}>
                                {order.order_type === 'dine_in' 
                                    ? `${t.table_label || 'Table'} ${order.table_no}` 
                                    : (t.takeaway_label || 'Take Away')}
                            </Tag>
                            {order.kitchen_batch_id && <Tag color="purple" style={{ fontSize: 10 }}>{t.batch_label || 'Batch'}: {order.kitchen_batch_id.slice(-4)}</Tag>}
                        </span>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            <ClockCircleOutlined /> {dayjs(order.order_date).format("HH:mm")}
                        </Text>
                    </div>
                }
            >
                <div style={{ minHeight: 120, marginBottom: 15 }}>
                    {items.map((item, idx) => (
                        <div key={idx} style={{ padding: '4px 0', borderBottom: '1px dashed #f0f0f0' }}>
                            <Text strong style={{ fontSize: 16 }}>{item}</Text>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Tag color={
                        order.kitchen_status === 'preparing' ? 'orange' : 
                        order.kitchen_status === 'ready' ? 'green' : 'default'
                    }>
                        {order.kitchen_status === 'preparing' ? (t.preparing_status || 'PREPARING') :
                         order.kitchen_status === 'ready' ? (t.ready_status || 'READY') :
                         order.kitchen_status === 'served' ? (t.done_status || 'DONE') : (t.pending_status || 'PENDING')}
                    </Tag>
                    
                    <Space>
                        {order.kitchen_status !== 'preparing' && order.kitchen_status !== 'ready' && order.kitchen_status !== 'served' && (
                            <Button 
                                icon={<FireOutlined />} 
                                onClick={() => updateStatus(order.order_id, order.kitchen_batch_id, 'preparing')}
                                style={{ background: '#f39c12', color: '#fff', border: 'none', borderRadius: 8 }}
                            >
                                {t.start_btn}
                            </Button>
                        )}
                        {order.kitchen_status === 'preparing' && (
                            <Button 
                                icon={<BellOutlined />} 
                                onClick={() => updateStatus(order.order_id, order.kitchen_batch_id, 'ready')}
                                style={{ background: '#2ecc71', color: '#fff', border: 'none', borderRadius: 8 }}
                            >
                                {t.ready_btn}
                            </Button>
                        )}
                        {order.kitchen_status === 'ready' && (
                            <Button 
                                icon={<CheckCircleOutlined />} 
                                onClick={() => updateStatus(order.order_id, order.kitchen_batch_id, 'served')}
                                style={{ background: '#1e4a2d', color: '#fff', border: 'none', borderRadius: 8 }}
                            >
                                {t.done_btn}
                            </Button>
                        )}
                    </Space>
                </div>
            </Card>
        );
    };

    return (
        <div style={{ padding: 24, background: '#f4f7f6', minHeight: '100vh' }}>
            <Row gutter={24} align="middle" style={{ marginBottom: 24 }}>
                <Col span={12}>
                    <Title level={2} style={{ margin: 0 }}>{t.kds_header || "Kitchen Display System (KDS)"} ☕️</Title>
                    <Text type="secondary">{t.kds_subtitle}</Text>
                </Col>
                <Col span={12} style={{ textAlign: 'right' }}>
                    <Space size="large">
                        <Badge count={orders.length} offset={[10, 0]}>
                            <Segmented 
                                options={[
                                    { label: t.active_orders, value: 'active', icon: <ThunderboltOutlined /> },
                                    { label: t.history, value: 'history', icon: <HistoryOutlined /> }
                                ]} 
                                value={viewMode}
                                onChange={setViewMode}
                                style={{ borderRadius: 12, padding: 4 }}
                            />
                        </Badge>
                        <Button onClick={fetchOrders} icon={<HistoryOutlined />}>{t.refresh}</Button>
                    </Space>
                </Col>
            </Row>

            {loading && orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>
            ) : orders.length === 0 ? (
                <Empty description={viewMode === 'active' ? t.no_active_orders : t.no_kds_history} />
            ) : (
                <Row gutter={[16, 16]}>
                    {orders.map(order => (
                        <Col xs={24} sm={12} md={8} lg={6} key={`${order.order_id}-${order.kitchen_batch_id}`}>
                            {renderOrderCard(order)}
                        </Col>
                    ))}
                </Row>
            )}

            <style jsx global>{`
                .kds-card .ant-card-head {
                    border-bottom: 1px solid #f0f0f0;
                    padding: 0 16px;
                    min-height: 50px;
                }
                .kds-card .ant-card-body {
                    padding: 16px;
                }
            `}</style>
        </div>
    );
};

export default KdsPage;
