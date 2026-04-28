import React, { useEffect, useState } from "react";
import {
    Table, Button, Card, Row, Col, Input,
    Modal, Form, message, Tag, Space,
    Typography, Divider, Badge, Tooltip, Statistic,
    Select, Checkbox
} from "antd";
import {
    PlusOutlined,
    ShopOutlined,
    SearchOutlined,
    MailOutlined,
    PhoneOutlined,
    UserOutlined,
    GlobalOutlined,
    SafetyCertificateOutlined,
    CheckCircleOutlined,
    StopOutlined,
    CrownOutlined,
    CalendarOutlined,
    EyeOutlined,
    TeamOutlined,
    CoffeeOutlined,
    AppstoreAddOutlined,
    EditOutlined
} from "@ant-design/icons";
import { request } from "../../util/helper";

const { Title, Text } = Typography;
const { TabPane } = Modal; // Not actually valid, using Tabs

import { Tabs } from "antd";
import CategoryManageTab from "../settings/CategoryManageTab";

const BusinessPage = () => {
    const [list, setList] = useState([]);
    const [packageList, setPackageList] = useState([]);
    const [systemModules, setSystemModules] = useState([]);
    const [loading, setLoading] = useState(false);
    const [visible, setVisible] = useState(false);
    const [catVisible, setCatVisible] = useState(false);
    const [selectedBizId, setSelectedBizId] = useState(null);
    const [isRenewal, setIsRenewal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [form] = Form.useForm();
    const [searchText, setSearchText] = useState("");

    // Detail View State
    const [detailVisible, setDetailVisible] = useState(false);
    const [selectedBiz, setSelectedBiz] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailData, setDetailData] = useState({
        branches: [],
        users: [],
        products: [],
        insights: null
    });

    const [plans, setPlans] = useState([]);

    useEffect(() => {
        getList();
        getPlans();
        getPackages();
        getSystemModules();
    }, []);

    const getSystemModules = async () => {
        try {
            const res = await request("system_module", "get");
            if (res && res.list) {
                // only active modules should be selectable in onboarding
                setSystemModules(res.list.filter(m => m.status === 'active'));
            }
        } catch (error) {}
    };

    const getPackages = async () => {
        try {
            const res = await request("modular_package", "get");
            if (res && res.list) {
                setPackageList(res.list);
            }
        } catch (error) {}
    };

    const getPlans = async () => {
        try {
            const res = await request("plans", "get");
            if (res && res.plans) {
                setPlans(res.plans);
            }
        } catch (error) {}
    };

    const getList = async () => {
        setLoading(true);
        try {
            const res = await request("business", "get");
            if (res && res.list) {
                setList(res.list);
            }
        } catch (error) {
            message.error("Failed to fetch businesses");
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetail = async (record) => {
        setSelectedBiz(record);
        setDetailVisible(true);
        setDetailLoading(true);
        try {
            // Fetch everything except money
            const [bRes, uRes, pRes, iRes] = await Promise.all([
                request(`branch?target_business_id=${record.id}`, "get"),
                request(`user?target_business_id=${record.id}`, "get"),
                request(`product/getBusinessProducts?target_business_id=${record.id}`, "get"),
                request(`business/insights?id=${record.id}`, "get")
            ]);
            
            setDetailData({
                branches: bRes?.list || [],
                users: uRes?.list || [],
                products: pRes?.list || [],
                insights: iRes || null
            });
        } catch (error) {
            message.error("Failed to load enterprise details");
        } finally {
            setDetailLoading(false);
        }
    };

    const onFinish = async (values) => {
        console.log("FORM_VALUES_SUBMITTED:", values);
        try {
            let res;
            if (isEdit) {
                res = await request("business", "put", {
                    id: values.id,
                    name: values.business_name,
                    phone: values.phone,
                    owner_name: values.owner_name,
                    package_id: values.package_id,
                    active_modules: values.active_modules,
                    smtp_user: values.smtp_user,
                    smtp_pass: values.smtp_pass
                });
            } else {
                res = await request("business", "post", values);
            }
            
            if (res) {
                message.success(isEdit ? "Business updated successfully!" : "New Business and Owner registered successfully!");
                setVisible(false);
                form.resetFields();
                getList();
            }
        } catch (error) {
            message.error(error.message || (isEdit ? "Update failed" : "Registration failed"));
        }
    };

    const toggleStatus = async (record) => {
        const newStatus = record.status === 'active' ? 'suspended' : 'active';
        try {
            const res = await request("business/status", "put", { id: record.id, status: newStatus });
            if (res) {
                message.success(`Business ${newStatus} successfully`);
                getList();
            }
        } catch (error) {
            message.error("Status update failed");
        }
    };

    const handleUpdatePlan = async (values) => {
        try {
            const res = await request("business/plan", "put", {
                business_id: values.business_id,
                plan_id: values.plan_id,
                plan_type: values.plan_type,
                active_modules: values.active_modules,
                duration_days: values.duration_days
            });
            if (res) {
                message.success("Subscription updated successfully");
                setVisible(false);
                getList();
            }
        } catch (error) {
            message.error("Failed to update plan");
        }
    };

    const columns = [
        {
            title: "Business / Enterprise",
            dataIndex: "name",
            key: "name",
            width: 250, // 📏 Increased width
            render: (text, record) => (
                <div style={{ minWidth: 220 }}>
                    <Space size="middle">
                        <div style={{
                            width: 50, height: 50, borderRadius: '14px',
                            background: 'linear-gradient(135deg, #1e4a2d 0%, #2d6a3e 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', 
                            color: 'white', flexShrink: 0,
                            boxShadow: '0 4px 10px rgba(30, 74, 45, 0.2)'
                        }}>
                            <ShopOutlined style={{ fontSize: '22px' }} />
                        </div>
                        <div style={{ lineHeight: 1.3 }}>
                            <Text strong style={{ fontSize: '15px', color: '#1e4a2d', display: 'block' }}>{text}</Text>
                            <Text type="secondary" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>ID: BIZ-{record.id.toString().padStart(4, '0')}</Text>
                        </div>
                    </Space>
                </div>
            )
        },
        {
            title: "Owner Identity",
            dataIndex: "owner_name",
            key: "owner_name",
            width: 200,
            render: (text, record) => (
                <div style={{ minWidth: 180 }}>
                    <div style={{ marginBottom: 4 }}>
                        <Text strong style={{ fontSize: '13px' }}><UserOutlined style={{ color: '#c0a060' }} /> {text}</Text>
                    </div>
                    <Text type="secondary" style={{ fontSize: '12px' }}><MailOutlined style={{ marginRight: 4 }} />{record.email}</Text>
                </div>
            )
        },
        {
            title: "Operations",
            key: "ops",
            width: 160,
            render: (_, record) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>Branches</Text>
                        <Tag color="blue" style={{ margin: 0, borderRadius: 4, fontSize: 11 }}>{record.total_branches}</Tag>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>Staff Cap</Text>
                        <Tag color="green" style={{ margin: 0, borderRadius: 4, fontSize: 11 }}>{record.total_users}</Tag>
                    </div>
                </div>
            )
        },
        {
            title: "Plan Architecture",
            dataIndex: "plan_type",
            key: "plan_type",
            width: 150,
            render: (type) => {
                const configs = { 
                    basic: { color: 'blue', icon: <SafetyCertificateOutlined /> }, 
                    standard: { color: 'gold', icon: <CrownOutlined /> }, 
                    premium: { color: 'purple', icon: <CrownOutlined /> } 
                };
                const conf = configs[type] || { color: 'default', icon: <SafetyCertificateOutlined /> };
                return (
                    <Tag color={conf.color} style={{ borderRadius: '6px', border: 'none', padding: '4px 12px', fontWeight: 600 }}>
                        {conf.icon} {type?.toUpperCase()}
                    </Tag>
                );
            }
        },
        {
            title: "Enabled Modules",
            dataIndex: "active_modules",
            key: "active_modules",
            width: 180,
            render: (modules) => (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {modules?.split(',').map(m => (
                        <Tag key={m} style={{ fontSize: '10px', borderRadius: 4, margin: 0, background: '#f5f5f5', border: '1px solid #eee' }}>
                            {m}
                        </Tag>
                    ))}
                </div>
            )
        },
        {
            title: "Expiry / Period",
            dataIndex: "expiry_date",
            key: "expiry_date",
            width: 160,
            render: (date) => (
                <div>
                    <div style={{ marginBottom: 4 }}>
                        <CalendarOutlined style={{ marginRight: 6, color: '#999' }} />
                        <Text style={{ fontSize: '13px' }}>{date ? new Date(date).toLocaleDateString() : "Life-time"}</Text>
                    </div>
                    {date && new Date(date) < new Date() ? (
                        <Tag color="error" style={{ fontSize: '10px', borderRadius: 4 }}>EXPIRED</Tag>
                    ) : date && (
                        <Tag color="success" style={{ fontSize: '10px', borderRadius: 4 }}>ACTIVE</Tag>
                    )}
                </div>
            )
        },
        {
            title: "Health Status",
            dataIndex: "status",
            key: "status",
            width: 160, // 📏 Increased width
            render: (status) => (
                <div style={{ 
                    padding: '4px 12px', 
                    borderRadius: '20px', 
                    background: status === 'active' ? '#f6ffed' : '#fff2f0',
                    border: `1px solid ${status === 'active' ? '#b7eb8f' : '#ffccc7'}`,
                    display: 'inline-block',
                    whiteSpace: 'nowrap' // 🛡️ Prevent wrapping
                }}>
                    <Badge
                        status={status === 'active' ? 'success' : 'error'}
                        text={<Text strong style={{ color: status === 'active' ? '#52c41a' : '#ff4d4f', fontSize: 12, whiteSpace: 'nowrap' }}>{status === 'active' ? "Operational" : "Suspended"}</Text>}
                    />
                </div>
            )
        },
        {
            title: "Management",
            key: "actions",
            align: 'right',
            width: 450, // 📏 Increased width to fit all buttons
            render: (record) => (
                <Space style={{ whiteSpace: 'nowrap' }}>
                    <Tooltip title="View Enterprise Details">
                        <Button
                            icon={<EyeOutlined />}
                            onClick={() => handleViewDetail(record)}
                        >
                            View
                        </Button>
                    </Tooltip>
                    <Tooltip title="Manage Subscription">
                        <Button
                            icon={<CrownOutlined />}
                            onClick={() => {
                                setVisible(true);
                                setIsRenewal(true);
                                setIsEdit(false);
                                form.setFieldsValue({
                                    id: record.id,
                                    business_id: record.id,
                                    plan_id: record.plan_id,
                                    plan_type: record.plan_type,
                                    active_modules: record.active_modules?.split(','),
                                    is_renewal: true
                                });
                            }}
                            style={{ color: '#c0a060' }}
                        >
                            Renew
                        </Button>
                    </Tooltip>
                    <Tooltip title="Edit Basic Details">
                        <Button
                            icon={<EditOutlined />}
                            onClick={() => {
                                setVisible(true);
                                setIsEdit(true);
                                setIsRenewal(false);
                                form.setFieldsValue({
                                    id: record.id,
                                    business_name: record.name,
                                    owner_name: record.owner_name,
                                    email: record.email,
                                    phone: record.phone,
                                    package_id: record.package_id,
                                    active_modules: record.active_modules?.split(','),
                                    smtp_user: record.smtp_user,
                                    smtp_pass: record.smtp_pass
                                });
                            }}
                            style={{ color: '#1890ff' }}
                        >
                            Edit
                        </Button>
                    </Tooltip>
                    <Tooltip title="Manage Category Access">
                        <Button
                            icon={<CoffeeOutlined />}
                            onClick={() => {
                                setSelectedBizId(record.id);
                                setSelectedBiz(record);
                                setCatVisible(true);
                            }}
                            style={{ color: '#1e4a2d' }}
                        >
                            Categories
                        </Button>
                    </Tooltip>
                    <Button
                        type={record.status === 'active' ? 'text' : 'primary'}
                        danger={record.status === 'active'}
                        icon={record.status === 'active' ? <StopOutlined /> : <CheckCircleOutlined />}
                        onClick={() => toggleStatus(record)}
                        disabled={record.id === 1} // 🛡️ Protect Super Admin Business
                        style={{ whiteSpace: 'nowrap' }}
                    >
                        {record.status === 'active' ? "Suspend" : "Activate"}
                    </Button>
                </Space>
            )
        }
    ];

    const filteredList = list.filter(item =>
        item.name.toLowerCase().includes(searchText.toLowerCase()) ||
        item.owner_name.toLowerCase().includes(searchText.toLowerCase()) ||
        item.email.toLowerCase().includes(searchText.toLowerCase())
    );

    return (
        <div style={{ padding: '20px' }}>
            {/* Platform Overview */}
            <div style={{ marginBottom: 32 }}>
                <Title level={2} style={{ color: '#1e4a2d', margin: 0, fontWeight: 700 }}>
                    <GlobalOutlined /> Platform Ecosystem
                </Title>
                <Text type="secondary">System Administration: Managing business tenants and owner provisioning.</Text>
            </div>

            <Row gutter={16} style={{ marginBottom: 32 }}>
                <Col span={8}>
                    <Card style={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        <Statistic title="Total Businesses" value={list.length} prefix={<ShopOutlined />} valueStyle={{ color: '#1e4a2d' }} />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card style={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        <Statistic title="Active Subscriptions" value={list.filter(b => b.status === 'active').length} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card style={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        <Statistic title="Revenue Engines" value={list.filter(b => b.plan_name === 'pro').length} prefix={<SafetyCertificateOutlined />} valueStyle={{ color: '#c0a060' }} />
                    </Card>
                </Col>
            </Row>

            <Card
                className="premium-table-card"
                style={{ borderRadius: '24px', boxShadow: '0 8px 32px rgba(0,0,0,0.05)', border: 'none' }}
                title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <Text strong style={{ fontSize: '18px' }}>Business Registry</Text>
                        <Space>
                            <Input
                                placeholder="Search by Business, Owner or Email..."
                                prefix={<SearchOutlined />}
                                onChange={e => setSearchText(e.target.value)}
                                style={{ width: 300, borderRadius: '12px' }}
                            />
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => {
                                    setIsRenewal(false);
                                    setIsEdit(false);
                                    setVisible(true);
                                    form.setFieldsValue({
                                        plan_type: 'basic',
                                        active_modules: ['POS']
                                    });
                                }}
                                style={{ background: '#1e4a2d', borderColor: '#1e4a2d', borderRadius: '12px', height: '40px' }}
                            >
                                Onboard New Business
                            </Button>
                        </Space>
                    </div>
                }
            >
                <Table
                    columns={columns}
                    dataSource={filteredList}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10, showSizeChanger: true }}
                    scroll={{ x: 1000 }}
                />
            </Card>

            {/* Enterprise Inspection Modal */}
            <Modal
                title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <EyeOutlined style={{ color: '#1e4a2d' }} />
                            <Title level={4} style={{ margin: 0 }}>Enterprise Inspection: {selectedBiz?.name}</Title>
                        </div>
                        {detailData.insights?.lastActive && (
                            <Tag color="cyan">Last Order Activity: {new Date(detailData.insights.lastActive).toLocaleString()}</Tag>
                        )}
                    </div>
                }
                open={detailVisible}
                onCancel={() => setDetailVisible(false)}
                footer={[<Button key="close" onClick={() => setDetailVisible(false)}>Done</Button>]}
                width={1000}
                centered
            >
                <Tabs defaultActiveKey="branches" loading={detailLoading}>
                    <Tabs.TabPane 
                        tab={<span><ShopOutlined /> Branches</span>} 
                        key="branches"
                    >
                        <Table 
                            size="small"
                            dataSource={detailData.branches}
                            pagination={{ pageSize: 5 }}
                            columns={[
                                { title: 'Branch Name', dataIndex: 'name', key: 'name' },
                                { title: 'Location', dataIndex: 'location', key: 'location' },
                                { title: 'Phone', dataIndex: 'phone', key: 'phone' },
                                { title: 'Status', dataIndex: 'is_main', key: 'is_main', render: (val) => val == 1 ? <Tag color="gold">MAIN HQ</Tag> : <Tag>Regular</Tag> }
                            ]}
                        />
                    </Tabs.TabPane>
                    <Tabs.TabPane 
                        tab={<span><TeamOutlined /> Team Roster</span>} 
                        key="team"
                    >
                        <Table 
                            size="small"
                            dataSource={detailData.users}
                            pagination={{ pageSize: 5 }}
                            columns={[
                                { title: 'Name', dataIndex: 'name', key: 'name' },
                                { title: 'Role', dataIndex: 'role_name', key: 'role_name' },
                                { title: 'Assigned Branch', dataIndex: 'branch_name', key: 'branch_name' },
                                { title: 'Status', dataIndex: 'status', key: 'status', render: (s) => <Tag color={s === 'active' ? 'success' : 'error'}>{s?.toUpperCase()}</Tag> }
                            ]}
                        />
                    </Tabs.TabPane>
                    <Tabs.TabPane 
                        tab={<span><CoffeeOutlined /> Product Menu</span>} 
                        key="products"
                    >
                         <Table 
                            size="small"
                            dataSource={detailData.products}
                            pagination={{ pageSize: 5 }}
                            columns={[
                                { title: 'Product Name', dataIndex: 'name', key: 'name' },
                                { title: 'Category', dataIndex: 'category_name', key: 'category_name' },
                                { title: 'Brand', dataIndex: 'brand', key: 'brand' },
                                { title: 'Status', dataIndex: 'status', key: 'status', render: (s) => s == 1 ? <Tag color="success">Active</Tag> : <Tag color="error">Inactive</Tag> }
                            ]}
                        />
                    </Tabs.TabPane>
                    <Tabs.TabPane 
                        tab={<span><SafetyCertificateOutlined /> Operational Health</span>} 
                        key="insights"
                    >
                        <Row gutter={[16, 16]}>
                            <Col span={12}>
                                <Card size="small" title="Recent Order Volume (Last 6 Months)" style={{ borderRadius: '12px' }}>
                                    {detailData.insights?.orderTrend?.map(item => (
                                        <div key={item.label} style={{ fontSize: '13px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                                            <Text type="secondary">{item.label}</Text>
                                            <Text strong>{item.value} Orders</Text>
                                        </div>
                                    ))}
                                    {detailData.insights?.orderTrend?.length === 0 && <Text type="secondary">No order data yet.</Text>}
                                </Card>
                            </Col>
                            <Col span={12}>
                                <Card size="small" title="Top Popular Items" style={{ borderRadius: '12px' }}>
                                    {detailData.insights?.topProducts?.map((item, idx) => (
                                        <div key={idx} style={{ fontSize: '13px', marginBottom: '8px' }}>
                                            <Badge count={idx+1} style={{ backgroundColor: '#1e4a2d', marginRight: '8px' }} />
                                            <Text>{item.name}</Text>
                                            <Text type="secondary" style={{ float: 'right' }}>{item.total_sold} units sold</Text>
                                        </div>
                                    ))}
                                    {detailData.insights?.topProducts?.length === 0 && <Text type="secondary">No sales data yet.</Text>}
                                </Card>
                            </Col>
                            <Col span={24}>
                                <Card size="small" title="Menu Distribution" style={{ borderRadius: '12px' }}>
                                    <Space size="middle" wrap>
                                        {detailData.insights?.categories?.map(cat => (
                                            <Tag key={cat.name} color="default" style={{ padding: '4px 12px', fontSize: '12px' }}>
                                                {cat.name}: <strong>{cat.product_count} items</strong>
                                            </Tag>
                                        ))}
                                    </Space>
                                </Card>
                            </Col>
                        </Row>
                    </Tabs.TabPane>
                </Tabs>
                <div style={{ marginTop: '16px', background: '#fff9ef', padding: '12px', borderRadius: '8px', border: '1px dashed #c0a060' }}>
                    <Text italic style={{ fontSize: '12px', color: '#c0a060' }}>
                        * Privacy Shield: Financial metrics, revenue snapshots, and sales reports are restricted from this administrative view to maintain enterprise privacy.
                    </Text>
                </div>
            </Modal>

            <Modal
                title={<Title level={3} style={{ margin: 0, color: '#1e4a2d' }}>
                    {isRenewal ? "Subscription Lifecycle Control" : (isEdit ? "Update Enterprise Details" : "Business Onboarding")}
                </Title>}
                open={visible}
                onCancel={() => {
                    setVisible(false);
                    form.resetFields();
                }}
                footer={null}
                width={700}
                centered
                bodyStyle={{ maxHeight: '70vh', overflowY: 'auto', padding: '24px 32px' }}
            >
                <Divider style={{ margin: '12px 0 24px 0' }} />
                <Form form={form} layout="vertical" onFinish={isRenewal ? handleUpdatePlan : onFinish}>
                    <Form.Item name="business_id" hidden><Input /></Form.Item>
                    <Form.Item name="id" hidden><Input /></Form.Item>
                    <Form.Item name="is_renewal" hidden><Input /></Form.Item>

                    <Row gutter={24}>
                        {( !isRenewal ) && (
                            <>
                                <Col span={24}>
                                    <Text strong style={{ color: '#c0a060', fontSize: '12px' }}>ENTERPRISE DETAILS</Text>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="business_name" label="Business Name" rules={[{ required: true }]}>
                                        <Input placeholder="e.g. Amazon Coffee" size="large" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="phone" label="Business Contact">
                                        <Input prefix={<PhoneOutlined />} placeholder="012 345 678" size="large" />
                                    </Form.Item>
                                </Col>
                            </>
                        )}

                        {!isRenewal && (
                            <Col span={24} style={{ marginTop: 12 }}>
                                <Text strong style={{ color: '#c0a060', fontSize: '12px' }}>
                                    {isEdit ? "OWNER IDENTITY" : "OWNER CREDENTIALS"}
                                </Text>
                            </Col>
                        )}
                        {isRenewal && (
                             <Col span={24} style={{ marginTop: 12 }}>
                                <Text strong style={{ color: '#c0a060', fontSize: '12px' }}>
                                    PLAN CONFIGURATION
                                </Text>
                            </Col>
                        )}

                        {!isRenewal && (
                            <>
                                <Col span={12}>
                                    <Form.Item name="owner_name" label="Owner Full Name" rules={[{ required: true }]}>
                                        <Input prefix={<UserOutlined />} placeholder="Owner Name" size="large" />
                                    </Form.Item>
                                </Col>
                                {!isEdit && (
                                    <>
                                        <Col span={12}>
                                            <Form.Item name="email" label="Owner Email (Login)" rules={[{ required: true, type: 'email' }]}>
                                                <Input prefix={<MailOutlined />} placeholder="owner@gmail.com" size="large" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item name="password" label="Temporary Password" rules={[{ required: true, min: 6 }]}>
                                                <Input.Password placeholder="******" size="large" />
                                            </Form.Item>
                                        </Col>
                                    </>
                                )}
                            </>
                        )}
                        {isRenewal && (
                            <>
                                <Col span={12}>
                                    <Form.Item name="duration_days" label="Subscription Duration" initialValue={30} rules={[{ required: true }]}>
                                        <Select size="large">
                                            <Select.Option value={30}>1 Month (30 Days)</Select.Option>
                                            <Select.Option value={90}>3 Months</Select.Option>
                                            <Select.Option value={180}>6 Months</Select.Option>
                                            <Select.Option value={365}>1 Year (Normal)</Select.Option>
                                            <Select.Option value={730}>2 Years (Bonus)</Select.Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                            </>
                        )}

                        {(isRenewal || (!isEdit && !isRenewal)) && (
                            <Col span={12}>
                                <Form.Item name="plan_id" label="Subscription Tier" rules={[{ required: true }]}>
                                    <Select 
                                        size="large" 
                                        placeholder="Select Architecture"
                                        onChange={(val) => {
                                            const plan = plans.find(p => p.id === val);
                                            if (plan) {
                                                const type = plan.price > 100 ? 'premium' : (plan.price > 0 ? 'standard' : 'basic');
                                                form.setFieldsValue({ plan_type: type });
                                            }
                                        }}
                                    >
                                        {plans.map(p => (
                                            <Select.Option key={p.id} value={p.id}>
                                                {p.name} - ${p.price} ({p.billing_cycle})
                                            </Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                                <Form.Item name="plan_type" hidden initialValue="basic"><Input /></Form.Item>
                            </Col>
                        )}

                        {!isRenewal && (
                            <Col span={24} style={{ marginTop: 12 }}>
                                <Text strong style={{ color: '#c0a060', fontSize: '12px' }}>
                                    {isEdit ? "INDUSTRY BLUEPRINT & CAPABILITIES (SYSTEM FLEXIBILITY)" : "PROVISIONED MODULES (FEATURE TOGGLING)"}
                                </Text>
                                        <Divider orientation="left">Industry Role & Features</Divider>
                                        
                                <Form.Item 
                                            name="package_id" 
                                            label="Industry Type (e.g. Mart, Restaurant, Cafe - Changes system behavior)"
                                            rules={[{ required: form.getFieldValue("id") !== 1, message: 'Please select industry type' }]}
                                        >
                                            <Select 
                                                placeholder="Change Industry Blueprint" 
                                                size="large"
                                                style={{ borderRadius: 12 }}
                                            >
                                                {packageList.map(pkg => (
                                                    <Select.Option key={pkg.id} value={pkg.id}>
                                                        <Space>
                                                            <AppstoreAddOutlined />
                                                            {pkg.name}
                                                        </Space>
                                                    </Select.Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
    
                                        <Form.Item label="ACTIVE MODULES (ADD/REMOVE FEATURES)" name="active_modules" rules={[{ required: true, message: 'Select at least one module' }]}>
                                            <Checkbox.Group>
                                                <Row gutter={[8, 8]}>
                                                    {systemModules.map(mod => (
                                                        <Col span={8} key={mod.code}>
                                                            <Checkbox value={mod.code}>{mod.name}</Checkbox>
                                                        </Col>
                                                    ))}
                                                </Row>
                                            </Checkbox.Group>
                                        </Form.Item>
                             </Col>
                        )}

                        {!isRenewal && (
                             <Col span={24} style={{ marginTop: 24, padding: '24px', background: '#f6ffed', borderRadius: '16px', border: '1.5px dashed #b7eb8f' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                                    <MailOutlined style={{ fontSize: 20, color: '#52c41a' }} />
                                    <Text strong style={{ color: '#1e4a2d', fontSize: '14px' }}>
                                        MARKETING & EMAIL CONFIGURATION (GMAIL SMTP)
                                    </Text>
                                </div>
                                <Text type="secondary" style={{ display: 'block', marginBottom: 16, fontSize: '12px' }}>
                                    កំណត់ Email ម្ចាស់ហាងផ្ទាល់ ដើម្បីឱ្យអតិថិជនទទួលបាន Promotion ពីឈ្មោះហាងលោកអ្នក។
                                </Text>
                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item name="smtp_user" label="Gmail Address (Email អ្នកផ្ញើ)">
                                            <Input prefix={<MailOutlined />} placeholder="owner@gmail.com" size="large" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item name="smtp_pass" label="App Password (១៦ ខ្ទង់)">
                                            <Input.Password prefix={<SafetyCertificateOutlined />} placeholder="xxxx xxxx xxxx xxxx" size="large" />
                                        </Form.Item>
                                    </Col>
                                </Row>
                             </Col>
                        )}
                    </Row>

                    <div style={{ textAlign: 'right', marginTop: 32 }}>
                        <Space size="large">
                            <Button size="large" onClick={() => {
                                setVisible(false);
                                form.resetFields();
                            }}>Cancel</Button>
                            <Button size="large" type="primary" htmlType="submit" style={{ background: '#1e4a2d', borderColor: '#1e4a2d', minWidth: 200 }}>
                                {isRenewal ? "Update & Issue Subscription" : (isEdit ? "Update Details" : "Provision Enterprise")}
                            </Button>
                        </Space>
                    </div>
                </Form>
            </Modal>
            {/* Category Activation Management Modal */}
            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <CoffeeOutlined style={{ fontSize: 24, color: '#1e4a2d' }} />
                        <div>
                            <Title level={4} style={{ margin: 0 }}>Category Access Control</Title>
                            <Text type="secondary" style={{ fontSize: 13 }}>Enterprise: <Text strong color="#1e4a2d">{selectedBiz?.name}</Text></Text>
                        </div>
                    </div>
                }
                open={catVisible}
                onCancel={() => setCatVisible(false)}
                footer={[<Button key="close" onClick={() => setCatVisible(false)}>Done</Button>]}
                width={1000}
                centered
                bodyStyle={{ padding: '24px 32px' }}
            >
                <div style={{ background: '#fcfaf7', borderRadius: 20, padding: 24, border: '1px solid #f0ede6' }}>
                    <CategoryManageTab targetBusinessId={selectedBizId} />
                </div>
            </Modal>
        </div>
    );
};

export default BusinessPage;
