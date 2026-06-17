import React, { useEffect, useState, useRef } from "react";
import { Row, Col, Card, Tag, Button, Space, Typography, Badge, Spin, Empty, message, Segmented, Statistic, Avatar } from "antd";
import { 
    ClockCircleOutlined, 
    CheckCircleOutlined, 
    FireOutlined, 
    BellOutlined,
    HistoryOutlined,
    ThunderboltOutlined,
    LoadingOutlined,
    SmileOutlined,
    ExclamationCircleOutlined,
    CoffeeOutlined,
    TrophyOutlined,
    WarningOutlined
} from "@ant-design/icons";
import { request } from "@/shared/utils/helper";
import dayjs from "dayjs";

import { useLanguage, translations } from "@/app/store/language.store";

const { Title, Text } = Typography;

const KdsPage = () => {
    const { lang } = useLanguage();
    const t = translations[lang];
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState("active"); // active | history
    const refreshInterval = useRef(null);
    const prevOrderCount = useRef(0);

    // Audio context for notification sound
    const playNotificationSound = () => {
        try {
            const context = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = context.createOscillator();
            const gain = context.createGain();
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, context.currentTime); // A5 note
            oscillator.frequency.exponentialRampToValueAtTime(1320, context.currentTime + 0.1); // E6 note
            
            gain.gain.setValueAtTime(0.1, context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3);
            
            oscillator.connect(gain);
            gain.connect(context.destination);
            
            oscillator.start();
            oscillator.stop(context.currentTime + 0.3);
        } catch (e) {
            console.log("Audio play blocked", e);
        }
    };

    useEffect(() => {
        fetchOrders();
        // Auto-refresh every 10 seconds for real-time feel
        refreshInterval.current = setInterval(fetchOrders, 10000);
        return () => {
            if (refreshInterval.current) clearInterval(refreshInterval.current);
        };
    }, [viewMode]);

    const fetchOrders = async () => {
        const res = await request(`order-kds?is_history=${viewMode === 'history' ? 1 : 0}`, "get");
        if (res && res.list) {
            setOrders(res.list);
            
            // Play sound if new orders arrived (only in active mode)
            if (viewMode === 'active' && res.list.length > prevOrderCount.current) {
                playNotificationSound();
            }
            prevOrderCount.current = res.list.length;
        }
        setLoading(false);
    };

    const updateStatus = async (id, batchId, status) => {
        const res = await request("order-kitchen-status", "put", { 
            order_id: id, 
            kitchen_batch_id: batchId,
            kitchen_status: status 
        });
        if (res && res.success) {
            message.success({
                content: `Order #${id} updated to ${status}`,
                icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
                style: { marginTop: '10vh' }
            });
            fetchOrders();
        }
    };

    const getWaitTimeInfo = (createdAt) => {
        const minutes = dayjs().diff(dayjs(createdAt), 'minute');
        const seconds = dayjs().diff(dayjs(createdAt), 'second') % 60;
        
        if (minutes > 15) return { color: '#ef4444', label: 'CRITICAL', class: 'pulse-red' };
        if (minutes > 8) return { color: '#f59e0b', label: 'WARNING', class: 'pulse-yellow' };
        return { color: '#10b981', label: 'NORMAL', class: '' };
    };

    const calculateMetrics = () => {
        const activeCount = orders.length;
        const avgWait = orders.reduce((acc, curr) => acc + dayjs().diff(dayjs(curr.order_date), 'minute'), 0) / (activeCount || 1);
        const urgentCount = orders.filter(o => dayjs().diff(dayjs(o.order_date), 'minute') > 10).length;

        return { activeCount, avgWait: avgWait.toFixed(1), urgentCount };
    };

    const metrics = calculateMetrics();

    const renderOrderCard = (order) => {
        const items = order.items_summary ? order.items_summary.split('\n') : [];
        const waitInfo = getWaitTimeInfo(order.order_date);
        const minutes = dayjs().diff(dayjs(order.order_date), 'minute');
        
        return (
            <Card 
                key={`${order.order_id}-${order.kitchen_batch_id}`}
                className={`premium-kds-card ${waitInfo.class}`}
                title={
                    <div className="card-header-flex">
                        <div className="order-identity">
                            <div className="order-number">#{order.order_id}</div>
                            <Tag color={order.order_type === 'dine_in' ? 'geekblue' : 'orange'} className="type-tag">
                                {order.order_type === 'dine_in' 
                                    ? `${t.table_label || 'Table'} ${order.table_no}` 
                                    : (t.takeaway_label || 'Take Away')}
                            </Tag>
                        </div>
                        <div className="timer-box" style={{ background: waitInfo.color }}>
                            <ClockCircleOutlined /> {minutes}m
                        </div>
                    </div>
                }
            >
                <div className="order-items-list">
                    {items.map((item, idx) => {
                        const [displayStr, servings, stock, type] = item.split('||');
                        const [qty, ...nameParts] = (displayStr || "").split(' x ');
                        const itemName = nameParts.join(' x ');
                        
                        const isLow = type === 'recipe' ? servings < 20 : stock < 10;

                        return (
                            <div key={idx} className="order-item-row" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', gap: 12, alignItems: 'center', width: '100%' }}>
                                    <span className="item-qty">{qty}x</span>
                                    <span className="item-name" style={{ flex: 1 }}>{itemName}</span>
                                </div>
                                <div style={{ paddingLeft: 42, marginTop: -4 }}>
                                    {type === 'recipe' ? (
                                        <Tag color={isLow ? 'error' : 'processing'} style={{ fontSize: 10, borderRadius: 4, border: 'none' }}>
                                            {isLow ? <WarningOutlined style={{ fontSize: 10 }} /> : <CoffeeOutlined style={{ fontSize: 10 }} />}
                                            <span style={{ marginLeft: 4 }}>~{servings} {t.cups || 'cups'} left</span>
                                        </Tag>
                                    ) : (
                                        <Tag color={isLow ? 'warning' : 'default'} style={{ fontSize: 10, borderRadius: 4, border: 'none' }}>
                                            {isLow ? <WarningOutlined style={{ fontSize: 10 }} /> : <ThunderboltOutlined style={{ fontSize: 10 }} />}
                                            <span style={{ marginLeft: 4 }}>{stock} in stock</span>
                                        </Tag>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="card-footer-actions">
                    <div className="status-indicator">
                        <Badge status={
                            order.kitchen_status === 'preparing' ? 'processing' : 
                            order.kitchen_status === 'ready' ? 'success' : 'default'
                        } text={
                            <Text strong style={{ fontSize: 12, color: '#64748b' }}>
                                {order.kitchen_status === 'preparing' ? (t.preparing_status || 'PREPARING') :
                                 order.kitchen_status === 'ready' ? (t.ready_status || 'READY') :
                                 order.kitchen_status === 'served' ? (t.done_status || 'DONE') : (t.pending_status || 'PENDING')}
                            </Text>
                        } />
                    </div>
                    
                    <div className="action-buttons">
                        {order.kitchen_status !== 'preparing' && order.kitchen_status !== 'ready' && order.kitchen_status !== 'served' && (
                            <Button 
                                className="op-btn start"
                                icon={<FireOutlined />} 
                                onClick={() => updateStatus(order.order_id, order.kitchen_batch_id, 'preparing')}
                            >
                                {t.start_btn || "START"}
                            </Button>
                        )}
                        {order.kitchen_status === 'preparing' && (
                            <Button 
                                className="op-btn ready"
                                icon={<BellOutlined />} 
                                onClick={() => updateStatus(order.order_id, order.kitchen_batch_id, 'ready')}
                            >
                                {t.ready_btn || "READY"}
                            </Button>
                        )}
                        {order.kitchen_status === 'ready' && (
                            <Button 
                                className="op-btn done"
                                icon={<CheckCircleOutlined />} 
                                onClick={() => updateStatus(order.order_id, order.kitchen_batch_id, 'served')}
                            >
                                {t.done_btn || "SERVE"}
                            </Button>
                        )}
                    </div>
                </div>
            </Card>
        );
    };

    return (
        <div className="kds-premium-layout">
            {/* Executive Header */}
            <div className="kds-top-bar">
                <div className="brand-section">
                    <div className="logo-box">
                        <FireOutlined className="fire-icon" />
                    </div>
                    <div>
                        <Title level={2} style={{ margin: 0, color: '#1e4a2d' }}>KDS Dashboard</Title>
                        <Text type="secondary" style={{ fontSize: 12 }}>Executive Kitchen Operations</Text>
                    </div>
                </div>

                <div className="metrics-group">
                    <div className="metric-glass-card">
                        <div className="metric-icon active"><ThunderboltOutlined /></div>
                        <div className="metric-content">
                            <div className="m-val">{metrics.activeCount}</div>
                            <div className="m-lbl">Active Orders</div>
                        </div>
                    </div>
                    <div className="metric-glass-card">
                        <div className="metric-icon wait"><ClockCircleOutlined /></div>
                        <div className="metric-content">
                            <div className="m-val">{metrics.avgWait}m</div>
                            <div className="m-lbl">Avg. Wait Time</div>
                        </div>
                    </div>
                    <div className="metric-glass-card urgent">
                        <div className="metric-icon critical"><ExclamationCircleOutlined /></div>
                        <div className="metric-content">
                            <div className="m-val">{metrics.urgentCount}</div>
                            <div className="m-lbl">Urgent (&gt;10m)</div>
                        </div>
                    </div>
                </div>

                <div className="view-switcher">
                    <Segmented 
                        options={[
                            { label: 'ACTIVE', value: 'active', icon: <ThunderboltOutlined /> },
                            { label: 'HISTORY', value: 'history', icon: <HistoryOutlined /> }
                        ]} 
                        value={viewMode}
                        onChange={setViewMode}
                        className="premium-segmented"
                    />
                </div>
            </div>

            {/* Main Content Area */}
            <div className="kds-content-grid">
                {loading && orders.length === 0 ? (
                    <div className="loading-state">
                        <Spin indicator={<LoadingOutlined style={{ fontSize: 48, color: '#1e4a2d' }} spin />} />
                        <Text style={{ marginTop: 16, color: '#1e4a2d', fontWeight: 600 }}>Refreshing Kitchen Data...</Text>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="empty-state">
                        <Empty 
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={
                                <div className="empty-msg">
                                    <SmileOutlined style={{ fontSize: 32, color: '#1e4a2d', marginBottom: 12 }} />
                                    <div className="big-txt">{viewMode === 'active' ? "Kitchen is Clear!" : "No History Records"}</div>
                                    <div className="sub-txt">{viewMode === 'active' ? "Relax, enjoy a coffee while waiting for new orders." : "Check back later for historical data."}</div>
                                </div>
                            } 
                        />
                    </div>
                ) : (
                    <Row gutter={[20, 20]}>
                        {orders.map(order => (
                            <Col xs={24} sm={12} md={12} lg={8} xl={6} key={`${order.order_id}-${order.kitchen_batch_id}`}>
                                {renderOrderCard(order)}
                            </Col>
                        ))}
                    </Row>
                )}
            </div>

            <style>{`
                .kds-premium-layout {
                    padding: 20px;
                    background: var(--theme-milk-bg);
                    min-height: 100vh;
                    font-family: 'Inter', -apple-system, sans-serif;
                }
                
                /* Header Section */
                .kds-top-bar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: var(--theme-cream-card-bg);
                    backdrop-filter: blur(10px);
                    padding: 20px 30px;
                    border-radius: 24px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.05);
                    margin-bottom: 30px;
                    border: 1.5px solid var(--theme-dark-green);
                }
                
                .brand-section { display: flex; gap: 15px; align-items: center; }
                .logo-box {
                    width: 48px;
                    height: 48px;
                    background: #1e4a2d;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 24px;
                    box-shadow: 0 8px 16px rgba(30, 74, 45, 0.2);
                }
                
                /* Metrics */
                .metrics-group { display: flex; gap: 20px; }
                .metric-glass-card {
                    background: var(--theme-cream-card-bg);
                    padding: 12px 20px;
                    border-radius: 18px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    min-width: 160px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.03);
                    border: 1.5px solid var(--theme-dark-green);
                }
                .metric-glass-card.urgent { border: 1.5px solid var(--theme-dark-green); }
                .metric-icon {
                    width: 36px;
                    height: 36px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 18px;
                }
                .metric-icon.active { background: #e0f2fe; color: #0ea5e9; }
                .metric-icon.wait { background: #f0fdf4; color: #22c55e; }
                .metric-icon.critical { background: #fef2f2; color: #ef4444; }
                
                .m-val { font-size: 20px; font-weight: 900; color: #1e293b; line-height: 1; }
                .m-lbl { font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; margin-top: 4px; }
                
                /* Order Cards */
                .premium-kds-card {
                    background: var(--theme-cream-card-bg) !important;
                    backdrop-filter: blur(5px);
                    border-radius: 24px !important;
                    border: 1.5px solid var(--theme-dark-green) !important;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.04) !important;
                    overflow: hidden;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .premium-kds-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 20px 40px rgba(0,0,0,0.08) !important;
                }
                
                .premium-kds-card .ant-card-head { border: none !important; padding: 20px 20px 10px !important; }
                .card-header-flex { display: flex; justify-content: space-between; align-items: flex-start; }
                .order-number { font-size: 22px; font-weight: 900; color: #1e293b; letter-spacing: -0.5px; line-height: 1.2; }
                .type-tag { border-radius: 6px !important; border: none !important; font-weight: 700 !important; font-size: 11px !important; }
                
                .timer-box {
                    padding: 4px 12px;
                    border-radius: 10px;
                    color: white;
                    font-weight: 900;
                    font-size: 13px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
                }
                
                .order-items-list {
                    min-height: 140px;
                    padding: 10px 0;
                }
                .order-item-row {
                    display: flex;
                    gap: 12px;
                    padding: 8px 0;
                    border-bottom: 1px solid #f8fafc;
                }
                .item-qty { font-weight: 900; color: #1e4a2d; font-size: 16px; min-width: 30px; }
                .item-name { font-weight: 600; color: #334155; font-size: 16px; }
                
                /* Actions */
                .card-footer-actions {
                    margin-top: 15px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-top: 15px;
                    border-top: 1px solid #f1f5f9;
                }
                
                .op-btn {
                    height: 44px !important;
                    border-radius: 14px !important;
                    font-weight: 900 !important;
                    border: none !important;
                    transition: all 0.2s !important;
                    padding: 0 20px !important;
                    font-size: 14px !important;
                    letter-spacing: 0.5px !important;
                }
                .op-btn.start { background: linear-gradient(135deg, #f59e0b, #d97706) !important; color: white !important; box-shadow: 0 6px 12px rgba(245, 158, 11, 0.2) !important; }
                .op-btn.ready { background: linear-gradient(135deg, #10b981, #059669) !important; color: white !important; box-shadow: 0 6px 12px rgba(16, 185, 129, 0.2) !important; }
                .op-btn.done { background: linear-gradient(135deg, #1e4a2d, #112919) !important; color: white !important; box-shadow: 0 6px 12px rgba(30, 74, 45, 0.2) !important; }
                .op-btn:hover { transform: scale(1.05); filter: brightness(1.1); }
                .op-btn:active { transform: scale(0.95); }
                
                /* Animations */
                @keyframes pulse-card-red {
                    0% { border: 1px solid rgba(239, 68, 68, 0.3); }
                    50% { border: 1px solid rgba(239, 68, 68, 0.8); box-shadow: 0 0 20px rgba(239, 68, 68, 0.2) !important; }
                    100% { border: 1px solid rgba(239, 68, 68, 0.3); }
                }
                .pulse-red { animation: pulse-card-red 2s infinite; }
                
                @keyframes pulse-card-yellow {
                    0% { border: 1px solid rgba(245, 158, 11, 0.2); }
                    50% { border: 1px solid rgba(245, 158, 11, 0.6); }
                    100% { border: 1px solid rgba(245, 158, 11, 0.2); }
                }
                .pulse-yellow { animation: pulse-card-yellow 3s infinite; }
                
                /* States */
                .loading-state, .empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 100px 0;
                    text-align: center;
                }
                .empty-msg .big-txt { font-size: 24px; font-weight: 900; color: #1e293b; }
                .empty-msg .sub-txt { font-size: 14px; color: #64748b; margin-top: 5px; }
                
                .premium-segmented {
                    background: rgba(226, 232, 240, 0.5) !important;
                    border-radius: 14px !important;
                    padding: 4px !important;
                    border: 1.5px solid var(--theme-dark-green) !important;
                }
                .premium-segmented .ant-segmented-item-selected {
                    background: var(--theme-dark-green) !important;
                    border-radius: 10px !important;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.05) !important;
                    color: #fff !important;
                }
            `}</style>
        </div>
    );
};

export default KdsPage;
