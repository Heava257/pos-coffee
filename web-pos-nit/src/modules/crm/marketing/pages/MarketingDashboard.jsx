import React, { useEffect, useState } from "react";
import { Table, Card, Row, Col, Typography, Button, Space, Tag, Modal, Input, message, Statistic, Tooltip, Avatar } from "antd";
import { 
    TeamOutlined, 
    SendOutlined, 
    GiftOutlined, 
    ThunderboltOutlined,
    UserDeleteOutlined,
    ClockCircleOutlined,
    SearchOutlined
} from "@ant-design/icons";
import { request } from "@/shared/utils/helper";
import { getProfile } from "@/app/store/profile.store";
import dayjs from "dayjs";
import { useLanguage, translations } from "@/app/store/language.store";

const { Title, Text } = Typography;

const MarketingDashboard = () => {
    const { lang } = useLanguage();
    const t = translations[lang];
    const profile = getProfile();
    const [inactiveList, setInactiveList] = useState([]);
    const [allMembers, setAllMembers] = useState([]);
    const [stats, setStats] = useState({ total_members: 0, inactive_count: 0, recovery_rate: 0 });
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false); // 🚀 Add sending state
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [isPromoModalVisible, setIsPromoModalVisible] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Inactive List
            const resList = await request("customer/inactive", "get", { days: 30 });
            if (resList && resList.list) setInactiveList(resList.list);

            // 2. Fetch All Members
            const resAll = await request("customer", "get");
            if (resAll && resAll.list) setAllMembers(resAll.list);

            // 3. Fetch Stats Summary
            const resStats = await request("customer/marketing-stats", "get");
            if (resStats) setStats(resStats);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const handleSendPromo = (customer) => {
        setSelectedCustomer(customer);
        setIsPromoModalVisible(true);
    };

    const columns = [
        {
            title: t.customer_name,
            render: (row) => (
                <Space>
                    <Avatar style={{ backgroundColor: '#1e4a2d' }}>{row.name ? row.name[0] : 'C'}</Avatar>
                    <div>
                        <div style={{ fontWeight: 700 }}>{row.name || t.unknown}</div>
                        <Text type="secondary" style={{ fontSize: 12 }}>{row.phone || t.no_phone}</Text>
                    </div>
                </Space>
            )
        },
        {
            title: t.tier,
            dataIndex: "tier_name",
            render: (text) => <Tag color="gold">{text || "Standard"}</Tag>
        },
        {
            title: t.last_visit,
            dataIndex: "last_order_date",
            render: (text) => text ? dayjs(text).format("DD MMM YYYY") : <Tag color="default">{t.never}</Tag>
        },
        {
            title: t.days_inactive,
            dataIndex: "days_since_last_order",
            render: (days) => (
                <Tag color={(days > 60 || days === null) ? "error" : "warning"}>
                    {days === null ? t.never : `${days} ${t.days_ago}`}
                </Tag>
            )
        },
        {
            title: t.action,
            render: (row) => (
                <Button 
                    type="primary" 
                    icon={<GiftOutlined />} 
                    size="small" 
                    onClick={() => handleSendPromo(row)}
                    style={{ background: '#c0a060', border: 'none', borderRadius: 6 }}
                >
                    {t.win_back}
                </Button>
            )
        }
    ];

    const allMemberColumns = [
        {
            title: t.member,
            render: (row) => (
                <Space>
                    <Avatar style={{ backgroundColor: '#4A6741' }}>{row.name ? row.name[0] : 'M'}</Avatar>
                    <div>
                        <div style={{ fontWeight: 700 }}>{row.name || t.guest}</div>
                        <Text type="secondary" style={{ fontSize: 11 }}>{row.phone || "-"}</Text>
                    </div>
                </Space>
            )
        },
        {
            title: t.tier,
            dataIndex: "tier_name",
            render: (text) => <Tag color="gold" style={{ borderRadius: 4 }}>{text || "Standard"}</Tag>
        },
        {
            title: t.points,
            dataIndex: "points",
            sorter: (a, b) => a.points - b.points,
            render: (p) => <span style={{ fontWeight: 800, color: '#c0a060' }}>{p || 0} ⭐</span>
        },
        {
            title: t.total_spent,
            dataIndex: "total_spent",
            sorter: (a, b) => a.total_spent - b.total_spent,
            render: (v) => <span style={{ fontWeight: 700 }}>${parseFloat(v || 0).toFixed(2)}</span>
        },
        {
            title: t.balance || "Balance",
            dataIndex: "wallet_balance",
            render: (v) => <Text strong type="success">${parseFloat(v || 0).toFixed(2)}</Text>
        },
        {
            title: t.action,
            render: (row) => (
                <Button 
                    type="primary" 
                    icon={<SendOutlined />} 
                    size="small" 
                    onClick={() => handleSendPromo(row)}
                    style={{ background: '#4A6741', border: 'none', borderRadius: 6 }}
                >
                    Email
                </Button>
            )
        }
    ];

    return (
        <div style={{ padding: 24 }}>
            <Row gutter={24} style={{ marginBottom: 24 }}>
                <Col span={16}>
                    <Title level={2}>{t.marketing_title} 🚀</Title>
                    <Text type="secondary">{t.marketing_subtitle}</Text>
                </Col>
            </Row>

            <Row gutter={24} style={{ marginBottom: 24 }}>
                <Col span={8}>
                    <Card style={{ borderRadius: 20 }}>
                        <Statistic 
                            title={t.inactive_vips} 
                            value={stats.inactive_count} 
                            prefix={<UserDeleteOutlined />} 
                            valueStyle={{ color: '#e74c3c', fontWeight: 800 }}
                            loading={loading}
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card style={{ borderRadius: 20 }}>
                        <Statistic 
                            title={t.total_loyalty} 
                            value={stats.total_members} 
                            prefix={<TeamOutlined />} 
                            valueStyle={{ color: '#1e4a2d', fontWeight: 800 }}
                            loading={loading}
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card style={{ borderRadius: 20, background: '#1e4a2d', color: '#fff' }}>
                        <Statistic 
                            title={<span style={{ color: '#fff', opacity: 0.8 }}>{t.recovery_rate}</span>}
                            value={stats.recovery_rate} 
                            suffix="%" 
                            prefix={<ThunderboltOutlined />} 
                            valueStyle={{ color: '#fff', fontWeight: 800 }}
                            loading={loading}
                        />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[24, 24]}>
                <Col span={24}>
                    <Card 
                        title={<span><ClockCircleOutlined /> {t.at_risk_customers}</span>} 
                        style={{ borderRadius: 20, boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}
                        extra={<Button onClick={fetchData} icon={<SearchOutlined />}>{t.refresh_analysis}</Button>}
                    >
                        <Table 
                            columns={columns} 
                            dataSource={inactiveList} 
                            loading={loading} 
                            rowKey="id"
                            pagination={{ pageSize: 5 }}
                        />
                    </Card>
                </Col>
                
                <Col span={24}>
                    <Card 
                        title={<span><TeamOutlined /> {t.all_loyalty_members}</span>} 
                        style={{ borderRadius: 20, boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}
                    >
                        <Table 
                            columns={allMemberColumns} 
                            dataSource={allMembers} 
                            loading={loading} 
                            rowKey="id"
                            pagination={{ pageSize: 10 }}
                        />
                    </Card>
                </Col>
            </Row>

            <Modal
                title={<b>{t.win_back_campaign}</b>}
                open={isPromoModalVisible}
                onCancel={() => !sending && setIsPromoModalVisible(false)}
                footer={[
                    <Button key="cancel" disabled={sending} onClick={() => setIsPromoModalVisible(false)}>{t.cancel}</Button>,
                    <Button 
                        key="send" 
                        type="primary" 
                        icon={<SendOutlined />} 
                        style={{ background: '#1e4a2d' }} 
                        loading={sending} // 🔄 Show loading
                        onClick={async () => {
                            setSending(true);
                            try {
                                const res = await request("customer/send-promo", "post", {
                                    customer_id: selectedCustomer?.id,
                                    promo_text: "Hey " + selectedCustomer?.name + ", we miss you! Come back today and enjoy 15% OFF on your favorite drink. ☕️",
                                    platform_url: window.location.origin,
                                    branch_id: profile?.branch_id
                                });
                                if (res?.success) {
                                    message.success(res.message);
                                    setIsPromoModalVisible(false);
                                } else {
                                    message.error(res?.message || "Failed to send email");
                                }
                            } catch (error) {
                                message.error("Connection timeout or server error. Please try again.");
                            } finally {
                                setSending(false);
                            }
                        }}
                    >
                        {t.send_promotion}
                    </Button>
                ]}
            >
                <div style={{ padding: '20px 0' }}>
                    <p>{lang === 'kh' ? `ផ្តល់ជូនប្រូម៉ូសិនទៅកាន់ ` : `Offering a promotion to `} <b>{selectedCustomer?.name}</b></p>
                    <div style={{ background: '#f8fafc', padding: 15, borderRadius: 12 }}>
                        <Text strong>{t.suggested_offer}:</Text>
                        <p style={{ margin: '5px 0 0 0' }}>
                            {lang === 'kh' 
                                ? `សួស្តី ${selectedCustomer?.name}, យើងនឹករូបអ្នកណាស់! សូមអញ្ជើញត្រឡប់មកវិញថ្ងៃនេះ ដើម្បីរីករាយជាមួយការបញ្ចុះតម្លៃ 15% លើភេសជ្ជៈដែលអ្នកចូលចិត្ត។ ☕️`
                                : `Hey ${selectedCustomer?.name}, we miss you! Come back today and enjoy 15% OFF on your favorite drink. ☕️`
                            }
                        </p>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default MarketingDashboard;
