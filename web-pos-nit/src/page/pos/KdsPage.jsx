import React, { useEffect, useState, useRef } from "react";
import { 
    Row, 
    Col, 
    Card, 
    Button, 
    Tag, 
    Typography, 
    Space, 
    Badge, 
    message,
    Empty,
    Spin,
    Divider
} from "antd";
import { 
    ClockCircleOutlined, 
    CheckCircleOutlined, 
    CoffeeOutlined, 
    SoundOutlined,
    SyncOutlined,
    NotificationOutlined,
    HistoryOutlined
} from "@ant-design/icons";
import { request } from "../../util/helper";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useLanguage, translations } from "../../store/language.store";

dayjs.extend(relativeTime);

const { Title, Text } = Typography;

const KdsPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isHistory, setIsHistory] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const audioRef = useRef(null);
    const { lang } = useLanguage();
    const t = translations[lang];

    const fetchOrders = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await request(`order-kds?is_history=${isHistory ? 1 : 0}`, "get");
            if (res && res.list) {
                // If new orders arrived and not in history mode, play sound
                if (!isHistory && orders.length > 0 && res.list.length > orders.length) {
                    playNotification();
                }
                setOrders(res.list);
            }
        } catch (error) {
            console.error("KDS Fetch Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const playNotification = () => {
        try {
            const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
            audio.play();
        } catch (e) {
            console.warn("Audio play blocked by browser");
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [isHistory]);

    useEffect(() => {
        let interval;
        if (autoRefresh && !isHistory) {
            interval = setInterval(() => {
                fetchOrders(true);
            }, 10000); // 10 seconds
        }
        return () => clearInterval(interval);
    }, [autoRefresh, orders, isHistory]);

    const updateStatus = async (id, status) => {
        try {
            const res = await request("order-kitchen-status", "put", { id, kitchen_status: status });
            if (res && res.success) {
                message.success(`Status updated to ${status}`);
                fetchOrders(true);
            }
        } catch (error) {
            message.error("Failed to update status");
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'preparing': return 'processing';
            case 'ready': return 'success';
            case 'served': return 'default';
            default: return 'warning'; // pending
        }
    };

    const getTimeDiff = (createdAt) => {
        const minutes = dayjs().diff(dayjs(createdAt), 'minute');
        if (minutes > 15) return <Tag color="error">{minutes}m</Tag>;
        if (minutes > 8) return <Tag color="warning">{minutes}m</Tag>;
        return <Tag color="default">{minutes}m</Tag>;
    };

    return (
        <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Title level={2} style={{ margin: 0 }}>
                    <CoffeeOutlined /> {isHistory ? t.kds_history_title : t.kds_header}
                </Title>
                <Space>
                    <Button 
                        type={isHistory ? "primary" : "default"}
                        icon={<HistoryOutlined />}
                        onClick={() => setIsHistory(!isHistory)}
                    >
                        {isHistory ? t.show_active_btn : t.history_btn}
                    </Button>
                    <Button 
                        icon={<SyncOutlined spin={loading} />} 
                        onClick={() => fetchOrders()}
                    >
                        {t.refresh_btn}
                    </Button>
                    {!isHistory && (
                        <Button 
                            type={autoRefresh ? "primary" : "default"}
                            icon={<NotificationOutlined />}
                            onClick={() => setAutoRefresh(!autoRefresh)}
                        >
                            {autoRefresh ? t.auto_refresh_on : t.auto_refresh_off}
                        </Button>
                    )}
                </Space>
            </div>

            {loading && orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>
            ) : orders.length === 0 ? (
                <Empty description={isHistory ? t.served_today_empty : t.active_tickets_empty} style={{ marginTop: 100 }} />
            ) : (
                <Row gutter={[16, 16]}>
                    {orders.map((order) => (
                        <Col key={order.id} xs={24} sm={12} md={8} lg={6}>
                            <Card 
                                hoverable
                                style={{ 
                                    borderRadius: 12, 
                                    borderTop: `6px solid ${order.kitchen_status === 'preparing' ? '#1890ff' : order.kitchen_status === 'ready' ? '#52c41a' : '#faad14'}`,
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                }}
                                title={
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Text strong>#{order.id} - {order.table_no || t.takeaway_label}</Text>
                                        {getTimeDiff(order.created_at)}
                                    </div>
                                }
                                bodyStyle={{ padding: '12px 16px' }}
                            >
                                <div style={{ minHeight: 120, whiteSpace: 'pre-wrap', marginBottom: 12 }}>
                                    <Text style={{ fontSize: 16 }}>{order.items_summary}</Text>
                                </div>
                                
                                <Divider style={{ margin: '8px 0' }} />
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                    <Tag color={getStatusColor(order.kitchen_status)}>
                                        {(order.kitchen_status === 'preparing' ? t.preparing_status : 
                                          order.kitchen_status === 'ready' ? t.done_status : 
                                          t.pending_status).toUpperCase()}
                                    </Tag>
                                    <Text type="secondary" style={{ fontSize: 12 }}>{order.customer_name || 'Walking Guest'}</Text>
                                </div>

                                <Row gutter={8}>
                                    {(!order.kitchen_status || order.kitchen_status === 'pending') && (
                                        <Col span={24}>
                                            <Button 
                                                block 
                                                type="primary" 
                                                icon={<ClockCircleOutlined />}
                                                onClick={() => updateStatus(order.id, 'preparing')}
                                            >
                                                {t.start_preparing_btn}
                                            </Button>
                                        </Col>
                                    )}
                                    {order.kitchen_status === 'preparing' && (
                                        <Col span={24}>
                                            <Button 
                                                block 
                                                type="primary"
                                                style={{ background: '#52c41a', borderColor: '#52c41a' }}
                                                icon={<CheckCircleOutlined />}
                                                onClick={() => updateStatus(order.id, 'ready')}
                                            >
                                                {t.mark_ready_btn}
                                            </Button>
                                        </Col>
                                    )}
                                    {order.kitchen_status === 'ready' && (
                                        <Col span={24}>
                                            <Button 
                                                block 
                                                type="primary"
                                                style={{ background: '#262626', borderColor: '#262626' }}
                                                icon={<NotificationOutlined />}
                                                onClick={() => updateStatus(order.id, 'served')}
                                            >
                                                {t.mark_served_btn}
                                            </Button>
                                        </Col>
                                    )}
                                </Row>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}
        </div>
    );
};

export default KdsPage;
